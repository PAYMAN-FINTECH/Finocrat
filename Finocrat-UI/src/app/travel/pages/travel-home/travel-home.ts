import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Bus {
  id: number;
  busNumber: string;
  operator: string;
  departure: string;
  arrival: string;
  duration: string;
  seats: number;
  fare: number;
  type: string;
}

@Component({
  selector: 'app-travel-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './travel-home.html',
  styleUrl: './travel-home.css'
})
export class TravelHome implements OnDestroy {

  /* =========================================================
     LOCATION
  ========================================================= */

  locationModalOpen = false;

  locationType: 'pickup' | 'dropoff' = 'pickup';

  pickupLocation = '';
  dropoffLocation = '';

  locationSearch = '';

  hyderabadAreas: string[] = [
    'Hitech City',
    'Gachibowli',
    'Madhapur',
    'Kukatpally',
    'Ameerpet',
    'Secunderabad',
    'Banjara Hills',
    'Jubilee Hills',
    'Dilsukhnagar',
    'Uppal',
    'Miyapur',
    'L B Nagar',
    'Koti',
    'Abids',
    'Begumpet'
  ];

  get filteredLocations(): string[] {
    const search = this.locationSearch.trim().toLowerCase();

    if (!search) {
      return this.hyderabadAreas;
    }

    return this.hyderabadAreas.filter(x =>
      x.toLowerCase().includes(search)
    );
  }

  openLocationModal(type: 'pickup' | 'dropoff'): void {
    this.locationType = type;
    this.locationSearch = '';
    this.locationModalOpen = true;
  }

  closeLocationModal(): void {
    this.locationModalOpen = false;
    this.locationSearch = '';
  }

  selectLocation(location: string): void {

    if (this.locationType === 'pickup') {
      this.pickupLocation = location;
    } else {
      this.dropoffLocation = location;
    }

    this.closeLocationModal();
  }


  /* =========================================================
     BOOKING
  ========================================================= */

  bookingModalOpen = false;

  bookingStep = 1;

  pickupDistrict = '';
  dropoffDistrict = '';

  journeyDate = '';
  journeyTime = '';

  availableBuses: Bus[] = [];

  selectedBus: Bus | null = null;

  amount = 0;

  customerName = '';
  customerMobile = '';
  customerEmail = '';

  paymentLoading = false;
  paymentError = '';

  paymentId = '';

  districts: string[] = [
    'Adilabad',
    'Bhadradri Kothagudem',
    'Hanamkonda',
    'Hyderabad',
    'Jagtial',
    'Jangaon',
    'Jayashankar Bhupalpally',
    'Jogulamba Gadwal',
    'Kamareddy',
    'Karimnagar',
    'Khammam',
    'Komaram Bheem Asifabad',
    'Mahabubabad',
    'Mahabubnagar',
    'Mancherial',
    'Medak',
    'Medchal–Malkajgiri',
    'Mulugu',
    'Nagarkurnool',
    'Nalgonda',
    'Narayanpet',
    'Nirmal',
    'Nizamabad',
    'Peddapalli',
    'Rajanna Sircilla',
    'Rangareddy',
    'Sangareddy',
    'Siddipet',
    'Suryapet',
    'Vikarabad',
    'Wanaparthy',
    'Warangal',
    'Yadadri Bhuvanagiri'
  ];

  availableTimes: string[] = [
    '07:20',
    '08:40',
    '09:00',
    '10:21',
    '16:30',
    '18:45'
  ];


  openBookingModal(): void {

    this.bookingModalOpen = true;

    this.bookingStep = 1;

    this.paymentError = '';

    this.availableBuses = [];

    this.selectedBus = null;

    this.amount = 0;
  }


  closeBookingModal(): void {
    this.bookingModalOpen = false;
  }


  resetBooking(): void {

    this.bookingStep = 1;

    this.pickupDistrict = '';
    this.dropoffDistrict = '';

    this.journeyDate = '';
    this.journeyTime = '';

    this.availableBuses = [];

    this.selectedBus = null;

    this.amount = 0;

    this.customerName = '';
    this.customerMobile = '';
    this.customerEmail = '';

    this.paymentLoading = false;

    this.paymentError = '';
  }


  searchBuses(): void {

    this.paymentError = '';

    if (!this.pickupDistrict) {
      this.paymentError = 'Please select pickup district.';
      return;
    }

    if (!this.dropoffDistrict) {
      this.paymentError = 'Please select drop-off district.';
      return;
    }

    if (this.pickupDistrict === this.dropoffDistrict) {
      this.paymentError = 'Pickup and drop-off districts cannot be same.';
      return;
    }

    if (!this.journeyDate) {
      this.paymentError = 'Please select journey date.';
      return;
    }

    if (!this.journeyTime) {
      this.paymentError = 'Please select journey time.';
      return;
    }

    this.availableBuses = this.generateBuses();

    this.bookingStep = 2;
  }


