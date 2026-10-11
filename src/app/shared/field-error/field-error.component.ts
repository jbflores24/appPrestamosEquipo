import { Component, computed, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';
import { startWith, switchMap } from 'rxjs';

/** Muestra el primer error de un control cuando el usuario ya lo tocó o lo escribió. */
@Component({
  selector: 'app-field-error',
  // El aspecto está en la clase global .app-field-error (global.scss).
  template: `
    @if (mensaje(); as texto) {
      <span class="app-field-error">{{ texto }}</span>
    }
  `,
})
export class FieldErrorComponent {
  readonly control = input.required<AbstractControl>();

  // Cada cambio del control (valor, estado, touched) vuelve a calcular el mensaje.
  private readonly cambios = toSignal(
    toObservable(this.control).pipe(switchMap((c) => c.events.pipe(startWith(null)))),
  );

  readonly mensaje = computed(() => {
    this.cambios();
    const control = this.control();
    if (!control.errors || !(control.touched || control.dirty)) {
      return null;
    }
    const e = control.errors;
    if (e['server']) return e['server'] as string;
    if (e['required']) return 'Este campo es obligatorio.';
    if (e['minlength']) return `Escribe al menos ${e['minlength'].requiredLength} caracteres.`;
    if (e['maxlength']) return `Escribe máximo ${e['maxlength'].requiredLength} caracteres.`;
    if (e['fechaIso']) return 'Escribe una fecha válida (AAAA-MM-DD).';
    if (e['fechaAnterior']) return 'La fecha de devolución no puede ser anterior a la de salida.';
    return 'El valor no es válido.';
  });
}
