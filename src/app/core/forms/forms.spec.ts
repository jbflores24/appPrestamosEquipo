import { FormControl, FormGroup, Validators } from '@angular/forms';
import { applyServerErrors } from './apply-server-errors';
import { fechaIso, fechaNoAnterior, hoyIso, textoRequerido } from './validators';

describe('validators', () => {
  it('textoRequerido rechaza solo espacios', () => {
    expect(textoRequerido(new FormControl('   '))).toEqual({ required: true });
    expect(textoRequerido(new FormControl(' ab '))).toBeNull();
  });

  it('fechaIso acepta fechas reales YYYY-MM-DD y rechaza el resto', () => {
    expect(fechaIso(new FormControl('2026-10-11'))).toBeNull();
    expect(fechaIso(new FormControl('2026-02-30'))).toEqual({ fechaIso: true });
    expect(fechaIso(new FormControl('11/10/2026'))).toEqual({ fechaIso: true });
    expect(fechaIso(new FormControl(''))).toBeNull();
  });

  it('hoyIso devuelve el formato YYYY-MM-DD', () => {
    expect(hoyIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('applyServerErrors', () => {
  const crear = () =>
    new FormGroup({
      titulo: new FormControl('abc', Validators.required),
      fecha: new FormControl('2026-10-11'),
    });

  it('marca cada control con su mensaje y lo deja touched', () => {
    const form = crear();
    const sueltos = applyServerErrors(form, { titulo: ['Primero.', 'Segundo.'] });
    expect(sueltos).toEqual([]);
    expect(form.controls.titulo.errors).toEqual({ server: 'Primero. Segundo.' });
    expect(form.controls.titulo.touched).toBe(true);
    expect(form.controls.fecha.errors).toBeNull();
  });

  it('devuelve los mensajes de claves sin control', () => {
    const form = crear();
    expect(applyServerErrors(form, { 'equipos.0': ['No disponible.'] })).toEqual(['No disponible.']);
  });

  it('el error del servidor desaparece al editar el campo', () => {
    const form = crear();
    applyServerErrors(form, { titulo: ['Ya existe.'] });
    form.controls.titulo.setValue('otro valor');
    expect(form.controls.titulo.errors).toBeNull();
  });
});

describe('fechaNoAnterior y hoyIso con días', () => {
  const grupo = (salida: string, devolucion: string) => {
    const g = new FormGroup({
      fecha_salida: new FormControl(salida),
      fecha_devolucion_esperada: new FormControl(devolucion, fechaNoAnterior('fecha_salida')),
    });
    // Al crearse, el control aún no tenía padre: se vuelve a validar ya dentro del grupo.
    g.controls.fecha_devolucion_esperada.updateValueAndValidity();
    return g;
  };

  it('rechaza una devolución anterior a la salida y acepta la misma fecha o una posterior', () => {
    expect(grupo('2026-10-10', '2026-10-09').controls.fecha_devolucion_esperada.errors).toEqual({ fechaAnterior: true });
    expect(grupo('2026-10-10', '2026-10-10').controls.fecha_devolucion_esperada.errors).toBeNull();
    expect(grupo('2026-10-10', '2026-10-11').controls.fecha_devolucion_esperada.errors).toBeNull();
  });

  it('no opina si alguna fecha está vacía o mal formada (lo reporta fechaIso)', () => {
    expect(grupo('', '2026-10-09').controls.fecha_devolucion_esperada.errors).toBeNull();
    expect(grupo('2026-10-10', 'x').controls.fecha_devolucion_esperada.errors).toBeNull();
  });

  it('hoyIso(7) es una semana después de hoyIso()', () => {
    const [a, b] = [hoyIso(), hoyIso(7)].map((f) => new Date(f + 'T00:00:00').getTime());
    expect(Math.round((b - a) / 86_400_000)).toBe(7);
  });
});

describe('applyServerErrors con claves de arreglo', () => {
  it('asigna equipos.0, equipos.1 al control equipos, sin repetir el mensaje', () => {
    const form = new FormGroup({ equipos: new FormControl<number[]>([3, 4]) });
    const mensaje = 'El equipo seleccionado no existe o no está disponible.';
    const sueltos = applyServerErrors(form, { 'equipos.0': [mensaje], 'equipos.1': [mensaje] });
    expect(sueltos).toEqual([]);
    expect(form.controls.equipos.errors).toEqual({ server: mensaje });
    expect(form.controls.equipos.touched).toBe(true);
  });

  it('una clave sin control ni base sigue devolviéndose como mensaje suelto', () => {
    const form = new FormGroup({ equipos: new FormControl<number[]>([]) });
    expect(applyServerErrors(form, { otra: ['Algo.'] })).toEqual(['Algo.']);
  });
});
