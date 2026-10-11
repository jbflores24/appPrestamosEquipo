import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Falla con `required` si el texto está vacío o solo tiene espacios (el backend recorta los espacios). */
export function textoRequerido(control: AbstractControl): ValidationErrors | null {
  const valor = control.value;
  return typeof valor === 'string' && valor.trim() === '' ? { required: true } : null;
}

/** Acepta solo fechas reales con formato YYYY-MM-DD (igual que `date_format:Y-m-d` del backend). */
export function fechaIso(control: AbstractControl): ValidationErrors | null {
  const valor = control.value;
  if (!valor) {
    return null; // lo cubre Validators.required
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (!m) {
    return { fechaIso: true };
  }
  const [anio, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const fecha = new Date(anio, mes - 1, dia);
  const esReal = fecha.getFullYear() === anio && fecha.getMonth() === mes - 1 && fecha.getDate() === dia;
  return esReal ? null : { fechaIso: true };
}

/**
 * La fecha del control no puede ser anterior a la de otro control del mismo grupo
 * (igual que `after_or_equal` del backend: la misma fecha es válida).
 */
export function fechaNoAnterior(otroControl: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const mia = control.value;
    const otra = control.parent?.get(otroControl)?.value;
    const formato = /^\d{4}-\d{2}-\d{2}$/;
    if (!formato.test(mia ?? '') || !formato.test(otra ?? '')) {
      return null; // los formatos inválidos los reporta fechaIso
    }
    // YYYY-MM-DD se ordena igual como texto que como fecha.
    return mia < otra ? { fechaAnterior: true } : null;
  };
}

/** Fecha de hoy en hora local, como YYYY-MM-DD. Con `dias` se suma ese número de días. */
export function hoyIso(dias = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}
