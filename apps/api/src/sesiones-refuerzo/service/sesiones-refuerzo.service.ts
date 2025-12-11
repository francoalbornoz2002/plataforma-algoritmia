import { Injectable } from '@nestjs/common';
import { CreateSesionesRefuerzoDto } from '../dto/create-sesiones-refuerzo.dto';
import { UpdateSesionesRefuerzoDto } from '../dto/update-sesiones-refuerzo.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SesionesRefuerzoService {
  constructor(private readonly prisma: PrismaService) {}

  create(idCurso: string, dto: CreateSesionesRefuerzoDto, idDocente: string) {}

  findAll(idCurso: string) {}

  findOne(idCurso: string, idSesion: string) {}

  update(idCurso: string, idSesion: string, dto: UpdateSesionesRefuerzoDto) {}

  remove(idCurso: string, idSesion: string) {}
}
