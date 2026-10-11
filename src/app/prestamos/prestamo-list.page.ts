import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  AlertController,
  IonButton,
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonFooter,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, returnDownBack, trash } from 'ionicons/icons';
import { ApiError } from '../core/api/api-error';
import { Pagination } from '../core/api/api.models';
import { Prestamo } from '../core/models/prestamo';
import { PrestamoService } from '../core/services/prestamo.service';

@Component({
  selector: 'app-prestamo-list',
  templateUrl: 'prestamo-list.page.html',
  imports: [
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonFab,
    IonFabButton,
    IonSpinner,
    IonFooter,
  ],
})
export class PrestamoListPage {
  private readonly prestamos = inject(PrestamoService);
  private readonly alertas = inject(AlertController);
  private readonly toasts = inject(ToastController);
  private readonly router = inject(Router);

  readonly items = signal<Prestamo[]>([]);
  readonly pagination = signal<Pagination | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  private pagina = 1;

  constructor() {
    addIcons({ add, trash, returnDownBack });
  }

  // Ionic conserva esta pantalla al navegar; recargamos cada vez que se vuelve a mostrar.
  ionViewWillEnter() {
    this.cargar(this.pagina);
  }

  /** Equipos del préstamo que aún no se devuelven. */
  pendientes(prestamo: Prestamo): number {
    return (prestamo.detalles ?? []).filter((d) => d.fecha_devolucion_real === null).length;
  }

  cargar(pagina: number) {
    this.cargando.set(true);
    this.error.set(null);
    this.prestamos.list(pagina).subscribe({
      next: (page) => {
        this.pagina = page.pagination.current_page;
        this.items.set(page.items);
        this.pagination.set(page.pagination);
        this.cargando.set(false);
      },
      error: (e: ApiError) => {
        this.error.set(e.message);
        this.cargando.set(false);
      },
    });
  }

  anterior() {
    this.cargar(this.pagina - 1);
  }

  siguiente() {
    this.cargar(this.pagina + 1);
  }

  irADevolucion(prestamo: Prestamo, evento: Event) {
    // El botón está dentro de un ion-item con routerLink: evitamos que también navegue a editar.
    evento.preventDefault();
    evento.stopPropagation();
    this.router.navigate(['/prestamos', prestamo.id, 'devolucion']);
  }

  async confirmarBorrado(prestamo: Prestamo, evento: Event) {
    evento.preventDefault();
    evento.stopPropagation();
    const alumno = prestamo.alumno?.nombre ?? 'este alumno';
    const alerta = await this.alertas.create({
      header: 'Eliminar préstamo',
      message: `¿Eliminar el préstamo de ${alumno} (${prestamo.fecha_salida})? Los equipos pendientes quedarán disponibles.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive', handler: () => this.borrar(prestamo) },
      ],
    });
    await alerta.present();
  }

  borrar(prestamo: Prestamo) {
    this.prestamos.remove(prestamo.id).subscribe({
      next: () => {
        this.mostrarToast('Préstamo eliminado', 'success');
        // Si se vació la última página, regresamos una.
        const sigueHabiendo = this.items().length > 1 || this.pagina === 1;
        this.cargar(sigueHabiendo ? this.pagina : this.pagina - 1);
      },
      error: (e: ApiError) => {
        this.mostrarToast(e.status === 404 ? 'El préstamo ya no existe' : e.message, 'danger');
        this.cargar(this.pagina);
      },
    });
  }

  private async mostrarToast(message: string, color: 'success' | 'danger') {
    // Los errores salen arriba para no tapar el botón flotante de alta.
    const position = color === 'danger' ? 'top' : 'bottom';
    const toast = await this.toasts.create({ message, color, duration: 4000, position });
    await toast.present();
  }
}
