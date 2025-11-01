import { Module } from '@nestjs/common';

import { CoursesController } from './controllers/courses.controller';
import { CoursesService } from './services/courses.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { MulterModule } from '@nestjs/platform-express';
import { extname, join } from 'path';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';

const UPLOADS_PATH = join(process.cwd(), 'uploads');

@Module({
  imports: [
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
  controllers: [CoursesController],
  providers: [CoursesService, PrismaService],
})
export class CoursesModule {}
