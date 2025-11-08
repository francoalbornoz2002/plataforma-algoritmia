import { Module } from '@nestjs/common';
import { AuditoriaService } from './services/auditoria.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { AuditoriaController } from './controllers/auditoria.controller';

@Module({
  imports: [PrismaModule],
  providers: [AuditoriaService, AuditInterceptor],
  exports: [AuditoriaService],
  controllers: [AuditoriaController],
})
export class AuditoriaModule {}
