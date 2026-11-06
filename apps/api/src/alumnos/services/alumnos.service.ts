import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { estado_simple } from '@prisma/client';
import { checkDocenteAccess } from 'src/helpers/access.helper';

@Injectable()
export class AlumnosService {
  constructor(private prisma: PrismaService) {}
}
