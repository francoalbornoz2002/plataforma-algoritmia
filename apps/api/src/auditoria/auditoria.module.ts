import { Module, forwardRef } from '@nestjs/common';
import { AuditoriaService } from './services/auditoria.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { AuditoriaController } from './controllers/auditoria.controller';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [PrismaModule, forwardRef(() => PdfModule)],
  providers: [AuditoriaService, AuditInterceptor],
  exports: [AuditoriaService],
  controllers: [AuditoriaController],
})
export class AuditoriaModule {}
