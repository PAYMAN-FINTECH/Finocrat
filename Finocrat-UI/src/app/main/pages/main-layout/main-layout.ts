import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MainheaderComponent } from '../../components/mainheader/mainheader';
import { SidebarComponent } from '../sidebar/sidebar';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,        // <-- fixes router-outlet error
    SidebarComponent     // <-- fixes app-sidebar error
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout {

}
