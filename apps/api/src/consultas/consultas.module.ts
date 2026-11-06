import { Module } from '@nestjs/common';
import { ConsultasService } from './services/consultas.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ConsultasController } from './controller/consultas.controller';

@Module({
  imports: [PrismaModule],
  providers: [ConsultasService],
  exports: [ConsultasService],
  controllers: [ConsultasController],
})
export class ConsultasModule {}
