import { Module } from '@nestjs/common';
import { DocentesService } from './services/docentes.service';
import { DocentesController } from './controllers/docentes.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProgressModule } from 'src/progress/progress.module';

@Module({
  imports: [ProgressModule, PrismaModule],
  controllers: [DocentesController],
  providers: [DocentesService],
})
export class DocentesModule {}
