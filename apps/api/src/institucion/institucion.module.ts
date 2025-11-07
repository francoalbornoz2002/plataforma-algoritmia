import { Module } from '@nestjs/common';
import { InstitucionController } from './controllers/institucion.controller';
import { InstitucionService } from './services/institucion.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InstitucionController],
  providers: [InstitucionService],
})
export class InstitucionModule {}
