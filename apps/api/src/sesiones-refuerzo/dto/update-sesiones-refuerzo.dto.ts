import { PartialType } from '@nestjs/swagger';
import { CreateSesionesRefuerzoDto } from './create-sesiones-refuerzo.dto';

export class UpdateSesionesRefuerzoDto extends PartialType(CreateSesionesRefuerzoDto) {}
