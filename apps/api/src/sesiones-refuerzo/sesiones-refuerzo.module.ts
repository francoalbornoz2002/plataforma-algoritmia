import { Module } from '@nestjs/common';
import { SesionesRefuerzoService } from './service/sesiones-refuerzo.service';
import { SesionesRefuerzoController } from './controller/sesiones-refuerzo.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [SesionesRefuerzoController],
  providers: [SesionesRefuerzoService, PrismaService],
})
export class SesionesRefuerzoModule {}
