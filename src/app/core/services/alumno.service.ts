import { Injectable } from '@angular/core';
import { WritableApiService } from '../api/writable-api.service';
import { Alumno, AlumnoPayload } from '../models/alumno';

@Injectable({ providedIn: 'root' })
export class AlumnoService extends WritableApiService<Alumno, AlumnoPayload> {
  protected readonly resource = 'alumno';
}
