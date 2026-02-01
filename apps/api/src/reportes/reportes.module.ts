import { Module } from '@nestjs/common';
import { ReportesService } from './services/reportes.service';
import { ReportesController } from './controllers/reportes.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [PrismaModule, PdfModule],
  controllers: [ReportesController],
  providers: [ReportesService],
})
export class ReportesModule {}
