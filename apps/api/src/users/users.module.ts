import { Module } from '@nestjs/common';
import { UsersService } from './services/users.service';
import { UsersController } from './controllers/users.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { ProgressModule } from 'src/progress/progress.module';
import { DifficultiesModule } from 'src/difficulties/difficulties.module';

const UPLOADS_PATH = join(process.cwd(), 'uploads');

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({
      limits: {
        fileSize: 2 * 1024 * 1024, // Límite de 2MB
      },
      storage: diskStorage({
        destination: (req, file, cb) => {
          if (!existsSync(UPLOADS_PATH)) {
            mkdirSync(UPLOADS_PATH, { recursive: true });
          }
          cb(null, UPLOADS_PATH);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
    }),
    ProgressModule,
    DifficultiesModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
