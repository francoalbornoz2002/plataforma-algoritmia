import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { auditStorage } from 'src/auditoria/interceptors/audit.storage';

/**
 * Esta función auxiliar crea la Extensión de Prisma.
 * La definimos aquí para que el código del servicio quede más limpio.
 */
function getAuditExtension(baseClient: PrismaClient) {
  return baseClient.$extends({
    name: 'AuditLogExtension',
    query: {
      // Aplicar a todos los modelos
      $allModels: {
        // Aplicar a todas las operaciones (create, update, etc.)
        $allOperations: async ({ model, operation, args, query }) => {
          // 1. Obtenemos el userId del AsyncLocalStorage
          const auditData = auditStorage.getStore();
          const userId = auditData?.userId;

          // 2. Definimos qué operaciones queremos auditar
          const actionsToAudit = [
            'create',
            'createMany',
            'update',
            'updateMany',
            'delete',
            'deleteMany',
            'upsert',
          ];

          // 3. Si es una operación auditable Y tenemos un usuario...
          if (userId && actionsToAudit.includes(operation)) {
            // 4. ...usamos una transacción para asegurar que SET LOCAL
            // y la query real ocurran en la MISMA conexión.
            return await baseClient.$transaction(async (tx) => {
              try {
                // 5. Seteamos el user_id para que el trigger de PG lo lea
                await tx.$executeRawUnsafe(
                  `SET LOCAL "audit.user_id" = '${userId}'`,
                );
              } catch (e) {
                console.error(
                  'PRISMA EXTENSION: Fallo al setear audit.user_id:',
                  e,
                );
                throw new Error('Fallo al configurar la auditoría');
              }
              const modelName = model[0].toLowerCase() + model.substring(1);
              // 6. Ejecutamos la query original (ej. 'cursos.create')
              // pero usando el cliente de transacción 'tx'
              const result = await (tx as any)[modelName][operation](args);

              return result;
            });
          }

          // 7. Si no es una acción auditable, la ejecutamos normalmente
          return query(args);
        },
      },
    },
  });
}

@Injectable()
export class PrismaService implements OnModuleInit {
  /**
   * 1. El cliente base, lo usamos internamente para $transaction
   */
  private readonly baseClient: PrismaClient;

  /**
   * 2. El cliente extendido, que contiene la lógica de auditoría.
   * Este es el que expondremos al resto de la app.
   */
  public readonly extendedClient: ReturnType<typeof getAuditExtension>;

  constructor() {
    this.baseClient = new PrismaClient();
    // Creamos el cliente extendido pasándole el cliente base
    this.extendedClient = getAuditExtension(this.baseClient);
  }

  async onModuleInit() {
    await this.baseClient.$connect();
  }

  // --- ADAPTACIÓN AL SCHEMA ---
  // Mapeamos cada modelo del schema para que
  // 'this.prisma.modelo' apunte a 'this.prisma.extendedClient.modelo'.
  // Esto hace que la extensión sea transparente para el resto de la aplicación.

  get alumnoCurso() {
    return this.extendedClient.alumnoCurso;
  }
  get claseConsulta() {
    return this.extendedClient.claseConsulta;
  }
  get consulta() {
    return this.extendedClient.consulta;
  }
  get consultaClase() {
    return this.extendedClient.consultaClase;
  }
  get curso() {
    return this.extendedClient.curso;
  }
  get diaClase() {
    return this.extendedClient.diaClase;
  }
  get dificultadAlumno() {
    return this.extendedClient.dificultadAlumno;
  }
  get dificultad() {
    return this.extendedClient.dificultad;
  }
  get dificultadesCurso() {
    return this.extendedClient.dificultadesCurso;
  }
  get docenteCurso() {
    return this.extendedClient.docenteCurso;
  }
  get institucion() {
    return this.extendedClient.institucion;
  }
  get localidad() {
    return this.extendedClient.localidad;
  }
  get logAuditoria() {
    return this.extendedClient.logAuditoria;
  }
  get misionEspecialCompletada() {
    return this.extendedClient.misionEspecialCompletada;
  }
  get mision() {
    return this.extendedClient.mision;
  }
  get misionCompletada() {
    return this.extendedClient.misionCompletada;
  }
  get opcionRespuesta() {
    return this.extendedClient.opcionRespuesta;
  }
  get pregunta() {
    return this.extendedClient.pregunta;
  }
  get preguntaSesion() {
    return this.extendedClient.preguntaSesion;
  }
  get progresoAlumno() {
    return this.extendedClient.progresoAlumno;
  }
  get progresoCurso() {
    return this.extendedClient.progresoCurso;
  }
  get provincia() {
    return this.extendedClient.provincia;
  }
  get respuestaAlumno() {
    return this.extendedClient.respuestaAlumno;
  }
  get respuestaConsulta() {
    return this.extendedClient.respuestaConsulta;
  }
  get resultadoSesion() {
    return this.extendedClient.resultadoSesion;
  }
  get sesionRefuerzo() {
    return this.extendedClient.sesionRefuerzo;
  }
  get usuario() {
    return this.extendedClient.usuario;
  }
  get valoracion() {
    return this.extendedClient.valoracion;
  }

  get $transaction() {
    return this.extendedClient.$transaction.bind(this.extendedClient);
  }

  get $executeRaw() {
    return this.extendedClient.$executeRaw.bind(this.extendedClient);
  }

  get $queryRaw() {
    return this.extendedClient.$queryRaw.bind(this.extendedClient);
  }

  get $executeRawUnsafe() {
    return this.extendedClient.$executeRawUnsafe.bind(this.extendedClient);
  }

  get $queryRawUnsafe() {
    return this.extendedClient.$queryRawUnsafe.bind(this.extendedClient);
  }
}
