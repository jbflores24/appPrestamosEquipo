import { FormBuilder, Validators } from '@angular/forms';
import { textoRequerido } from '../core/forms/validators';

/** Estados que el formulario permite elegir. `prestado` lo asigna el servidor al prestar el equipo. */
export type EstadoEditable = 'disponible' | 'mantenimiento';

/**
 * Formulario de equipos con las reglas del backend:
 * codigo obligatorio (máximo 30), nombre obligatorio (3 a 150), tipo obligatorio (3 a 80)
 * y estado disponible o mantenimiento. El código único lo valida el servidor (422).
 */
export function crearFormEquipo(fb: FormBuilder) {
  return fb.nonNullable.group({
    codigo: ['', [Validators.required, textoRequerido, Validators.maxLength(30)]],
    nombre: ['', [Validators.required, textoRequerido, Validators.minLength(3), Validators.maxLength(150)]],
    tipo: ['', [Validators.required, textoRequerido, Validators.minLength(3), Validators.maxLength(80)]],
    estado: fb.nonNullable.control<EstadoEditable>('disponible', Validators.required),
  });
}
