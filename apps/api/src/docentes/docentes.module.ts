import { Module } from '@nestjs/common';
import { DocentesService } from './services/docentes.service';
import { DocentesController } from './controllers/docentes.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DocentesController],
  providers: [DocentesService],
})
export class DocentesModule {}
