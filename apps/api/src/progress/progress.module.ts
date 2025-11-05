import { Module } from '@nestjs/common';
import { ProgressService } from './services/progress.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProgressController } from './controllers/progress.controller';

@Module({
  imports: [PrismaModule],
  providers: [ProgressService],
  exports: [ProgressService],
  controllers: [ProgressController],
})
export class ProgressModule {}