  generateBuses(): Bus[] {

    const operators = [
      'PayWoo Travels',
      'Payman Travels',
      'TSRTC Express',
      'City Connect',
      'Travel Plus',
      'Smart Travels',
      'Express Line',
      'Green Travels'
    ];

    const busTypes = [
      'AC Seater',
      'AC Sleeper',
      'Non AC Seater',
      'Luxury AC',
      'Volvo AC'
    ];

    const buses: Bus[] = [];

    const count = Math.floor(Math.random() * 6) + 5;

    for (let i = 0; i < count; i++) {

      const fare =
        Math.floor(
          Math.random() * (799 - 300 + 1)
        ) + 300;

      const departureHour =
        6 + Math.floor(Math.random() * 14);

      const departureMinute =
        Math.floor(Math.random() * 6) * 10;

      const arrivalHour =
        departureHour + 4 + Math.floor(Math.random() * 3);

      const departure =
        `${departureHour.toString().padStart(2, '0')}:${departureMinute
          .toString()
          .padStart(2, '0')}`;

      const arrival =
        `${arrivalHour.toString().padStart(2, '0')}:${departureMinute
          .toString()
          .padStart(2, '0')}`;

      buses.push({
        id: i + 1,

        busNumber:
          `TS ${Math.floor(Math.random() * 90) + 10} `
          + `${String.fromCharCode(65 + i)}`
          + `${Math.floor(Math.random() * 9000) + 1000}`,

        operator:
          operators[
            Math.floor(Math.random() * operators.length)
          ],

        departure,

        arrival,

        duration:
          `${4 + Math.floor(Math.random() * 3)}h `
          + `${Math.floor(Math.random() * 50)}m`,

        seats:
          Math.floor(Math.random() * 25) + 10,

        fare,

        type:
          busTypes[
            Math.floor(Math.random() * busTypes.length)
          ]
      });
    }

    return buses;
  }


  selectBus(bus: Bus): void {

    this.selectedBus = bus;

    this.amount = bus.fare;

    this.bookingStep = 3;

    this.paymentError = '';
  }


  backToSearch(): void {

    this.bookingStep = 1;

    this.paymentError = '';
  }


  backToBuses(): void {

    this.bookingStep = 2;

    this.paymentError = '';
  }


  goToDetails(): void {

    if (!this.selectedBus) {
      this.paymentError = 'Please select a bus.';
      return;
    }

    this.bookingStep = 3;
  }


  /* =========================================================
     PAYMENT
  ========================================================= */

  async submitPayment(): Promise<void> {

    this.paymentError = '';

    if (!this.customerName.trim()) {
      this.paymentError = 'Please enter your name.';
      return;
    }

    if (!this.customerMobile.trim()) {
      this.paymentError = 'Please enter mobile number.';
      return;
    }

    if (!/^[6-9]\d{9}$/.test(this.customerMobile.trim())) {
      this.paymentError = 'Please enter a valid 10 digit mobile number.';
      return;
    }

    if (
      this.customerEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        this.customerEmail.trim()
      )
    ) {
      this.paymentError = 'Please enter a valid email address.';
      return;
    }

    if (!this.selectedBus) {
      this.paymentError = 'Please select a bus.';
      return;
    }

    //this.paymentLoading = true;

    this.showSuccess('Payment successful!');

    // try {

    //   const orderId =
    //     'PAYMAN'
    //     + Date.now()
    //     + Math.floor(Math.random() * 1000);

    //   const body = new URLSearchParams();

    //   body.set('orderId', orderId);

    //   body.set(
    //     'amount',
    //     this.amount.toString()
    //   );

    //   body.set(
    //     'actionType',
    //     '1'
    //   );

    //   body.set(
    //     'email',
    //     this.customerEmail || 'customer@payman.in'
    //   );

    //   /*
    //    * Use customer's actual mobile.
    //    */
    //   body.set(
    //     'phone',
    //     this.customerMobile
    //   );

    //   body.set(
    //     'customerMobile',
    //     this.customerMobile
    //   );

    //   body.set(
    //     'customerName',
    //     this.customerName
    //   );

    //   body.set(
    //     'pickup',
    //     this.pickupDistrict
    //   );

    //   body.set(
    //     'dropoff',
    //     this.dropoffDistrict
    //   );

    //   body.set(
    //     'journeyDate',
    //     this.journeyDate
    //   );

    //   body.set(
    //     'journeyTime',
    //     this.journeyTime
    //   );

    //   body.set(
    //     'busNumber',
    //     this.selectedBus.busNumber
    //   );

    //   body.set(
    //     'busOperator',
    //     this.selectedBus.operator
    //   );

