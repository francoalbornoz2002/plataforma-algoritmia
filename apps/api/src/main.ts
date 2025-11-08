import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import morgan from 'morgan';
import { CORS } from './constants';
import { PrismaService } from './prisma/prisma.service';
import { AuditInterceptor } from './auditoria/interceptors/audit.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefijo global para toda la api
  app.setGlobalPrefix('api');

  // Usamos la libería morgan para poder auditar las instrucciones o peticiones ejecutadas
  app.use(morgan('dev'));

  // Configuración de Swagger para la documentación de la API.
  const config = new DocumentBuilder()
    .setTitle('Algoritmia')
    .setDescription('Documentación de la API de Plataforma "Algoritmia"')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      in: 'header',
      name: 'Authorization',
      description: 'Enter your Bearer token',
    })
    .addSecurityRequirements('bearer')
    .build();

  // Creación del documento Swagger para la documentación de la API
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/api', app, document);

  // Obtención de la variable de entorno PORT
  const PORT = process.env.PORT;

  // Para usar todas las validaciones definidas de manera global.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true, // Ayuda a la transformación
      },
    }),
  );

  // Para que el Guard de JWT se utilice de manera global.
  const jwtAuthGuard = app.get(JwtAuthGuard);
  app.useGlobalGuards(jwtAuthGuard);

  // Habilitamos CORS
  app.enableCors(CORS);

  // --- REGISTRAR EL INTERCEPTOR PARA AUDITORIA GLOBALMENTE ---
  // Obtenemos la instancia (Singleton) de PrismaService
  const prismaService = app.get(PrismaService);

  // Inyectamos manualmente el PrismaService en el constructor del interceptor
  app.useGlobalInterceptors(new AuditInterceptor());

  await app.listen(PORT);
}
bootstrap();
