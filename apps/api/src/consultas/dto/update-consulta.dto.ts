import { PartialType, OmitType } from '@nestjs/mapped-types';

import { CreateConsultaDto } from './create-consulta.dto';

export class UpdateConsultaDto extends PartialType(
  OmitType(CreateConsultaDto, ['idCurso'] as const),
) {}
