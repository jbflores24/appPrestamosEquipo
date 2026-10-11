import { HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProviderToken } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';
import { ApiError } from '../api/api-error';
import { apiErrorInterceptor } from '../api/api-error.interceptor';
import { WritableApiService } from '../api/writable-api.service';
import { AlumnoService } from './alumno.service';
import { AvisoService } from './aviso.service';
import { EquipoService } from './equipo.service';
import { PrestamoService } from './prestamo.service';

const BASE = 'http://127.0.0.1:8000/api';

const envelope = (data: unknown, statusCode = 200, error = false, message = 'ok') => ({
  message,
  statusCode,
  error,
  data,
});

const prestamoCreate = {
  alumno_id: 1,
  fecha_salida: '2026-10-11',
  fecha_devolucion_esperada: '2026-10-15',
  equipos: [3, 4],
};

interface Recurso {
  nombre: string;
  servicio: ProviderToken<unknown>;
  create: object;
  update: object;
}

const recursos: Recurso[] = [
  {
    nombre: 'aviso',
    servicio: AvisoService,
    create: { titulo: 'Titulo', texto: 'Texto', fecha: '2026-10-11' },
    update: { texto: 'Solo texto' },
  },
  {
    nombre: 'alumno',
    servicio: AlumnoService,
    create: { matricula: '20240099', nombre: 'Nombre Completo', carrera: 'Carrera' },
    update: { nombre: 'Otro Nombre' },
  },
  {
    nombre: 'equipo',
    servicio: EquipoService,
    create: { codigo: 'EQ-099', nombre: 'Equipo', tipo: 'Tipo', estado: 'disponible' as const },
    update: { estado: 'mantenimiento' as const },
  },
  {
    nombre: 'prestamo',
    servicio: PrestamoService,
    create: prestamoCreate,
    update: { fecha_salida: '2026-10-12', fecha_devolucion_esperada: '2026-10-16' },
  },
];

