import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, estado_consulta, temas } from '@prisma/client';

// DTOs
import type { CreateConsultaDto } from '../dto/create-consulta.dto';
import type { CreateRespuestaDto } from '../dto/create-respuesta.dto';
import type { ValorarConsultaDto } from '../dto/valorar-consulta.dto';
import { FindConsultasDto } from '../dto/find-consultas.dto';
import { UpdateConsultaDto } from '../dto/update-consulta.dto';

@Injectable()
export class ConsultasService {
  constructor(private prisma: PrismaService) {}

  // --- 1. SERVICIO DE CREACIÓN (ALUMNO) (Corregido) ---
  async createConsulta(
    idAlumno: string,
    idCurso: string,
    dto: CreateConsultaDto,
  ) {
    const { titulo, descripcion, tema, fechaConsulta } = dto;

    try {
      const nuevaConsulta = await this.prisma.consulta.create({
        data: {
          titulo: titulo,
          descripcion: descripcion,
          tema: tema,
          fechaConsulta: new Date(fechaConsulta),
          idAlumno,
          idCurso,
          estado: estado_consulta.Pendiente,
        },
      });

      return nuevaConsulta;
    } catch (error) {
      console.error('Error en createConsulta:', error);
      throw new InternalServerErrorException('Error al crear la consulta.');
    }
  }

