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
import {
  estado_simple,
  Prisma,
  roles,
  estado_sesion,
  estado_clase_consulta,
  estado_consulta,
} from '@prisma/client'; // Importamos 'roles'
// import * as bcrypt from 'bcrypt';
import { FindAllCoursesDto } from '../dto/find-all-courses.dto';
import { dateToTime, timeToDate } from 'src/helpers';
import { DiaClaseDto } from '../dto/dia-clase.dto';
import { UserPayload } from 'src/interfaces/authenticated-user.interface';
import { unlink } from 'fs';
import { basename, join } from 'path';
import { MailService } from 'src/mail/services/mail.service';
import { JoinCourseDto } from '../dto/join-course-dto';
import { ProgressService } from 'src/progress/services/progress.service';
import { DifficultiesService } from 'src/difficulties/services/difficulties.service';
import {
  checkAlumnoAccess,
  checkDocenteAccess,
} from 'src/helpers/access.helper';

@Injectable()
export class CoursesService {
  constructor(
    private prisma: PrismaService,
    private progressService: ProgressService,
    private difficultiesService: DifficultiesService,
    private readonly mailService: MailService,
  ) {}

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
      return await this.prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          // 1. Crear el curso y sus relaciones anidadas
          const curso = await tx.curso.create({
            data: {
              nombre,
              descripcion,
              contrasenaAcceso, // Deberías hashear esta contraseña
              imagenUrl,
              modalidadPreferencial: modalidadPreferencial,
              estado: estado_simple.Activo, // <-- Default explícito
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

          // 2. Inicializar ProgresoCurso y DificultadesCurso vinculados al curso
          const fechaInicio = new Date();
          await tx.progresoCurso.create({
            data: {
              idCurso: curso.id,
              fechaRegistro: fechaInicio,
            },
          });

          await tx.dificultadesCurso.create({
            data: {
              idCurso: curso.id,
              fechaRegistro: fechaInicio,
            },
          });

          // 3. Enviar correo de bienvenida a los docentes asignados
          // (Lo hacemos dentro del try pero fuera de la transacción crítica si queremos,
          // o aquí mismo. Para simplificar, lo hacemos después de crear el curso)
          const docentesAsignados = await tx.usuario.findMany({
            where: { id: { in: docenteIds } },
          });

          const diasTexto = diasClase
            .map((d) => `${d.dia} (${d.horaInicio}-${d.horaFin})`)
            .join(', ');

          for (const docente of docentesAsignados) {
            this.mailService.enviarBienvenidaCursoDocente(
              docente.email,
              docente.nombre,
              {
                nombre: curso.nombre,
                descripcion: curso.descripcion,
                diasClase: diasTexto,
                contrasena: contrasenaAcceso,
                idCurso: curso.id,
              },
            );
          }

          return curso;
        },
      );
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
        where.estado = estado;
      }
      if (docenteIds && docenteIds.length > 0) {
        where.docentes = {
          some: { idDocente: { in: docenteIds }, estado: estado_simple.Activo },
        };
      }

      // --- 2. Construir el ORDER BY ---
      let orderBy: Prisma.CursoOrderByWithRelationInput;

