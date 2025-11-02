import { Module } from '@nestjs/common';
import { DocentesService } from './services/docentes.service';
import { DocentesController } from './controllers/docentes.controller';

@Module({
  controllers: [DocentesController],
  providers: [DocentesService],
})
export class DocentesModule {}
