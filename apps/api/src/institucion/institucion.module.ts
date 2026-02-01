import { Module } from '@nestjs/common';
import { InstitucionController } from './controllers/institucion.controller';
import { InstitucionService } from './services/institucion.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MulterModule } from '@nestjs/platform-express';
import { extname, join } from 'path';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';

const UPLOADS_PATH = join(process.cwd(), 'uploads');

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, cb) => {
          // Nos aseguramos de que la carpeta exista
          if (!existsSync(UPLOADS_PATH)) {
            mkdirSync(UPLOADS_PATH, { recursive: true });
          }
          cb(null, UPLOADS_PATH);
        },
        filename: (req, file, cb) => {
          // Generamos un nombre único
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
    }),
  ],
  controllers: [InstitucionController],
  providers: [InstitucionService],
})
export class InstitucionModule {}
