import path from 'path';
import nunjucks from 'nunjucks';
import { AppModule } from './app/app.module';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger: new Logger() });

  const baseViewsDir = path.join(__dirname, 'views');
  nunjucks.configure(
    [baseViewsDir],
    {
      watch: true,
      noCache: true,
      express: app,
      trimBlocks: true,
      lstripBlocks: true,
      throwOnUndefined: true
    },
  );

  app.setViewEngine('html');
  app.setBaseViewsDir(baseViewsDir);
  app.useStaticAssets(path.join(__dirname, 'assets'), { prefix: '/assets' });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
