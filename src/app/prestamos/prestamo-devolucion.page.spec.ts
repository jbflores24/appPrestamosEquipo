import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { of, throwError } from 'rxjs';
import { ApiError } from '../core/api/api-error';
import { DetallePrestamo } from '../core/models/detalle-prestamo';
import { Prestamo } from '../core/models/prestamo';
import { PrestamoService } from '../core/services/prestamo.service';
import { PrestamoDevolucionPage } from './prestamo-devolucion.page';

const sello = { created_at: '2026-10-11T12:00:00.000000Z', updated_at: '2026-10-11T12:00:00.000000Z' };
const detalle = (id: number, real: string | null): DetallePrestamo => ({
  id,
  prestamo_id: 1,
  equipo_id: id + 10,
  fecha_devolucion_real: real,
  observaciones: null,
  dias_retraso: 0,
});
const prestamo = (detalles: DetallePrestamo[]): Prestamo => ({
  id: 1,
  alumno_id: 1,
  fecha_salida: '2026-10-01',
  fecha_devolucion_esperada: '2026-10-05',
  detalles,
  ...sello,
});

describe('PrestamoDevolucionPage', () => {
  const servicio = { get: vi.fn(), devolver: vi.fn() };
  const toast = { create: vi.fn().mockResolvedValue({ present: vi.fn() }) };

  function configurar() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: PrestamoService, useValue: servicio },
        { provide: ToastController, useValue: toast },
      ],
    });
  }

  function crear(detalles: DetallePrestamo[]) {
    servicio.get.mockReturnValue(of(prestamo(detalles)));
    configurar();
    const fixture = TestBed.createComponent(PrestamoDevolucionPage);
    fixture.componentRef.setInput('id', '1');
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  beforeEach(() => vi.clearAllMocks());

  it('muestra solo los equipos pendientes', () => {
    const page = crear([detalle(1, null), detalle(2, '2026-10-03'), detalle(3, null)]);
    expect(servicio.get).toHaveBeenCalledWith(1);
    expect(page.pendientes().map((d) => d.equipo_id)).toEqual([11, 13]);
  });

  it('sin equipos marcados ni observaciones envía el cuerpo vacío (devuelve todos)', () => {
    servicio.devolver.mockReturnValue(of(prestamo([])));
    const page = crear([detalle(1, null), detalle(3, null)]);
    expect(page.textoBoton()).toBe('Devolver todos los pendientes');

    page.guardar();

    expect(servicio.devolver).toHaveBeenCalledWith(1, undefined);
  });

  it('con equipos marcados envía solo esos y las observaciones sin espacios sobrantes', () => {
    servicio.devolver.mockReturnValue(of(prestamo([])));
    const page = crear([detalle(1, null), detalle(3, null)]);
    page.alternar(11, true);
    page.form.controls.observaciones.setValue('  Buen estado  ');
    expect(page.textoBoton()).toBe('Devolver 1 equipo');

    page.guardar();

    expect(servicio.devolver).toHaveBeenCalledWith(1, { equipos: [11], observaciones: 'Buen estado' });
  });

  it('seleccionar todos marca todos los pendientes y volver a pulsar los quita', () => {
    const page = crear([detalle(1, null), detalle(3, null)]);
    page.alternarTodos();
    expect(page.seleccionados()).toEqual([11, 13]);
    expect(page.todosMarcados()).toBe(true);
    page.alternarTodos();
    expect(page.seleccionados()).toEqual([]);
  });

  it('desmarcar un equipo lo quita de la selección', () => {
    const page = crear([detalle(1, null), detalle(3, null)]);
    page.alternar(11, true);
    page.alternar(13, true);
    page.alternar(11, false);
    expect(page.seleccionados()).toEqual([13]);
    expect(page.form.controls.equipos.value).toEqual([13]);
  });

  it('observaciones de más de 255 caracteres bloquean el envío', () => {
    const page = crear([detalle(1, null)]);
    page.form.controls.observaciones.setValue('a'.repeat(256));
    page.guardar();
    expect(servicio.devolver).not.toHaveBeenCalled();
  });

  it('422 con equipos.N muestra el mensaje del servidor en el campo de equipos', () => {
    const mensaje = 'El equipo no pertenece a este préstamo o ya fue devuelto.';
    servicio.devolver.mockReturnValue(
      throwError(() => new ApiError(422, 'Los datos enviados no son válidos', { 'equipos.0': [mensaje] })),
    );
    const page = crear([detalle(1, null)]);
    page.alternar(11, true);

    page.guardar();

    expect(page.form.controls.equipos.errors).toEqual({ server: mensaje });
    expect(page.errorGeneral()).toBeNull();
    page.alternar(11, false); // al cambiar la selección el error se limpia
    expect(page.form.controls.equipos.errors).toBeNull();
  });

  it('404 lleva a /no-encontrado con volver=/prestamos', () => {
    servicio.get.mockReturnValue(throwError(() => new ApiError(404, 'Recurso no encontrado')));
    configurar();
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(PrestamoDevolucionPage);
    fixture.componentRef.setInput('id', '1');
    fixture.detectChanges();

    expect(navegar).toHaveBeenCalledWith(['/no-encontrado'], { queryParams: { volver: '/prestamos' }, replaceUrl: true });
  });

  it('sin equipos pendientes no hay nada que devolver', () => {
    const page = crear([detalle(1, '2026-10-02')]);
    expect(page.pendientes()).toEqual([]);
    expect(page.todosMarcados()).toBe(false);
  });

  describe('sección Devueltos', () => {
    const conEquipo = (id: number, real: string | null, retraso: number, obs: string | null): DetallePrestamo => ({
      ...detalle(id, real),
      dias_retraso: retraso,
      observaciones: obs,
      equipo: { id: id + 10, codigo: `EQ-0${id}`, nombre: `Equipo ${id}`, tipo: 'Tipo', estado: 'disponible', ...sello },
    });

    function renderizar(detalles: DetallePrestamo[]) {
      servicio.get.mockReturnValue(of(prestamo(detalles)));
      configurar();
      const fixture = TestBed.createComponent(PrestamoDevolucionPage);
      fixture.componentRef.setInput('id', '1');
      fixture.detectChanges();
      return { page: fixture.componentInstance, texto: (fixture.nativeElement as HTMLElement).textContent ?? '' };
    }

    it('muestra código, nombre, fecha real, retraso y observaciones de cada equipo devuelto, sin otra llamada', () => {
      const { page, texto } = renderizar([
        conEquipo(1, null, 6, null),
        conEquipo(2, '2026-10-11', 6, 'Entregado con retraso'),
        conEquipo(3, '2026-10-05', 0, null),
      ]);

      expect(page.devueltos().map((d) => d.equipo_id)).toEqual([12, 13]);
      expect(servicio.get).toHaveBeenCalledTimes(1);
      expect(texto).toContain('Devueltos');
      expect(texto).toContain('Equipo 2 (EQ-02)');
      expect(texto).toContain('2026-10-11');
      expect(texto).toContain('6 días de retraso');
      expect(texto).toContain('Entregado con retraso');
      expect(texto).toContain('Equipo 3 (EQ-03)');
      expect(texto).toContain('Sin retraso');
    });

    it('si no hay equipos devueltos no muestra la sección', () => {
      const { page, texto } = renderizar([conEquipo(1, null, 0, null)]);
      expect(page.devueltos()).toEqual([]);
      expect(texto).not.toContain('Devueltos');
    });

    it('también aparece cuando ya no quedan pendientes', () => {
      const { texto } = renderizar([conEquipo(1, '2026-10-02', 0, null)]);
      expect(texto).toContain('Todo devuelto');
      expect(texto).toContain('Devueltos');
    });

    it('textoRetraso usa singular, plural y "Sin retraso"', () => {
      const { page } = renderizar([conEquipo(1, '2026-10-02', 0, null)]);
      expect(page.textoRetraso(0)).toBe('Sin retraso');
      expect(page.textoRetraso(1)).toBe('1 día de retraso');
      expect(page.textoRetraso(3)).toBe('3 días de retraso');
    });
  });
});
