import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiResponse } from '../api/api.models';
import { WritableApiService } from '../api/writable-api.service';
import { DevolucionPayload, Prestamo, PrestamoPayload, PrestamoUpdatePayload } from '../models/prestamo';

@Injectable({ providedIn: 'root' })
export class PrestamoService extends WritableApiService<Prestamo, PrestamoPayload, PrestamoUpdatePayload> {
  protected readonly resource = 'prestamo';

  /** Sin payload devuelve todos los equipos pendientes del préstamo. */
  devolver(id: number, payload?: DevolucionPayload): Observable<Prestamo> {
    return this.http
      .post<ApiResponse<Prestamo>>(`${this.url}/${id}/devolucion`, payload ?? {})
      .pipe(map((r) => r.data));
  }
}
