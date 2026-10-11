import { Injectable } from '@angular/core';
import { WritableApiService } from '../api/writable-api.service';
import { Aviso, AvisoPayload } from '../models/aviso';

@Injectable({ providedIn: 'root' })
export class AvisoService extends WritableApiService<Aviso, AvisoPayload> {
  protected readonly resource = 'aviso';
}
