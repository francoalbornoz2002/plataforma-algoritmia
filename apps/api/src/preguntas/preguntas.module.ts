import { Module } from '@nestjs/common';
import { PreguntasService } from './services/preguntas.service';
import { PreguntasController } from './controllers/preguntas.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [PreguntasController],
  providers: [PreguntasService, PrismaService],
  exports: [PreguntasService],
})
export class PreguntasModule {}
