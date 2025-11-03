import { Module } from '@nestjs/common';
import { ProgressService } from './services/progress.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
