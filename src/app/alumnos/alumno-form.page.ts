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
  IonSpinner,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular';
import { ApiError } from '../core/api/api-error';
import { applyServerErrors } from '../core/forms/apply-server-errors';
import { AlumnoPayload } from '../core/models/alumno';
import { AlumnoService } from '../core/services/alumno.service';
import { FieldErrorComponent } from '../shared/field-error/field-error.component';
import { crearFormAlumno } from './alumno-form';

/** Sirve para /alumnos/nuevo (sin id) y /alumnos/:id/editar (con id). */
@Component({
  selector: 'app-alumno-form',
  templateUrl: 'alumno-form.page.html',
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
    IonButton,
    IonSpinner,
  ],
})
export class AlumnoFormPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly alumnos = inject(AlumnoService);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastController);

  /** Parámetro de ruta :id (llega por withComponentInputBinding). */
  readonly id = input<string>();
  readonly esEdicion = computed(() => this.id() !== undefined);

  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly errorGeneral = signal<string | null>(null);

  readonly form = crearFormAlumno(this.fb);

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
    this.alumnos.get(numero).subscribe({
      next: (alumno) => {
        this.form.setValue({ matricula: alumno.matricula, nombre: alumno.nombre, carrera: alumno.carrera });
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
    const { matricula, nombre, carrera } = this.form.getRawValue();
    const payload: AlumnoPayload = { matricula: matricula.trim(), nombre: nombre.trim(), carrera: carrera.trim() };
    const id = this.id();
    const peticion = id === undefined ? this.alumnos.create(payload) : this.alumnos.update(Number(id), payload);

    this.guardando.set(true);
    peticion.subscribe({
      next: async () => {
        this.guardando.set(false);
        await this.avisarExito(id === undefined ? 'Alumno creado' : 'Alumno actualizado');
        await this.router.navigateByUrl('/alumnos');
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
      // 422 sin fieldErrors y cualquier otro error.
      this.errorGeneral.set(e.message);
    }
  }

  private irANoEncontrado() {
    this.router.navigate(['/no-encontrado'], { queryParams: { volver: '/alumnos' }, replaceUrl: true });
  }

  private async avisarExito(message: string) {
    const toast = await this.toasts.create({ message, color: 'success', duration: 2500, position: 'bottom' });
    await toast.present();
  }
}
