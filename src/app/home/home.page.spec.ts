import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomePage } from './home.page';

describe('HomePage', () => {
  it('muestra un acceso por cada sección, sin repetir Inicio', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const titulos = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('ion-item.app-card h2')).map((h) => h.textContent?.trim());
    expect(titulos).toEqual(['Avisos', 'Alumnos', 'Equipos', 'Préstamos']);
  });
});