    //   body.set(
    //     'fare',
    //     this.amount.toString()
    //   );

    //   /*
    //    * IMPORTANT:
    //    * Do NOT put real card numbers in Angular/frontend.
    //    *
    //    * These were present in the original source.
    //    * Keep payment/card handling on backend.
    //    */
    //   body.set(
    //     'custcard',
    //     ''
    //   );

    //   body.set(
    //     'divice',
    //     'web'
    //   );

    //   const response =
    //     await fetch(
    //       'https://paymove.payman.in/Paymove/Initiate',
    //       {
    //         method: 'POST',

    //         headers: {
    //           'Content-Type':
    //             'application/x-www-form-urlencoded'
    //         },

    //         body: body.toString()
    //       }
    //     );

    //   if (!response.ok) {
    //     throw new Error(
    //       `Payment server returned ${response.status}`
    //     );
    //   }

    //   const result =
    //     await response.json();

    //   if (
    //     result &&
    //     result.success &&
    //     result.url
    //   ) {

    //     window.location.href =
    //       result.url;

    //     return;
    //   }

    //   this.paymentError =
    //     result?.message ||
    //     'Unable to initiate payment. Please try again.';

    // } catch (error) {

    //   console.error(
    //     'Payment initiation error:',
    //     error
    //   );

    //   this.paymentError =
    //     'Unable to connect to payment gateway. Please try again.';
    // } finally {

    //   this.paymentLoading = false;
    // }
  }


  showSuccess(
    paymentId?: string
  ): void {

    this.paymentId =
      paymentId || '';

    this.bookingStep = 4;

    this.paymentLoading = false;
  }


  bookAnother(): void {

    this.resetBooking();

    this.bookingModalOpen = true;
  }


  /* =========================================================
     TESTIMONIALS
  ========================================================= */

  testimonials = [
    {
      name: 'Rahul Kumar',
      role: 'Hyderabad',
      message:
        'The booking process was very simple and the bus arrived on time.',
      rating: 5
    },
    {
      name: 'Priya Reddy',
      role: 'Secunderabad',
      message:
        'Very easy to book tickets. The overall experience was smooth.',
      rating: 5
    },
    {
      name: 'Arjun Sharma',
      role: 'Gachibowli',
      message:
        'Clean buses, easy booking and good customer support.',
      rating: 5
    },
    {
      name: 'Sneha Rao',
      role: 'Madhapur',
      message:
        'I liked how quickly I could search and select a bus.',
      rating: 5
    }
  ];

  currentTestimonial = 0;

  testimonialTimer: any;


  ngOnInit(): void {

    this.testimonialTimer =
      setInterval(() => {

        this.currentTestimonial =
          (
            this.currentTestimonial + 1
          ) % this.testimonials.length;

      }, 5000);
  }


  ngOnDestroy(): void {

    if (this.testimonialTimer) {
      clearInterval(
        this.testimonialTimer
      );
    }
  }


  nextTestimonial(): void {

    this.currentTestimonial =
      (
        this.currentTestimonial + 1
      ) % this.testimonials.length;
  }


  previousTestimonial(): void {

    this.currentTestimonial =
      (
        this.currentTestimonial -
        1 +
        this.testimonials.length
      ) % this.testimonials.length;
  }


  /* =========================================================
     FAQ
  ========================================================= */

  faqs = [
    {
      question:
        'How can I book a bus ticket?',
      answer:
        'Select your pickup and destination, choose your journey date and time, select a bus and enter your passenger details to continue with payment.',
      open: false
    },

    {
      question:
        'Can I select my preferred bus?',
      answer:
        'Yes. After searching your route, available buses will be displayed with operator, timing, bus type, available seats and fare.',
      open: false
    },

    {
      question:
        'How will I receive my booking details?',
      answer:
        'After successful payment, your booking confirmation and payment details can be displayed on the confirmation screen.',
      open: false
    },

    {
      question:
        'Can I cancel my booking?',
      answer:
        'Cancellation depends on the booking and operator cancellation policy. Please check the applicable cancellation terms before completing your booking.',
      open: false
    },

    {
      question:
        'Is online payment secure?',
      answer:
        'Payments are redirected to the configured payment gateway. Card and payment credentials should be handled by the payment gateway rather than stored in the frontend application.',
      open: false
    }
  ];


  toggleFaq(index: number): void {

    this.faqs[index].open =
      !this.faqs[index].open;
  }


  /* =========================================================
     HELPERS
  ========================================================= */

  scrollTo(
    sectionId: string
  ): void {

    document
      .getElementById(sectionId)
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
  }


  formatCurrency(
    amount: number
  ): string {

    return new Intl.NumberFormat(
      'en-IN',
      {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }
    ).format(amount);
  }
}