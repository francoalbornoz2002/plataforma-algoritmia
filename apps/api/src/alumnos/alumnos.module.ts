import { Module } from '@nestjs/common';
import { AlumnosService } from './services/alumnos.service';
import { AlumnosController } from './controllers/alumnos.controller';

@Module({
  controllers: [AlumnosController],
  providers: [AlumnosService],
})
export class AlumnosModule {}
