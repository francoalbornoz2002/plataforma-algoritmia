import { Module } from '@nestjs/common';
import { ProgressService } from './services/progress.service';

@Module({
  providers: [ProgressService],
})
export class ProgressModule {}
