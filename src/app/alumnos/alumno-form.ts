import { FormBuilder, Validators } from '@angular/forms';
import { textoRequerido } from '../core/forms/validators';

/**
 * Formulario de alumnos con las reglas del backend:
 * matricula obligatoria (máximo 20), nombre y carrera obligatorios (3 a 150 caracteres).
 */
export function crearFormAlumno(fb: FormBuilder) {
  return fb.nonNullable.group({
    matricula: ['', [Validators.required, textoRequerido, Validators.maxLength(20)]],
    nombre: ['', [Validators.required, textoRequerido, Validators.minLength(3), Validators.maxLength(150)]],
    carrera: ['', [Validators.required, textoRequerido, Validators.minLength(3), Validators.maxLength(150)]],
  });
}
