import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CreatePreguntaDto } from '../dto/create-pregunta.dto';
import { UpdatePreguntaDto } from '../dto/update-pregunta.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { grado_dificultad, Prisma } from '@prisma/client';
import { FindPreguntasDto, TipoPregunta } from '../dto/find-preguntas.dto';

@Injectable()
export class PreguntasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePreguntaDto, idDocente: string) {
    const { idDificultad, gradoDificultad, enunciado, opcionesRespuesta } = dto;

    // Validar si ya exite una pregunta con el mismo enunciado
    const preguntaExistente = await this.prisma.pregunta.findFirst({
      where: { enunciado: enunciado },
    });

    if (preguntaExistente) {
      throw new ConflictException('Ya existe una pregunta con ese enunciado.');
    }

    try {
      // Revisamos que tengamos mínimo 2 opciones de respuesta y máximo 4
      if (opcionesRespuesta.length < 2 || opcionesRespuesta.length > 4) {
        throw new BadRequestException(
          'La pregunta debe tener entre 2 y 4 opciones de respuesta.',
        );
      }

      // Aseguramos que todas las respuestas sean distintas en cuanto al texto
      const opcionesTexto = opcionesRespuesta.map(
        (opcion) => opcion.textoOpcion,
      );
      const opcionesDistintas = new Set(opcionesTexto);
      if (opcionesTexto.length !== opcionesDistintas.size) {
        throw new BadRequestException(
          'Las opciones de respuesta no pueden tener el mismo texto.',
        );
      }

      // Revisamos si existe UNA sola respuesta correcta
      const numCorrectas = opcionesRespuesta.filter(
        (opcion) => opcion.esCorrecta,
      ).length;

      if (numCorrectas !== 1) {
        throw new BadRequestException(
          'La pregunta solo puede tener una respuesta correcta.',
        );
      }

      // 1. Creamos la pregunta con las opciones de respuesta asociadas.
      const nuevaPregunta = await this.prisma.pregunta.create({
        data: {
          idDificultad: idDificultad,
          idDocente: idDocente,
          gradoDificultad: gradoDificultad,
          enunciado: enunciado,
          opcionesRespuesta: {
            create: opcionesRespuesta.map((opcion) => ({
              textoOpcion: opcion.textoOpcion,
              esCorrecta: opcion.esCorrecta,
            })),
          },
        },
      });

      return nuevaPregunta;
    } catch (error) {
      console.error('Error al crear la pregunta:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Ejemplo: Error de constraint (P2002) o un foreign key (P2003)
        throw new BadRequestException('No se pudo crear la pregunta.');
      }
      throw new InternalServerErrorException('Error al crear la pregunta.');
    }
  }

  async findAll(dto: FindPreguntasDto) {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc',
      search,
      tema,
      idDificultad,
      gradoDificultad,
      tipo,
    } = dto;

    const skip = (page - 1) * limit;
    const take = limit;

    try {
      // 1. Construimos la cláusula WHERE dinámicamente
      const where: Prisma.PreguntaWhereInput = {
        deletedAt: null, // Siempre filtramos las eliminadas lógicamente
      };

      if (search) {
        where.enunciado = { contains: search, mode: 'insensitive' };
      }

      if (idDificultad) {
        where.idDificultad = idDificultad;
      }

      if (gradoDificultad) {
        where.gradoDificultad = gradoDificultad;
      }

      if (tema) {
        where.dificultad = { tema: tema };
      }

      if (tipo) {
        where.idDocente = tipo === TipoPregunta.SISTEMA ? null : { not: null };
      }

      // 2. Construimos la cláusula ORDER BY
      const orderBy: Prisma.PreguntaOrderByWithRelationInput = {
        [sort]: order,
      };

      // 3. Ejecutamos las consultas en una transacción para consistencia
      const [preguntas, total] = await this.prisma.$transaction([
        this.prisma.pregunta.findMany({
          where,
          orderBy,
          skip,
          take,
          include: {
            opcionesRespuesta: {
              select: { id: true, textoOpcion: true, esCorrecta: true },
            },
            dificultad: { select: { nombre: true, tema: true } },
            docenteCreador: { select: { nombre: true, apellido: true } },
          },
        }),
        this.prisma.pregunta.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);
      return {
        data: preguntas,
        meta: { total, page, totalPages, limit },
      };
    } catch (error) {
      console.error('Error al buscar las preguntas:', error);
      throw new InternalServerErrorException('Error al buscar las preguntas.');
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} pregunta`;
  }

  /**
   * Busca las preguntas de tipo "Sistema" para una sesión de refuerzo.
   * La lógica es acumulativa:
   * - Dificultad 'Bajo': Solo preguntas de grado 'Bajo'.
   * - Dificultad 'Medio': Preguntas de grado 'Medio' y 'Bajo'.
   * - Dificultad 'Alto': Preguntas de grado 'Alto', 'Medio' y 'Bajo'.
   * @param idDificultad - El ID de la dificultad.
   * @param gradoDificultad - El grado de dificultad del alumno.
   */
  async findSystemPreguntasForSesion(
    idDificultad: string,
    gradoDificultad: grado_dificultad,
  ) {
    // 1. Determinar qué grados de dificultad se deben incluir en la búsqueda.
    let gradosAIncluir: grado_dificultad[];

    switch (gradoDificultad) {
      case 'Alto':
        gradosAIncluir = ['Alto', 'Medio', 'Bajo'];
        break;
      case 'Medio':
        gradosAIncluir = ['Medio', 'Bajo'];
        break;
      case 'Bajo':
        gradosAIncluir = ['Bajo'];
        break;
      default:
        // Esta validación previene casos inesperados, aunque el DTO ya lo valida.
        throw new BadRequestException('Grado de dificultad no válido.');
    }

    try {
      // 2. Buscar las preguntas en la base de datos.
      const preguntas = await this.prisma.pregunta.findMany({
        where: {
          idDificultad: idDificultad,
          gradoDificultad: {
            in: gradosAIncluir,
          },
          idDocente: null, // Solo preguntas de tipo "Sistema".
          deletedAt: null, // Solo preguntas activas.
        },
        include: {
          opcionesRespuesta: true, // Incluir las opciones de respuesta.
        },
        orderBy: {
          createdAt: 'asc', // Ordenar por fecha de creación como criterio base.
        },
      });

      return preguntas;
    } catch (error) {
      console.error(
        'Error al buscar preguntas del sistema para la sesión:',
        error,
      );
      throw new InternalServerErrorException(
        'Error al obtener las preguntas del sistema.',
      );
    }
  }

  async update(idPregunta: string, dto: UpdatePreguntaDto, idDocente: string) {
    const { idDificultad, gradoDificultad, enunciado, opcionesRespuesta } = dto;

    // Verificamos que la pregunta exista antes de intentar actualizarla
    const pregunta = await this.prisma.pregunta.findUnique({
      where: { id: idPregunta },
    });

    if (!pregunta) {
      throw new NotFoundException(
        `La pregunta con ID "${idPregunta}" no fue encontrada.`,
      );
    }

    try {
      // Verificamos si la pregunta ya fue utilizada en una sesión de refuerzo.
      const usoEnSesion = await this.prisma.preguntaSesion.count({
        where: {
          idPregunta: idPregunta,
        },
      });

      if (usoEnSesion > 0) {
        throw new ForbiddenException(
          'No se puede modificar una pregunta que ya ha sido utilizada en una sesión de refuerzo.',
        );
      }

      // 1. Validamos que el nuevo enunciado no sea igual a los enunciados de otras preguntas
      if (enunciado) {
        const preguntaExistente = await this.prisma.pregunta.findFirst({
          where: {
            id: { not: idPregunta }, // Omitimos la pregunta actual
            enunciado: enunciado,
          },
        });

        if (preguntaExistente) {
          throw new ConflictException(
            'Ya existe una pregunta con ese enunciado.',
          );
        }
      }

      // 2. Replicamos las validaciones de opciones de respuesta si se proveen en el DTO
      if (opcionesRespuesta) {
        // Revisamos que tengamos mínimo 2 opciones de respuesta y máximo 4
        if (opcionesRespuesta.length < 2 || opcionesRespuesta.length > 4) {
          throw new BadRequestException(
            'La pregunta debe tener entre 2 y 4 opciones de respuesta.',
          );
        }

        // Aseguramos que todas las respuestas sean distintas en cuanto al texto
        const opcionesTexto = opcionesRespuesta.map(
          (opcion) => opcion.textoOpcion,
        );
        const opcionesDistintas = new Set(opcionesTexto);
        if (opcionesTexto.length !== opcionesDistintas.size) {
          throw new BadRequestException(
            'Las opciones de respuesta no pueden tener el mismo texto.',
          );
        }

        // Revisamos si existe UNA sola respuesta correcta
        const numCorrectas = opcionesRespuesta.filter(
          (opcion) => opcion.esCorrecta,
        ).length;

        if (numCorrectas !== 1) {
          throw new BadRequestException(
            'La pregunta solo puede tener una respuesta correcta.',
          );
        }
      }

      // 3. Construimos el objeto de datos para la actualización
      const dataToUpdate: Prisma.PreguntaUpdateInput = {
        ...(enunciado && { enunciado }),
        ...(idDificultad && { idDificultad }),
        ...(gradoDificultad && { gradoDificultad }),
      };

      // Si se proveen nuevas opciones, usamos una escritura anidada para reemplazarlas.
      if (opcionesRespuesta) {
        dataToUpdate.opcionesRespuesta = {
          deleteMany: {}, // Borra todas las opciones existentes para esta pregunta
          create: opcionesRespuesta.map((opcion) => ({
            textoOpcion: opcion.textoOpcion,
            esCorrecta: opcion.esCorrecta,
          })),
        };
      }

      // 4. Actualizamos la pregunta en la base de datos
      return this.prisma.pregunta.update({
        where: { id: idPregunta },
        data: dataToUpdate,
        include: {
          opcionesRespuesta: true, // Devolvemos la pregunta con sus opciones
        },
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      console.error('Error al actualizar la pregunta:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BadRequestException('No se pudo actualizar la pregunta.');
      }
      throw new InternalServerErrorException(
        'Error al actualizar la pregunta.',
      );
    }
  }

  async remove(idPregunta: string) {
    try {
      // 1. Verificamos que la pregunta exista y no esté ya eliminada
      const pregunta = await this.prisma.pregunta.findFirst({
        where: { id: idPregunta, deletedAt: null },
      });

      if (!pregunta) {
        throw new NotFoundException(
          `La pregunta con ID "${idPregunta}" no fue encontrada o ya ha sido eliminada.`,
        );
      }

      // 2. Hacemos una baja lógica (soft delete) de la pregunta.
      // Las opciones de respuesta no se eliminan para mantener la integridad
      // de las sesiones de refuerzo pasadas.
      return await this.prisma.pregunta.update({
        where: { id: idPregunta },
        data: { deletedAt: new Date() },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Error al eliminar la pregunta ${idPregunta}:`, error);
      throw new InternalServerErrorException('Error al eliminar la pregunta.');
    }
  }
}
