import { FormBuilder, Validators } from '@angular/forms';
import { fechaIso, fechaNoAnterior, hoyIso } from '../core/forms/validators';

/**
 * Formulario de préstamos con las reglas del backend:
 * alumno obligatorio, fechas YYYY-MM-DD obligatorias (la devolución no puede ser anterior a la salida)
 * y, solo al crear, al menos un equipo. En edición el control `equipos` se deshabilita.
 */
export function crearFormPrestamo(fb: FormBuilder) {
  const form = fb.nonNullable.group({
    alumno_id: fb.control<number | null>(null, Validators.required),
    fecha_salida: [hoyIso(), [Validators.required, fechaIso]],
    fecha_devolucion_esperada: [hoyIso(7), [Validators.required, fechaIso, fechaNoAnterior('fecha_salida')]],
    equipos: fb.nonNullable.control<number[]>([], Validators.required),
  });
  // Al cambiar la salida hay que volver a comprobar que la devolución no sea anterior.
  form.controls.fecha_salida.valueChanges.subscribe(() => form.controls.fecha_devolucion_esperada.updateValueAndValidity());
  return form;
}

/** Formulario de devolución: equipos elegidos (vacío = devolver todos) y observaciones opcionales (máximo 255). */
export function crearFormDevolucion(fb: FormBuilder) {
  return fb.nonNullable.group({
    equipos: fb.nonNullable.control<number[]>([]),
    observaciones: ['', Validators.maxLength(255)],
  });
}
