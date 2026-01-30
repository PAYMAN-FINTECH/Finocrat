

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { HeaderComponent as EduHeaderComponent } from './edu/components/header/header';
import { FooterComponent as EduFooterComponent } from './edu/components/footer/footer';
import { MainheaderComponent } from './main/components/mainheader/mainheader';
import { MainfooterComponent } from './main/components/mainfooter/mainfooter';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet,
    EduHeaderComponent,
    EduFooterComponent,
    MainheaderComponent,
    MainfooterComponent
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  isEdu = window.location.hostname.startsWith('edu.');
}

