import path from 'path';
import cheerio from 'cheerio';
import { URL } from 'url';
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/common/http';
import { map, tap } from 'rxjs/operators';
import { Book, Chapter } from './entities';
import { ElementType } from "domelementtype";

@Injectable()
export class AppService {
  private static BIQUGE_BASE_URL = 'https://www.biquge.com';

  constructor(
      private readonly http: HttpService) {

  }

  public search(keyword: string) {
    return this.http.get<string>(`${ AppService.BIQUGE_BASE_URL }/searchbook.php`, {
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
          const cover = path.join(AppService.BIQUGE_BASE_URL, $element.find('> .image > a > img').attr('src'));
          const name = $element.find('> dl > dt > a').text().trim();
          const author = $element.find('> dl > dt > span').text().trim();
          const description = $element.find('> dl > dd').text().trim().replace(/\s+/g, '');

          return new Book({ id, cover, name, author, description });
        });
      }));
  }

  public getBook(id: string) {
    return this.http.get<string>(`${ AppService.BIQUGE_BASE_URL }/${ id }/`, {
        responseType: 'text',
      })
      .pipe(map(response => response.data))
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
      }));
  }

  public getChapter(id: string, chapterId: string) {
    return this.http.get(`${ AppService.BIQUGE_BASE_URL }/${ id }/${ chapterId }.html`, { responseType: 'text' })
      .pipe(map(response => response.data))
      .pipe(map(html => {
        const document = cheerio.load(html);
        const content = document('#content');
        content.find('div').remove();
        const ps = content.text().split(/\s{2}/).map(a => a.trim()).filter(a => a.length > 0);
        const chapterTitle = document('div.bookname > h1').text().trim();
        const preId = document('div.bookname a.pre').attr('href').replace(/(\.html)|(\/[\d_]+\/)/g, '');
        const nextId = document('div.bookname a.next').attr('href').replace(/(\.html)|(\/[\d_]+\/)/g, '') || null;
        return { ps, chapterTitle, preId, nextId };
      }));
  }

}
