import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  grado_dificultad,
  Prisma,
  roles,
  temas,
  fuente_cambio_dificultad,
  estado_simple,
  estado_sesion,
} from '@prisma/client';
import { SubmitDifficultyDto } from '../dto/submit-difficulty.dto';
import { SesionesRefuerzoService } from '../../sesiones-refuerzo/service/sesiones-refuerzo.service';

@Injectable()
export class DifficultiesService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => SesionesRefuerzoService))
    private sesionesRefuerzoService: SesionesRefuerzoService,
  ) {}

  /**
   * Obtiene la lista de dificultades y el grado (performance) del alumno
   * para un curso específico.
   */
  async getStudentDifficulties(idAlumno: string, idCurso: string) {
    try {
      // 1. Buscamos todas las dificultades asignadas a ese alumno en ese curso
      const dificultadesAlumno = await this.prisma.dificultadAlumno.findMany({
        where: {
          idAlumno: idAlumno,
          idCurso: idCurso,
        },
        // 2. Incluimos los detalles de la dificultad (nombre, tema, etc.)
        include: {
          dificultad: true,
        },
        // Opcional: ordenar por tema o nombre
        orderBy: {
          dificultad: {
            tema: 'asc',
          },
        },
      });

      // 3. Validamos si se encontró algo
      if (!dificultadesAlumno || dificultadesAlumno.length === 0) {
        // No es un error, simplemente puede no tener dificultades aún
        return [];
      }

      // 4. Mapeamos la respuesta para que sea más limpia para el frontend
      return dificultadesAlumno.map((da) => ({
        id: da.dificultad.id,
        nombre: da.dificultad.nombre,
        descripcion: da.dificultad.descripcion,
        tema: da.dificultad.tema,
        grado: da.grado, // El grado (Ninguno, Bajo, Medio, Alto) del alumno
      }));
    } catch (error) {
      console.error('Error en getStudentDifficulties:', error);
      throw new InternalServerErrorException(
        'Error al obtener tus dificultades.',
      );
    }
  }

  /**
   * MÉTODO 1: Obtener el Resumen (KPIs) del Curso
   * (Lee la tabla 'DificultadesCurso' vinculada)
   */
  async getCourseDifficultiesOverview(idCurso: string) {
    try {
      const curso = await this.prisma.curso.findUnique({
        where: { id: idCurso },
        select: {
          dificultadesCurso: {
            // Opcional: incluir el nombre de la dificultad más frecuente
            include: {
              dificultadModa: {
                select: { nombre: true },
              },
            },
          },
        },
      });

      if (!curso || !curso.dificultadesCurso) {
        throw new NotFoundException(
          'Resumen de dificultades del curso no encontrado.',
        );
      }

      const overview = curso.dificultadesCurso;

      return {
        ...overview,
        promDificultades: parseFloat(overview.promDificultades as any),
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Error en getCourseDifficultiesOverview:', error);
      throw new InternalServerErrorException(
        'Error al obtener el resumen de dificultades.',
      );
    }
  }

  /**
   * MÉTODO 2: Obtener la lista de alumnos para la DataGrid (Resumen)
   */
  async getStudentDifficultyList(idCurso: string) {
    // 0. Verificar estado del curso
    const curso = await this.prisma.curso.findUnique({
      where: { id: idCurso },
      select: { deletedAt: true },
    });
    const includeInactive = !!curso?.deletedAt;

    try {
      // 1. Construir el WHERE (Ahora para el modelo 'Usuario')
      const where: Prisma.UsuarioWhereInput = {
        rol: roles.Alumno, // Solo Alumnos
        cursosDelAlumno: {
          // Que estén en este curso Y activos
          some: {
            idCurso: idCurso,
            // Si el curso está finalizado, mostramos Finalizados y Activos, pero NO Inactivos (Abandonos)
            estado: includeInactive
              ? { in: [estado_simple.Activo, estado_simple.Finalizado] }
              : estado_simple.Activo,
          },
        },
      };

      // 2. Ejecutar consulta (sin paginación ni ordenamiento del lado del servidor)
      const alumnos = await this.prisma.usuario.findMany({
        where,
        select: {
          id: true,
          nombre: true,
          apellido: true,
          dificultades: {
            where: { idCurso: idCurso },
            select: {
              grado: true,
              idDificultad: true,
              dificultad: { select: { tema: true } },
            },
          },
        },
      });

      // 3. Mapear la respuesta y calcular los conteos
      const data = alumnos.map((alumno) => {
        // Contamos los grados manualmente
        const alto = alumno.dificultades.filter(
          (d) => d.grado === 'Alto',
        ).length;
        const medio = alumno.dificultades.filter(
          (d) => d.grado === 'Medio',
        ).length;
        const bajo = alumno.dificultades.filter(
          (d) => d.grado === 'Bajo',
        ).length;
        const ninguno = alumno.dificultades.filter(
          (d) => d.grado === 'Ninguno',
        ).length;

        return {
          id: alumno.id,
          nombre: alumno.nombre,
          apellido: alumno.apellido,
          totalDificultades: alumno.dificultades.length,
          gradoAlto: alto,
          gradoMedio: medio,
          gradoBajo: bajo,
          gradoNinguno: ninguno,
          dificultadesDetalle: alumno.dificultades.map((d) => ({
            idDificultad: d.idDificultad,
            grado: d.grado,
            tema: d.dificultad.tema,
          })),
        };
      });

      return data;
    } catch (error) {
      console.error('Error en getStudentDifficultyList:', error);
      throw new InternalServerErrorException(
        'Error al obtener la lista de alumnos.',
      );
    }
  }

  /**
   * MÉTODO 3: Obtener el detalle de dificultades de UN alumno
   * (El que usamos para el Alumno, ahora reutilizado para el Modal del Docente)
   */
  async getStudentDifficultiesDetail(idAlumno: string, idCurso: string) {
    try {
      const dificultadesAlumno = await this.prisma.dificultadAlumno.findMany({
        where: {
          idAlumno: idAlumno,
          idCurso: idCurso,
        },
        include: {
          dificultad: true,
        },
        orderBy: {
          dificultad: {
            tema: 'asc',
          },
        },
      });

      if (!dificultadesAlumno) {
        throw new NotFoundException(
          'No se encontraron dificultades para este alumno.',
        );
      }

      // Mapeamos para el frontend
      return dificultadesAlumno.map((da) => ({
        id: da.dificultad.id,
        nombre: da.dificultad.nombre,
        descripcion: da.dificultad.descripcion,
        tema: da.dificultad.tema,
        grado: da.grado,
      }));
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Error en getStudentDifficultiesDetail:', error);
      throw new InternalServerErrorException(
        'Error al obtener las dificultades del alumno.',
      );
    }
  }

  /**
   * Registra o actualiza una o varias de dificultades de alumno y recalcula los KPIs del curso.
   */
  async submitDifficulties(dtos: SubmitDifficultyDto[]) {
    // 1. Validación de entrada
    if (!dtos || dtos.length === 0) {
      throw new BadRequestException(
        'El lote de dificultades no puede estar vacío.',
      );
    }

    // 2. Todos los DTOs deben ser del MISMO alumno
    const idAlumno = dtos[0].idAlumno;
    const todosDelMismoAlumno = dtos.every((dto) => dto.idAlumno === idAlumno);
    if (!todosDelMismoAlumno) {
      throw new BadRequestException(
        'Todas las dificultades del lote deben pertenecer al mismo alumno.',
      );
    }

    try {
      // 3. Validar que el alumno esté activo (UNA SOLA VEZ)
      const inscripcion = await this.prisma.alumnoCurso.findFirst({
        where: { idAlumno: idAlumno, estado: 'Activo' },
        select: { idCurso: true },
      });

      if (!inscripcion) {
        throw new NotFoundException(
          'No se encontró una inscripción activa para este alumno.',
        );
      }
      const { idCurso } = inscripcion;

      // 4. Ejecutar todo como UNA transacción
      await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Definimos la fecha de registro para los historiales:
        // SIEMPRE será el momento actual (cuando el servidor recibe la sincronización),
        // para no romper la cronología de los gráficos.
        const fechaRegistroHistorial = new Date();

        // --- Paso A: Iterar y hacer UPSERT para cada dificultad ---
        for (const dto of dtos) {
          // --- Lógica de Cancelación de Sesiones por cambio de Grado ---
          const sesionPendiente = await tx.sesionRefuerzo.findFirst({
            where: {
              idAlumno,
              idCurso,
              idDificultad: dto.idDificultad,
              estado: estado_sesion.Pendiente,
              deletedAt: null,
            },
          });

          if (sesionPendiente) {
            const gradoValor = {
              [grado_dificultad.Ninguno]: 0,
              [grado_dificultad.Bajo]: 1,
              [grado_dificultad.Medio]: 2,
              [grado_dificultad.Alto]: 3,
            };
            const valorSesion = gradoValor[sesionPendiente.gradoSesion];
            const valorNuevo = gradoValor[dto.grado];

            // 1. Mejora (Nuevo < Sesion) O 2. Empeora a Alto (Nuevo > Sesion && Nuevo == Alto)
            if (
              valorNuevo < valorSesion ||
              (valorNuevo > valorSesion && dto.grado === grado_dificultad.Alto)
            ) {
              try {
                // Usamos el servicio de sesiones para cancelar, pasando la transacción actual
                await this.sesionesRefuerzoService.remove(
                  idCurso,
                  sesionPendiente.id,
                  tx,
                );
              } catch (error) {
                // Si falla (ej: la fecha límite ya pasó), ignoramos y no cancelamos.
                // Esto respeta la validación del servicio de sesiones.
              }
            }
          }

          // 1. Buscamos el estado actual para saber si cambió
          const existing = await tx.dificultadAlumno.findUnique({
            where: {
              idAlumno_idCurso_idDificultad: {
                idAlumno: idAlumno,
                idCurso: idCurso,
                idDificultad: dto.idDificultad,
              },
            },
          });

          // 2. Solo actuamos si es nuevo o si el grado es diferente
          const shouldUpdate = !existing || existing.grado !== dto.grado;

          if (shouldUpdate) {
            await tx.dificultadAlumno.upsert({
              where: {
                idAlumno_idCurso_idDificultad: {
                  idAlumno: idAlumno,
                  idCurso: idCurso,
                  idDificultad: dto.idDificultad,
                },
              },
              create: {
                idAlumno: idAlumno,
                idCurso: idCurso,
                idDificultad: dto.idDificultad,
                grado: dto.grado,
              },
              update: {
                grado: dto.grado,
              },
            });

            // 3. Insertamos en el Historial
            await tx.historialDificultadAlumno.create({
              data: {
                idAlumno: idAlumno,
                idCurso: idCurso,
                idDificultad: dto.idDificultad,
                gradoAnterior: existing
                  ? existing.grado
                  : grado_dificultad.Ninguno,
                gradoNuevo: dto.grado,
                fechaCambio: fechaRegistroHistorial,
                fuente: fuente_cambio_dificultad.VIDEOJUEGO,
              },
            });
          }
        } // Fin del bucle

        // --- Paso B: Recalcular los KPIs del curso (UNA SOLA VEZ) ---
        await this.recalculateCourseDifficulties(
          tx,
          idCurso,
          fechaRegistroHistorial,
        );
      }); // Fin de la transacción

      // 5. PROCESO AUTOMÁTICO: Verificar si alguna dificultad quedó en grado ALTO
      // y generar sesión de refuerzo. (Fuera de la transacción para no bloquear)
      for (const dto of dtos) {
        if (dto.grado === grado_dificultad.Alto) {
          await this.sesionesRefuerzoService.createAutomaticSession(
            idCurso,
            idAlumno,
            dto.idDificultad,
          );
        }
      }

      return { message: 'Lote de dificultades registrado con éxito' };
    } catch (error) {
      // Manejo de errores
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new BadRequestException(
            'El idDificultad o idAlumno no existen en el lote.',
          );
        }
      }
      console.error('Error en submitBatchDifficulties:', error);
      throw new InternalServerErrorException(
        'Error al registrar el lote de dificultades.',
      );
    }
  }

  /**
   * Obtiene una lista simple de todas las dificultades para poblar filtros.
   */
  async findAllForFilter() {
    try {
      return this.prisma.dificultad.findMany({
        select: {
          id: true,
          nombre: true,
          tema: true,
        },
        orderBy: {
          nombre: 'asc',
        },
      });
    } catch (error) {
      console.error('Error en findAllForFilter:', error);
      throw new InternalServerErrorException(
        'Error al obtener la lista de dificultades.',
      );
    }
  }

  /**
   * HELPER: Recalcula los KPIs de DificultadesCurso
   * (Esta es la lógica que discutimos)
   */
  public async recalculateCourseDifficulties(
    tx: Prisma.TransactionClient,
    idCurso: string,
    fechaRegistro: Date = new Date(),
  ) {
    // 1. Encontrar el registro de DificultadesCurso a actualizar
    const curso = await tx.curso.findUnique({
      where: { id: idCurso },
      select: { idDificultadesCurso: true },
    });
    if (!curso) throw new Error('Curso no encontrado en recalculate'); // Error interno

    // 2. Obtener TODOS los registros de dificultad de ESTE curso
    // CORRECCIÓN: Solo de alumnos que siguen en el curso (Activos o Finalizados)
    // Excluimos a los 'Inactivo' para no manchar los promedios.
    const allDifAlumnos = await tx.dificultadAlumno.findMany({
      where: {
        idCurso: idCurso,
        alumno: {
          cursosDelAlumno: {
            some: {
              idCurso: idCurso,
              // Filtramos por estado en la tabla intermedia
              estado: { in: [estado_simple.Activo, estado_simple.Finalizado] },
            },
          },
        },
      },
      select: {
        idAlumno: true,
        idDificultad: true,
        grado: true,
        dificultad: { select: { tema: true } }, // Hacemos JOIN con 'dificultad'
      },
      orderBy: { idDificultad: 'asc' }, // Orden determinista para empates
    });

    // 2.1. Contar el total de alumnos activos/finalizados para el cálculo del promedio
    const totalAlumnos = await tx.alumnoCurso.count({
      where: {
        idCurso: idCurso,
        estado: { in: [estado_simple.Activo, estado_simple.Finalizado] },
      },
    });

    // Si no hay dificultades (o no hay alumnos), reseteamos y salimos
    if (allDifAlumnos.length === 0 || totalAlumnos === 0) {
      const reset = await tx.dificultadesCurso.update({
        where: { id: curso.idDificultadesCurso },
        data: {
          temaModa: 'Ninguno',
          idDificultadModa: null,
          promDificultades: 0,
          promGrado: 'Ninguno',
        },
      });

      // Guardar historial de reset
      await tx.historialDificultadesCurso.create({
        data: {
          idDificultadesCurso: curso.idDificultadesCurso,
          temaModa: reset.temaModa,
          idDificultadModa: reset.idDificultadModa,
          promDificultades: reset.promDificultades,
          promGrado: reset.promGrado,
          fechaRegistro: fechaRegistro,
        },
      });

      return;
    }

    // --- 3. Calcular KPIs (Lógica en TypeScript) ---

    // KPI: Promedio de dificultades por alumno
    // Dividimos por el total de alumnos del curso, no solo los que tienen dificultades
    // (Incluye superadas para coincidir con el reporte general)
    const promDificultades = allDifAlumnos.length / totalAlumnos;

    let promGrado: grado_dificultad = 'Ninguno';
    let dificultadModaId: string | null = null;
    let temaModa: temas = temas.Ninguno;

    // Filtramos solo las activas para las Modas y el Grado Promedio
    const activeDifAlumnos = allDifAlumnos.filter(
      (d) => d.grado !== grado_dificultad.Ninguno,
    );

    if (activeDifAlumnos.length > 0) {
      // KPI: Dificultad más frecuente (Moda de activas)
      const difCounts = new Map<string, number>();
      activeDifAlumnos.forEach((d) =>
        difCounts.set(d.idDificultad, (difCounts.get(d.idDificultad) || 0) + 1),
      );
      dificultadModaId = [...difCounts.entries()].reduce((a, b) =>
        b[1] > a[1] ? b : a,
      )[0];

      // KPI: Tema más frecuente (Contamos alumnos únicos por tema, igual que en el reporte)
      const temaCounts = new Map<temas, Set<string>>();
      activeDifAlumnos.forEach((d) => {
        if (!temaCounts.has(d.dificultad.tema))
          temaCounts.set(d.dificultad.tema, new Set());
        temaCounts.get(d.dificultad.tema)!.add(d.idAlumno);
      });
      temaModa = [...temaCounts.entries()].reduce((a, b) =>
        b[1].size > a[1].size ? b : a,
      )[0];

      // KPI: Grado promedio (con pesos, solo de las activas)
      const pesos = { Ninguno: 0, Bajo: 1, Medio: 2, Alto: 3 };
      let sumaPesos = 0;
      activeDifAlumnos.forEach((d) => (sumaPesos += pesos[d.grado]));
      const promNumerico = sumaPesos / activeDifAlumnos.length;

      if (promNumerico > 2.5) promGrado = grado_dificultad.Alto;
      else if (promNumerico > 1.5) promGrado = grado_dificultad.Medio;
      else if (promNumerico > 0) promGrado = grado_dificultad.Bajo;
    }

    // 4. Actualizar la tabla DificultadesCurso
    const actualizado = await tx.dificultadesCurso.update({
      where: { id: curso.idDificultadesCurso },
      data: {
        temaModa: temaModa,
        idDificultadModa: dificultadModaId,
        promDificultades: promDificultades,
        promGrado: promGrado,
      },
    });

    // --- NUEVO: Insertar en HistorialDificultadesCurso ---
    await tx.historialDificultadesCurso.create({
      data: {
        idDificultadesCurso: curso.idDificultadesCurso,
        temaModa: actualizado.temaModa,
        idDificultadModa: actualizado.idDificultadModa,
        promDificultades: actualizado.promDificultades,
        promGrado: actualizado.promGrado,
        fechaRegistro: fechaRegistro,
      },
    });
  }
}
