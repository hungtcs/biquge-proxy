import { map } from 'rxjs/operators';
import { BiqugeService } from './biquge/biquku.service';
import { Controller, Get, Param, Query, Render } from '@nestjs/common';

@Controller()
export class AppController {

  constructor(
      private readonly biqugeService: BiqugeService) {

  }

  @Get()
  @Render('index.njk')
  public index() {
    return {};
  }

  @Get('search.html')
  @Render('search.njk')
  public search() {
    return {};
  }

  @Get('search-result.html')
  @Render('search-result.njk')
  public doSearch(
      @Query('keyword') keyword: string) {
    return this.biqugeService.search(keyword)
      .pipe(map(books => ({ books })));
  }

  @Get('detail/:id')
  @Render('book-detail.njk')
  public detail(
      @Param('id') id: string) {
    return this.biqugeService.getBook(id)
      .pipe(map(book => (book.chapters = book.chapters.reverse(), book)))
      .pipe(map(book => ({ book })));
  }

  @Get('chapter/:id/:chapterId')
  @Render('chapter.njk')
  public chapter(
      @Param('id') id: string,
      @Param('chapterId') chapterId: string) {
    return this.biqugeService.getChapter(id, chapterId)
        .pipe(map(ps => ({ ...ps, id, chapterId })));
  }

}