describe('capa de escritura de la API', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  /** Suscribe y devuelve lo emitido o el error recibido. */
  function capturar<T>(obs: Observable<T>) {
    const resultado: { value?: T; emitted: boolean; error?: unknown } = { emitted: false };
    obs.subscribe({
      next: (v) => {
        resultado.value = v;
        resultado.emitted = true;
      },
      error: (e) => (resultado.error = e),
    });
    return resultado;
  }

  describe.each(recursos)('$nombre', ({ nombre, servicio, create, update }) => {
    // Las pruebas son genéricas: solo usan la API de WritableApiService.
    const svc = () => TestBed.inject(servicio) as unknown as WritableApiService<unknown, unknown, unknown>;

    it('create: POST con el payload y devuelve data', () => {
      const r = capturar(svc().create(create));
      const req = http.expectOne(`${BASE}/${nombre}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(create);
      req.flush(envelope({ id: 7, ...create }, 201));
      expect(r.value).toEqual({ id: 7, ...create });
    });

    it('update: PATCH con el id y el cuerpo parcial', () => {
      const r = capturar(svc().update(5, update));
      const req = http.expectOne(`${BASE}/${nombre}/5`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(update);
      req.flush(envelope({ id: 5, ...update }));
      expect(r.value).toEqual({ id: 5, ...update });
    });

    it('remove: DELETE con el id y emite void', () => {
      const r = capturar(svc().remove(5));
      const req = http.expectOne(`${BASE}/${nombre}/5`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.body).toBeNull();
      req.flush(envelope([], 200));
      expect(r.emitted).toBe(true);
      expect(r.value).toBeUndefined();
    });
  });

  describe('prestamo.devolver', () => {
    it('sin payload manda {}', () => {
      const r = capturar(TestBed.inject(PrestamoService).devolver(4));
      const req = http.expectOne(`${BASE}/prestamo/4/devolucion`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(envelope({ id: 4 }));
      expect(r.value).toEqual({ id: 4 });
    });

    it('con payload manda equipos y observaciones', () => {
      const payload = { equipos: [3], observaciones: null };
      capturar(TestBed.inject(PrestamoService).devolver(4, payload));
      const req = http.expectOne(`${BASE}/prestamo/4/devolucion`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(envelope({ id: 4 }));
    });
  });

  describe('errores', () => {
    function fallar(obs: Observable<unknown>, url: string, method: string, status: number, body: unknown) {
      const r = capturar(obs);
      const req = http.expectOne(url);
      expect(req.request.method).toBe(method);
      req.flush(body as object | string, { status, statusText: 'x' });
      return r.error;
    }

    it('422 con mapa de errores: ApiError con fieldErrors', () => {
      const data = { 'equipos.0': ['El equipo seleccionado no existe o no está disponible.'] };
      const err = fallar(
        TestBed.inject(PrestamoService).create(prestamoCreate),
        `${BASE}/prestamo`,
        'POST',
        422,
        envelope(data, 422, true, 'Los datos enviados no son válidos'),
      );
      expect(err).toBeInstanceOf(ApiError);
      expect(err).not.toBeInstanceOf(HttpErrorResponse);
      const e = err as ApiError;
      expect(e.status).toBe(422);
      expect(e.message).toBe('Los datos enviados no son válidos');
      expect(e.fieldErrors).toEqual(data);
    });

    it('422 con data [] (carrera): ApiError sin fieldErrors', () => {
      const err = fallar(
        TestBed.inject(PrestamoService).create(prestamoCreate),
        `${BASE}/prestamo`,
        'POST',
        422,
        envelope([], 422, true, 'Uno o más equipos ya no están disponibles'),
      ) as ApiError;
      expect(err).toBeInstanceOf(ApiError);
      expect(err.status).toBe(422);
      expect(err.message).toBe('Uno o más equipos ya no están disponibles');
      expect(err.fieldErrors).toBeUndefined();
    });

    it('409 al modificar un equipo prestado', () => {
      const err = fallar(
        TestBed.inject(EquipoService).update(1, { nombre: 'Nuevo' }),
        `${BASE}/equipo/1`,
        'PATCH',
        409,
        envelope([], 409, true, 'No se puede modificar un equipo que está prestado'),
      ) as ApiError;
      expect(err).toBeInstanceOf(ApiError);
      expect(err.status).toBe(409);
      expect(err.fieldErrors).toBeUndefined();
    });

    it('409 al eliminar un alumno con préstamos', () => {
      const err = fallar(
        TestBed.inject(AlumnoService).remove(1),
        `${BASE}/alumno/1`,
        'DELETE',
        409,
        envelope([], 409, true, 'No se puede eliminar un alumno con préstamos registrados'),
      ) as ApiError;
      expect(err).toBeInstanceOf(ApiError);
      expect(err.status).toBe(409);
    });

    it('404 al eliminar un recurso inexistente', () => {
      const err = fallar(
        TestBed.inject(PrestamoService).remove(999999),
        `${BASE}/prestamo/999999`,
        'DELETE',
        404,
        envelope([], 404, true, 'Recurso no encontrado'),
      ) as ApiError;
      expect(err).toBeInstanceOf(ApiError);
      expect(err.status).toBe(404);
      expect(err.message).toBe('Recurso no encontrado');
    });

    it('404 en devolución de un préstamo inexistente', () => {
      const err = fallar(
        TestBed.inject(PrestamoService).devolver(999999),
        `${BASE}/prestamo/999999/devolucion`,
        'POST',
        404,
        envelope([], 404, true, 'Recurso no encontrado'),
      ) as ApiError;
      expect(err.status).toBe(404);
    });

    it('error de red (sin cuerpo JSON): ApiError con mensaje genérico', () => {
      const err = fallar(
        TestBed.inject(AvisoService).remove(1),
        `${BASE}/aviso/1`,
        'DELETE',
        500,
        'Internal error',
      ) as ApiError;
      expect(err).toBeInstanceOf(ApiError);
      expect(err.status).toBe(500);
      expect(err.fieldErrors).toBeUndefined();
    });
  });
});
