import { Module } from '@nestjs/common';
import { ConsultasService } from './services/consultas.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ConsultasService],
  exports: [ConsultasService],
})
export class ConsultasModule {}
