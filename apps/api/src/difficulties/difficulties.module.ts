import { Module } from '@nestjs/common';
import { DifficultiesService } from './services/difficulties.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [DifficultiesService],
  exports: [DifficultiesService],
})
export class DifficultiesModule {}
