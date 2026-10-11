import { HttpClient, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from './api-config';
import { ApiResponse, Page } from './api.models';

export abstract class ReadOnlyApiService<T> {
  protected readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  protected abstract readonly resource: string;

  protected get url(): string {
    return `${this.baseUrl}/${this.resource}`;
  }

  list(page = 1): Observable<Page<T>> {
    const params = new HttpParams().set('page', page);
    return this.http.get<ApiResponse<Page<T>>>(this.url, { params }).pipe(map((r) => r.data));
  }

  get(id: number): Observable<T> {
    return this.http.get<ApiResponse<T>>(`${this.url}/${id}`).pipe(map((r) => r.data));
  }
}
