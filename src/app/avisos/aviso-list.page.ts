import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
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
import { add, trash } from 'ionicons/icons';
import { ApiError } from '../core/api/api-error';
import { Pagination } from '../core/api/api.models';
import { Aviso } from '../core/models/aviso';
import { AvisoService } from '../core/services/aviso.service';

@Component({
  selector: 'app-aviso-list',
  templateUrl: 'aviso-list.page.html',
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
export class AvisoListPage {
  private readonly avisos = inject(AvisoService);
  private readonly alertas = inject(AlertController);
  private readonly toasts = inject(ToastController);

  readonly items = signal<Aviso[]>([]);
  readonly pagination = signal<Pagination | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  private pagina = 1;

  constructor() {
    addIcons({ add, trash });
  }

  // Ionic conserva esta pantalla al navegar; recargamos cada vez que se vuelve a mostrar.
  ionViewWillEnter() {
    this.cargar(this.pagina);
  }

  cargar(pagina: number) {
    this.cargando.set(true);
    this.error.set(null);
    this.avisos.list(pagina).subscribe({
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

  async confirmarBorrado(aviso: Aviso, evento: Event) {
    // El botón está dentro de un ion-item con routerLink: evitamos que también navegue a editar.
    evento.preventDefault();
    evento.stopPropagation();
    const alerta = await this.alertas.create({
      header: 'Eliminar aviso',
      message: `¿Eliminar "${aviso.titulo}"? Esta acción no se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive', handler: () => this.borrar(aviso) },
      ],
    });
    await alerta.present();
  }

  private borrar(aviso: Aviso) {
    this.avisos.remove(aviso.id).subscribe({
      next: () => {
        this.mostrarToast('Aviso eliminado', 'success');
        // Si se vació la última página, regresamos una.
        const sigueHabiendo = this.items().length > 1 || this.pagina === 1;
        this.cargar(sigueHabiendo ? this.pagina : this.pagina - 1);
      },
      error: (e: ApiError) => {
        this.mostrarToast(e.status === 404 ? 'El aviso ya no existe' : e.message, 'danger');
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
