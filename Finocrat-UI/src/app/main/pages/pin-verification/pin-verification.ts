import { Component, Input, Output, EventEmitter } from '@angular/core';
import { HomeService } from '../../../services/mainservices/home.service';

@Component({
  selector: 'app-pin-verification',
  standalone: true,
  templateUrl: './pin-verification.html',
  styleUrls: ['./pin-verification.css']
})
export class PinVerificationComponent {

  @Input() userPhone = '';
  @Output() onSuccess = new EventEmitter<void>();
  @Output() onClose = new EventEmitter<void>();

  pin = '';
  error = '';
  isLoading = false;

  constructor(private securityService: HomeService) {}

  onInput(e: any) {
    this.pin = e.target.value.replace(/\D/g, '').slice(0,4);
    if (this.pin.length === 4) this.verify();
  }

  verify() {

    this.isLoading = true;

    this.securityService.verifyPin({
      UserPhone: this.userPhone,
      Pin: this.pin
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.onSuccess.emit();
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.message;
        this.pin = '';
      }
    });
  }
}