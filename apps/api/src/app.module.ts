import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { CoursesModule } from './courses/courses.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

const UPLOADS_PATH = join(process.cwd(), 'uploads');

@Module({
  imports: [
    ServeStaticModule.forRoot({
      // 2. Le decimos a Nest que sirva archivos desde esta carpeta exacta
      rootPath: UPLOADS_PATH,

      // 3. Le decimos que solo responda a URLs que empiecen con '/uploads'
      serveRoot: '/uploads',
    }),
    ConfigModule.forRoot({
      envFilePath: `.${process.env.NODE_ENV}.env`,
      isGlobal: true,
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    CoursesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
