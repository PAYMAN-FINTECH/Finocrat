import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RegistrationService } from '../../../services/mainservices/registration.service';

@Component({
  selector: 'app-user-registration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-registration.html',
  styleUrls: ['./user-registration.css']
})
export class UserRegistrationComponent implements OnInit {

  registerForm!: FormGroup;
  margins: any[] = [];

  constructor(
    private fb: FormBuilder,
    private service: RegistrationService
  ) {}

  ngOnInit(): void {

    // ✅ Initialize here (NOT in property declaration)
    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      gender: ['', Validators.required],
      isActive: [true],
      marginId: ['', Validators.required],
      isRazorpayEnabled: [false]
    });

    this.loadMargins();
  }

  loadMargins() {
    this.service.getMargins().subscribe((res: any) => {
      this.margins = res;
    });
  }

  submit() {
    if (this.registerForm.invalid) return;

    this.service.register(this.registerForm.value)
      .subscribe({
        next: () => alert("User Registered Successfully"),
        error: err => alert(err.error)
      });
  }
}