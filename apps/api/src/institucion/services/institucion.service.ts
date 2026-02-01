import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateInstitucionDto } from '../dto/update-institucion.dto';
import { unlink } from 'fs';
import { basename, join } from 'path';

@Injectable()
export class InstitucionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Obtiene la (única) fila de datos de la institución.
   * AHORA DEVUELVE NULL si no existe, en lugar de un error.
   */
  async findOne() {
    try {
      const institucion = await this.prisma.institucion.findFirst({
        include: {
          // Incluimos la localidad Y la provincia dentro de la localidad
          localidad: {
            include: {
              provincia: true,
            },
          },
        },
      });

      if (!institucion) {
        return null;
      }
      return institucion;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Error en InstitucionService.findOne:', error);
      throw new InternalServerErrorException(
        'Error al obtener los datos de la institución.',
      );
    }
  }

  /**
   * Actualiza O CREA (Upsert) la fila de datos de la institución.
   * Renombramos 'update' a 'upsert'.
   */
  async upsert(dto: UpdateInstitucionDto, logo?: Express.Multer.File) {
    try {
      // Separamos 'logo' del resto de datos para que Prisma no falle
      const { logo: _ignored, ...dataWithoutLogo } = dto;

      const current = await this.prisma.institucion.findFirst({
        select: { id: true, logoUrl: true },
      });

      // --- 1. Definimos el 'include' que queremos devolver ---
      // (Es el mismo 'include' que usamos en 'findOne')
      const includeData = {
        localidad: {
          include: {
            provincia: true,
          },
        },
      };

      // --- Manejo del Logo ---
      let logoUrl: string | undefined;
      if (logo && logo.filename) {
        logoUrl = `/uploads/${logo.filename}`;

        // Si ya existía un logo, borramos el archivo viejo
        if (current?.logoUrl) {
          const oldFileName = basename(current.logoUrl);
          const UPLOADS_PATH = join(process.cwd(), 'uploads');
          const oldImagePath = join(UPLOADS_PATH, oldFileName);

          unlink(oldImagePath, (err) => {
            if (err) {
              console.error(
                `Error al eliminar logo antiguo ${oldImagePath}:`,
                err,
              );
            }
          });
        }
      }

      // Combinamos los datos del DTO con la nueva URL del logo (si existe)
      const dataToSave = {
        ...dataWithoutLogo,
        ...(logoUrl ? { logoUrl } : {}),
      };

      if (current) {
        // --- 2. SI EXISTE: Actualizamos (UPDATE) ---
        return await this.prisma.institucion.update({
          where: { id: current.id },
          data: dataToSave,
          include: includeData,
        });
      } else {
        // --- 3. SI NO EXISTE: Creamos (CREATE) ---
        return await this.prisma.institucion.create({
          data: dataToSave,
          include: includeData,
        });
      }
    } catch (error) {
      console.error('Error en InstitucionService.upsert:', error);
      throw new InternalServerErrorException(
        'Error al guardar los datos de la institución.',
      );
    }
  }

  /**
   * Obtiene la lista de todas las provincias
   */
  async findProvincias() {
    try {
      return await this.prisma.provincia.findMany({
        orderBy: {
          provincia: 'asc', // Ordenadas alfabéticamente
        },
      });
    } catch (error) {
      console.error('Error en InstitucionService.findProvincias:', error);
      throw new InternalServerErrorException(
        'Error al obtener las provincias.',
      );
    }
  }

  /**
   * Obtiene las localidades de una provincia específica
   */
  async findLocalidades(idProvincia: number) {
    try {
      return await this.prisma.localidad.findMany({
        where: {
          idProvincia: idProvincia,
        },
        orderBy: {
          localidad: 'asc',
        },
      });
    } catch (error) {
      console.error('Error en InstitucionService.findLocalidades:', error);
      throw new InternalServerErrorException(
        'Error al obtener las localidades.',
      );
    }
  }
}
