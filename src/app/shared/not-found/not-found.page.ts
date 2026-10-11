import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';

/** Pantalla para 404. La ruta a la que se vuelve llega por query param `volver`. */
@Component({
  selector: 'app-not-found',
  imports: [RouterLink, IonHeader, IonToolbar, IonTitle, IonContent, IonButton],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>No encontrado</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="app-container">
        <div class="app-state">
          <h2>No encontramos lo que buscabas</h2>
          <p>El registro no existe o ya fue eliminado.</p>
          <ion-button [routerLink]="volver()">Volver al listado</ion-button>
        </div>
      </div>
    </ion-content>
  `,
})
export class NotFoundPage {
  readonly volver = input('/avisos');
}
