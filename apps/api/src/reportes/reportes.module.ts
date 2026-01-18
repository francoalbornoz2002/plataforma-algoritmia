import { Module } from '@nestjs/common';
import { ReportesService } from './services/reportes.service';
import { ReportesController } from './controllers/reportes.controller';

@Module({
  controllers: [ReportesController],
  providers: [ReportesService],
})
export class ReportesModule {}
