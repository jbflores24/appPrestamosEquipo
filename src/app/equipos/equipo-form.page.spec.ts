import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { of, throwError } from 'rxjs';
import { ApiError } from '../core/api/api-error';
import { Equipo } from '../core/models/equipo';
import { EquipoService } from '../core/services/equipo.service';
import { EquipoFormPage } from './equipo-form.page';

const equipo = (estado: Equipo['estado']): Equipo => ({
  id: 1,
  codigo: 'EQ-001',
  nombre: 'Laptop Dell Latitude',
  tipo: 'Laptop',
  estado,
  created_at: '2026-10-11T12:10:59.000000Z',
  updated_at: '2026-10-11T12:10:59.000000Z',
});

describe('EquipoFormPage: errores del servidor al editar', () => {
  const servicio = { get: vi.fn(), create: vi.fn(), update: vi.fn() };
  const toast = { create: vi.fn().mockResolvedValue({ present: vi.fn() }) };

  function crearEdicion(estado: Equipo['estado']) {
    servicio.get.mockReturnValue(of(equipo(estado)));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: EquipoService, useValue: servicio },
        { provide: ToastController, useValue: toast },
      ],
    });
    const fixture = TestBed.createComponent(EquipoFormPage);
    fixture.componentRef.setInput('id', '1');
    fixture.detectChanges(); // ejecuta ngOnInit y precarga con get(1)
    return fixture.componentInstance;
  }

  beforeEach(() => vi.clearAllMocks());

  it('precarga el formulario con get(id)', () => {
    const page = crearEdicion('disponible');
    expect(servicio.get).toHaveBeenCalledWith(1);
    expect(page.form.getRawValue()).toEqual({
      codigo: 'EQ-001',
      nombre: 'Laptop Dell Latitude',
      tipo: 'Laptop',
      estado: 'disponible',
    });
    expect(page.prestado()).toBe(false);
  });

  it('409 al editar un equipo prestado: muestra el mensaje del servidor y no envía el estado', () => {
    const mensaje = 'No se puede modificar un equipo que está prestado';
    servicio.update.mockReturnValue(throwError(() => new ApiError(409, mensaje)));
    const page = crearEdicion('prestado');
    expect(page.prestado()).toBe(true);

    page.guardar();

    expect(servicio.update).toHaveBeenCalledWith(1, {
      codigo: 'EQ-001',
      nombre: 'Laptop Dell Latitude',
      tipo: 'Laptop',
    });
    expect(page.errorGeneral()).toBe(mensaje);
    expect(page.guardando()).toBe(false);
  });

  it('422 con fieldErrors marca el código repetido en el campo', () => {
    servicio.update.mockReturnValue(
      throwError(() => new ApiError(422, 'Los datos enviados no son válidos', { codigo: ['El valor de código ya está registrado.'] })),
    );
    const page = crearEdicion('disponible');

    page.guardar();

    expect(page.form.controls.codigo.errors).toEqual({ server: 'El valor de código ya está registrado.' });
    expect(page.errorGeneral()).toBeNull();
  });

  it('422 sin fieldErrors muestra un mensaje general', () => {
    servicio.update.mockReturnValue(throwError(() => new ApiError(422, 'Uno o más equipos ya no están disponibles')));
    const page = crearEdicion('disponible');

    page.guardar();

    expect(page.errorGeneral()).toBe('Uno o más equipos ya no están disponibles');
  });

  it('404 al guardar lleva a /no-encontrado con volver=/equipos', () => {
    servicio.update.mockReturnValue(throwError(() => new ApiError(404, 'Recurso no encontrado')));
    const page = crearEdicion('disponible');
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    page.guardar();

    expect(navegar).toHaveBeenCalledWith(['/no-encontrado'], { queryParams: { volver: '/equipos' }, replaceUrl: true });
  });
});
