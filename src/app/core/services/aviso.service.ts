import { Injectable } from '@angular/core';
import { ReadOnlyApiService } from '../api/read-only-api.service';
import { Aviso } from '../models/aviso';

@Injectable({ providedIn: 'root' })
export class AvisoService extends ReadOnlyApiService<Aviso> {
  protected readonly resource = 'aviso';
}
