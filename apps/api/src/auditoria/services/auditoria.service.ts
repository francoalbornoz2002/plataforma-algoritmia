import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { LogData } from '../interfaces/LogData.interface';

@Injectable()
export class AuditoriaService {
  // Usamos un 'PrismaService' separado para evitar bucles infinitos
  // (Si el log se logueara a sí mismo)
  // Pero por ahora, usemos el 'prisma' normal
  constructor(private prisma: PrismaService) {}

  /**
   * Crea un registro de auditoría.
   * Se ejecuta "en segundo plano" (sin 'await') para no frenar la
   * petición principal del usuario.
   */
  logChange(data: LogData): void {
    this.prisma.logAuditoria
      .create({
        data: {
          tablaAfectada: data.tablaAfectada,
          idFilaAfectada: data.idFilaAfectada,
          operacion: data.operacion,
          idUsuarioModifico: data.idUsuarioModifico,
          // Convertimos los objetos a Json
          valoresAnteriores: data.valoresAnteriores,
          valoresNuevos: data.valoresNuevos,
          fechaHora: new Date(), // La fecha del servidor
        },
      })
      .catch((err) => {
        // Si el log falla, no queremos que crashee la app
        console.error('CRITICAL: Falla al guardar el log de auditoría:', err);
      });
  }
}
