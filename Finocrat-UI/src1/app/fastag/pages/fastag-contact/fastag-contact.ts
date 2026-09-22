// fastag/pages/fastag-contact/fastag-contact.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-fastag-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './fastag-contact.html',
  styleUrls: ['./fastag-contact.css']
})
export class FastagContactComponent {
  
  contactData = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };

  isLoading = false;
  isSubmitted = false;

  constructor(
    private toastr: ToastrService,
    private http: HttpClient
  ) {}

  onSubmit() {
    // Validate form
    if (!this.contactData.name) {
      this.toastr.warning('Please enter your name');
      return;
    }
    if (!this.contactData.email) {
      this.toastr.warning('Please enter your email');
      return;
    }
    if (!this.isValidEmail(this.contactData.email)) {
      this.toastr.warning('Please enter a valid email address');
      return;
    }
    if (!this.contactData.subject) {
      this.toastr.warning('Please enter a subject');
      return;
    }
    if (!this.contactData.message) {
      this.toastr.warning('Please enter your message');
      return;
    }

    this.isLoading = true;

    // Send to backend API
    this.http.post('https://your-api.com/api/contact/send', this.contactData)
      .subscribe({
        next: (response: any) => {
          this.isLoading = false;
          this.isSubmitted = true;
          this.toastr.success('Message sent successfully! We will get back to you soon.');
          
          // Reset form after 3 seconds
          setTimeout(() => {
            this.resetForm();
          }, 3000);
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.error('Failed to send message. Please try again later.');
          console.error('Contact form error:', error);
        }
      });
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  resetForm() {
    this.contactData = {
      name: '',
      email: '',
      subject: '',
      message: ''
    };
    setTimeout(() => {
      this.isSubmitted = false;
    }, 3000);
  }
}