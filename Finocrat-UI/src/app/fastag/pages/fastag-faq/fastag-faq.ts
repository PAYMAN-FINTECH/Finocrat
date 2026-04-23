// fastag/pages/fastag-faq/fastag-faq.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-fastag-faq',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './fastag-faq.html',
  styleUrls: ['./fastag-faq.css']
})
export class FastagFaqComponent {
  
  activeCategory: string = 'general';
  activeQuestion: number | null = null;

  categories = [
    { id: 'general', name: 'General', icon: 'ℹ️' },
    { id: 'recharge', name: 'Recharge', icon: '💰' },
    { id: 'payment', name: 'Payment', icon: '💳' },
    { id: 'technical', name: 'Technical', icon: '🔧' },
    { id: 'refund', name: 'Refund & Cancellation', icon: '🔄' },
    { id: 'security', name: 'Security', icon: '🔒' }
  ];

  faqs = {
    general: [
      {
        id: 1,
        question: 'What is FASTag?',
        answer: 'FASTag is a Radio Frequency Identification (RFID) tag used for toll payments across India under the NETC (National Electronic Toll Collection) system. It allows you to pay tolls electronically without stopping at toll plazas.'
      },
      {
        id: 2,
        question: 'How does FASTag work?',
        answer: 'FASTag uses RFID technology. When you pass through a toll plaza, the reader scans your FASTag and deducts the toll amount automatically from your linked wallet or bank account.'
      },
      {
        id: 3,
        question: 'Who can use FASTag?',
        answer: 'FASTag can be used by all vehicle owners - cars, buses, trucks, and other commercial vehicles. It is mandatory for all vehicles to have FASTag for toll payments.'
      },
      {
        id: 4,
        question: 'Is FASTag mandatory?',
        answer: 'Yes, FASTag is mandatory for all vehicles as per Government of India regulations. Vehicles without FASTag pay double toll at plazas.'
      }
    ],
    recharge: [
      {
        id: 5,
        question: 'How do I recharge my FASTag?',
        answer: 'You can recharge your FASTag through our portal by selecting your provider, entering vehicle number and mobile number, and making payment via UPI, Card, or NetBanking.'
      },
      {
        id: 6,
        question: 'How long does recharge take?',
        answer: 'FASTag recharge is instant. Your balance will reflect within 2-5 minutes after successful payment confirmation.'
      },
      {
        id: 7,
        question: 'What is the minimum recharge amount?',
        answer: 'The minimum recharge amount is ₹100. You can recharge any amount above ₹100 as per your requirement.'
      },
      {
        id: 8,
        question: 'Can I recharge for any FASTag provider?',
        answer: 'Yes, we support all major FASTag providers including HDFC, ICICI, Axis, SBI, Paytm, and Kotak.'
      },
      {
        id: 9,
        question: 'Do I need to register to recharge?',
        answer: 'Yes, you need to login to your account to recharge. If you are a new user, please sign up first.'
      }
    ],
    payment: [
      {
        id: 10,
        question: 'What payment methods are accepted?',
        answer: 'We accept all major payment methods including UPI, Credit/Debit Cards, NetBanking, and Wallets.'
      },
      {
        id: 11,
        question: 'Is my payment secure?',
        answer: 'Yes, we use 256-bit SSL encryption and secure payment gateways. All transactions are PCI-DSS compliant.'
      },
      {
        id: 12,
        question: 'What happens if payment fails?',
        answer: 'If payment fails but amount is deducted, it will be automatically refunded within 5-7 working days.'
      },
      {
        id: 13,
        question: 'Can I get a receipt for my transaction?',
        answer: 'Yes, you will receive a transaction receipt via email after successful recharge.'
      }
    ],
    technical: [
      {
        id: 14,
        question: 'Why is my FASTag not working?',
        answer: 'FASTag may not work due to low balance, damaged tag, or network issues. Check your balance and ensure the tag is properly affixed.'
      },
      {
        id: 15,
        question: 'How do I check my FASTag balance?',
        answer: 'You can check your balance by fetching bill on our portal or by logging into your FASTag provider\'s app/website.'
      },
      {
        id: 16,
        question: 'What to do if FASTag is damaged?',
        answer: 'Contact your FASTag provider immediately to get a replacement tag. They will deactivate the old tag and issue a new one.'
      },
      {
        id: 17,
        question: 'How long does the website take to load?',
        answer: 'Our website is optimized for fast loading. However, if you experience slow speed, please check your internet connection.'
      }
    ],
    refund: [
      {
        id: 18,
        question: 'What is your refund policy?',
        answer: 'All successful recharges are final and non-refundable. Refunds are only processed for failed transactions where money was deducted but recharge failed.'
      },
      {
        id: 19,
        question: 'How to request a refund?',
        answer: 'Email us at support@paymanfintech.in with your transaction ID, vehicle number, recharge date, amount, and provider details.'
      },
      {
        id: 20,
        question: 'How long does refund take?',
        answer: 'Refunds are processed within 5-7 working days after verification. The amount will be credited back to your original payment method.'
      },
      {
        id: 21,
        question: 'Can I cancel my recharge?',
        answer: 'No, once a recharge is successfully processed, it cannot be cancelled. Please verify all details before making payment.'
      }
    ],
    security: [
      {
        id: 22,
        question: 'Is my personal information safe?',
        answer: 'Yes, we follow strict data protection policies and never share your personal information with third parties without consent.'
      },
      {
        id: 23,
        question: 'What security measures do you use?',
        answer: 'We use SSL encryption, secure servers, firewalls, and regular security audits to protect your data.'
      },
      {
        id: 24,
        question: 'Do you store my card details?',
        answer: 'No, we never store your card or bank details. All payment information is handled by our secure payment gateways.'
      },
      {
        id: 25,
        question: 'What should I do if I suspect fraud?',
        answer: 'Contact our support team immediately at support@paymanfintech.in or call +91-9100748033.'
      }
    ]
  };

  setCategory(categoryId: string) {
    this.activeCategory = categoryId;
    this.activeQuestion = null;
  }

  toggleQuestion(id: number) {
    if (this.activeQuestion === id) {
      this.activeQuestion = null;
    } else {
      this.activeQuestion = id;
    }
  }

  getCurrentFaqs() {
    return this.faqs[this.activeCategory as keyof typeof this.faqs] || [];
  }
}