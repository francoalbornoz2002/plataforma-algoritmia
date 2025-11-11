import { Module } from '@nestjs/common';
import { ClasesConsultaService } from './services/clases-consulta.service';
import { ClasesConsultaController } from './controllers/clases-consulta.controller';

@Module({
  controllers: [ClasesConsultaController],
  providers: [ClasesConsultaService],
})
export class ClasesConsultaModule {}
