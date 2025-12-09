import { Module } from '@nestjs/common';
import { PreguntasService } from './services/preguntas.service';
import { PreguntasController } from './controllers/preguntas.controller';

@Module({
  controllers: [PreguntasController],
  providers: [PreguntasService],
})
export class PreguntasModule {}
