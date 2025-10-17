import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import morgan from 'morgan';
import { CORS } from './constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
  SwaggerModule.setup('api', app, document);

  // Obtención de la variable de entorno PORT
  const configService = app.get(ConfigService);
  const PORT = configService.get('PORT');

  // Para usar todas las validaciones definidas de manera global.
  app.useGlobalPipes(
    new ValidationPipe({
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Para que el Guard de JWT se utilice de manera global.
  const jwtAuthGuard = app.get(JwtAuthGuard);
  app.useGlobalGuards(jwtAuthGuard);

  // Habilitamos CORS
  app.enableCors(CORS);

  await app.listen(PORT);
}
bootstrap();
