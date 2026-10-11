import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
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
import { forkJoin, map } from 'rxjs';
import { ApiError } from '../core/api/api-error';
import { todasLasPaginas } from '../core/api/todas-las-paginas';
import { applyServerErrors } from '../core/forms/apply-server-errors';
import { Alumno } from '../core/models/alumno';
import { Equipo } from '../core/models/equipo';
import { PrestamoPayload, PrestamoUpdatePayload } from '../core/models/prestamo';
import { AlumnoService } from '../core/services/alumno.service';
import { EquipoService } from '../core/services/equipo.service';
import { PrestamoService } from '../core/services/prestamo.service';
import { FieldErrorComponent } from '../shared/field-error/field-error.component';
import { crearFormPrestamo } from './prestamo-form';

/** Sirve para /prestamos/nuevo (sin id) y /prestamos/:id/editar (con id). */
@Component({
  selector: 'app-prestamo-form',
  templateUrl: 'prestamo-form.page.html',
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
export class PrestamoFormPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly prestamos = inject(PrestamoService);
  private readonly alumnos = inject(AlumnoService);
  private readonly equipos = inject(EquipoService);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastController);

  /** Parámetro de ruta :id (llega por withComponentInputBinding). */
  readonly id = input<string>();
  readonly esEdicion = computed(() => this.id() !== undefined);

  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly errorGeneral = signal<string | null>(null);

  /** Opciones de los selectores. */
  readonly alumnosOpciones = signal<Alumno[]>([]);
  readonly equiposDisponibles = signal<Equipo[]>([]);

  readonly form = crearFormPrestamo(this.fb);

  private readonly equiposElegidos = toSignal(this.form.controls.equipos.valueChanges, { initialValue: [] as number[] });
  /** Texto corto para el selector de equipos: con muchos equipos la lista completa no cabe en la pantalla. */
  readonly textoEquipos = computed(() => {
    const n = this.equiposElegidos().length;
    if (n === 0) return undefined;
    return n === 1 ? '1 equipo seleccionado' : `${n} equipos seleccionados`;
  });

  ngOnInit() {
    const id = this.id();
    this.cargando.set(true);

    if (id === undefined) {
      // Alta: alumnos y solo los equipos disponibles.
      forkJoin({
        alumnos: todasLasPaginas((p) => this.alumnos.list(p)),
        equipos: todasLasPaginas((p) => this.equipos.list(p)).pipe(
          map((lista) => lista.filter((e) => e.estado === 'disponible')),
        ),
      }).subscribe({
        next: ({ alumnos, equipos }) => {
          this.alumnosOpciones.set(alumnos);
          this.equiposDisponibles.set(equipos);
          this.cargando.set(false);
        },
        error: (e: ApiError) => this.alFallar(e),
      });
      return;
    }

    const numero = Number(id);
    if (!Number.isInteger(numero) || numero < 1) {
      this.irANoEncontrado();
      return;
    }
    // Edición: el servidor ignora `equipos`, así que ese control no participa.
    this.form.controls.equipos.disable();
    forkJoin({
      prestamo: this.prestamos.get(numero),
      alumnos: todasLasPaginas((p) => this.alumnos.list(p)),
    }).subscribe({
      next: ({ prestamo, alumnos }) => {
        this.alumnosOpciones.set(alumnos);
        this.form.patchValue({
          alumno_id: prestamo.alumno_id,
          fecha_salida: prestamo.fecha_salida,
          fecha_devolucion_esperada: prestamo.fecha_devolucion_esperada,
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
    const { alumno_id, fecha_salida, fecha_devolucion_esperada, equipos } = this.form.getRawValue();
    if (alumno_id === null) {
      return;
    }
    const id = this.id();

    this.guardando.set(true);
    const peticion =
      id === undefined
        ? this.prestamos.create({ alumno_id, fecha_salida, fecha_devolucion_esperada, equipos } satisfies PrestamoPayload)
        : this.prestamos.update(Number(id), { alumno_id, fecha_salida, fecha_devolucion_esperada } satisfies PrestamoUpdatePayload);

    peticion.subscribe({
      next: async () => {
        this.guardando.set(false);
        await this.avisarExito(id === undefined ? 'Préstamo registrado' : 'Préstamo actualizado');
        await this.router.navigateByUrl('/prestamos');
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
      // 422 sin fieldErrors (condición de carrera: un equipo se ocupó) y cualquier otro error:
      // mensaje general del servidor, sin marcar campos.
      this.errorGeneral.set(e.message);
    }
  }

  private irANoEncontrado() {
    this.router.navigate(['/no-encontrado'], { queryParams: { volver: '/prestamos' }, replaceUrl: true });
  }

  private async avisarExito(message: string) {
    const toast = await this.toasts.create({ message, color: 'success', duration: 2500, position: 'bottom' });
    await toast.present();
  }
}
