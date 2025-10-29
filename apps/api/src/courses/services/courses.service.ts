import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCourseDto } from '../dto/create-course.dto';
import { UpdateCourseDto } from '../dto/update-course.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Curso, roles } from '@prisma/client';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async create(createCourseDto: CreateCourseDto) {
    /*  const { nombre, descripcion, contrasenaAcceso, docenteIds, diasClase } =
      createCourseDto;
    // 1. Verificar que los IDs de docentes realmente pertenezcan a usuarios con rol DOCENTE
    const docentes = await this.prisma.usuario.findMany({
      where: {
        id: { in: docenteIds },
        rol: roles.Docente, // Filtra solo por docentes
        deletedAt: null, // Asegúrate que no estén "dados de baja"
      },
      select: {
        id: true, // Solo necesitamos los IDs para verificar
      },
    });

    // Si la cantidad de docentes encontrados no coincide con la cantidad de IDs enviados,
    // significa que uno o más IDs eran inválidos o no eran docentes.
    if (docentes.length !== docenteIds.length) {
      throw new BadRequestException(
        'Uno o más IDs de docentes proporcionados son inválidos o no corresponden a un docente.',
      );
    }

    // Crea el curso y sus relaciones en una sola transacción
    try {
      const nuevoCurso = await this.prisma.curso.create({
        data: {
          nombre,
          descripcion,
          contrasenaAcceso,
          // Crea las relaciones en la tabla de unión `docentes_cursos`
          docentes: {
            createMany: {
              data: docenteIds.map((id) => ({
                idDocente: id,
                estado: 'Activo',
              })),
            },
          },
          // Crea los registros de dias de clase y los asocia a este curso
          diasClase: {
            createMany: {
              data: diasClase.map((dia) => ({
                dia: dia.dia,
                horaInicio: dia.horaInicio,
                horaFin: dia.horaFin,
                modalidad: dia.modalidad,
              })),
            },
          },
        },
        // Incluye las relaciones creadas en la respuesta para confirmar
        include: {
          docentes: { include: { docente: true } }, // Incluye datos del docente
          diasClase: true,
        },
      });
      return nuevoCurso;
    } catch (error) {
      // Manejo básico de errores (puedes refinar esto)
      console.error('Error al crear el curso:', error);
      throw new BadRequestException('No se pudo crear el curso.');
    }
      COMENTO POR AHORA*/
    return 'This action adds a new course';
  }

  async findAll(): Promise<Curso[]> {
    // Devuelve solo los usuarios que no han sido borrados lógicamente
    const cursos = await this.prisma.curso.findMany({
      where: { deletedAt: null },
    });
    return cursos;
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

  async update(id: string, updateCourseDto: UpdateCourseDto) {}

  async delete(id: string) {
    // Verifica si el curso existe y no está ya borrado
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
