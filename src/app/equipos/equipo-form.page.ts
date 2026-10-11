import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular';
import { ApiError } from '../core/api/api-error';
import { applyServerErrors } from '../core/forms/apply-server-errors';
import { EquipoPayload } from '../core/models/equipo';
import { EquipoService } from '../core/services/equipo.service';
import { FieldErrorComponent } from '../shared/field-error/field-error.component';
import { crearFormEquipo } from './equipo-form';

/** Sirve para /equipos/nuevo (sin id) y /equipos/:id/editar (con id). */
@Component({
  selector: 'app-equipo-form',
  templateUrl: 'equipo-form.page.html',
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
    IonSelect,
    IonSelectOption,
    IonButton,
    IonSpinner,
  ],
})
export class EquipoFormPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly equipos = inject(EquipoService);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastController);

  /** Parámetro de ruta :id (llega por withComponentInputBinding). */
  readonly id = input<string>();
  readonly esEdicion = computed(() => this.id() !== undefined);

  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly errorGeneral = signal<string | null>(null);
  /** El servidor rechaza (409) cualquier cambio a un equipo prestado; no se puede elegir su estado. */
  readonly prestado = signal(false);

  readonly form = crearFormEquipo(this.fb);

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
    this.equipos.get(numero).subscribe({
      next: (equipo) => {
        this.prestado.set(equipo.estado === 'prestado');
        this.form.setValue({
          codigo: equipo.codigo,
          nombre: equipo.nombre,
          tipo: equipo.tipo,
          estado: equipo.estado === 'mantenimiento' ? 'mantenimiento' : 'disponible',
        });
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
    const { codigo, nombre, tipo, estado } = this.form.getRawValue();
    const payload: EquipoPayload = { codigo: codigo.trim(), nombre: nombre.trim(), tipo: tipo.trim() };
    // Si el equipo está prestado no se envía el estado: lo controla el servidor.
    if (!this.prestado()) {
      payload.estado = estado;
    }
    const id = this.id();
    const peticion = id === undefined ? this.equipos.create(payload) : this.equipos.update(Number(id), payload);

    this.guardando.set(true);
    peticion.subscribe({
      next: async () => {
        this.guardando.set(false);
        await this.avisarExito(id === undefined ? 'Equipo creado' : 'Equipo actualizado');
        await this.router.navigateByUrl('/equipos');
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
      // 409 (equipo prestado), 422 sin fieldErrors y cualquier otro error: mensaje del servidor tal cual.
      this.errorGeneral.set(e.message);
    }
  }

  private irANoEncontrado() {
    this.router.navigate(['/no-encontrado'], { queryParams: { volver: '/equipos' }, replaceUrl: true });
  }

  private async avisarExito(message: string) {
    const toast = await this.toasts.create({ message, color: 'success', duration: 2500, position: 'bottom' });
    await toast.present();
  }
}
