import { Module } from '@nestjs/common';
import { ClasesConsultaService } from './services/clases-consulta.service';
import { ClasesConsultaController } from './controllers/clases-consulta.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [PrismaModule],
  controllers: [ClasesConsultaController],
  providers: [ClasesConsultaService, PrismaService],
})
export class ClasesConsultaModule {}
