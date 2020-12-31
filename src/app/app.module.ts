import { HttpModule, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    HttpModule.register({
      headers: {
        'DNT': '1',
        'Host': 'www.biquge.com',
        'Pragma': 'no-cache',
        'Referer': 'https://www.biquge.com/',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36',
        'Cache-Control': 'no-cache',
      },
    }),
  ],
  providers: [
    AppService,
  ],
  controllers: [
    AppController,
  ],
})
export class AppModule {}
