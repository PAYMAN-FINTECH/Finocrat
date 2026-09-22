import { Component } from '@angular/core';
import { TravelHeader } from '../travel-header/travel-header';
import { TravelFooter } from '../travel-footer/travel-footer';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-travel-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, TravelHeader, TravelFooter],
  template: `
    <div class="travel-layout">
      <app-travel-header></app-travel-header>
      <main class="travel-main">
        <router-outlet></router-outlet>
      </main>
      <app-travel-footer></app-travel-footer>
    </div>
  `,
  styles: [`
    .travel-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .travel-main {
      flex: 1;
      padding: 20px;
    }
  `]
})
export class TravelLayout {

}
