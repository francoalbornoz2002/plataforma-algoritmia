import { Module } from '@nestjs/common';
import { SesionesRefuerzoService } from './service/sesiones-refuerzo.service';
import { SesionesRefuerzoController } from './controller/sesiones-refuerzo.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { PreguntasService } from 'src/preguntas/services/preguntas.service';
import { MailService } from 'src/mail/services/mail.service';

@Module({
  controllers: [SesionesRefuerzoController],
  providers: [
    SesionesRefuerzoService,
    PrismaService,
    PreguntasService,
    MailService,
  ],
})
export class SesionesRefuerzoModule {}
