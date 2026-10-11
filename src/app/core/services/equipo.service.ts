import { Injectable } from '@angular/core';
import { ReadOnlyApiService } from '../api/read-only-api.service';
import { Equipo } from '../models/equipo';

@Injectable({ providedIn: 'root' })
export class EquipoService extends ReadOnlyApiService<Equipo> {
  protected readonly resource = 'equipo';
}
