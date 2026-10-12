import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/eduservices/auth.service';
import { RazorPaymentService } from '../../../services/mainservices/razorpayment.service';
import { form } from '@angular/forms/signals';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { HdfcPaymentService } from '../../../services/eduservices/hdfc-payment.service';
import { CourseService } from '../../../services/eduservices/course.service';

declare var Razorpay: any;
@Component({
  selector: 'edu-course-details',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './course-details.html',
  styleUrls: ['./course-details.css']
})
export class CourseDetailsComponent implements OnInit {

  courseId!: number;
  course: any;
  isLoggedIn = false;
  showModal = false;
  isLoading = true;
  notFound = false;

  selectedGateway: string = '';

  showSuccessScreen = false;
  showFailureScreen = false;

 

  buyCourse() {
    this.selectedGateway = '';
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedGateway = '';
  }
goToDashboard(): void {
  this.showSuccessScreen = false;
  this.showFailureScreen = false;
 // this.toastr.success('Payment successful!');
  this.router.navigate(['/edu']);
}

  confirmPurchase() {

     if (!this.selectedGateway) {
    return;
  }

  console.log('Selected Gateway:', this.selectedGateway);

  if(this.selectedGateway === 'REduction') {
     this.razorService.createOrder(this.course.price)
      .subscribe({
        next: (res) => {
          debugger;
          //this.isLoading = false;   // 👈 ADD THIS

          const options: any = {
            key: res.key,
            amount: res.amount * 100,
            currency: "INR",
            order_id: res.orderId,
            name: 'Finocrat Edu',
            description: 'Add Wallet Funds',

            handler: (response: any) => {
              debugger;
               //this.isLoading = true;

              const verifyPayload = {
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                amount: this.course.price,
                mobile: '9849800697',
                selectedGateway: 'Education e',
                loggedInUserPhone: '9849800697',
                cardHolderName: 'Jhon Doe',
                cardHolderCard: '',
                cardHolderMail: 'john.doe@gmail.com'

              };

              this.razorService.verifyPayment(verifyPayload)
                .subscribe({
                  next: (result) => {

                    if (result.status == 'SUCCESS') {
                      this.showSuccessScreen = true;
                            setTimeout(() => {
                              this.goToDashboard();
                             }, 3000);
                    } else {
                      alert("Payment Verification Failed");
                      setTimeout(() => {
                              this.goToDashboard();
                             }, 3000);
                    }
                  },
                  error: () => {
                    alert("Payment Verification Failed");
                    setTimeout(() => {
                              this.goToDashboard();
                             }, 3000);
                  }
                });
            },

            prefill: {
              name: 'Jhon Doe',
              email: 'john.doe@gmail.com',
              contact: '9849800697'
            },

            theme: { color: '#6A1B9A' }
          };

          const rzp = new Razorpay(options);
          rzp.open();
        },
        error: () => {
          alert("Unable to create payment order");
        }
      });

  }

  if(this.selectedGateway == 'HEduction'){
    this.HdfcSmartpayment();

  }

  if(this.selectedGateway == 'TAEduction'){
    this.startTAPayment();

  }

   

    // alert('✅ Purchase successful (Demo)');
    // this.showModal = false;
    // this.router.navigate(['/edu']);
  }

   // =====================================================
  // PAY NOW
  // =====================================================
 HdfcSmartpayment(): void {

    //this.errorMessage = '';


    // ---------------------------------------------------
    // Validate amount
    // ---------------------------------------------------

    if (!this.course.price ||
        this.course.price <= 0) {

      // this.errorMessage =
      //   'Please enter a valid amount.';

      return;
    }


   // this.loading = true;


    // ---------------------------------------------------
    // Customer details
    // ---------------------------------------------------

    const customerId =
      'testingcustomerone1hhh';


    const request = {

      amount:
        Number(this.course.price),

      customerId:
        customerId,

      customerEmail: 'edudemo@gmail.com',

      customerPhone:
        '9849800697',

      firstName: 'jurra',

      lastName:
        'EduTest',
      selectedGateway: 'HEducationedu',
      loggedInUserPhone: '9849800697',
      cardnum: '433333333333333'

    };


    console.log(
      'Creating HDFC payment:',
      request
    );


    // ---------------------------------------------------
    // Create HDFC Session
    // ---------------------------------------------------

    this.hdfcPaymentService
      .createPayment(request)
      .subscribe({

        next: (response) => {

          console.log(
            'HDFC Create Response:',
            response
          );


          //this.loading = false;


          if (
            response.success &&
            response.paymentUrl
          ) {

            // ------------------------------------------------
            // Save order information locally
            // ------------------------------------------------

            sessionStorage.setItem(
              'hdfc_order_id',
              response.orderId
            );


            sessionStorage.setItem(
              'hdfc_customer_id',
              customerId
            );


            // ------------------------------------------------
            // Redirect to HDFC
            // ------------------------------------------------

            window.location.href =
              response.paymentUrl;

          }
          else {

            // this.errorMessage =
            //   'HDFC payment link was not generated.';
          }
        },


        error: (error) => {

          console.error(
            'HDFC payment error:',
            error
          );


          //this.loading = false;


          // this.errorMessage =
          //   error?.error?.message ||
          //   'Unable to create payment.';
        }
      });
  }


  startTAPayment(): void {


  const request = {
    amount: Number(this.course.price),
    email: 'test@example.com',
    phone: '9999999999',
    name: 'Test User',
    selectedGateway: 'TA PAY',
    loggedInUserPhone: '9849800697',
    cardnum: '4111111111111111' 
  };

  this.hdfcPaymentService.createTAPayment(request)
    .subscribe({
      next: (response) => {

        console.log('TA Payment Create Response:', response);

        if (response?.success && response?.paymentUrl) {

          // Redirect to the payment gateway
          window.location.href = response.paymentUrl;

        } else {

          alert(
            response?.message ||
            'TA payment link was not generated.'
          );
        }
      },

      error: (error) => {

        console.error('TA payment error:', error);

        alert(
          error?.error?.message ||
          'Unable to initiate payment. Please try again.'
        );
      }
    });
}

  constructor(private route: ActivatedRoute,private authService: AuthService,private router: Router,  private razorService: RazorPaymentService, private toastr: ToastrService,private hdfcPaymentService: HdfcPaymentService, private courseService: CourseService) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.courseId = Number(this.route.snapshot.paramMap.get('id'));

    if (!this.courseId) {
      this.isLoading = false;
      this.notFound = true;
      return;
    }

    this.courseService.getById(this.courseId).subscribe({
      next: course => {
        this.course = course;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.notFound = true;
      }
    });
  }

}
