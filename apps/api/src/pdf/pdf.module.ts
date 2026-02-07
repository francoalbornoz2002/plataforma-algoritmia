import { Module, forwardRef } from '@nestjs/common';
import { PdfService } from './service/pdf.service';
import { ReportesModule } from '../reportes/reportes.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';

@Module({
  imports: [
    forwardRef(() => ReportesModule),
    forwardRef(() => AuditoriaModule),
  ],
  providers: [PdfService],
  exports: [PdfService],
})
export class PdfModule {}
