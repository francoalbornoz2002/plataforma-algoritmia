import { PartialType, OmitType } from '@nestjs/mapped-types';

import { CreateConsultaDto } from './create-consulta.dto';

export class UpdateConsultaDto extends PartialType(
  // 1. Omitimos el campo 'fechaConsulta' del DTO de creación.
  OmitType(CreateConsultaDto, ['fechaConsulta'] as const),
) {}
