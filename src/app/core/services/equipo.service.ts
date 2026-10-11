import { Injectable } from '@angular/core';
import { WritableApiService } from '../api/writable-api.service';
import { Equipo, EquipoPayload } from '../models/equipo';

@Injectable({ providedIn: 'root' })
export class EquipoService extends WritableApiService<Equipo, EquipoPayload> {
  protected readonly resource = 'equipo';
}
