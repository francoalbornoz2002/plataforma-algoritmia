import {
  BadRequestException,
  ConflictException,
  ForbiddenException, // Para permisos
  Injectable,
  InternalServerErrorException, // Para errores genéricos
  NotFoundException,
} from '@nestjs/common';
import { CreateCourseDto } from '../dto/create-course.dto';
import { UpdateCourseDto } from '../dto/update-course.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { estado_simple, Prisma, roles } from '@prisma/client'; // Importamos 'roles'
// import * as bcrypt from 'bcrypt';
import { FindAllCoursesDto } from '../dto/find-all-courses.dto';
import { dateToTime, timeToDate } from 'src/helpers';
import { DiaClaseDto } from '../dto/dia-clase.dto';
import { UserPayload } from 'src/interfaces/authenticated-user.interface';
import { unlink } from 'fs';
import { basename, join } from 'path';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crea un nuevo curso.
   * Solo accesible por Administradores.
   */
  async create(dto: CreateCourseDto, imagen: Express.Multer.File) {
    const {
      nombre,
      descripcion,
      contrasenaAcceso,
      modalidadPreferencial,
      docenteIds,
      diasClase,
    } = dto;

    // VALIDACIÓN DE DÍAS DE CLASE
    this.validateDiasClase(diasClase);

    // 1. Verificamos si el nombre o descripción ya existen en los cursos registrados
    const cursoExistente = await this.prisma.curso.findFirst({
      where: {
        OR: [{ nombre: nombre }, { descripcion: descripcion }],
      },
    });

    if (cursoExistente) {
      if (cursoExistente.nombre === nombre) {
        throw new ConflictException('Ya existe un curso con ese nombre.');
      } else {
        throw new ConflictException('Ya existe un curso con esa descripción.');
      }
    }

    // Manejo de imagen
    const imagenUrl =
      imagen && imagen.filename ? `/uploads/${imagen.filename}` : null;

    try {
      return await this.prisma.$transaction(async (tx) => {
        // 1. Crear dependencias
        const progreso = await tx.progresoCurso.create({ data: {} });
        const dificultades = await tx.dificultadesCurso.create({ data: {} });

        // 2. Crear el curso y sus relaciones anidadas
        const curso = await tx.curso.create({
          data: {
            nombre,
            descripcion,
            contrasenaAcceso, // Deberías hashear esta contraseña
            imagenUrl,
            modalidadPreferencial: modalidadPreferencial,
            idProgreso: progreso.id,
            idDificultadesCurso: dificultades.id,
            docentes: {
              create: docenteIds.map((idDocente) => ({
                idDocente: idDocente,
                estado: 'Activo',
              })),
            },
            diasClase: {
              create: diasClase.map((dia) => ({
                dia: dia.dia,
                modalidad: dia.modalidad,
                horaInicio: timeToDate(dia.horaInicio),
                horaFin: timeToDate(dia.horaFin),
              })),
            },
          },
        });
        return curso;
      });
    } catch (error) {
      console.error('Error al crear el curso:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Ejemplo: Error de constraint (P2002) o un foreign key (P2003)
        throw new BadRequestException(
          'No se pudo crear el curso. Revisa los datos (ej: docentes duplicados o inexistentes).',
        );
      }
      throw new InternalServerErrorException('Error al crear el curso.');
    }
  }

  /**
   * Busca todos los cursos con paginación y filtros.
   */
  async findAll(query: FindAllCoursesDto) {
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

    try {
      // --- 1. Construir el WHERE ---
      const where: Prisma.CursoWhereInput = {};
      if (search) {
        where.nombre = { contains: search, mode: 'insensitive' };
      }
      if (estado) {
        where.deletedAt =
          estado === estado_simple.Activo ? null : { not: null };
      }
      if (docenteIds && docenteIds.length > 0) {
        where.docentes = {
          some: { idDocente: { in: docenteIds }, estado: estado_simple.Activo },
        };
      }

      // --- 2. Construir el ORDER BY ---
      const orderBy: Prisma.CursoOrderByWithRelationInput = { [sort]: order };

      // --- 3. Ejecutar consultas ---
      const [cursos, total] = await this.prisma.$transaction([
        this.prisma.curso.findMany({
          where,
          orderBy,
          skip,
          take,
          include: {
            docentes: {
              where: {
                estado: 'Activo',
              },
              include: {
                docente: { select: { nombre: true, apellido: true } },
              },
            },
            _count: { select: { alumnos: true } },
          },
        }),
        this.prisma.curso.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);
      return { data: cursos, total, page, totalPages };
    } catch (error) {
      console.error('Error en findAll courses service:', error);
      throw new InternalServerErrorException('Error al buscar los cursos.');
    }
  }

  /**
   * Busca un curso por ID con todos los datos para el formulario de edición.
   */
  async findOne(id: string) {
    try {
      const curso = await this.prisma.curso.findUnique({
        where: { id, deletedAt: null }, // Solo buscar cursos activos
        include: {
          docentes: {
            where: {
              estado: 'Activo',
            },
            select: {
              docente: {
                select: { id: true, nombre: true, apellido: true },
              },
            },
          },
          diasClase: {
            select: {
              id: true,
              dia: true,
              horaInicio: true,
              horaFin: true,
              modalidad: true,
            },
          },
        },
      });

      if (!curso) {
        throw new NotFoundException(`Curso con ID '${id}' no encontrado.`);
      }

      // Transformamos los datos para que coincidan con 'CursoParaEditar'
      const docentes = curso.docentes.map((dc) => dc.docente);
      const diasClase = curso.diasClase.map((d) => ({
        id: d.id,
        dia: d.dia,
        modalidad: d.modalidad,
        horaInicio: dateToTime(d.horaInicio),
        horaFin: dateToTime(d.horaFin),
      }));

      const { docentes: _, ...cursoBase } = curso;
      return { ...cursoBase, docentes, diasClase };
    } catch (error) {
      console.error(`Error al buscar el curso ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al buscar el curso.');
    }
  }

  /**
   * Actualiza un curso, aplicando lógica de permisos según el rol.
   */

  async update(
    id: string,
    dto: UpdateCourseDto,
    imagen: Express.Multer.File,
    user: UserPayload, // El usuario autenticado (desde el Controller)
  ) {
    // 1. Verificar que el curso existe y obtener imagen antigua
    const cursoExistente = await this.prisma.curso.findUnique({
      where: { id },
      select: { imagenUrl: true },
    });
    if (!cursoExistente) {
      throw new NotFoundException(`Curso con ID '${id}' no encontrado.`);
    }
    const oldImagenUrl = cursoExistente.imagenUrl;

    // 2. Preparar los datos a actualizar
    const dataToUpdate: Prisma.CursoUpdateInput = {};
    const { docenteIds, diasClase, ...dataBasica } = dto;

    if (diasClase) {
      this.validateDiasClase(diasClase);
    }

    const diasClaseToSync: DiaClaseDto[] | undefined = diasClase;
    const newImageUploaded = imagen && imagen.filename;

    // 3. Lógica de Permisos
    if (user.rol === roles.Administrador) {
      Object.assign(dataToUpdate, dataBasica);
      if (newImageUploaded) {
        dataToUpdate.imagenUrl = `/uploads/${imagen.filename}`; // <-- Se guarda con prefijo
      }
    } else if (user.rol === roles.Docente) {
      const isDocenteOfCourse = await this.prisma.docenteCurso.findFirst({
        where: { idCurso: id, idDocente: user.userId, estado: 'Activo' },
      });
      if (!isDocenteOfCourse) {
        throw new ForbiddenException(
          'No tienes permiso para editar este curso.',
        );
      }
      if (dto.nombre || dto.docenteIds) {
        throw new ForbiddenException(
          'Los docentes solo pueden modificar: descripción, imagen, días de clase, contraseña y modalidad preferencial.',
        );
      }
      if (dto.descripcion) dataToUpdate.descripcion = dto.descripcion;
      if (dto.contrasenaAcceso)
        dataToUpdate.contrasenaAcceso = dto.contrasenaAcceso;
      if (dto.modalidadPreferencial)
        dataToUpdate.modalidadPreferencial = dto.modalidadPreferencial;
      if (newImageUploaded) {
        dataToUpdate.imagenUrl = `/uploads/${imagen.filename}`; // <-- Se guarda con prefijo
      }
    } else {
      throw new ForbiddenException('No tienes permisos para esta acción.');
    }

    // 1. Verificamos si el nombre o descripción ya existen en los cursos registrados
    const otroCurso = await this.prisma.curso.findFirst({
      where: {
        OR: [
          { nombre: dataBasica.nombre },
          { descripcion: dataBasica.descripcion },
        ],
      },
    });

    if (otroCurso?.id !== id) {
      if (otroCurso?.nombre === dataBasica.nombre) {
        throw new ConflictException('Ya existe un curso con ese nombre.');
      } else {
        throw new ConflictException('Ya existe un curso con esa descripción.');
      }
    }

    try {
      // 4. Ejecutar la transacción
      const cursoActualizado = await this.prisma.$transaction(async (tx) => {
        const cursoActualizadoTx = await tx.curso.update({
          where: { id },
          data: dataToUpdate,
        });

        // Sincronizar Docentes
        if (user.rol === roles.Administrador && dto.docenteIds !== undefined) {
          const { docenteIds } = dto; // La nueva lista de IDs

          // 1. DESACTIVAR:
          // (Pone 'Inactivo' a los docentes que están en la BD pero NO en la nueva lista)
          await tx.docenteCurso.updateMany({
            where: {
              idCurso: id,
              idDocente: { notIn: docenteIds },
              estado: 'Activo', // Solo afecta a los que estaban activos
            },
            data: { estado: 'Inactivo' },
          });

          // 2. REACTIVAR:
          // (Pone 'Activo' a los docentes que SÍ están en la nueva lista
          // pero que figuraban como 'Inactivo' en la BD)
          await tx.docenteCurso.updateMany({
            where: {
              idCurso: id,
              idDocente: { in: docenteIds },
              estado: 'Inactivo', // Solo afecta a los que estaban inactivos
            },
            data: { estado: 'Activo' },
          });

          // 3. CREAR NUEVOS:
          // (Esta es la parte más importante)

          // 3.1. Primero, buscamos los docentes que YA existen en la tabla
          const asignacionesExistentes = await tx.docenteCurso.findMany({
            where: {
              idCurso: id,
              idDocente: { in: docenteIds },
            },
            select: { idDocente: true },
          });
          const idsExistentes = new Set(
            asignacionesExistentes.map((a) => a.idDocente),
          );

          // 3.2. Filtramos la lista para encontrar los que son 100% nuevos
          const idsParaCrear = docenteIds.filter(
            (id) => !idsExistentes.has(id),
          );

          // 3.3. Creamos solo los nuevos
          if (idsParaCrear.length > 0) {
            await tx.docenteCurso.createMany({
              data: idsParaCrear.map((idDocente) => ({
                idCurso: id,
                idDocente: idDocente,
                estado: 'Activo',
              })),
            });
          }
        }

        // Sincronizar Días de Clase
        if (diasClaseToSync) {
          await this.sincronizarDiasClase(tx, id, diasClaseToSync);
        }

        return cursoActualizadoTx;
      });

      // 5. Borrar archivo de imagen antiguo
      if (newImageUploaded && oldImagenUrl) {
        const oldFileName = basename(oldImagenUrl);

        const UPLOADS_PATH = join(process.cwd(), 'uploads');
        const oldImagePath = join(UPLOADS_PATH, oldFileName);

        unlink(oldImagePath, (err) => {
          if (err) {
            console.error(
              `Error al eliminar imagen antigua ${oldImagePath}:`,
              err,
            );
          } else {
            console.log(
              `Imagen antigua ${oldImagePath} eliminada correctamente.`,
            );
          }
        });
      }

      return cursoActualizado;
    } catch (error) {
      console.error(`Error al actualizar el curso ${id}:`, error);
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        console.error('Prisma Error Code:', error.code, error.message);
        throw new BadRequestException(
          'Error al actualizar. Revisa los datos (ej: docentes, días de clase).',
        );
      }
      throw new InternalServerErrorException('Error al actualizar el curso.');
    }
  }

  /**
   * Realiza un soft delete del curso.
   */
  async remove(id: string) {
    try {
      // 1. Verificar si existe y no está ya eliminado
      // Necesitamos fetchear el curso para obtener los IDs de progreso y dificultades
      const curso = await this.prisma.curso.findUnique({
        where: { id, deletedAt: null },
        select: { id: true, idProgreso: true, idDificultadesCurso: true }, // Solo traemos lo que necesitamos
      });

      if (!curso) {
        throw new NotFoundException(
          `Curso con ID '${id}' no encontrado o ya ha sido eliminado.`,
        );
      }

      // 2. Ejecutar todas las bajas en una transacción
      // Usamos $transaction con un array de operaciones
      const [cursoDadoDeBaja] = await this.prisma.$transaction([
        // a. Dar de baja el curso principal
        this.prisma.curso.update({
          where: { id: curso.id },
          data: { deletedAt: new Date() },
        }),

        // b. Dar de baja el ProgresoCurso
        this.prisma.progresoCurso.update({
          where: { id: curso.idProgreso },
          data: { estado: 'Inactivo' },
        }),

        // c. Dar de baja DificultadesCurso
        this.prisma.dificultadesCurso.update({
          where: { id: curso.idDificultadesCurso },
          data: { estado: 'Inactivo' },
        }),

        // d. Dar de baja asignaciones de Docentes (updateMany)
        this.prisma.docenteCurso.updateMany({
          where: { idCurso: curso.id },
          data: { estado: 'Inactivo' },
        }),

        // e. Eliminar Días de Clase (deleteMany)
        this.prisma.diaClase.deleteMany({
          where: { idCurso: curso.id },
        }),
      ]);

      return cursoDadoDeBaja; // Devolvemos el curso actualizado
    } catch (error) {
      console.error(`Error al eliminar el curso ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Captura errores de la transacción (ej: un ID no encontrado)
        throw new BadRequestException(
          'Error al procesar la baja del curso. Alguna relación no fue encontrada.',
        );
      }
      throw new InternalServerErrorException('Error al eliminar el curso.');
    }
  }

  // --- MÉTODO HELPER PARA SINCRONIZAR DÍAS ---
  // Esta función es privada y se ejecuta dentro de un transaction.
  private async sincronizarDiasClase(
    tx: Prisma.TransactionClient, // Importante: usar el cliente de transacción
    idCurso: string,
    diasDto: DiaClaseDto[],
  ) {
    const diasNuevos = diasDto.filter((d) => d.id === null);
    const diasExistentes = diasDto.filter((d) => d.id !== null);
    const idsExistentes = diasExistentes.map((d) => d.id!);

    // 1. Borrar días que ya no están en la lista
    await tx.diaClase.deleteMany({
      where: {
        idCurso: idCurso,
        id: { notIn: idsExistentes },
      },
    });

    // 2. Crear los días nuevos
    if (diasNuevos.length > 0) {
      await tx.diaClase.createMany({
        data: diasNuevos.map((d) => ({
          idCurso: idCurso,
          dia: d.dia,
          modalidad: d.modalidad,
          horaInicio: timeToDate(d.horaInicio),
          horaFin: timeToDate(d.horaFin),
        })),
      });
    }

    // 3. Actualizar los días existentes
    for (const dia of diasExistentes) {
      await tx.diaClase.update({
        where: { id: dia.id! }, // Asumimos que el ID del día de clase es único
        data: {
          dia: dia.dia,
          modalidad: dia.modalidad,
          horaInicio: timeToDate(dia.horaInicio),
          horaFin: timeToDate(dia.horaFin),
        },
      });
    }
  }

  private validateDiasClase(diasClase: DiaClaseDto[]) {
    // 1. Validar que horaInicio < horaFin para cada día
    for (const dia of diasClase) {
      if (dia.horaInicio >= dia.horaFin) {
        throw new BadRequestException(
          `En el día ${dia.dia}, la hora de inicio (${dia.horaInicio}) debe ser anterior a la hora de fin (${dia.horaFin}).`,
        );
      }
    }

    // 2. Validar que no haya solapamientos en el mismo día
    const diasAgrupados = diasClase.reduce(
      (acc, dia) => {
        if (!acc[dia.dia]) {
          acc[dia.dia] = [];
        }
        acc[dia.dia].push(dia);
        return acc;
      },
      {} as Record<string, DiaClaseDto[]>,
    );

    for (const diaSemana in diasAgrupados) {
      const clasesDelDia = diasAgrupados[diaSemana];
      // Ordenar por hora de inicio
      clasesDelDia.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

      // Comprobar solapamientos
      for (let i = 0; i < clasesDelDia.length - 1; i++) {
        if (clasesDelDia[i].horaFin > clasesDelDia[i + 1].horaInicio) {
          throw new ConflictException(
            `Hay un solapamiento de horarios el día ${diaSemana}.`,
          );
        }
      }
    }
  }
}
