import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],   // ✅ IMPORTANT
  templateUrl: './contact.html',
  styleUrls: ['./contact.css']
})
export class ContactComponent {

  formData = {
    name: '',
    email: '',
    mobile: '',
    message: ''
  };

  submitForm() {
    console.log(this.formData);
    alert('Message sent successfully!');
    this.formData = { name: '', email: '', mobile: '', message: '' };
  }
}
