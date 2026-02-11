import { Module, forwardRef } from '@nestjs/common';
import { ReportesService } from './services/reportes.service';
import { ReportesController } from './controllers/reportes.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PdfModule } from '../pdf/pdf.module';
import { ExcelModule } from '../excel/excel.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProgressModule } from 'src/progress/progress.module';

@Module({
  imports: [
    PrismaModule,
    ProgressModule,
    forwardRef(() => PdfModule),
    forwardRef(() => ExcelModule),
  ],
  controllers: [ReportesController],
  providers: [ReportesService],
  exports: [ReportesService],
})
export class ReportesModule {}
