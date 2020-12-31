
export class Chapter {
  id: string;
  name: string;

  constructor(chapter: Chapter) {
    Object.assign(this, chapter);
  }

}

export class Book {
  public id: string;
  public name: string;
  public cover: string;
  public author: string;
  public description: string;

  public chapters?: Array<Chapter>;

  constructor(book: Book) {
    Object.assign(this, book);
  }

}
