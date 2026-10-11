import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { applyServerErrors } from '../core/forms/apply-server-errors';
import { crearFormEquipo } from './equipo-form';

describe('formulario de equipos', () => {
  const crear = () => crearFormEquipo(TestBed.inject(FormBuilder));
  const valido = { codigo: 'EQ-100', nombre: 'Laptop HP', tipo: 'Laptop', estado: 'disponible' as const };

  it('es válido con datos correctos y el estado por defecto es disponible', () => {
    const form = crear();
    expect(form.controls.estado.value).toBe('disponible');
    form.patchValue(valido);
    expect(form.valid).toBe(true);
  });

  it('código, nombre y tipo son obligatorios (también si solo hay espacios)', () => {
    const form = crear();
    expect(form.controls.codigo.errors).toEqual({ required: true });
    expect(form.controls.nombre.errors).toEqual({ required: true });
    expect(form.controls.tipo.errors).toEqual({ required: true });

    form.patchValue({ codigo: '  ', nombre: '  ', tipo: '  ' });
    expect(form.controls.codigo.hasError('required')).toBe(true);
    expect(form.controls.nombre.hasError('required')).toBe(true);
    expect(form.controls.tipo.hasError('required')).toBe(true);
  });

  it('código: máximo 30 caracteres', () => {
    const form = crear();
    form.patchValue({ codigo: 'a'.repeat(30) });
    expect(form.controls.codigo.errors).toBeNull();
    form.patchValue({ codigo: 'a'.repeat(31) });
    expect(form.controls.codigo.hasError('maxlength')).toBe(true);
  });

  it('nombre: 3 a 150 caracteres', () => {
    const form = crear();
    form.patchValue({ nombre: 'ab' });
    expect(form.controls.nombre.hasError('minlength')).toBe(true);
    form.patchValue({ nombre: 'a'.repeat(150) });
    expect(form.controls.nombre.errors).toBeNull();
    form.patchValue({ nombre: 'a'.repeat(151) });
    expect(form.controls.nombre.hasError('maxlength')).toBe(true);
  });

  it('tipo: 3 a 80 caracteres', () => {
    const form = crear();
    form.patchValue({ tipo: 'ab' });
    expect(form.controls.tipo.hasError('minlength')).toBe(true);
    form.patchValue({ tipo: 'a'.repeat(80) });
    expect(form.controls.tipo.errors).toBeNull();
    form.patchValue({ tipo: 'a'.repeat(81) });
    expect(form.controls.tipo.hasError('maxlength')).toBe(true);
  });

  it('un 422 marca el código repetido y el error se limpia al editar', () => {
    const form = crear();
    form.patchValue(valido);
    const sueltos = applyServerErrors(form, { codigo: ['El valor de código ya está registrado.'] });
    expect(sueltos).toEqual([]);
    expect(form.controls.codigo.errors).toEqual({ server: 'El valor de código ya está registrado.' });
    expect(form.controls.codigo.touched).toBe(true);

    form.controls.codigo.setValue('EQ-101');
    expect(form.controls.codigo.errors).toBeNull();
  });
});
