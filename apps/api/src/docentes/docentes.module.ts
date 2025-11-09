import { Module } from '@nestjs/common';
import { DocentesService } from './services/docentes.service';
import { DocentesController } from './controllers/docentes.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProgressModule } from 'src/progress/progress.module';
import { DifficultiesModule } from 'src/difficulties/difficulties.module';
import { ConsultasModule } from 'src/consultas/consultas.module';

@Module({
  imports: [ProgressModule, PrismaModule, DifficultiesModule, ConsultasModule],
  controllers: [DocentesController],
  providers: [DocentesService],
})
export class DocentesModule {}
