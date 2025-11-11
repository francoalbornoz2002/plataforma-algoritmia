import { Injectable } from '@nestjs/common';
import { CreateClasesConsultaDto } from '../dto/create-clases-consulta.dto';
import { UpdateClasesConsultaDto } from '../dto/update-clases-consulta.dto';
import { UserPayload } from 'src/interfaces/authenticated-user.interface';

@Injectable()
export class ClasesConsultaService {
  create(dto: CreateClasesConsultaDto, user: UserPayload) {
    return 'This action adds a new clasesConsulta';
  }

  findAll(idCurso: string, user: UserPayload) {
    return `This action returns all clasesConsulta`;
  }

  update(id: string, dto: UpdateClasesConsultaDto, user: UserPayload) {
    return `This action updates a #${id} clasesConsulta`;
  }

  remove(id: string) {
    return `This action removes a #${id} clasesConsulta`;
  }
}
