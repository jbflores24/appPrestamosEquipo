import { map, Observable } from 'rxjs';
import { ApiResponse } from './api.models';
import { ReadOnlyApiService } from './read-only-api.service';

/**
 * Agrega alta, edición y baja a la lectura. La edición usa PATCH, que la ruta
 * apiResource expone junto con PUT.
 */
export abstract class WritableApiService<
  T,
  TCreate,
  TUpdate = Partial<TCreate>,
> extends ReadOnlyApiService<T> {
  create(payload: TCreate): Observable<T> {
    return this.http.post<ApiResponse<T>>(this.url, payload).pipe(map((r) => r.data));
  }

  update(id: number, payload: TUpdate): Observable<T> {
    return this.http.patch<ApiResponse<T>>(`${this.url}/${id}`, payload).pipe(map((r) => r.data));
  }

  remove(id: number): Observable<void> {
    return this.http.delete<ApiResponse<unknown>>(`${this.url}/${id}`).pipe(map(() => undefined));
  }
}
