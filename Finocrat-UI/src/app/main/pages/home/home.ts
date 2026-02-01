import { Component, OnInit } from '@angular/core';
import { HomeService } from '../../../services/mainservices/home.service';
@Component({
  selector: 'app-finhome',
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class FinhomeComponent implements OnInit {

  stats: any = {};

  constructor(private homeService: HomeService) {}

  ngOnInit() {
    this.homeService.getStats().subscribe(res => {
      this.stats = res;
    });
  }
}
