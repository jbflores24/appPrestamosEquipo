import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { of, throwError } from 'rxjs';
import { ApiError } from '../core/api/api-error';
import { Page } from '../core/api/api.models';
import { Alumno } from '../core/models/alumno';
import { Equipo } from '../core/models/equipo';
import { Prestamo } from '../core/models/prestamo';
import { AlumnoService } from '../core/services/alumno.service';
import { EquipoService } from '../core/services/equipo.service';
import { PrestamoService } from '../core/services/prestamo.service';
import { PrestamoFormPage } from './prestamo-form.page';

const sello = { created_at: '2026-10-11T12:00:00.000000Z', updated_at: '2026-10-11T12:00:00.000000Z' };
const alumno: Alumno = { id: 1, matricula: '20240001', nombre: 'Ana Martínez Peña', carrera: 'Sistemas', ...sello };
const equipo = (id: number, estado: Equipo['estado']): Equipo => ({ id, codigo: `EQ-00${id}`, nombre: `Equipo ${id}`, tipo: 'Tipo', estado, ...sello });
const pagina = <T,>(items: T[]): Page<T> => ({ items, pagination: { current_page: 1, last_page: 1, per_page: 15, total: items.length } });
const prestamo: Prestamo = { id: 5, alumno_id: 1, fecha_salida: '2026-10-01', fecha_devolucion_esperada: '2026-10-05', ...sello };

