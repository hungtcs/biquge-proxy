import cheerio from 'cheerio';
import { URL } from 'url';
import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/common/http';
import { map, tap } from 'rxjs/operators';
import { Book, Chapter } from '../entities';
import { ElementType } from "domelementtype";
import { Observable, of } from 'rxjs';
import fs from 'fs';
import path from 'path';

function ChapterPreload(): MethodDecorator {
  const cacheMap = new Map<string, any>();
  return (target, propertyKey, descriptor: TypedPropertyDescriptor<any>) => {
    const origin = descriptor.value;
    descriptor.value = function(id: string, chapterId: string) {
      const cache = cacheMap.get(`${ chapterId }@${ id }`);
      if(!cache) {
        const _result = origin.call(this, id, chapterId) as Observable<{ ps: string[]; chapterTitle: string; preId: string; nextId: string; }>;
        const result = _result
          .pipe(tap(({ nextId }) => {
            if(nextId) {
              origin.call(this, id, nextId)
                .pipe(tap(data => cacheMap.set(`${ nextId }@${ id }`, data)))
                .subscribe();
            }
          }))
          .pipe(tap(data => cacheMap.set(`${ chapterId }@${ id }`, data)));
        cacheMap.set(`${ chapterId }@${ id }`, result);
        return result;
      } else if(cache instanceof Observable) {
        return cache;
      } else {
        return of(cache)
          .pipe(tap(({ nextId }) => {
            if(nextId) {
              origin.call(this, id, nextId)
                .pipe(tap(data => cacheMap.set(`${ nextId }@${ id }`, data)))
                .subscribe();
            }
          }));
      }
    };
    return descriptor;
  };
}

@Injectable()
export class BiqugeService implements OnModuleInit {

  private static BIQUGE_BASE_URL = 'https://www.biquge.com';

  private get baseURL() {
    return BiqugeService.BIQUGE_BASE_URL;
  }

  private cacheRootDir: string;

  constructor(
      private readonly http: HttpService,
      private readonly logger: Logger,
      @Inject('CONFIG_DIR') private readonly configDir: string) {
    this.cacheRootDir = path.join(this.configDir, 'biquge');
  }

  public async onModuleInit() {
    if(!fs.existsSync(this.cacheRootDir)) {
      await fs.promises.mkdir(this.cacheRootDir, { recursive: true });
    }
  }

  public search(keyword: string) {
    return this.http.get<string>(`${ this.baseURL }/searchbook.php`, {
        params: {
          keyword,
        },
        responseType: 'text'
      })
      .pipe(map(response => {
        const document = cheerio.load(response.data);
        return document('#hotcontent > .l2 > .item').toArray().map(element => {
          const $element = cheerio(element);
          const id = $element.find('> .image > a').attr('href').replace(/\//g, '');
          const cover = this.baseURL + $element.find('> .image > a > img').attr('src');
          const name = $element.find('> dl > dt > a').text().trim();
          const author = $element.find('> dl > dt > span').text().trim();
          const description = $element.find('> dl > dd').text().trim().replace(/\s+/g, '');

          return new Book({ id, cover, name, author, description });
        });
      }));
  }

  public getBook(id: string) {
    this.logger.log(`getBook, ${ id }, ${ this.baseURL }/${ id }/`);
    return this.http.get<string>(`${ this.baseURL }/${ id }/`, {
        responseType: 'text',
      })
      .pipe(map(response => response.data))
      .pipe(tap(() => this.logger.log('remote responsed')))
      .pipe(map(html => {
        let flag = false;
        const document = cheerio.load(html);
        const name = document('#info > h1').text().trim();
        const cover = new URL('http:'+ document('#fmimg > img').attr('src').trim()).toString();
        const author = document('#info > p:nth(0)').text().substr(7);
        const description = document('#intro').text().trim().replace(/\s+/g, '');
        const chapters = document('#list > dl').contents().toArray().reduce((chapters, element) => {
          if(element.type !== ElementType.Tag) {
            return chapters;
          }
          const $element = cheerio(element);
          const tagName = element.tagName.toUpperCase();

          if(tagName === 'DT' && /正文/.test($element.text().trim())) {
            flag = true;
            return chapters;
          }
          if(tagName !== 'DD') {
            return chapters;
          }
          if(!flag) {
            return chapters;
          }
          const id = $element.find('> a').attr('href').replace(/\/\d+_\d+\//, '').replace('.html', '');
          const name = $element.text().trim();
          const chapter = new Chapter({ id, name });
          chapters.push(chapter);
          return chapters;
        }, []);

        return new Book({ id, name, author, cover, description, chapters });
      }))
      .pipe(tap(() => this.logger.log('local responsed')));
  }

  @ChapterPreload()
  public getChapter(id: string, chapterId: string) {
    this.logger.log(`getChapter, ${ chapterId }@${ id }`);
    return this.http.get(`${ this.baseURL }/${ id }/${ chapterId }.html`, { responseType: 'text' })
      .pipe(map(response => response.data))
      .pipe(tap(() => this.logger.log(`remote response, ${ chapterId }@${ id }`)))
      .pipe(map(html => {
        const document = cheerio.load(html);
        const content = document('#content');
        content.find('div').remove();
        const ps = content.text().split(/\s{2}/).map(a => a.trim()).filter(a => a.length > 0);
        const chapterTitle = document('div.bookname > h1').text().trim();
        const preId = document('div.bookname a.pre').attr('href').replace(/(\.html)|(\/[\d_]+\/)/g, '');
        const nextId = document('div.bookname a.next').attr('href').replace(/(\.html)|(\/[\d_]+\/)/g, '') || null;
        return { ps, chapterTitle, preId, nextId };
      }))
      .pipe(tap(() => this.logger.log(`local response, ${ chapterId }@${ id }`)));
  }

}
