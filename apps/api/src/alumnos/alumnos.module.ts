import { Module } from '@nestjs/common';
import { AlumnosService } from './services/alumnos.service';
import { AlumnosController } from './controllers/alumnos.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AlumnosController],
  providers: [AlumnosService],
})
export class AlumnosModule {}
