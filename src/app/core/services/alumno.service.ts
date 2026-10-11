import { Injectable } from '@angular/core';
import { ReadOnlyApiService } from '../api/read-only-api.service';
import { Alumno } from '../models/alumno';

@Injectable({ providedIn: 'root' })
export class AlumnoService extends ReadOnlyApiService<Alumno> {
  protected readonly resource = 'alumno';
}
