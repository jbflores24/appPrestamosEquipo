import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { of, throwError } from 'rxjs';
import { ApiError } from '../core/api/api-error';
import { Page } from '../core/api/api.models';
import { Alumno } from '../core/models/alumno';
import { AlumnoService } from '../core/services/alumno.service';
import { AlumnoListPage } from './alumno-list.page';

const alumno: Alumno = {
  id: 1,
  matricula: '20240001',
  nombre: 'Ana Martínez Peña',
  carrera: 'Ingeniería en Sistemas',
  created_at: '2026-10-11T12:10:59.000000Z',
  updated_at: '2026-10-11T12:10:59.000000Z',
};

const pagina: Page<Alumno> = {
  items: [alumno],
  pagination: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
};

describe('AlumnoListPage: borrado', () => {
  const toastPresent = vi.fn().mockResolvedValue(undefined);
  const toastCreate = vi.fn().mockResolvedValue({ present: toastPresent });
  const servicio = { list: vi.fn(), remove: vi.fn() };

  function crear() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AlumnoService, useValue: servicio },
        { provide: ToastController, useValue: { create: toastCreate } },
      ],
    });
    return TestBed.createComponent(AlumnoListPage).componentInstance;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    servicio.list.mockReturnValue(of(pagina));
  });

  it('409: muestra el mensaje del servidor, sin reemplazarlo, y recarga el listado', async () => {
    const mensaje = 'No se puede eliminar un alumno con préstamos registrados';
    servicio.remove.mockReturnValue(throwError(() => new ApiError(409, mensaje)));
    const page = crear();

    page.borrar(alumno);
    await vi.waitFor(() => expect(toastCreate).toHaveBeenCalled());

    expect(servicio.remove).toHaveBeenCalledWith(1);
    expect(toastCreate.mock.calls[0][0]).toMatchObject({ message: mensaje, color: 'danger' });
    expect(toastPresent).toHaveBeenCalled();
    expect(servicio.list).toHaveBeenCalledTimes(1); // recarga tras el error
  });

  it('404: avisa que el alumno ya no existe', async () => {
    servicio.remove.mockReturnValue(throwError(() => new ApiError(404, 'Recurso no encontrado')));
    const page = crear();

    page.borrar(alumno);
    await vi.waitFor(() => expect(toastCreate).toHaveBeenCalled());

    expect(toastCreate.mock.calls[0][0]).toMatchObject({ message: 'El alumno ya no existe', color: 'danger' });
  });

  it('200: confirma con un toast de éxito y recarga', async () => {
    servicio.remove.mockReturnValue(of(undefined));
    const page = crear();

    page.borrar(alumno);
    await vi.waitFor(() => expect(toastCreate).toHaveBeenCalled());

    expect(toastCreate.mock.calls[0][0]).toMatchObject({ message: 'Alumno eliminado', color: 'success' });
    expect(servicio.list).toHaveBeenCalledTimes(1);
  });
});
