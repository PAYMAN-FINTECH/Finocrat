// fastag/pages/fastag-support/fastag-support.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-fastag-support',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './fastag-support.html',
  styleUrls: ['./fastag-support.css']
})
export class FastagSupportComponent {
  
  activeTab: string = 'ticket';

  // Ticket Form
  ticketData = {
    name: '',
    email: '',
    phone: '',
    category: 'general',
    subject: '',
    message: '',
    attachment: null as File | null
  };

  // Live Chat
  chatMessages = [
    { type: 'bot', message: 'Hello! Welcome to Finocrat FASTag Support. How can I help you today?', time: new Date() }
  ];
  newMessage = '';
  isTyping = false;

  // Callback Request
  callbackData = {
    name: '',
    phone: '',
    preferredTime: '',
    reason: ''
  };

  isLoading = false;
  isSubmitted = false;
  ticketId = '';

  categories = [
    { value: 'general', label: 'General Query', icon: 'ℹ️' },
    { value: 'recharge', label: 'Recharge Issue', icon: '💰' },
    { value: 'payment', label: 'Payment Failed', icon: '💳' },
    { value: 'refund', label: 'Refund Request', icon: '🔄' },
    { value: 'technical', label: 'Technical Issue', icon: '🔧' },
    { value: 'account', label: 'Account Related', icon: '👤' },
    { value: 'other', label: 'Other', icon: '📝' }
  ];

  timeSlots = [
    '9:00 AM - 11:00 AM',
    '11:00 AM - 1:00 PM',
    '1:00 PM - 3:00 PM',
    '3:00 PM - 5:00 PM',
    '5:00 PM - 6:00 PM'
  ];

  constructor(
    private toastr: ToastrService,
    private http: HttpClient
  ) {}

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.size <= 5 * 1024 * 1024) { // 5MB limit
      this.ticketData.attachment = file;
    } else {
      this.toastr.warning('File size should be less than 5MB');
    }
  }

  submitTicket() {
    // Validate form
    if (!this.ticketData.name) {
      this.toastr.warning('Please enter your name');
      return;
    }
    if (!this.ticketData.email) {
      this.toastr.warning('Please enter your email');
      return;
    }
    if (!this.isValidEmail(this.ticketData.email)) {
      this.toastr.warning('Please enter a valid email address');
      return;
    }
    if (!this.ticketData.subject) {
      this.toastr.warning('Please enter a subject');
      return;
    }
    if (!this.ticketData.message) {
      this.toastr.warning('Please enter your message');
      return;
    }

    this.isLoading = true;

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('name', this.ticketData.name);
    formData.append('email', this.ticketData.email);
    formData.append('phone', this.ticketData.phone);
    formData.append('category', this.ticketData.category);
    formData.append('subject', this.ticketData.subject);
    formData.append('message', this.ticketData.message);
    if (this.ticketData.attachment) {
      formData.append('attachment', this.ticketData.attachment);
    }

    this.http.post('https://your-api.com/api/support/ticket', formData)
      .subscribe({
        next: (response: any) => {
          this.isLoading = false;
          this.isSubmitted = true;
          this.ticketId = response.ticketId || 'TKT' + Math.floor(Math.random() * 1000000);
          this.toastr.success('Ticket created successfully! We will contact you soon.');
          
          setTimeout(() => {
            this.resetTicketForm();
          }, 5000);
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.error('Failed to create ticket. Please try again.');
          console.error('Ticket error:', error);
        }
      });
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;

    // Add user message
    this.chatMessages.push({
      type: 'user',
      message: this.newMessage,
      time: new Date()
    });

    const userMessage = this.newMessage;
    this.newMessage = '';
    this.isTyping = true;

    // Simulate bot response
    setTimeout(() => {
      this.isTyping = false;
      this.chatMessages.push({
        type: 'bot',
        message: this.getBotResponse(userMessage),
        time: new Date()
      });
    }, 1000);
  }

  getBotResponse(message: string): string {
    const msg = message.toLowerCase();
    if (msg.includes('recharge')) {
      return 'You can recharge your FASTag by selecting your provider, entering vehicle number and mobile number, then making payment. Minimum recharge amount is ₹100.';
    } else if (msg.includes('refund')) {
      return 'Refunds are processed within 5-7 working days for failed transactions. Please email us at support@paymanfintech.in with your transaction details.';
    } else if (msg.includes('balance')) {
      return 'You can check your FASTag balance by fetching bill on our portal or by contacting your FASTag provider directly.';
    } else if (msg.includes('payment')) {
      return 'We accept UPI, Credit/Debit Cards, NetBanking, and Wallets. All payments are secure and encrypted.';
    } else if (msg.includes('contact')) {
      return 'You can reach us at support@paymanfintech.in or call +91-9100748033. Our support hours are Monday-Friday 9AM-6PM.';
    } else {
      return 'Thank you for your message. Our support team will get back to you shortly. For immediate assistance, please call us at +91-9100748033.';
    }
  }

  requestCallback() {
    if (!this.callbackData.name) {
      this.toastr.warning('Please enter your name');
      return;
    }
    if (!this.callbackData.phone || this.callbackData.phone.length !== 10) {
      this.toastr.warning('Please enter a valid 10-digit phone number');
      return;
    }
    if (!this.callbackData.preferredTime) {
      this.toastr.warning('Please select preferred time');
      return;
    }

    this.isLoading = true;

    this.http.post('https://your-api.com/api/support/callback', this.callbackData)
      .subscribe({
        next: (response: any) => {
          this.isLoading = false;
          this.toastr.success('Callback request submitted! We will call you at the selected time.');
          this.resetCallbackForm();
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.error('Failed to request callback. Please try again.');
          console.error('Callback error:', error);
        }
      });
  }

  resetTicketForm() {
    this.ticketData = {
      name: '',
      email: '',
      phone: '',
      category: 'general',
      subject: '',
      message: '',
      attachment: null
    };
    setTimeout(() => {
      this.isSubmitted = false;
    }, 3000);
  }

  resetCallbackForm() {
    this.callbackData = {
      name: '',
      phone: '',
      preferredTime: '',
      reason: ''
    };
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  formatTime(time: Date): string {
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}