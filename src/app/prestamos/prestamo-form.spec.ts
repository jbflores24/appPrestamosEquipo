import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { crearFormDevolucion, crearFormPrestamo } from './prestamo-form';

describe('formulario de préstamos', () => {
  const crear = () => crearFormPrestamo(TestBed.inject(FormBuilder));

  it('empieza con fechas por defecto, sin alumno ni equipos, y es inválido', () => {
    const form = crear();
    const v = form.getRawValue();
    expect(v.alumno_id).toBeNull();
    expect(v.equipos).toEqual([]);
    expect(v.fecha_salida).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(v.fecha_devolucion_esperada >= v.fecha_salida).toBe(true);
    expect(form.invalid).toBe(true);
  });

  it('es válido con alumno, fechas coherentes y al menos un equipo', () => {
    const form = crear();
    form.patchValue({ alumno_id: 1, fecha_salida: '2026-10-11', fecha_devolucion_esperada: '2026-10-15', equipos: [3] });
    expect(form.valid).toBe(true);
  });

  it('alumno y equipos son obligatorios (equipos necesita al menos uno)', () => {
    const form = crear();
    expect(form.controls.alumno_id.hasError('required')).toBe(true);
    expect(form.controls.equipos.hasError('required')).toBe(true);
    form.patchValue({ equipos: [4] });
    expect(form.controls.equipos.errors).toBeNull();
  });

  it('las fechas son obligatorias y deben tener formato YYYY-MM-DD', () => {
    const form = crear();
    form.patchValue({ fecha_salida: '', fecha_devolucion_esperada: '' });
    expect(form.controls.fecha_salida.hasError('required')).toBe(true);
    expect(form.controls.fecha_devolucion_esperada.hasError('required')).toBe(true);
    form.patchValue({ fecha_salida: '11/10/2026', fecha_devolucion_esperada: '2026-02-30' });
    expect(form.controls.fecha_salida.hasError('fechaIso')).toBe(true);
    expect(form.controls.fecha_devolucion_esperada.hasError('fechaIso')).toBe(true);
  });

  it('la devolución no puede ser anterior a la salida; la misma fecha es válida', () => {
    const form = crear();
    form.patchValue({ fecha_salida: '2026-10-10', fecha_devolucion_esperada: '2026-10-09' });
    expect(form.controls.fecha_devolucion_esperada.hasError('fechaAnterior')).toBe(true);
    form.patchValue({ fecha_devolucion_esperada: '2026-10-10' });
    expect(form.controls.fecha_devolucion_esperada.errors).toBeNull();
  });

  it('al mover la salida después de la devolución, la devolución se vuelve a validar', () => {
    const form = crear();
    form.patchValue({ fecha_salida: '2026-10-10', fecha_devolucion_esperada: '2026-10-12' });
    expect(form.controls.fecha_devolucion_esperada.errors).toBeNull();
    form.controls.fecha_salida.setValue('2026-10-20');
    expect(form.controls.fecha_devolucion_esperada.hasError('fechaAnterior')).toBe(true);
  });

  it('en edición el control equipos deshabilitado no cuenta para la validez', () => {
    const form = crear();
    form.controls.equipos.disable();
    form.patchValue({ alumno_id: 2, fecha_salida: '2026-10-11', fecha_devolucion_esperada: '2026-10-12' });
    expect(form.valid).toBe(true);
  });
});

describe('formulario de devolución', () => {
  const crear = () => crearFormDevolucion(TestBed.inject(FormBuilder));

  it('es válido vacío (devuelve todos) y las observaciones admiten hasta 255 caracteres', () => {
    const form = crear();
    expect(form.valid).toBe(true);
    form.controls.observaciones.setValue('a'.repeat(255));
    expect(form.valid).toBe(true);
    form.controls.observaciones.setValue('a'.repeat(256));
    expect(form.controls.observaciones.hasError('maxlength')).toBe(true);
  });
});
