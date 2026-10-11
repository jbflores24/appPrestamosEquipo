import { Injectable } from '@angular/core';
import { ReadOnlyApiService } from '../api/read-only-api.service';
import { Prestamo } from '../models/prestamo';

@Injectable({ providedIn: 'root' })
export class PrestamoService extends ReadOnlyApiService<Prestamo> {
  protected readonly resource = 'prestamo';
}
