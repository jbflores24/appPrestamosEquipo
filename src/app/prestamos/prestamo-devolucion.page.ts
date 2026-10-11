import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular';
import { ApiError } from '../core/api/api-error';
import { applyServerErrors } from '../core/forms/apply-server-errors';
import { DetallePrestamo } from '../core/models/detalle-prestamo';
import { DevolucionPayload, Prestamo } from '../core/models/prestamo';
import { PrestamoService } from '../core/services/prestamo.service';
import { FieldErrorComponent } from '../shared/field-error/field-error.component';
import { crearFormDevolucion } from './prestamo-form';

/** Pantalla /prestamos/:id/devolucion: marca la devolución de uno, varios o todos los equipos pendientes. */
@Component({
  selector: 'app-prestamo-devolucion',
  templateUrl: 'prestamo-devolucion.page.html',
  // Una fecha no debe partirse en dos líneas.
  styles: '.fecha { white-space: nowrap; }',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    FieldErrorComponent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonItem,
    IonLabel,
    IonList,
    IonCheckbox,
    IonTextarea,
    IonButton,
    IonSpinner,
  ],
})
export class PrestamoDevolucionPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly prestamos = inject(PrestamoService);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastController);

  /** Parámetro de ruta :id (llega por withComponentInputBinding). */
  readonly id = input.required<string>();

  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly errorGeneral = signal<string | null>(null);
  readonly prestamo = signal<Prestamo | null>(null);

  readonly form = crearFormDevolucion(this.fb);
  /** Ids de equipos marcados; es el mismo valor del control `equipos`. */
  readonly seleccionados = signal<number[]>([]);

  /** Detalles con fecha de devolución real nula. */
  readonly pendientes = computed<DetallePrestamo[]>(() =>
    (this.prestamo()?.detalles ?? []).filter((d) => d.fecha_devolucion_real === null),
  );
  /** Detalles ya devueltos: salen del mismo préstamo, sin otra llamada al servidor. */
  readonly devueltos = computed<DetallePrestamo[]>(() =>
    (this.prestamo()?.detalles ?? []).filter((d) => d.fecha_devolucion_real !== null),
  );
  readonly todosMarcados = computed(
    () => this.pendientes().length > 0 && this.seleccionados().length === this.pendientes().length,
  );
  readonly textoBoton = computed(() => {
    const n = this.seleccionados().length;
    if (n === 0) return 'Devolver todos los pendientes';
    return n === 1 ? 'Devolver 1 equipo' : `Devolver ${n} equipos`;
  });

  ngOnInit() {
    const numero = Number(this.id());
    if (!Number.isInteger(numero) || numero < 1) {
      this.irANoEncontrado();
      return;
    }
    this.cargando.set(true);
    this.prestamos.get(numero).subscribe({
      next: (prestamo) => {
        this.prestamo.set(prestamo);
        this.cargando.set(false);
      },
      error: (e: ApiError) => this.alFallar(e),
    });
  }

  textoRetraso(dias: number): string {
    if (dias <= 0) return 'Sin retraso';
    return dias === 1 ? '1 día de retraso' : `${dias} días de retraso`;
  }

  estaMarcado(equipoId: number): boolean {
    return this.seleccionados().includes(equipoId);
  }

  alternar(equipoId: number, marcado: boolean) {
    const actuales = this.seleccionados().filter((id) => id !== equipoId);
    this.fijarSeleccion(marcado ? [...actuales, equipoId] : actuales);
  }

  alternarTodos() {
    this.fijarSeleccion(this.todosMarcados() ? [] : this.pendientes().map((d) => d.equipo_id));
  }

  /** Sin equipos marcados el cuerpo no lleva `equipos`: el servidor devuelve todos los pendientes. */
  cuerpo(): DevolucionPayload | undefined {
    const cuerpo: DevolucionPayload = {};
    const equipos = this.seleccionados();
    const observaciones = this.form.controls.observaciones.value.trim();
    if (equipos.length > 0) {
      cuerpo.equipos = equipos;
    }
    if (observaciones !== '') {
      cuerpo.observaciones = observaciones;
    }
    return Object.keys(cuerpo).length > 0 ? cuerpo : undefined;
  }

  guardar() {
    this.errorGeneral.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    this.prestamos.devolver(Number(this.id()), this.cuerpo()).subscribe({
      next: async () => {
        this.guardando.set(false);
        await this.avisarExito('Devolución registrada');
        await this.router.navigateByUrl('/prestamos');
      },
      error: (e: ApiError) => {
        this.guardando.set(false);
        this.alFallar(e);
      },
    });
  }

  private fijarSeleccion(ids: number[]) {
    this.seleccionados.set(ids);
    this.form.controls.equipos.setValue(ids); // también limpia un error del servidor en `equipos`
    this.form.controls.equipos.markAsDirty();
  }

  private alFallar(e: ApiError) {
    this.cargando.set(false);
    if (e.status === 404) {
      this.irANoEncontrado();
    } else if (e.status === 422 && e.fieldErrors) {
      // Las claves equipos.N se muestran en el campo de equipos con el mensaje del servidor.
      const sueltos = applyServerErrors(this.form, e.fieldErrors);
      this.errorGeneral.set(sueltos.length > 0 ? sueltos.join(' ') : null);
    } else {
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
