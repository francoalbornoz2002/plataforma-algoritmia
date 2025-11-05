import { Module } from '@nestjs/common';
import { DifficultiesService } from './services/difficulties.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { DifficultiesController } from './controllers/difficulties.controller';

@Module({
  imports: [PrismaModule],
  providers: [DifficultiesService],
  exports: [DifficultiesService],
  controllers: [DifficultiesController],
})
export class DifficultiesModule {}
