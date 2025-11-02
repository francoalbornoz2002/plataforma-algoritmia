import { Controller } from '@nestjs/common';
import { DocentesService } from '../services/docentes.service';

@Controller('docentes')
export class DocentesController {
  constructor(private readonly docentesService: DocentesService) {}
}
