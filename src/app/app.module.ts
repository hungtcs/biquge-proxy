import fs from 'fs';
import os from 'os';
import path from 'path';
import { AppController } from './app.controller';
import { BiqugeService } from './biquge/biquku.service';
import { HttpModule, Inject, Logger, Module, OnModuleInit } from '@nestjs/common';

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
    Logger,
    BiqugeService,
    {
      provide: 'CONFIG_DIR',
      useValue: path.join(os.homedir(), '.config/biquge-proxy'),
    },
  ],
  controllers: [
    AppController,
  ],
})
export class AppModule implements OnModuleInit {

  constructor(
      @Inject('CONFIG_DIR') private readonly configDir: string) {

  }

  public async onModuleInit() {
    if(os.platform() === 'linux') {
      if(!fs.existsSync(this.configDir)) {
        await fs.promises.mkdir(this.configDir, { recursive: true });
      }
    }
  }

}
