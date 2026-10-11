import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { of, throwError } from 'rxjs';
import { ApiError } from '../core/api/api-error';
import { Page } from '../core/api/api.models';
import { DetallePrestamo } from '../core/models/detalle-prestamo';
import { Prestamo } from '../core/models/prestamo';
import { PrestamoService } from '../core/services/prestamo.service';
import { PrestamoListPage } from './prestamo-list.page';

const sello = { created_at: '2026-10-11T12:00:00.000000Z', updated_at: '2026-10-11T12:00:00.000000Z' };
const detalle = (id: number, real: string | null): DetallePrestamo => ({
  id,
  prestamo_id: 1,
  equipo_id: id,
  fecha_devolucion_real: real,
  observaciones: null,
  dias_retraso: 0,
});
const prestamo: Prestamo = {
  id: 1,
  alumno_id: 1,
  alumno: { id: 1, matricula: '20240001', nombre: 'Ana Martínez Peña', carrera: 'Sistemas', ...sello },
  fecha_salida: '2026-10-01',
  fecha_devolucion_esperada: '2026-10-05',
  detalles: [detalle(1, null), detalle(2, null), detalle(3, '2026-10-03')],
  ...sello,
};
const pagina: Page<Prestamo> = { items: [prestamo], pagination: { current_page: 1, last_page: 1, per_page: 15, total: 1 } };

describe('PrestamoListPage', () => {
  const toastPresent = vi.fn().mockResolvedValue(undefined);
  const toastCreate = vi.fn().mockResolvedValue({ present: toastPresent });
  const servicio = { list: vi.fn(), remove: vi.fn() };

  function crear() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: PrestamoService, useValue: servicio },
        { provide: ToastController, useValue: { create: toastCreate } },
      ],
    });
    return TestBed.createComponent(PrestamoListPage).componentInstance;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    servicio.list.mockReturnValue(of(pagina));
  });

  it('cuenta los equipos pendientes (fecha de devolución real nula)', () => {
    const page = crear();
    expect(page.pendientes(prestamo)).toBe(2);
    expect(page.pendientes({ ...prestamo, detalles: [detalle(1, '2026-10-02')] })).toBe(0);
    expect(page.pendientes({ ...prestamo, detalles: undefined })).toBe(0);
  });

  it('carga el listado en el orden de la API y guarda la paginación', () => {
    const page = crear();
    page.cargar(1);
    expect(servicio.list).toHaveBeenCalledWith(1);
    expect(page.items()).toEqual([prestamo]);
    expect(page.pagination()?.total).toBe(1);
  });

  it('irADevolucion navega a /prestamos/:id/devolucion sin abrir la edición', () => {
    const page = crear();
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const evento = { preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as Event;

    page.irADevolucion(prestamo, evento);

    expect(evento.stopPropagation).toHaveBeenCalled();
    expect(navegar).toHaveBeenCalledWith(['/prestamos', 1, 'devolucion']);
  });

  it('borrar con 200 confirma y recarga', async () => {
    servicio.remove.mockReturnValue(of(undefined));
    const page = crear();
    page.borrar(prestamo);
    await vi.waitFor(() => expect(toastCreate).toHaveBeenCalled());
    expect(servicio.remove).toHaveBeenCalledWith(1);
    expect(toastCreate.mock.calls[0][0]).toMatchObject({ message: 'Préstamo eliminado', color: 'success', position: 'bottom' });
    expect(servicio.list).toHaveBeenCalledTimes(1);
  });

  it('borrar con 404 avisa que ya no existe', async () => {
    servicio.remove.mockReturnValue(throwError(() => new ApiError(404, 'Recurso no encontrado')));
    const page = crear();
    page.borrar(prestamo);
    await vi.waitFor(() => expect(toastCreate).toHaveBeenCalled());
    expect(toastCreate.mock.calls[0][0]).toMatchObject({ message: 'El préstamo ya no existe', color: 'danger', position: 'top' });
  });

  it('otro error muestra el mensaje del servidor tal cual', async () => {
    servicio.remove.mockReturnValue(throwError(() => new ApiError(500, 'No se pudo eliminar el préstamo')));
    const page = crear();
    page.borrar(prestamo);
    await vi.waitFor(() => expect(toastCreate).toHaveBeenCalled());
    expect(toastCreate.mock.calls[0][0]).toMatchObject({ message: 'No se pudo eliminar el préstamo', color: 'danger' });
  });
});