  // --- 2. SERVICIO DE RESPUESTA (DOCENTE) ---
  async createRespuesta(
    idConsulta: string,
    idDocente: string,
    dto: CreateRespuestaDto,
  ) {
    const { descripcion } = dto;
    try {
      // Usamos una transacción para asegurar que ambas cosas ocurran
      return await this.prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          // 1. Creamos la Respuesta
          await tx.respuestaConsulta.create({
            data: {
              descripcion: descripcion,
              idDocente: idDocente,
              idConsulta: idConsulta,
              fechaRespuesta: new Date(),
            },
          });

          // 2. Actualizamos el estado de la Consulta
          const consultaActualizada = await tx.consulta.update({
            where: { id: idConsulta },
            data: {
              estado: estado_consulta.Revisada,
            },
          });

          return consultaActualizada;
        },
      );
    } catch (error) {
      // Manejamos si la consulta no existe
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === 'P2025' || error.code === 'P2003')
      ) {
        throw new NotFoundException('Consulta no encontrada.');
      }
      console.error('Error en createRespuesta:', error);
      throw new InternalServerErrorException('Error al enviar la respuesta.');
    }
  }

  // --- 3. SERVICIO DE VALORACIÓN (ALUMNO) ---
  async valorarConsulta(
    idConsulta: string,
    idAlumno: string,
    dto: ValorarConsultaDto,
  ) {
    const { valoracion, comentarioValoracion } = dto;

    try {
      const consulta = await this.prisma.consulta.findUnique({
        where: { id: idConsulta },
        select: { idAlumno: true, estado: true },
      });

      if (!consulta) {
        throw new NotFoundException('Consulta no encontrada.');
      }

      if (consulta.idAlumno !== idAlumno) {
        throw new ForbiddenException('No puedes valorar esta consulta.');
      }

      if (consulta.estado !== estado_consulta.Revisada) {
        throw new ForbiddenException(
          'Solo puedes valorar consultas respondidas.',
        );
      }

      // Actualizamos. El trigger captura el cambio.
      const consultaActualizada = await this.prisma.consulta.update({
        where: { id: idConsulta },
        data: {
          valoracionAlumno: valoracion,
          comentarioValoracion: comentarioValoracion,
          estado: estado_consulta.Resuelta,
        },
      });

      return consultaActualizada;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof ForbiddenException) throw error;
      console.error('Error en valorarConsulta:', error);
      throw new InternalServerErrorException('Error al valorar la consulta.');
    }
  }

  // --- 4. SERVICIO DE LECTURA (ALUMNO) ---
  async findConsultasForAlumno(
    idAlumno: string,
    idCurso: string,
    dto: FindConsultasDto, // <-- 2. Usar el DTO
  ) {
    const { page, limit, sort, order, tema, estado, search } = dto;
    const skip = (page - 1) * limit;
    const take = limit;

    const where: Prisma.ConsultaWhereInput = {
      idAlumno,
      idCurso,
      ...(tema && { tema: tema }),
      ...(estado && { estado: estado }),
      ...(search && {
        OR: [
          { titulo: { contains: search, mode: 'insensitive' } },
          { descripcion: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const orderBy: Prisma.ConsultaOrderByWithRelationInput = {
      [sort || 'fechaConsulta']: order || 'desc',
    };

    try {
      // 3. Usamos $transaction para paginación (igual que en UsersPage)
      const [consultas, total] = await this.prisma.$transaction([
        this.prisma.consulta.findMany({
          where,
          orderBy,
          skip,
          take,
          include: {
            respuestaConsulta: {
              include: {
                docente: {
                  select: { nombre: true, apellido: true },
                },
              },
            },
          },
        }),
        this.prisma.consulta.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);
      return { data: consultas, total, page, totalPages };
    } catch (error) {
      console.error('Error en findConsultasForAlumno:', error);
      throw new InternalServerErrorException('Error al obtener las consultas.');
    }
  }

  // --- 5. SERVICIO DE LECTURA (DOCENTE) (Refactorizado) ---
  async findConsultasForDocente(
    idCurso: string,
    dto: FindConsultasDto, // <-- 2. Usar el DTO
  ) {
    const { page, limit, sort, order, tema, estado, search } = dto;
    const skip = (page - 1) * limit;
    const take = limit;

    const where: Prisma.ConsultaWhereInput = {
      idCurso,
      deletedAt: null,
      ...(tema && { tema: tema }),
      ...(estado && { estado: estado }),
      ...(search && {
        OR: [
          { titulo: { contains: search, mode: 'insensitive' } },
          { descripcion: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const orderBy: Prisma.ConsultaOrderByWithRelationInput = {
      [sort || 'fechaConsulta']: order || 'desc',
    };

    try {
      // 3. Usamos $transaction
      const [consultas, total] = await this.prisma.$transaction([
        this.prisma.consulta.findMany({
          where,
          orderBy,
          skip,
          take,
          include: {
            alumno: {
              select: { nombre: true, apellido: true },
            },
            respuestaConsulta: {
              include: {
                docente: {
                  select: { nombre: true, apellido: true },
                },
              },
            },
          },
        }),
        this.prisma.consulta.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);
      return { data: consultas, total, page, totalPages };
    } catch (error) {
      console.error('Error en findConsultasForDocente:', error);
      throw new InternalServerErrorException('Error al obtener las consultas.');
    }
  }

  async updateConsulta(
    idConsulta: string,
    idAlumno: string,
    dto: UpdateConsultaDto,
  ) {
    try {
      // 1. Validar permisos (dueño, pendiente y no borrado)
      await this.checkConsultaOwnershipAndState(idConsulta, idAlumno);

      // 2. Actualizar (El trigger de auditoría captura esto)
      const consultaActualizada = await this.prisma.consulta.update({
        where: { id: idConsulta },
        data: dto,
      });

      return consultaActualizada;
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      console.error('Error en updateConsulta:', error);
      throw new InternalServerErrorException(
        'Error al actualizar la consulta.',
      );
    }
  }

  // --- ¡MÉTODO DE BORRADO (ACTUALIZADO A SOFT DELETE)! ---
  async deleteConsulta(idConsulta: string, idAlumno: string) {
    try {
      // 1. Validar permisos (dueño, pendiente y no borrado)
      await this.checkConsultaOwnershipAndState(idConsulta, idAlumno);

      // 2. Hacer "soft delete" (actualizar 'deletedAt')
      // El trigger de auditoría registrará esto como un 'UPDATE'
      const consultaBorrada = await this.prisma.consulta.update({
        where: { id: idConsulta },
        data: {
          deletedAt: new Date(), // <-- Marcamos como borrado
        },
      });

      return consultaBorrada;
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      console.error('Error en deleteConsulta:', error);
      throw new InternalServerErrorException('Error al borrar la consulta.');
    }
  }

  /**
   * Obtiene solo las consultas 'Pendientes' de un curso (para el formulario)
   */
  async findPendingConsultasByCurso(idCurso: string) {
    return this.prisma.consulta.findMany({
      where: {
        idCurso: idCurso,
        estado: estado_consulta.Pendiente,
        deletedAt: null,
      },
      select: {
        id: true,
        titulo: true,
        tema: true,
        descripcion: true,
        fechaConsulta: true,
        // (Incluimos el alumno para que el docente vea de quién es)
        alumno: {
          select: { nombre: true, apellido: true },
        },
      },
      orderBy: {
        fechaConsulta: 'asc',
      },
    });
  }

  // --- HELPER DE PERMISOS (Sigue igual) ---
  private async checkConsultaOwnershipAndState(
    idConsulta: string,
    idAlumno: string,
  ) {
    const consulta = await this.prisma.consulta.findFirst({
      where: {
        id: idConsulta,
        idAlumno: idAlumno,
        deletedAt: null, // <-- Importante: no se puede editar/borrar algo ya borrado
      },
    });

    if (!consulta) {
      throw new ForbiddenException(
        'No tienes permiso para modificar esta consulta.',
      );
    }

    if (consulta.estado !== estado_consulta.Pendiente) {
      throw new ForbiddenException(
        'No puedes modificar una consulta que ya fue respondida o está resuelta.',
      );
    }
  }
}
