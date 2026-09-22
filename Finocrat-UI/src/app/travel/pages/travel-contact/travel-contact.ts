import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-travel-contact',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './travel-contact.html',
  styleUrl: './travel-contact.css'
})
export class TravelContact {

  contactForm = {
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  };

  submitted = false;

  submitForm(): void {

    this.submitted = true;

    console.log('Contact Form:', this.contactForm);

    // Later connect your API here
    // this.http.post('/api/contact', this.contactForm)

  }

}