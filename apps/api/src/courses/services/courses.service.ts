import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCourseDto } from '../dto/create-course.dto';
import { UpdateCourseDto } from '../dto/update-course.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Rol } from '@prisma/client';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async create(createCourseDto: CreateCourseDto) {
    const { nombre, descripcion, claveAcceso, docenteIds, diasClase } =
      createCourseDto;
    // 1. Verificar que los IDs de docentes realmente pertenezcan a usuarios con rol DOCENTE
    const docentes = await this.prisma.usuario.findMany({
      where: {
        id: { in: docenteIds },
        rol: Rol.DOCENTE, // Filtra solo por docentes
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
          claveAcceso,
          // Crea las relaciones en la tabla de unión `docentes_cursos`
          docentes: {
            createMany: {
              data: docenteIds.map((id) => ({ docenteId: id })),
            },
          },
          // Crea los registros de dias de clase y los asocia a este curso
          diasClase: {
            createMany: {
              // CAMBIO: Se mapea desde 'diasClase' del DTO
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
  }

  findAll() {
    return `This action returns all courses`;
  }

  findOne(id: number) {
    return `This action returns a #${id} course`;
  }

  update(id: number, updateCourseDto: UpdateCourseDto) {
    return `This action updates a #${id} course`;
  }

  remove(id: number) {
    return `This action removes a #${id} course`;
  }
}
