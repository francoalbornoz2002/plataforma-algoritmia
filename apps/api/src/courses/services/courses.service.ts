import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCourseDto } from '../dto/create-course.dto';
import { UpdateCourseDto } from '../dto/update-course.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Curso, estado_simple, Prisma, roles } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { FindAllCoursesDto } from '../dto/find-all-courses.dto';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async create(createCourseDto: CreateCourseDto) {
    // Desestructuración de los campos del DTO
    const {
      nombre,
      descripcion,
      imagenUrl,
      contrasenaAcceso,
      modalidadPreferencial,
      docenteIds,
      diasClase,
    } = createCourseDto;

    // --- Inicia Transacción ---
    try {
      const nuevoCurso = await this.prisma.$transaction(async (tx) => {
        // --- Validación de Docentes ---
        if (docenteIds && docenteIds.length > 0) {
          const docentes = await tx.usuario.findMany({
            where: {
              id: { in: docenteIds },
              rol: roles.Docente, // O como se llame tu enum Rol
              deletedAt: null,
            },
            select: { id: true },
          });
          if (docentes.length !== docenteIds.length) {
            throw new BadRequestException(
              'Uno o más IDs de docentes proporcionados son inválidos o no corresponden a un docente activo.',
            );
          }
        }
        // --- Fin Validación Docentes ---

        // 1. Crear ProgresoCurso (los defaults del schema se aplicarán)
        const nuevoProgresoCurso = await tx.progresoCurso.create({
          data: {}, // Los defaults manejan la inicialización
          select: { id: true }, // Solo necesitamos el ID generado
        });

        // 2. Crear DificultadesCurso (los defaults del schema se aplicarán)
        const nuevasDificultadesCurso = await tx.dificultadesCurso.create({
          data: {}, // Los defaults manejan la inicialización (dificultadModa es nullable)
          select: { id: true }, // Solo necesitamos el ID
        });

        // --- HASHEAR CONTRASEÑA DE ACCESO ---
        const contrasenaHasheada = await bcrypt.hash(
          contrasenaAcceso,
          +process.env.HASH_SALT,
        );

        // 3. Crear el Curso, vinculando los IDs generados
        const cursoCreado = await tx.curso.create({
          data: {
            nombre,
            descripcion,
            imagenUrl,
            contrasenaAcceso: contrasenaHasheada,
            modalidadPreferencial,
            idProgreso: nuevoProgresoCurso.id, // Vincula con ProgresoCurso
            idDificultadesCurso: nuevasDificultadesCurso.id, // Vincula con DificultadesCurso
            // Crear relaciones para docentes
            docentes: docenteIds
              ? {
                  createMany: {
                    data: docenteIds.map((id) => ({
                      idDocente: id,
                      estado: 'Activo', // O tu estado inicial por defecto
                    })),
                  },
                }
              : undefined,
            // Crear relaciones para diasClase
            diasClase: diasClase
              ? {
                  createMany: {
                    data: diasClase.map((dia) => {
                      // Asegúrate que dia.horaInicio y dia.horaFin vengan en formato "HH:MM"
                      if (
                        !/^\d{2}:\d{2}$/.test(dia.horaInicio) ||
                        !/^\d{2}:\d{2}$/.test(dia.horaFin)
                      ) {
                        throw new BadRequestException(
                          `Formato de hora inválido: ${dia.horaInicio} / ${dia.horaFin}. Usar HH:MM.`,
                        );
                      }

                      return {
                        dia: dia.dia,
                        // Convierte "HH:MM" a un objeto Date con fecha fija (UTC)
                        horaInicio: new Date(
                          `1970-01-01T${dia.horaInicio}:00.000Z`,
                        ),
                        horaFin: new Date(`1970-01-01T${dia.horaFin}:00.000Z`),
                        modalidad: dia.modalidad,
                      };
                    }),
                  },
                }
              : undefined,
          },
          // Incluimos las relaciones recién creadas en la respuesta
          include: {
            progresoCurso: true, // Incluye el objeto progreso creado
            dificultadesCurso: true, // Incluye el objeto dificultades creado
            docentes: { include: { docente: true } }, // Incluye datos completos del docente
            diasClase: true,
          },
        });

        return cursoCreado; // Devuelve el objeto curso final desde la transacción
      }); // --- Fin Transacción ---

      return nuevoCurso; // Devuelve el resultado de la transacción
    } catch (error) {
      // Manejo básico de errores (puede refinarse)
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        console.error('Código de Error Prisma:', error.code);
      }
      console.error('Error al crear el curso:', error);
      throw new BadRequestException(
        error.message || 'No se pudo crear el curso.',
      );
    }
  }

  async findAll(query: FindAllCoursesDto) {
    // Desestructuramos el DTO y ponemos valores por defecto
    const {
      page = 1,
      limit = 8,
      sort = 'nombre',
      order = 'asc',
      search,
      estado,
      docenteIds,
    } = query;

    const skip = (page - 1) * limit;
    const take = limit;

    // --- 1. Construir el WHERE dinámicamente ---
    const where: Prisma.CursoWhereInput = {};

    // Filtro de Búsqueda (search)
    if (search) {
      where.nombre = {
        contains: search,
        mode: 'insensitive', // Para que no distinga mayúsc/minúsc
      };
    }

    // Filtro de Estado
    if (estado) {
      where.deletedAt = estado === estado_simple.Activo ? null : { not: null };
    }

    // Filtro de Docentes
    if (docenteIds && docenteIds.length > 0) {
      where.docentes = {
        some: {
          idDocente: {
            in: docenteIds,
          },
        },
      };
    }

    // --- 2. Construir el ORDER BY ---
    const orderBy: Prisma.CursoOrderByWithRelationInput = {
      [sort]: order,
    };

    // --- 3. Ejecutar las consultas ---
    try {
      // Hacemos dos consultas en paralelo: una para los datos y otra para el conteo total
      const [cursos, total] = await this.prisma.$transaction([
        this.prisma.curso.findMany({
          where,
          orderBy,
          skip,
          take,
          // Incluimos los docentes y el conteo de alumnos para la Card
          include: {
            docentes: {
              include: {
                docente: {
                  select: {
                    nombre: true,
                    apellido: true,
                  },
                },
              },
            },
            _count: {
              select: {
                alumnos: true,
              },
            },
          },
        }),
        this.prisma.curso.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      // Devolvemos el objeto paginado que el Frontend espera
      return {
        data: cursos,
        total,
        page,
        totalPages,
      };
    } catch (error) {
      // Manejo de errores
      console.error('Error in findAll courses service:', error);
      throw new Error('Error al buscar los cursos.');
    }
  }

  async findOne(id: string): Promise<Curso> {
    // Busca un usuario por ID que no haya sido borrado
    const curso = await this.prisma.curso.findUnique({
      where: { id, deletedAt: null },
    });

    if (!curso) {
      throw new NotFoundException(`Curso con ID '${id}' no encontrado.`);
    }

    return curso;
  }

  async update(id: string, updateCourseDto: UpdateCourseDto, userRole: roles) {
    const { docenteIds, diasClase, ...basicData } = updateCourseDto;

    // --- 1. CONSTRUIR OBJETO DE DATOS BÁSICOS (dataToUpdate) ---
    // Este objeto solo contendrá los campos escalares (nombre, desc, etc.)
    const dataToUpdate: Prisma.CursoUpdateInput = {};

    if (userRole === roles.Administrador) {
      // El Administrador puede actualizar todos los datos básicos
      // (Asignamos todos los datos básicos del DTO)
      Object.assign(dataToUpdate, basicData);
    } else {
      // El Docente solo puede actualizar campos permitidos
      if (basicData.descripcion !== undefined) {
        dataToUpdate.descripcion = basicData.descripcion;
      }
      if (basicData.contrasenaAcceso !== undefined) {
        dataToUpdate.contrasenaAcceso = basicData.contrasenaAcceso; // ¡Ver hashing!
      }
      if (basicData.modalidadPreferencial !== undefined) {
        dataToUpdate.modalidadPreferencial = basicData.modalidadPreferencial;
      }
      // Nota: Si el DTO incluye 'nombre', será ignorado para el Docente.
    }

    // --- 2. (Opcional) Hashear Contraseña si cambió ---
    if (dataToUpdate.contrasenaAcceso) {
      // Reemplaza '10' con tu variable de entorno para salt rounds
      dataToUpdate.contrasenaAcceso = await bcrypt.hash(
        dataToUpdate.contrasenaAcceso as string,
        +process.env.HASH_SALT,
      );
    }

    // --- 3. INICIAR TRANSACCIÓN ---
    try {
      const cursoActualizado = await this.prisma.$transaction(async (tx) => {
        // --- 3.1. Actualizar los campos básicos del Curso ---
        // (Esto solo actualiza lo que definimos en 'dataToUpdate')
        await tx.curso.update({
          where: { id, deletedAt: null }, // Solo actualiza cursos activos
          data: dataToUpdate,
        });

        // --- 3.2. Actualizar 'diasClase' (Admin y Docente pueden) ---
        if (diasClase) {
          // El método más simple "sync": borrar todos los y crear los nuevos
          await tx.diaClase.deleteMany({
            where: { idCurso: id },
          });

          await tx.diaClase.createMany({
            data: diasClase.map((dia) => ({
              idCurso: id,
              dia: dia.dia,
              horaInicio: new Date(`1970-01-01T${dia.horaInicio}:00.000Z`), // Usamos la conversión
              horaFin: new Date(`1970-01-01T${dia.horaFin}:00.000Z`),
              modalidad: dia.modalidad,
            })),
          });
        }

        // --- 3.3. Actualizar 'docenteIds' (SOLO Admin) ---
        // Usamos el estado "Activo"/"Inactivo" para mantener el historial
        if (docenteIds && userRole === roles.Administrador) {
          // 1. Obtener los docentes actualmente activos en el curso
          const docentesActuales = await tx.docenteCurso.findMany({
            where: { idCurso: id, estado: estado_simple.Activo },
          });
          const idsActuales = docentesActuales.map((d) => d.idDocente);

          // 2. Docentes a INACTIVAR (están en la lista actual pero no en la nueva)
          const idsAInactivar = idsActuales.filter(
            (currentId) => !docenteIds.includes(currentId),
          );

          // 3. Docentes a ACTIVAR/CREAR (están en la nueva lista pero no en la activa actual)
          const idsAUpsertar = docenteIds; // Queremos asegurar que todos estos estén activos

          // 4. Ejecutar operaciones
          if (idsAInactivar.length > 0) {
            await tx.docenteCurso.updateMany({
              where: { idCurso: id, idDocente: { in: idsAInactivar } },
              data: { estado: estado_simple.Inactivo },
            });
          }

          // Usamos 'upsert' para activar docentes que ya existían (inactivos) o crear nuevos
          for (const docenteId of idsAUpsertar) {
            await tx.docenteCurso.upsert({
              where: {
                idDocente_idCurso: { idDocente: docenteId, idCurso: id },
              },
              update: { estado: estado_simple.Activo }, // Reactiva
              create: {
                idDocente: docenteId,
                idCurso: id,
                estado: estado_simple.Activo,
              }, // Crea
            });
          }
        } else if (docenteIds && userRole === roles.Docente) {
          // Si un docente intenta modificar la lista de docentes, lanzamos un error
          throw new ForbiddenException(
            'Los docentes no pueden modificar la asignación de docentes.',
          );
        }

        // --- 3.4. Devolver el curso actualizado ---
        // (Lo buscamos de nuevo para obtener todos los datos frescos)
        return tx.curso.findUnique({
          where: { id },
          include: {
            progresoCurso: true,
            dificultadesCurso: true,
            docentes: {
              where: { estado: estado_simple.Activo }, // Devolvemos solo los docentes activos
              include: { docente: true },
            },
            diasClase: true,
          },
        });
      }); // --- Fin de la Transacción ---

      return cursoActualizado;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          // 'Record to update not found'
          throw new NotFoundException(`Curso con ID '${id}' no encontrado.`);
        }
      }
      if (error instanceof ForbiddenException) {
        throw error; // Re-lanza el error de permisos
      }
      throw new BadRequestException('No se pudo actualizar el curso.');
    }
  }

  async delete(id: string) {
    const curso = await this.prisma.curso.findUnique({
      where: { id, deletedAt: null },
    });

    if (!curso) {
      throw new NotFoundException(
        `Curso con ID '${id}' no encontrado o ya ha sido eliminado.`,
      );
    }

    // Actualiza el campo deletedAt
    return this.prisma.curso.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
