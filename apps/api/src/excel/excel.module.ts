import { Module, forwardRef } from '@nestjs/common';
import { ExcelService } from './services/excel.service';
import { ReportesModule } from '../reportes/reportes.module';

@Module({
  imports: [
    // Importamos ReportesModule para acceder a metadatos y registro de reportes
    forwardRef(() => ReportesModule),
  ],
  providers: [ExcelService],
  exports: [ExcelService],
})
export class ExcelModule {}
