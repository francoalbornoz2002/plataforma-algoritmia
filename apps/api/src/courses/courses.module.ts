import { Module } from '@nestjs/common';

import { CoursesController } from './controllers/courses.controller';
import { CoursesService } from './services/courses.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [CoursesController],
  providers: [CoursesService, PrismaService],
})
export class CoursesModule {}