describe('PrestamoFormPage', () => {
  const prestamos = { get: vi.fn(), create: vi.fn(), update: vi.fn() };
  const alumnos = { list: vi.fn() };
  const equipos = { list: vi.fn() };
  const toast = { create: vi.fn().mockResolvedValue({ present: vi.fn() }) };

  function crear(id?: string) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: PrestamoService, useValue: prestamos },
        { provide: AlumnoService, useValue: alumnos },
        { provide: EquipoService, useValue: equipos },
        { provide: ToastController, useValue: toast },
      ],
    });
    const fixture = TestBed.createComponent(PrestamoFormPage);
    if (id !== undefined) {
      fixture.componentRef.setInput('id', id);
    }
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    alumnos.list.mockReturnValue(of(pagina([alumno])));
    equipos.list.mockReturnValue(of(pagina([equipo(1, 'prestado'), equipo(3, 'disponible'), equipo(4, 'disponible'), equipo(5, 'mantenimiento')])));
  });

  describe('alta', () => {
    it('carga los alumnos y solo los equipos disponibles', () => {
      const page = crear();
      expect(page.alumnosOpciones().map((a) => a.id)).toEqual([1]);
      expect(page.equiposDisponibles().map((e) => e.id)).toEqual([3, 4]);
      expect(page.cargando()).toBe(false);
    });

    it('el selector muestra "N equipo(s) seleccionado(s)" en lugar de la lista completa', () => {
      const page = crear();
      expect(page.textoEquipos()).toBeUndefined(); // sin selección se ve el texto de ayuda

      page.form.controls.equipos.setValue([3]);
      expect(page.textoEquipos()).toBe('1 equipo seleccionado');

      page.form.controls.equipos.setValue([3, 4]);
      expect(page.textoEquipos()).toBe('2 equipos seleccionados');

      page.form.controls.equipos.setValue([]);
      expect(page.textoEquipos()).toBeUndefined();
    });

    it('no envía nada si el formulario es inválido y marca los campos', () => {
      const page = crear();
      page.guardar();
      expect(prestamos.create).not.toHaveBeenCalled();
      expect(page.form.controls.alumno_id.touched).toBe(true);
      expect(page.form.controls.equipos.touched).toBe(true);
    });

    it('envía alumno, fechas y equipos', () => {
      prestamos.create.mockReturnValue(of(prestamo));
      const page = crear();
      page.form.patchValue({ alumno_id: 1, fecha_salida: '2026-10-11', fecha_devolucion_esperada: '2026-10-15', equipos: [3, 4] });

      page.guardar();

      expect(prestamos.create).toHaveBeenCalledWith({
        alumno_id: 1,
        fecha_salida: '2026-10-11',
        fecha_devolucion_esperada: '2026-10-15',
        equipos: [3, 4],
      });
    });

    it('422 con equipos.N marca el campo equipos con el mensaje del servidor', () => {
      const mensaje = 'El equipo seleccionado no existe o no está disponible.';
      prestamos.create.mockReturnValue(
        throwError(() => new ApiError(422, 'Los datos enviados no son válidos', { 'equipos.0': [mensaje], 'equipos.1': [mensaje] })),
      );
      const page = crear();
      page.form.patchValue({ alumno_id: 1, equipos: [3, 4] });

      page.guardar();

      expect(page.form.controls.equipos.errors).toEqual({ server: mensaje });
      expect(page.errorGeneral()).toBeNull();
    });

    it('422 sin fieldErrors (condición de carrera) muestra un mensaje general y no marca campos', () => {
      prestamos.create.mockReturnValue(throwError(() => new ApiError(422, 'Uno o más equipos ya no están disponibles')));
      const page = crear();
      page.form.patchValue({ alumno_id: 1, equipos: [3] });

      page.guardar();

      expect(page.errorGeneral()).toBe('Uno o más equipos ya no están disponibles');
      expect(page.form.controls.equipos.errors).toBeNull();
      expect(page.form.controls.alumno_id.errors).toBeNull();
    });
  });

  describe('edición', () => {
    beforeEach(() => prestamos.get.mockReturnValue(of(prestamo)));

    it('precarga alumno y fechas, y no usa el campo equipos', () => {
      const page = crear('5');
      expect(prestamos.get).toHaveBeenCalledWith(5);
      expect(page.form.getRawValue()).toMatchObject({ alumno_id: 1, fecha_salida: '2026-10-01', fecha_devolucion_esperada: '2026-10-05' });
      expect(page.form.controls.equipos.disabled).toBe(true);
      expect(equipos.list).not.toHaveBeenCalled();
    });

    it('envía siempre alumno_id y las dos fechas juntas, sin equipos', () => {
      prestamos.update.mockReturnValue(of(prestamo));
      const page = crear('5');
      page.form.patchValue({ fecha_devolucion_esperada: '2026-10-09' });

      page.guardar();

      expect(prestamos.update).toHaveBeenCalledWith(5, {
        alumno_id: 1,
        fecha_salida: '2026-10-01',
        fecha_devolucion_esperada: '2026-10-09',
      });
    });

    it('422 marca el campo con su mensaje', () => {
      prestamos.update.mockReturnValue(
        throwError(() => new ApiError(422, 'No válido', { fecha_devolucion_esperada: ['Debe ser posterior o igual a la salida.'] })),
      );
      const page = crear('5');

      page.guardar();

      expect(page.form.controls.fecha_devolucion_esperada.errors).toEqual({ server: 'Debe ser posterior o igual a la salida.' });
    });

    it('404 al cargar lleva a /no-encontrado con volver=/prestamos', () => {
      prestamos.get.mockReturnValue(throwError(() => new ApiError(404, 'Recurso no encontrado')));
      const navegar = vi.fn().mockResolvedValue(true);
      TestBed.configureTestingModule({
        providers: [
          provideRouter([]),
          { provide: PrestamoService, useValue: prestamos },
          { provide: AlumnoService, useValue: alumnos },
          { provide: EquipoService, useValue: equipos },
          { provide: ToastController, useValue: toast },
        ],
      });
      vi.spyOn(TestBed.inject(Router), 'navigate').mockImplementation(navegar);
      const fixture = TestBed.createComponent(PrestamoFormPage);
      fixture.componentRef.setInput('id', '5');
      fixture.detectChanges();

      expect(navegar).toHaveBeenCalledWith(['/no-encontrado'], { queryParams: { volver: '/prestamos' }, replaceUrl: true });
    });
  });
});
