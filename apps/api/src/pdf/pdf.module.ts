import { Module, forwardRef } from '@nestjs/common';
import { PdfService } from './service/pdf.service';
import { ReportesModule } from '../reportes/reportes.module';

@Module({
  imports: [forwardRef(() => ReportesModule)],
  providers: [PdfService],
  exports: [PdfService],
})
export class PdfModule {}
