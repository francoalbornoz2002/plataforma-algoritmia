import { Module } from '@nestjs/common';
import { AlumnosService } from './services/alumnos.service';
import { AlumnosController } from './controllers/alumnos.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProgressModule } from 'src/progress/progress.module';
import { DifficultiesModule } from 'src/difficulties/difficulties.module';
import { ConsultasModule } from 'src/consultas/consultas.module';

@Module({
  imports: [PrismaModule, ProgressModule, DifficultiesModule, ConsultasModule],
  controllers: [AlumnosController],
  providers: [AlumnosService],
})
export class AlumnosModule {}
