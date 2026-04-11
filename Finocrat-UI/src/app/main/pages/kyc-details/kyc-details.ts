import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeService } from '../../../services/mainservices/home.service';

@Component({
  selector: 'app-kyc',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kyc-details.html',
  styleUrls: ['./kyc-details.css']
})
export class KycDetailsComponent implements OnInit {

  kycList: any[] = [];
  selectedImage: string = '';

  constructor(private service: HomeService) {}

  ngOnInit(): void {
    this.loadKyc();
  }

  loadKyc() {
    this.service.getAllKycDetails().subscribe({
      next: (res: any[]) => {
        this.kycList = res.map(x => ({
          ...x,
          frontImage: this.toImage(x.frontImage),
          backImage: this.toImage(x.backImage),
          panImage: this.toImage(x.panImage)
        }));
      },
      error: () => alert("Failed to load KYC data")
    });
  }

  toImage(base64: string) {
    return base64 ? `data:image/jpeg;base64,${base64}` : '';
  }

  openImage(img: string) {
    this.selectedImage = img;
  }

  closeImage() {
    this.selectedImage = '';
  }
}