      if (sort === 'alumnos') {
        // Ordenamiento especial por cantidad de relaciones
        orderBy = {
          alumnos: { _count: order },
        };
      } else {
        orderBy = { [sort]: order };
      }

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
                estado: { in: ['Activo', 'Finalizado'] }, // <-- CORRECCIÓN: Mostrar docentes activos y finalizados
              },
              include: {
                docente: { select: { nombre: true, apellido: true } },
              },
            },
            _count: {
              select: {
                alumnos: {
                  where: {
                    estado: {
                      in: [estado_simple.Activo, estado_simple.Finalizado],
                    },
                  },
                },
              },
            },
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
        where: { id }, // Permitimos buscar cursos finalizados (deletedAt != null)
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

  async findActiveAlumnosByCurso(idCurso: string, idDocente: string) {
    // 1. Validamos que el docente que pide tenga acceso
    await checkDocenteAccess(this.prisma, idDocente, idCurso);

    // 2. Buscamos los alumnos activos
    const inscripciones = await this.prisma.inscripcionesAlumnoCurso.findMany({
      where: {
        idCurso: idCurso,
        estado: estado_simple.Activo,
      },
      include: {
        alumno: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            dni: true,
            fotoPerfilUrl: true,
          },
        },
      },
    });

    // 3. Mapeamos la respuesta con los datos del alumno y su fecha de inscripción
    return inscripciones.map((i) => ({
      ...i.alumno,
      fechaInscripcion: i.fechaInscripcion,
    }));
  }

  /**
   * Obtiene la lista de docentes activos de un curso (para los filtros)
   */
  async findActiveDocentesByCurso(
    idCurso: string,
    idUsuarioSolicitante: string,
    rol: roles,
  ) {
    // 1. Validamos acceso según el rol del solicitante
    if (rol === roles.Alumno) {
      await checkAlumnoAccess(this.prisma, idUsuarioSolicitante, idCurso);
    } else {
      await checkDocenteAccess(this.prisma, idUsuarioSolicitante, idCurso);
    }

    // 2. Buscamos los docentes activos
    const asignaciones = await this.prisma.asignacionesDocenteCurso.findMany({
      where: {
        idCurso: idCurso,
        estado: estado_simple.Activo,
      },
      include: {
        docente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
    });

    // 3. Mapeamos la respuesta
    return asignaciones.map((a) => a.docente);
  }

  async findEligibleForRefuerzo(idCurso: string, idDocente: string) {
    // 1. Validamos que el docente que pide tenga acceso
    await checkDocenteAccess(this.prisma, idDocente, idCurso);

    // 2. Buscamos las inscripciones activas del curso que tengan dificultades registradas no superadas
    const inscripcionesConDificultades =
      await this.prisma.inscripcionesAlumnoCurso.findMany({
        where: {
          idCurso: idCurso,
          estado: estado_simple.Activo,
          dificultadesAlumnos: {
            some: {
              gradoActual: { not: 'Ninguno' },
            },
          },
        },
        include: {
          alumno: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              fotoPerfilUrl: true,
            },
          },
          dificultadesAlumnos: {
            where: {
              gradoActual: { not: 'Ninguno' },
            },
            select: {
              gradoActual: true,
            },
          },
        },
        orderBy: [
          { alumno: { apellido: 'asc' } },
          { alumno: { nombre: 'asc' } },
        ],
      });

    return inscripcionesConDificultades.map((inscripcion) => {
      const { alumno, dificultadesAlumnos } = inscripcion;
      const alto = dificultadesAlumnos.filter(
        (d) => d.gradoActual === 'Alto',
      ).length;
      const medio = dificultadesAlumnos.filter(
        (d) => d.gradoActual === 'Medio',
      ).length;
      const bajo = dificultadesAlumnos.filter(
        (d) => d.gradoActual === 'Bajo',
      ).length;

      return {
        id: alumno.id,
        nombre: alumno.nombre,
        apellido: alumno.apellido,
        fotoPerfilUrl: alumno.fotoPerfilUrl,
        totalDificultades: dificultadesAlumnos.length,
        gradoAlto: alto,
        gradoMedio: medio,
        gradoBajo: bajo,
      };
    });
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
      const isDocenteOfCourse =
        await this.prisma.asignacionesDocenteCurso.findFirst({
          where: { idCurso: id, idDocente: user.userId, estado: 'Activo' },
        });
      if (!isDocenteOfCourse) {
        throw new ForbiddenException(
          'No tienes permiso para editar este curso.',
        );
      }
      // Eliminamos la validación estricta. Si llegan nombre/docentes, simplemente los ignoramos abajo.
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
    const orConditions: Prisma.CursoWhereInput[] = [];
    if (dataBasica.nombre) {
      orConditions.push({ nombre: dataBasica.nombre });
    }
    if (dataBasica.descripcion) {
      orConditions.push({ descripcion: dataBasica.descripcion });
    }

    if (orConditions.length > 0) {
      const otroCurso = await this.prisma.curso.findFirst({
        where: {
          OR: orConditions,
          id: { not: id }, // Excluimos el curso actual directamente en la query
        },
      });

      if (otroCurso) {
        if (dataBasica.nombre && otroCurso.nombre === dataBasica.nombre) {
          throw new ConflictException('Ya existe un curso con ese nombre.');
        }
        if (
          dataBasica.descripcion &&
          otroCurso.descripcion === dataBasica.descripcion
        ) {
          throw new ConflictException(
            'Ya existe un curso con esa descripción.',
          );
        }
      }
    }

    try {
      // 4. Ejecutar la transacción
      const cursoActualizado = await this.prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          let nuevosDocentesIds: string[] = [];
          const cursoActualizadoTx = await tx.curso.update({
            where: { id },
            data: dataToUpdate,
          });

          // Sincronizar Docentes
          if (
            user.rol === roles.Administrador &&
            dto.docenteIds !== undefined
          ) {
            const { docenteIds } = dto; // La nueva lista de IDs

            // 1. DESACTIVAR:
            // (Pone 'Inactivo' a los docentes que están en la BD pero NO en la nueva lista)
            await tx.asignacionesDocenteCurso.updateMany({
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
            await tx.asignacionesDocenteCurso.updateMany({
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
            const asignacionesExistentes =
              await tx.asignacionesDocenteCurso.findMany({
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
              await tx.asignacionesDocenteCurso.createMany({
                data: idsParaCrear.map((idDocente) => ({
                  idCurso: id,
                  idDocente: idDocente,
                  estado: 'Activo',
                })),
              });
              nuevosDocentesIds = idsParaCrear;
            }
          }

          // Sincronizar Días de Clase
          if (diasClaseToSync) {
            await this.sincronizarDiasClase(tx, id, diasClaseToSync);
          }

          // Enviar correo a los NUEVOS docentes asignados
          if (nuevosDocentesIds.length > 0) {
            const nuevosDocentes = await tx.usuario.findMany({
              where: { id: { in: nuevosDocentesIds } },
            });

            // Obtenemos los días actualizados para el correo
            const diasActuales = await tx.diaClase.findMany({
              where: { idCurso: id },
            });
            const diasTexto = diasActuales
              .map(
                (d) =>
                  `${d.dia} (${dateToTime(d.horaInicio)}-${dateToTime(d.horaFin)})`,
              )
              .join(', ');

            for (const docente of nuevosDocentes) {
              this.mailService.enviarBienvenidaCursoDocente(
                docente.email,
                docente.nombre,
                {
                  nombre: cursoActualizadoTx.nombre,
                  descripcion: cursoActualizadoTx.descripcion,
                  diasClase: diasTexto,
                  contrasena: cursoActualizadoTx.contrasenaAcceso,
                  idCurso: id,
                },
              );
            }
          }

          return cursoActualizadoTx;
        },
      );

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
      const curso = await this.prisma.curso.findUnique({
        where: { id, deletedAt: null },
        select: { id: true },
      });

      if (!curso) {
        throw new NotFoundException(
          `Curso con ID '${id}' no encontrado o ya ha sido eliminado.`,
        );
      }

      // 2. Ejecutar todas las bajas en una transacción
      const [cursoDadoDeBaja] = await this.prisma.$transaction([
        // a. Dar de baja el curso principal
        this.prisma.curso.update({
          where: { id: curso.id },
          data: { deletedAt: new Date(), estado: estado_simple.Inactivo },
        }),

        // b. Dar de baja asignaciones de Docentes (updateMany)
        this.prisma.asignacionesDocenteCurso.updateMany({
          where: { idCurso: curso.id, estado: estado_simple.Activo },
          data: { estado: estado_simple.Inactivo, fechaBaja: new Date() },
        }),

        // c. Dar de baja inscripciones de Alumnos
        this.prisma.inscripcionesAlumnoCurso.updateMany({
          where: { idCurso: curso.id, estado: estado_simple.Activo },
          data: { estado: estado_simple.Inactivo, fechaBaja: new Date() },
        }),

        // d. Dar de baja Sesiones de Refuerzo
        this.prisma.sesionRefuerzo.updateMany({
          where: { idCurso: curso.id, deletedAt: null },
          data: { deletedAt: new Date(), estado: estado_sesion.Cancelada },
        }),

        // e. Dar de baja Consultas
        this.prisma.consulta.updateMany({
          where: { idCurso: curso.id, deletedAt: null },
          data: { deletedAt: new Date() },
        }),

        // f. Dar de baja Clases de Consulta
        this.prisma.claseConsulta.updateMany({
          where: { idCurso: curso.id, deletedAt: null },
          data: {
            deletedAt: new Date(),
            estadoClase: estado_clase_consulta.Cancelada,
          },
        }),

        // g. Eliminar Días de Clase (deleteMany)
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

  /**
   * Da de baja a un alumno de un curso específico.
   * (Soft delete de la inscripción y cierre de pendientes)
   */
  async removeStudent(
    idCurso: string,
    idAlumno: string,
    idDocenteSolicitante: string,
  ) {
    // 1. Validar acceso del docente
    await checkDocenteAccess(this.prisma, idDocenteSolicitante, idCurso);

    // 2. Validar que el alumno esté activo en el curso
    const inscripcion = await this.prisma.inscripcionesAlumnoCurso.findFirst({
      where: {
        idAlumno: idAlumno,
        idCurso: idCurso,
      },
    });

    if (!inscripcion || inscripcion.estado !== estado_simple.Activo) {
      throw new NotFoundException(
        'El alumno no está inscripto o ya está inactivo en este curso.',
      );
    }

    // 3. Ejecutar baja en transacción
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // a. Baja de inscripción
      await tx.inscripcionesAlumnoCurso.update({
        where: { id: inscripcion.id },
        data: { estado: estado_simple.Inactivo, fechaBaja: new Date() },
      });

      // c. Cerrar Consultas pendientes (Pendiente, A_revisar, Revisada -> No_resuelta)
      await tx.consulta.updateMany({
        where: {
          idCurso,
          idAlumno,
          estado: {
            in: [
              estado_consulta.Pendiente,
              estado_consulta.A_revisar,
              estado_consulta.Revisada,
            ],
          },
        },
        data: { estado: estado_consulta.No_resuelta },
      });

      // d. Cerrar Sesiones pendientes (Pendiente -> No_realizada)
      await tx.sesionRefuerzo.updateMany({
        where: { idCurso, idAlumno, estado: estado_sesion.Pendiente },
        data: { estado: estado_sesion.No_realizada },
      });

      // e. Recalcular estadísticas del curso (al pasar a Inactivo, se excluyen automáticamente)
      await this.progressService.recalculateCourseProgress(tx, idCurso);
      await this.difficultiesService.recalculateCourseDifficulties(tx, idCurso);

      return { message: 'Alumno dado de baja correctamente.' };
    });
  }

  /**
   * Finaliza un curso (Cierre de ciclo).
   * Marca el curso como eliminado (Solo Lectura) y cierra/cancela actividades pendientes,
   * pero MANTIENE los registros hijos para el historial.
   */
  async finalize(id: string) {
    // 1. Verificar si existe y no está ya finalizado/eliminado
    const curso = await this.prisma.curso.findUnique({
      where: { id, deletedAt: null },
      select: { id: true },
    });

    if (!curso) {
      throw new NotFoundException(
        `Curso con ID '${id}' no encontrado o ya ha sido finalizado.`,
      );
    }

    // 2. Ejecutar cierre en transacción
    return this.prisma.$transaction([
      // a. Soft delete del curso (Marca el fin del ciclo y activa modo Solo Lectura)
      this.prisma.curso.update({
        where: { id },
        data: { deletedAt: new Date(), estado: estado_simple.Finalizado }, // <-- Marcamos como Finalizado
      }),

      // b. Inactivar relaciones (Alumnos/Docentes/Dificultades)
      this.prisma.inscripcionesAlumnoCurso.updateMany({
        where: { idCurso: id, estado: estado_simple.Activo },
        data: { estado: estado_simple.Finalizado, fechaBaja: new Date() },
      }),
      this.prisma.asignacionesDocenteCurso.updateMany({
        where: { idCurso: id, estado: estado_simple.Activo },
        data: { estado: estado_simple.Finalizado, fechaBaja: new Date() },
      }),

      // c. Cerrar Consultas (Pendientes -> No resuelta)
      this.prisma.consulta.updateMany({
        where: {
          idCurso: id,
          estado: {
            in: [
              estado_consulta.Pendiente,
              estado_consulta.A_revisar,
              estado_consulta.Revisada,
            ],
          },
        },
        data: { estado: estado_consulta.No_resuelta },
      }),

      // d. Cancelar Clases Futuras/Pendientes
      this.prisma.claseConsulta.updateMany({
        where: {
          idCurso: id,
          estadoClase: {
            in: [
              estado_clase_consulta.Programada,
              estado_clase_consulta.En_curso,
              estado_clase_consulta.Pendiente_Asignacion,
            ],
          },
        },
        data: { estadoClase: estado_clase_consulta.Cancelada },
      }),

      // e. Cerrar Sesiones Pendientes
      this.prisma.sesionRefuerzo.updateMany({
        where: {
          idCurso: id,
          estado: estado_sesion.Pendiente,
        },
        data: { estado: estado_sesion.No_realizada },
      }),
    ]);
  }

  async joinCourse(idAlumno: string, idCurso: string, dto: JoinCourseDto) {
    const { contrasenaAcceso } = dto;

    try {
      return await this.prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          // 3. Validar Curso y Contraseña
          const curso = await tx.curso.findUnique({
            where: { id: idCurso, deletedAt: null },
          });

          console.log('Contraseña del curso:', curso?.contrasenaAcceso);
          console.log('Contraseña enviada:', contrasenaAcceso);

          if (!curso) {
            throw new NotFoundException(
              'Curso no encontrado o no está disponible.',
            );
          }

          if (curso.contrasenaAcceso !== contrasenaAcceso) {
            throw new BadRequestException(
              'La contraseña del curso es incorrecta.',
            );
          }

          // 4. Validar que el alumno no tenga OTRA inscripción activa
          const otraInscripcionActiva =
            await tx.inscripcionesAlumnoCurso.findFirst({
              where: {
                idAlumno: idAlumno,
                estado: estado_simple.Activo,
                NOT: { idCurso: idCurso },
              },
            });

          if (otraInscripcionActiva) {
            throw new BadRequestException(
              'Ya tienes una inscripción activa en otro curso.',
            );
          }

          // 5. Buscar inscripción existente (para validar re-inscripción)
          const inscripcionExistente =
            await tx.inscripcionesAlumnoCurso.findFirst({
              where: {
                idAlumno: idAlumno,
                idCurso: idCurso,
              },
            });

          if (inscripcionExistente) {
            // El alumno ya estuvo en este curso
            if (inscripcionExistente.estado === estado_simple.Activo) {
              throw new BadRequestException(
                'Ya estás inscripto en este curso.',
              );
            }
            // Regla de Negocio: No se puede volver a cursar el mismo curso
            throw new BadRequestException(
              'No puedes volver a inscribirte en un curso del que ya formaste parte (Baja o Finalizado).',
            );
          } else {
            // --- Inscripción Nueva ---
            // 1. Creamos la Inscripción
            const inscripcion = await tx.inscripcionesAlumnoCurso.create({
              data: {
                idAlumno: idAlumno,
                idCurso: idCurso,
                estado: estado_simple.Activo,
              },
            });

            // 2. Inicializamos el progreso del alumno vinculado a la nueva inscripción
            await tx.progresoAlumno.create({
              data: {
                idInscripcion: inscripcion.id,
              },
            });

            // 3. Actualizamos el progreso general del curso (para incluir al nuevo alumno en los promedios)
            await this.progressService.recalculateCourseProgress(tx, idCurso);
            // 4. Actualizamos también las estadísticas de dificultades
            await this.difficultiesService.recalculateCourseDifficulties(
              tx,
              idCurso,
            );

            return inscripcion;
          }
        },
      );
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'No se pudo completar la inscripción.',
      );
    }
  }

  /**
   * Obtiene estadísticas para el dashboard del docente (Hoy y Semana).
   */
  async getDashboardStats(idCurso: string) {
    const now = new Date();

    // 1. Ejecutamos las consultas en paralelo
    const [
      latestProgreso,
      latestDificultades,
      nextClass,
      consultasData,
      sesionesData,
      evolutionHistory,
      rawDifficulties,
    ] = await Promise.all([
      this.prisma.progresoCurso.findFirst({
        where: { idCurso },
        orderBy: { fechaRegistro: 'desc' },
        select: { pctMisionesCompletadas: true },
      }),
      this.prisma.dificultadesCurso.findFirst({
        where: { idCurso },
        orderBy: { fechaRegistro: 'desc' },
        select: {
          dificultadModa: { select: { nombre: true } },
        },
      }),
      this.prisma.claseConsulta.findFirst({
        where: {
          idCurso,
          fechaInicio: { gte: now },
          estadoClase: { not: 'Cancelada' },
        },
        orderBy: { fechaInicio: 'asc' },
      }),
      this.prisma.consulta.groupBy({
        by: ['estado'],
        where: { idCurso, deletedAt: null },
        _count: { id: true },
      }),
      this.prisma.sesionRefuerzo.findMany({
        where: { idCurso, deletedAt: null },
        select: { idDocente: true, estado: true },
      }),
      this.prisma.progresoCurso.findMany({
        where: { idCurso },
        orderBy: { fechaRegistro: 'asc' },
        select: { fechaRegistro: true, pctMisionesCompletadas: true },
      }),
      this.prisma.dificultadesAlumno.findMany({
        where: {
          inscripcion: {
            idCurso,
            estado: estado_simple.Activo,
          },
        },
        include: {
          dificultad: true,
          inscripcion: { select: { idAlumno: true } },
        },
        orderBy: { fechaRegistro: 'desc' },
      }),
    ]);

    // Procesar consultas
    let totalConsultas = 0;
    let pendientesConsultas = 0;
    const consultasPorEstado = consultasData.map((c) => {
      totalConsultas += c._count.id;
      if (c.estado === estado_consulta.Pendiente) {
        pendientesConsultas += c._count.id;
      }
      return {
        label: c.estado,
        value: c._count.id,
      };
    });

    // Procesar sesiones en memoria
    let totalSesiones = sesionesData.length;
    let pendientesSesiones = sesionesData.filter(
      (s) => s.estado === estado_sesion.Pendiente,
    ).length;
    const sesionesPorEstado = sesionesData.reduce((acc, s) => {
      acc[s.estado] = (acc[s.estado] || 0) + 1;
      return acc;
    }, {});

    const sistema = sesionesData.filter((s) => !s.idDocente).length;
    const docente = totalSesiones - sistema;

    // Procesar evolución
    const dailyEvolutionMap = new Map<
      string,
      { fecha: Date; progreso: number }
    >();
    evolutionHistory.forEach((h) => {
      const dateKey = h.fechaRegistro.toISOString().split('T')[0];
      dailyEvolutionMap.set(dateKey, {
        fecha: h.fechaRegistro,
        progreso: Number(h.pctMisionesCompletadas),
      });
    });

    const evolutionChartData = Array.from(dailyEvolutionMap.values());

    // Procesar Dificultades (usar únicamente el estado más reciente de cada dificultad)
    const latestDifMap = new Map<string, (typeof rawDifficulties)[0]>();
    for (const d of rawDifficulties) {
      const key = `${d.idInscripcion}_${d.idDificultad}`;
      if (!latestDifMap.has(key)) {
        latestDifMap.set(key, d);
      }
    }
    const currentDifficulties = Array.from(latestDifMap.values());

    const byTopic = new Map<string, Set<string>>();
    const byDifficulty = new Map<string, Set<string>>();
    const byGrade = { Ninguno: 0, Bajo: 0, Medio: 0, Alto: 0 };
    const difficultyDetails = new Map<string, any>();

    currentDifficulties.forEach((d) => {
      const tema = d.dificultad.tema;
      const alumnoId = d.inscripcion.idAlumno;
      if (d.gradoActual !== 'Ninguno') {
        if (!byTopic.has(tema)) byTopic.set(tema, new Set());
        byTopic.get(tema)!.add(alumnoId);
      }

      const difId = d.idDificultad;
      if (d.gradoActual !== 'Ninguno') {
        if (!byDifficulty.has(difId)) byDifficulty.set(difId, new Set());
        byDifficulty.get(difId)!.add(alumnoId);
      }

      if (!difficultyDetails.has(difId)) {
        difficultyDetails.set(difId, { nombre: d.dificultad.nombre });
      }

      if (d.gradoActual in byGrade) {
        byGrade[d.gradoActual as keyof typeof byGrade]++;
      }
    });

    const graficoTemas = Array.from(byTopic.entries()).map(
      ([label, students]) => ({
        label,
        value: students.size,
      }),
    );

    const graficoDificultades = Array.from(byDifficulty.entries()).map(
      ([id, students]) => ({
        label: difficultyDetails.get(id)?.nombre || 'Desconocida',
        value: students.size,
      }),
    );

    const graficoGrados = [
      { label: 'Ninguno', value: byGrade.Ninguno, color: '#9e9e9e' },
      { label: 'Bajo', value: byGrade.Bajo, color: '#4caf50' },
      { label: 'Medio', value: byGrade.Medio, color: '#ff9800' },
      { label: 'Alto', value: byGrade.Alto, color: '#f44336' },
    ];

    return {
      progresoPct: latestProgreso?.pctMisionesCompletadas
        ? Number(latestProgreso.pctMisionesCompletadas)
        : 0,
      dificultadMasDetectada:
        latestDificultades?.dificultadModa?.nombre || null,
      consultas: { total: totalConsultas, pendientes: pendientesConsultas },
      sesiones: { total: totalSesiones, pendientes: pendientesSesiones },
      nextClass,
      consultasPorEstado,
      sesionesPorEstado: Object.entries(sesionesPorEstado).map(
        ([label, value]) => ({
          label,
          value,
        }),
      ),
      sesionesPorOrigen: { sistema, docente },
      evolucionProgreso: evolutionChartData,
      dificultadesGraficos: {
        porTema: graficoTemas,
        porDificultad: graficoDificultades,
        porGrado: graficoGrados,
      },
    };
  }

  /**
   * Obtiene estadísticas para el dashboard del ALUMNO.
   */
  async getStudentDashboardStats(idCurso: string, idAlumno: string) {
    const now = new Date();

    const { start: startOfDay, end: endOfDay } = this.getDayRange(now);
    const { start: startOfWeek, end: endOfWeek } = this.getWeekRange(now);

    // 1. Obtener la inscripción activa del alumno en el curso
    const inscripcion = await this.prisma.inscripcionesAlumnoCurso.findFirst({
      where: { idAlumno, idCurso, estado: estado_simple.Activo },
      include: {
        progresoAlumnos: {
          orderBy: { fechaRegistro: 'desc' },
          take: 1,
          select: { pctMisionesCompletadas: true, promIntentos: true },
        },
      },
    });

    const progreso = inscripcion?.progresoAlumnos?.[0];

    // Misiones Completadas (Hoy y Semana)
    const [misionesHoy, misionesSemana] = await Promise.all([
      this.prisma.misionCompletada.count({
        where: {
          inscripcionAlumno: { idAlumno, idCurso },
          fechaCompletado: { gte: startOfDay, lte: endOfDay },
        },
      }),
      this.prisma.misionCompletada.count({
        where: {
          inscripcionAlumno: { idAlumno, idCurso },
          fechaCompletado: { gte: startOfWeek, lte: endOfWeek },
        },
      }),
    ]);

    // Misión más difícil de la semana (la que requirió más intentos)
    const misionMasDificilRecord = await this.prisma.misionCompletada.findFirst(
      {
        where: {
          fechaCompletado: { gte: startOfWeek, lte: endOfWeek },
          inscripcionAlumno: { idAlumno, idCurso },
        },
        include: { mision: true },
        orderBy: { intentos: 'desc' },
      },
    );
    let misionMasDificil;
    if (misionMasDificilRecord) {
      misionMasDificil = {
        mision: misionMasDificilRecord.mision,
        intentos: misionMasDificilRecord.intentos,
        promedioHistorial: progreso?.promIntentos
          ? Number(progreso.promIntentos)
          : 0,
      };
    }

    // 2. Sesión Pendiente (La más próxima)
    const sesionPendiente = await this.prisma.sesionRefuerzo.findFirst({
      where: {
        idCurso,
        idAlumno,
        estado: estado_sesion.Pendiente,
        deletedAt: null,
      },
      orderBy: { fechaHoraLimite: 'asc' },
      select: {
        id: true,
        fechaHoraLimite: true,
        dificultad: { select: { nombre: true } },
      },
    });

    // 3. Próxima Clase
    const proximaClase = await this.prisma.claseConsulta.findFirst({
      where: {
        idCurso,
        fechaInicio: { gte: now },
        estadoClase: {
          in: [
            estado_clase_consulta.Programada,
            estado_clase_consulta.Pendiente_Asignacion,
          ],
        },
        deletedAt: null,
      },
      orderBy: { fechaInicio: 'asc' },
      select: {
        id: true,
        fechaInicio: true,
        fechaFin: true,
        modalidad: true,
        nombre: true,
      },
    });

    // 4. Dificultades (usar únicamente el estado más reciente por dificultad)
    const rawStudentDifs = inscripcion
      ? await this.prisma.dificultadesAlumno.findMany({
          where: { idInscripcion: inscripcion.id },
          orderBy: { fechaRegistro: 'desc' },
        })
      : [];

    const studentDifMap = new Map<string, (typeof rawStudentDifs)[0]>();
    for (const d of rawStudentDifs) {
      if (!studentDifMap.has(d.idDificultad)) {
        studentDifMap.set(d.idDificultad, d);
      }
    }
    const latestStudentDifs = Array.from(studentDifMap.values());

    const cantDificultadesActivas = latestStudentDifs.filter(
      (d) => d.gradoActual !== 'Ninguno',
    ).length;

    const distCounts: Record<string, number> = {
      Ninguno: 0,
      Bajo: 0,
      Medio: 0,
      Alto: 0,
    };
    latestStudentDifs.forEach((d) => {
      distCounts[d.gradoActual] = (distCounts[d.gradoActual] || 0) + 1;
    });
    const dificultadesDistribucion = Object.entries(distCounts).map(
      ([gradoActual, count]) => ({
        gradoActual,
        _count: { idDificultad: count },
      }),
    );

    const ultimaDificultadAlta = inscripcion
      ? await this.prisma.dificultadesAlumno.findFirst({
          where: {
            idInscripcion: inscripcion.id,
            gradoActual: 'Alto',
          },
          orderBy: { fechaRegistro: 'desc' },
          select: {
            dificultad: { select: { id: true, nombre: true } },
            gradoActual: true,
          },
        })
      : null;

    let ultimaAltaInfo;
    if (ultimaDificultadAlta) {
      ultimaAltaInfo = {
        nombre: ultimaDificultadAlta.dificultad.nombre,
        gradoActual: ultimaDificultadAlta.gradoActual,
      };
    }

    // 5. Consultas
    const consultasDistribucion = await this.prisma.consulta.groupBy({
      by: ['estado'],
      where: { idAlumno, idCurso, deletedAt: null },
      _count: { id: true },
    });
    const totalConsultas = consultasDistribucion.reduce(
      (acc, curr) => acc + curr._count.id,
      0,
    );
    const ultimaConsultaRealizada = await this.prisma.consulta.findFirst({
      where: {
        idAlumno,
        idCurso,
        deletedAt: null, // Solo consultas no eliminadas
      },
      orderBy: { createdAt: 'desc' }, // Ordenar por fecha de creación descendente
      // Incluimos la descripción para la tarjeta del dashboard
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        estado: true,
        createdAt: true,
      },
    });

    // 6. Sesiones de Refuerzo
    const sesionesDistribucion = await this.prisma.sesionRefuerzo.groupBy({
      by: ['estado'],
      where: { idAlumno, idCurso, deletedAt: null },
      _count: { id: true },
    });
    const totalSesiones = sesionesDistribucion.reduce(
      (acc, curr) => acc + curr._count.id,
      0,
    );

    const ultimoResultado = await this.prisma.resultadoSesion.findFirst({
      where: {
        sesionRefuerzo: {
          idAlumno,
          idCurso,
          deletedAt: null,
        },
      },
      orderBy: { fechaCompletado: 'desc' },
      include: {
        sesionRefuerzo: {
          select: {
            dificultad: { select: { nombre: true } },
            nroSesion: true,
          },
        },
      },
    });

    let ultimoResultadoMapped;
    if (ultimoResultado) {
      ultimoResultadoMapped = {
        dificultadNombre: ultimoResultado.sesionRefuerzo.dificultad.nombre,
        pctAciertos: Number(ultimoResultado.pctAciertos),
        gradoAnterior: ultimoResultado.gradoAnterior,
        gradoNuevo: ultimoResultado.gradoNuevo,
        nroSesion: ultimoResultado.sesionRefuerzo.nroSesion,
      };
    }

    const ultimasConsultasRevisadas = await this.prisma.consulta.findMany({
      where: {
        idAlumno,
        idCurso,
        estado: { in: [estado_consulta.Revisada] },
        deletedAt: null,
      },
      orderBy: { updatedAt: 'desc' },
      take: 15,
      select: { id: true, titulo: true, estado: true, updatedAt: true },
    });

    const cantidadAlumnosInscriptos =
      await this.prisma.inscripcionesAlumnoCurso.count({
        where: { idCurso, estado: estado_simple.Activo },
      });

    return {
      misiones: { hoy: misionesHoy, semana: misionesSemana },
      progresoPct: progreso?.pctMisionesCompletadas
        ? Number(progreso.pctMisionesCompletadas)
        : 0,
      misionMasDificil,
      sesionPendiente,
      proximaClase,
      dificultades: {
        activas: cantDificultadesActivas,
        distribucion: dificultadesDistribucion.map((d) => ({
          label: d.gradoActual,
          value: d._count.idDificultad,
        })),
        ultimaAlta: ultimaAltaInfo,
      },
      consultas: {
        total: totalConsultas,
        distribucion: consultasDistribucion.map((c) => ({
          label: c.estado,
          value: c._count.id,
        })),
        recientes: ultimasConsultasRevisadas,
        ultimaRealizada: ultimaConsultaRealizada,
      },
      sesiones: {
        total: totalSesiones,
        distribucion: sesionesDistribucion.map((s) => ({
          label: s.estado,
          value: s._count.id,
        })),
        ultimoResultado: ultimoResultadoMapped,
      },
      cantidadAlumnosInscriptos,
    };
  }

  private getDayRange(date: Date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  private getWeekRange(date: Date) {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
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
