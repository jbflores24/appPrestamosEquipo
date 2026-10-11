import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular';
import { ApiError } from '../core/api/api-error';
import { applyServerErrors } from '../core/forms/apply-server-errors';
import { fechaIso, hoyIso, textoRequerido } from '../core/forms/validators';
import { AvisoPayload } from '../core/models/aviso';
import { AvisoService } from '../core/services/aviso.service';
import { FieldErrorComponent } from '../shared/field-error/field-error.component';

/** Sirve para /avisos/nuevo (sin id) y /avisos/:id/editar (con id). */
@Component({
  selector: 'app-aviso-form',
  templateUrl: 'aviso-form.page.html',
  imports: [
    ReactiveFormsModule,
    FieldErrorComponent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonItem,
    IonInput,
    IonTextarea,
    IonButton,
    IonSpinner,
  ],
})
export class AvisoFormPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly avisos = inject(AvisoService);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastController);

  /** Parámetro de ruta :id (llega por withComponentInputBinding). */
  readonly id = input<string>();
  readonly esEdicion = computed(() => this.id() !== undefined);

  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly errorGeneral = signal<string | null>(null);

  // Reglas del backend: titulo 3-150, texto mínimo 3, fecha YYYY-MM-DD, todos obligatorios.
  readonly form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, textoRequerido, Validators.minLength(3), Validators.maxLength(150)]],
    texto: ['', [Validators.required, textoRequerido, Validators.minLength(3)]],
    fecha: [hoyIso(), [Validators.required, fechaIso]],
  });

  ngOnInit() {
    const id = this.id();
    if (id === undefined) {
      return;
    }
    const numero = Number(id);
    if (!Number.isInteger(numero) || numero < 1) {
      this.irANoEncontrado();
      return;
    }
    this.cargando.set(true);
    this.avisos.get(numero).subscribe({
      next: (aviso) => {
        this.form.setValue({ titulo: aviso.titulo, texto: aviso.texto, fecha: aviso.fecha });
        this.cargando.set(false);
      },
      error: (e: ApiError) => this.alFallar(e),
    });
  }

  guardar() {
    this.errorGeneral.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { titulo, texto, fecha } = this.form.getRawValue();
    const payload: AvisoPayload = { titulo: titulo.trim(), texto: texto.trim(), fecha };
    const id = this.id();
    const peticion = id === undefined ? this.avisos.create(payload) : this.avisos.update(Number(id), payload);

    this.guardando.set(true);
    peticion.subscribe({
      next: async () => {
        this.guardando.set(false);
        await this.avisarExito(id === undefined ? 'Aviso creado' : 'Aviso actualizado');
        await this.router.navigateByUrl('/avisos');
      },
      error: (e: ApiError) => {
        this.guardando.set(false);
        this.alFallar(e);
      },
    });
  }

  private alFallar(e: ApiError) {
    this.cargando.set(false);
    if (e.status === 404) {
      this.irANoEncontrado();
    } else if (e.status === 422 && e.fieldErrors) {
      const sueltos = applyServerErrors(this.form, e.fieldErrors);
      this.errorGeneral.set(sueltos.length > 0 ? sueltos.join(' ') : null);
    } else {
      // 422 sin fieldErrors (por ejemplo, condición de carrera) y cualquier otro error.
      this.errorGeneral.set(e.message);
    }
  }

  private irANoEncontrado() {
    this.router.navigate(['/no-encontrado'], { queryParams: { volver: '/avisos' }, replaceUrl: true });
  }

  private async avisarExito(message: string) {
    const toast = await this.toasts.create({ message, color: 'success', duration: 2500, position: 'bottom' });
    await toast.present();
  }
}
