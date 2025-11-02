import { Controller, Get } from '@nestjs/common';
import { AlumnosService } from '../services/alumnos.service';

@Controller('alumnos')
export class AlumnosController {
  constructor(private readonly alumnosService: AlumnosService) {}

  @Get('my/courses')
  findOne() {
    return 'Hola Mundo';
  }
}
