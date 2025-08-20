import { ValidationPipe, VersioningType } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

import cookieParser from 'cookie-parser'

import { AppModule } from './app.module'
import { AllExceptionFilter } from './infrastructure/common/filter/exception.filter'
import { LoggingInterceptor } from './infrastructure/common/interceptors/logger.interceptor'
import {
  ResponseFormat,
  ResponseInterceptor,
} from './infrastructure/common/interceptors/response.interceptor'
import { ValidationPipe as CustomValidationPipe } from './infrastructure/common/pipes/validation.pipe'
import { LoggerService } from './infrastructure/logger/logger.service'

async function bootstrap() {
  const env = process.env.NODE_ENV
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  })

  app.use(cookieParser())

  app.useGlobalFilters(new AllExceptionFilter(new LoggerService()))

  app.useGlobalPipes(new CustomValidationPipe())
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  )

  app.useGlobalInterceptors(new LoggingInterceptor(new LoggerService()))
  app.useGlobalInterceptors(new ResponseInterceptor())

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: ['1'],
    prefix: 'api/v',
  })

  if (env !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('API Docs')
      .addBearerAuth()
      .setVersion('1.0')
      .addServer('https://d7973e82cb48.ngrok-free.app')
      .addServer('http://localhost:3000')
      .build()
    const document = SwaggerModule.createDocument(app, config, {
      extraModels: [ResponseFormat],
      deepScanRoutes: true,
    })
    SwaggerModule.setup('api', app, document)
  }
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })

  await app.listen(3000)
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Error during bootstrap:', error)
})
