import { Module } from '@nestjs/common';
import { DifficultiesService } from './services/difficulties.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { DifficultiesController } from './controllers/difficulties.controller';
import { SesionesRefuerzoService } from 'src/sesiones-refuerzo/service/sesiones-refuerzo.service';
import { PreguntasService } from 'src/preguntas/services/preguntas.service';

@Module({
  imports: [PrismaModule],
  providers: [DifficultiesService, SesionesRefuerzoService, PreguntasService],
  exports: [DifficultiesService],
  controllers: [DifficultiesController],
})
export class DifficultiesModule {}
