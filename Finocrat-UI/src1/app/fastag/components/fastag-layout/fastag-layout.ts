// fastag/pages/fastag-layout/fastag-layout.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { FastagHeaderComponent } from '../fastag-header/fastag-header';
import { FastagFooterComponent } from '../fastag-footer/fastag-footer';

@Component({
  selector: 'app-fastag-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, FastagHeaderComponent, FastagFooterComponent],
  template: `
    <div class="fastag-layout">
      <app-fastag-header></app-fastag-header>
      <main class="fastag-main">
        <router-outlet></router-outlet>
      </main>
      <app-fastag-footer></app-fastag-footer>
    </div>
  `,
  styles: [`
    .fastag-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .fastag-main {
      flex: 1;
      padding: 20px;
    }
  `]
})
export class FastagLayoutComponent {}