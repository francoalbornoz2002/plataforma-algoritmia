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
import { checkDocenteAccess } from 'src/helpers/access.helper';

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
      // 1. Obtener la inscripción activa del alumno en el curso
      const inscripcion = await this.prisma.inscripcionesAlumnoCurso.findFirst({
        where: { idAlumno, idCurso, estado: estado_simple.Activo },
      });

      // 2. Buscamos todas las dificultades asignadas a la inscripción del alumno en ese curso
      const dificultadesAlumno = await this.prisma.dificultadesAlumno.findMany({
        where: {
          idInscripcion: inscripcion?.id,
        },
        include: {
          dificultad: true,
        },
        orderBy: {
          fechaRegistro: 'desc',
        },
      });

      // 3. Validamos si se encontró algo
      if (!dificultadesAlumno || dificultadesAlumno.length === 0) {
        return [];
      }

      // Quedarse únicamente con el registro más reciente de cada dificultad
      const latestMap = new Map<string, (typeof dificultadesAlumno)[0]>();
      for (const da of dificultadesAlumno) {
        if (!latestMap.has(da.idDificultad)) {
          latestMap.set(da.idDificultad, da);
        }
      }
      const latestList = Array.from(latestMap.values());

      // 4. Mapeamos la respuesta para que sea más limpia para el frontend
      return latestList.map((da) => ({
        id: da.dificultad.id,
        nombre: da.dificultad.nombre,
        descripcion: da.dificultad.descripcion,
        tema: da.dificultad.tema,
        grado: da.gradoActual,
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
  async getCourseDifficultiesOverview(idDocente: string, idCurso: string) {
    await checkDocenteAccess(this.prisma, idDocente, idCurso);

    try {
      const curso = await this.prisma.curso.findUnique({
        where: { id: idCurso },
        select: {
          dificultadesCursos: {
            orderBy: { fechaRegistro: 'desc' },
            take: 1,
            // Opcional: incluir el nombre de la dificultad más frecuente
            include: {
              dificultadModa: {
                select: { nombre: true },
              },
            },
          },
        },
      });

      const overview = curso?.dificultadesCursos?.[0];
      if (!overview) {
        throw new NotFoundException(
          'Resumen de dificultades del curso no encontrado.',
        );
      }

      // Alumno Crítico (Alumno con más dificultades activas según su último estado)
      const allActiveDif = await this.prisma.dificultadesAlumno.findMany({
        where: {
          inscripcion: {
            idCurso: idCurso,
            estado: estado_simple.Activo,
          },
        },
        select: {
          idInscripcion: true,
          idDificultad: true,
          gradoActual: true,
          fechaRegistro: true,
          inscripcion: {
            select: {
              alumno: { select: { nombre: true, apellido: true } },
            },
          },
        },
        orderBy: { fechaRegistro: 'desc' },
      });

      // Deduplicar por idInscripcion + idDificultad
      const latestPerStudentDif = new Map<string, (typeof allActiveDif)[0]>();
      for (const d of allActiveDif) {
        const key = `${d.idInscripcion}_${d.idDificultad}`;
        if (!latestPerStudentDif.has(key)) {
          latestPerStudentDif.set(key, d);
        }
      }

      // Contar dificultades activas (gradoActual !== 'Ninguno') por inscripción
      const countsByInscripcion = new Map<
        string,
        { count: number; alumnoNombre: string }
      >();
      for (const d of latestPerStudentDif.values()) {
        if (d.gradoActual !== 'Ninguno') {
          const prev = countsByInscripcion.get(d.idInscripcion) || {
            count: 0,
            alumnoNombre: `${d.inscripcion.alumno.nombre} ${d.inscripcion.alumno.apellido}`,
          };
          prev.count++;
          countsByInscripcion.set(d.idInscripcion, prev);
        }
      }

      let alumnoCritico: string | undefined;
      let maxCount = 0;
      for (const { count, alumnoNombre } of countsByInscripcion.values()) {
        if (count > maxCount) {
          maxCount = count;
          alumnoCritico = alumnoNombre;
        }
      }

      return {
        ...overview,
        promDificultades: parseFloat(overview.promDificultades as any),
        alumnoCritico,
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
  async getStudentDifficultyList(idDocente: string, idCurso: string) {
    await checkDocenteAccess(this.prisma, idDocente, idCurso);
    // 0. Verificar estado del curso
    const curso = await this.prisma.curso.findUnique({
      where: { id: idCurso },
      select: { deletedAt: true },
    });
    const includeInactive = !!curso?.deletedAt;

    try {
      // 1. Consultar inscripciones del curso con el alumno y sus dificultades
      const inscripciones = await this.prisma.inscripcionesAlumnoCurso.findMany(
        {
          where: {
            idCurso: idCurso,
            estado: includeInactive
              ? { in: [estado_simple.Activo, estado_simple.Finalizado] }
              : estado_simple.Activo,
          },
          include: {
            alumno: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
              },
            },
            dificultadesAlumnos: {
              select: {
                gradoActual: true,
                idDificultad: true,
                dificultad: { select: { tema: true } },
                fechaRegistro: true,
              },
              orderBy: { fechaRegistro: 'desc' },
            },
          },
        },
      );

      // 2. Mapear la respuesta y calcular los conteos (utilizando solo el último estado por dificultad)
      const data = inscripciones.map((inscripcion) => {
        const { alumno, dificultadesAlumnos } = inscripcion;

        // Deduplicar: mantener el más reciente de cada idDificultad
        const latestDifMap = new Map<string, (typeof dificultadesAlumnos)[0]>();
        for (const d of dificultadesAlumnos) {
          if (!latestDifMap.has(d.idDificultad)) {
            latestDifMap.set(d.idDificultad, d);
          }
        }
        const activeDifficulties = Array.from(latestDifMap.values());

        const alto = activeDifficulties.filter(
          (d) => d.gradoActual === 'Alto',
        ).length;
        const medio = activeDifficulties.filter(
          (d) => d.gradoActual === 'Medio',
        ).length;
        const bajo = activeDifficulties.filter(
          (d) => d.gradoActual === 'Bajo',
        ).length;
        const ninguno = activeDifficulties.filter(
          (d) => d.gradoActual === 'Ninguno',
        ).length;

        return {
          id: alumno.id,
          nombre: alumno.nombre,
          apellido: alumno.apellido,
          totalDificultades: activeDifficulties.length,
          gradoAlto: alto,
          gradoMedio: medio,
          gradoBajo: bajo,
          gradoNinguno: ninguno,
          dificultadesDetalle: activeDifficulties.map((d) => ({
            idDificultad: d.idDificultad,
            grado: d.gradoActual,
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
      const inscripcion = await this.prisma.inscripcionesAlumnoCurso.findFirst({
        where: { idAlumno: idAlumno, estado: estado_simple.Activo },
        select: { id: true, idCurso: true },
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

        // --- Paso A: Iterar y registrar cada dificultad ---
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
                  sesionPendiente.id,
                  tx,
                );
              } catch (error) {
                // Si falla (ej: la fecha límite ya pasó), ignoramos y no cancelamos.
                // Esto respeta la validación del servicio de sesiones.
              }
            }
          }

          // 1. Buscamos el registro más reciente para saber el grado anterior
          const existing = await tx.dificultadesAlumno.findFirst({
            where: {
              idInscripcion: inscripcion.id,
              idDificultad: dto.idDificultad,
            },
            orderBy: { fechaRegistro: 'desc' },
          });

          // 2. Solo actuamos si es nuevo o si el grado es diferente
          const shouldCreate = !existing || existing.gradoActual !== dto.grado;

          if (shouldCreate) {
            // Siempre se crea un nuevo registro (comportamiento de historial)
            await tx.dificultadesAlumno.create({
              data: {
                idInscripcion: inscripcion.id,
                idDificultad: dto.idDificultad,
                gradoAnterior: existing
                  ? existing.gradoActual
                  : grado_dificultad.Ninguno,
                gradoActual: dto.grado,
                fechaRegistro: fechaRegistroHistorial,
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
   */
  public async recalculateCourseDifficulties(
    tx: Prisma.TransactionClient,
    idCurso: string,
    fechaRegistro: Date = new Date(),
  ) {
    // 1. Obtener los registros de dificultad de ESTE curso (más recientes primero)
    // Solo de alumnos con inscripciones Activas o Finalizadas
    const rawDifAlumnos = await tx.dificultadesAlumno.findMany({
      where: {
        inscripcion: {
          idCurso: idCurso,
          estado: { in: [estado_simple.Activo, estado_simple.Finalizado] },
        },
      },
      select: {
        idInscripcion: true,
        idDificultad: true,
        gradoActual: true,
        fechaRegistro: true,
        inscripcion: { select: { idAlumno: true } },
        dificultad: { select: { tema: true } },
      },
      orderBy: { fechaRegistro: 'desc' },
    });

    // Deduplicar: quedarnos únicamente con el registro más reciente para cada (idInscripcion, idDificultad)
    const latestMap = new Map<string, (typeof rawDifAlumnos)[0]>();
    for (const d of rawDifAlumnos) {
      const key = `${d.idInscripcion}_${d.idDificultad}`;
      if (!latestMap.has(key)) {
        latestMap.set(key, d);
      }
    }
    const allDifAlumnos = Array.from(latestMap.values());

    // 2. Contar el total de alumnos activos/finalizados para el cálculo del promedio
    const totalAlumnos = await tx.inscripcionesAlumnoCurso.count({
      where: {
        idCurso: idCurso,
        estado: { in: [estado_simple.Activo, estado_simple.Finalizado] },
      },
    });

    // Si no hay dificultades (o no hay alumnos), reseteamos y salimos
    if (allDifAlumnos.length === 0 || totalAlumnos === 0) {
      await tx.dificultadesCurso.create({
        data: {
          idCurso: idCurso,
          temaModa: temas.Ninguno,
          idDificultadModa: null,
          promDificultades: 0,
          promGrado: grado_dificultad.Ninguno,
          fechaRegistro: fechaRegistro,
        },
      });
      return;
    }

    // --- 3. Calcular KPIs (Lógica en TypeScript) ---

    // KPI: Promedio de dificultades por alumno
    const promDificultades = allDifAlumnos.length / totalAlumnos;

    let promGrado: grado_dificultad = 'Ninguno';
    let dificultadModaId: string | null = null;
    let temaModa: temas = temas.Ninguno;

    // Filtramos solo las activas para las Modas y el Grado Promedio
    const activeDifAlumnos = allDifAlumnos.filter(
      (d) => d.gradoActual !== grado_dificultad.Ninguno,
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

      // KPI: Tema más frecuente (Contamos alumnos únicos por tema)
      const temaCounts = new Map<temas, Set<string>>();
      activeDifAlumnos.forEach((d) => {
        if (!temaCounts.has(d.dificultad.tema))
          temaCounts.set(d.dificultad.tema, new Set());
        temaCounts.get(d.dificultad.tema)!.add(d.inscripcion.idAlumno);
      });
      temaModa = [...temaCounts.entries()].reduce((a, b) =>
        b[1].size > a[1].size ? b : a,
      )[0];

      // KPI: Grado promedio (con pesos, solo de las activas)
      const pesos = { Ninguno: 0, Bajo: 1, Medio: 2, Alto: 3 };
      let sumaPesos = 0;
      activeDifAlumnos.forEach((d) => (sumaPesos += pesos[d.gradoActual]));
      const promNumerico = sumaPesos / activeDifAlumnos.length;

      if (promNumerico > 2.5) promGrado = grado_dificultad.Alto;
      else if (promNumerico > 1.5) promGrado = grado_dificultad.Medio;
      else if (promNumerico > 0) promGrado = grado_dificultad.Bajo;
    }

    // 4. Crear snapshot en DificultadesCurso
    await tx.dificultadesCurso.create({
      data: {
        idCurso: idCurso,
        temaModa: temaModa,
        idDificultadModa: dificultadModaId,
        promDificultades: promDificultades,
        promGrado: promGrado,
        fechaRegistro: fechaRegistro,
      },
    });
  }
}
