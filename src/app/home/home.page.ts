import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButtons, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonMenuButton, IonTitle, IonToolbar } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { calendarOutline, laptopOutline, peopleOutline, swapHorizontalOutline } from 'ionicons/icons';
import { OPCIONES_MENU } from '../shared/menu';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  imports: [RouterLink, IonButtons, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonMenuButton, IonTitle, IonToolbar],
})
export class HomePage {
  readonly secciones = OPCIONES_MENU.filter((o) => o.url !== '/home');

  constructor() {
    addIcons({ calendarOutline, peopleOutline, laptopOutline, swapHorizontalOutline });
  }
}
