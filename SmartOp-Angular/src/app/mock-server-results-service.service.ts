import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { MyModel } from './model/myModel';

class PagedData<T> {
  data: T[];
}

@Injectable({
  providedIn: 'root'
})
export class MockServerResultsServiceService {
  URL_BACKEND: string="http://localhost:3000/";
  constructor(private http:HttpClient) { }

  public getResults(offset: number, limit: number) {
    return this.http.get(this.URL_BACKEND+"api/data?skip="+offset+"&limit="+limit);
  }

}
