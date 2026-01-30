import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-contact-us',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact-us.html',
  styleUrls: ['./contact-us.css']
})
export class ContactUsComponent implements OnInit {

  contactForm!: FormGroup;
  isSubmitting = false;

  contactInfo = {
    address: `premises bearing No H.No. 7-1-414/B,Mankammathtoa,,
Opp Shivani Degree College, Karimnagar,
Karimnagar, Telangana – 505001`,
    email: 'operations@thefinocrat.com',
    phones: [
      '+91 7702205291',
    ]
  };

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      mobile: ['', [
        Validators.required,
        Validators.pattern('^[6-9]\\d{9}$')
      ]],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  submitForm(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    const payload = this.contactForm.value;
    console.log('Contact Payload:', payload);

    // 🔗 API call here (later)
    setTimeout(() => {
      this.isSubmitting = false;
      this.contactForm.reset();
      alert('Thank you! We will contact you shortly.');
    }, 1200);
  }

}
