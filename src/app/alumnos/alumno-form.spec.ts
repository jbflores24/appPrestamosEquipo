import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { applyServerErrors } from '../core/forms/apply-server-errors';
import { crearFormAlumno } from './alumno-form';

describe('formulario de alumnos', () => {
  const crear = () => crearFormAlumno(TestBed.inject(FormBuilder));
  const valido = { matricula: '20240099', nombre: 'Ana Pérez', carrera: 'Sistemas' };

  it('es válido con datos correctos', () => {
    const form = crear();
    form.setValue(valido);
    expect(form.valid).toBe(true);
  });

  it('nombre, carrera y matrícula son obligatorios (también si solo hay espacios)', () => {
    const form = crear();
    expect(form.controls.matricula.errors).toEqual({ required: true });
    expect(form.controls.nombre.errors).toEqual({ required: true });
    expect(form.controls.carrera.errors).toEqual({ required: true });

    form.setValue({ matricula: '   ', nombre: '   ', carrera: '   ' });
    expect(form.controls.matricula.hasError('required')).toBe(true);
    expect(form.controls.nombre.hasError('required')).toBe(true);
    expect(form.controls.carrera.hasError('required')).toBe(true);
  });

  it('nombre y carrera: mínimo 3 y máximo 150 caracteres', () => {
    const form = crear();
    form.patchValue({ nombre: 'ab', carrera: 'ab' });
    expect(form.controls.nombre.hasError('minlength')).toBe(true);
    expect(form.controls.carrera.hasError('minlength')).toBe(true);

    form.patchValue({ nombre: 'abc', carrera: 'abc' });
    expect(form.controls.nombre.errors).toBeNull();
    expect(form.controls.carrera.errors).toBeNull();

    form.patchValue({ nombre: 'a'.repeat(150), carrera: 'a'.repeat(150) });
    expect(form.controls.nombre.errors).toBeNull();
    form.patchValue({ nombre: 'a'.repeat(151), carrera: 'a'.repeat(151) });
    expect(form.controls.nombre.hasError('maxlength')).toBe(true);
    expect(form.controls.carrera.hasError('maxlength')).toBe(true);
  });

  it('matrícula: máximo 20 caracteres', () => {
    const form = crear();
    form.patchValue({ matricula: '1'.repeat(20) });
    expect(form.controls.matricula.errors).toBeNull();
    form.patchValue({ matricula: '1'.repeat(21) });
    expect(form.controls.matricula.hasError('maxlength')).toBe(true);
  });

  it('un 422 del servidor marca la matrícula repetida y el error se limpia al editar', () => {
    const form = crear();
    form.setValue(valido);
    const sueltos = applyServerErrors(form, { matricula: ['El valor de matrícula ya está registrado.'] });
    expect(sueltos).toEqual([]);
    expect(form.controls.matricula.errors).toEqual({ server: 'El valor de matrícula ya está registrado.' });
    expect(form.controls.matricula.touched).toBe(true);

    form.controls.matricula.setValue('20240100');
    expect(form.controls.matricula.errors).toBeNull();
  });
});
