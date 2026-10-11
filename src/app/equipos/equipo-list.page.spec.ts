import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { of, throwError } from 'rxjs';
import { ApiError } from '../core/api/api-error';
import { Page } from '../core/api/api.models';
import { Equipo } from '../core/models/equipo';
import { EquipoService } from '../core/services/equipo.service';
import { EquipoListPage } from './equipo-list.page';

const equipo: Equipo = {
  id: 1,
  codigo: 'EQ-001',
  nombre: 'Laptop Dell Latitude',
  tipo: 'Laptop',
  estado: 'prestado',
  created_at: '2026-10-11T12:10:59.000000Z',
  updated_at: '2026-10-11T12:10:59.000000Z',
};

const pagina: Page<Equipo> = {
  items: [equipo],
  pagination: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
};

describe('EquipoListPage: borrado', () => {
  const toastPresent = vi.fn().mockResolvedValue(undefined);
  const toastCreate = vi.fn().mockResolvedValue({ present: toastPresent });
  const servicio = { list: vi.fn(), remove: vi.fn() };

  function crear() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: EquipoService, useValue: servicio },
        { provide: ToastController, useValue: { create: toastCreate } },
      ],
    });
    return TestBed.createComponent(EquipoListPage).componentInstance;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    servicio.list.mockReturnValue(of(pagina));
  });

  it('409: muestra el mensaje del servidor arriba (sin tapar el botón flotante) y recarga', async () => {
    const mensaje = 'No se puede eliminar un equipo con préstamos registrados';
    servicio.remove.mockReturnValue(throwError(() => new ApiError(409, mensaje)));
    const page = crear();

    page.borrar(equipo);
    await vi.waitFor(() => expect(toastCreate).toHaveBeenCalled());

    expect(servicio.remove).toHaveBeenCalledWith(1);
    expect(toastCreate.mock.calls[0][0]).toMatchObject({ message: mensaje, color: 'danger', position: 'top' });
    expect(toastPresent).toHaveBeenCalled();
    expect(servicio.list).toHaveBeenCalledTimes(1);
  });

  it('404: avisa que el equipo ya no existe', async () => {
    servicio.remove.mockReturnValue(throwError(() => new ApiError(404, 'Recurso no encontrado')));
    const page = crear();

    page.borrar(equipo);
    await vi.waitFor(() => expect(toastCreate).toHaveBeenCalled());

    expect(toastCreate.mock.calls[0][0]).toMatchObject({ message: 'El equipo ya no existe', color: 'danger' });
  });

  it('200: confirma con un toast de éxito abajo y recarga', async () => {
    servicio.remove.mockReturnValue(of(undefined));
    const page = crear();

    page.borrar(equipo);
    await vi.waitFor(() => expect(toastCreate).toHaveBeenCalled());

    expect(toastCreate.mock.calls[0][0]).toMatchObject({ message: 'Equipo eliminado', color: 'success', position: 'bottom' });
    expect(servicio.list).toHaveBeenCalledTimes(1);
  });
});
