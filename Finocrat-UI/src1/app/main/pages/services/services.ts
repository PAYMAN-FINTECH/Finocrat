import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-services',
  templateUrl: './services.html',
  imports: [CommonModule],
  styleUrls: ['./services.css']
})
export class ServicesComponent {

  services = [
    {
      title: 'Water Bill',
      description: 'Our water bill payment solutions offer convenience and reliability service to our customer',
      icon: 'fa-solid fa-droplet',
      color: 'blue'
    },
    {
      title: 'Electricity Bill',
      description: 'Simplify the way you settle your Electricity bill with our secure platform',
      icon: 'fa-solid fa-lightbulb',
      color: 'yellow'
    },
    {
      title: 'Mobile Prepaid',
      description: 'Recharge your mobile phone instantly online through our platform, easily handle your Top-ups',
      icon: 'fa-solid fa-mobile-screen',
      color: 'orange'
    },
    {
      title: 'Broadband',
      description: 'Pay your broadband internet bills easily. Ensure seamless and high-speed internet access.',
      icon: 'fa-solid fa-wifi',
      color: 'green'
    },
    {
      title: 'DTH',
      description: 'Recharge your DTH service anytime, anywhere. Enjoy uninterrupted TV entertainment.',
      icon: 'fa-solid fa-tv',
      color: 'purple'
    },
    {
      title: 'Credit Card',
      description: 'Pay your credit card dues securely and on time. Manage multiple cards in one place.',
      icon: 'fa-solid fa-credit-card',
      color: 'red'
    },
    {
      title: 'FASTag',
      description: 'Recharge your FASTag quickly for toll payments. Avoid long queues.',
      icon: 'fa-solid fa-road',
      color: 'blue'
    },
    {
      title: 'Education Fees',
      description: 'Make school, college, or tuition fee payments securely from anywhere.',
      icon: 'fa-solid fa-graduation-cap',
      color: 'green'
    },
    {
      title: 'Insurance',
      description: 'Pay your insurance premiums securely. Supports health, life, and vehicle insurance.',
      icon: 'fa-solid fa-shield-halved',
      color: 'purple'
    },
    {
      title: 'Loan EMI',
      description: 'Pay your monthly loan installments on time. Avoid penalties.',
      icon: 'fa-solid fa-file-invoice-dollar',
      color: 'orange'
    },
    {
      title: 'Subscriptions',
      description: 'Renew and manage OTT, newspaper, and other subscriptions easily.',
      icon: 'fa-solid fa-repeat',
      color: 'yellow'
    },
    {
      title: 'Rent Payment',
      description: 'Pay monthly rent online securely. Track your payment history.',
      icon: 'fa-solid fa-house',
      color: 'red'
    }
  ];

}
