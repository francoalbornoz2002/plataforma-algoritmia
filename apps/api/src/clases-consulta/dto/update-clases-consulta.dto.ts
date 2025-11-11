import { PartialType } from '@nestjs/swagger';
import { CreateClasesConsultaDto } from './create-clases-consulta.dto';

export class UpdateClasesConsultaDto extends PartialType(CreateClasesConsultaDto) {}
