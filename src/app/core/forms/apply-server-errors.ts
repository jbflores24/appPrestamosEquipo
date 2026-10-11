import { AbstractControl, FormGroup } from '@angular/forms';
import { ValidationErrors } from '../api/api.models';

/**
 * Marca cada control con el mensaje que mandó el backend en un 422.
 * Las claves de arreglos como `equipos.0` se asignan al control `equipos`.
 * El error `server` desaparece solo cuando el usuario edita el campo.
 * Devuelve los mensajes de claves que no corresponden a ningún control.
 */
export function applyServerErrors(form: FormGroup, fieldErrors: ValidationErrors): string[] {
  const sinControl: string[] = [];
  const porControl = new Map<AbstractControl, string[]>();

  for (const [campo, mensajes] of Object.entries(fieldErrors)) {
    const control = form.get(campo) ?? form.get(campo.replace(/\.\d+$/, ''));
    if (!control) {
      sinControl.push(...mensajes);
      continue;
    }
    const acumulados = porControl.get(control) ?? [];
    for (const mensaje of mensajes) {
      if (!acumulados.includes(mensaje)) {
        acumulados.push(mensaje);
      }
    }
    porControl.set(control, acumulados);
  }

  for (const [control, mensajes] of porControl) {
    control.setErrors({ server: mensajes.join(' ') });
    control.markAsTouched();
  }
  return sinControl;
}
