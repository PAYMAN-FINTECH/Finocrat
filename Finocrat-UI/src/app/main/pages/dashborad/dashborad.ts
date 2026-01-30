
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainheaderComponent } from '../../components/mainheader/mainheader';
import { MainfooterComponent } from '../../components/mainfooter/mainfooter';
import { RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashborad',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterLink
  ],
  templateUrl: './dashborad.html',
  styleUrls: ['./dashborad.css']
})
export class DashboradComponent {}

