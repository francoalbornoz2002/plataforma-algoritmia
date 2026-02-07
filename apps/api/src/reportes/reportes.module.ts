import { Module, forwardRef } from '@nestjs/common';
import { ReportesService } from './services/reportes.service';
import { ReportesController } from './controllers/reportes.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PdfModule } from '../pdf/pdf.module';
import { ExcelModule } from '../excel/excel.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => PdfModule),
    forwardRef(() => ExcelModule),
  ],
  controllers: [ReportesController],
  providers: [ReportesService],
  exports: [ReportesService],
})
export class ReportesModule {}
