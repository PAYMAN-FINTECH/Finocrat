// main/pages/fastag-bill-payment/fastag-bill-payment.component.ts
import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { TokenService } from '../../../services/mainservices/token.service';
import { HomeService } from '../../../services/mainservices/home.service';
import { FastagService } from '../../../services/fastgservices/fastag.service';
import { FastagAuthService } from '../../../services/fastgservices/fastag-auth.service';

@Component({
  selector: 'app-fastag-bill-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fastag-bill-payment.html',
  styleUrls: ['./fastag-bill-payment.css']
})
export class FastagBillPaymentComponent implements OnInit, AfterViewInit {

  @ViewChild('fastTagProvider') fastTagProviderSelect!: ElementRef;

  // Providers
  providers: any[] = [];
  selectedProvider: any = null;

  // Form Model
  model = {
    vehicleNumber: '',
    mobileNumber: '',
    amount: 0,
    providerId: ''
  };

  // Customer Details
  customerDetails: any = null;
  showCustomerDetails = false;
  showAmountField = false;
  showProcessPay = false;
  showFetchBill = true;

  // User Info
  userPhone = '';
  isLoggedIn = false;

  // Loading States
  isLoading = false;
  isProcessing = false;

  // Login Modal
  showLoginModal = false;
  loginData = { email: '', password: '' };
  showSignupModal = false;
  signupData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    gender: ''
  };
  showForgotModal = false;
  forgotData = { email: '' };

  // Payment Data
  paymentData: any = {};

  constructor(
    private fastagService: FastagService,
    private tokenService: TokenService,
    private toastr: ToastrService,
    private router: Router,
    private homeService: HomeService,
    private authService: FastagAuthService
  ) {}

  ngOnInit(): void {
    this.loadProviders();
    this.checkUserSession();
    this.loadStoredData();
  }

  ngAfterViewInit(): void {
    this.restoreSelectedProvider();
  }

  checkUserSession() {
    const user = this.authService.getUser();
    if (user) {
      this.userPhone = user.userPhone;
      this.isLoggedIn = true;
    }
  }

  loadStoredData() {
    const vehicle = localStorage.getItem('fastag_vehicleNumber');
    const mobile = localStorage.getItem('fastag_mobileNumber');
    const amount = localStorage.getItem('fastag_amount');
    const providerId = localStorage.getItem('fastag_providerId');

    if (vehicle) this.model.vehicleNumber = vehicle;
    if (mobile) this.model.mobileNumber = mobile;
    if (amount) {
      this.model.amount = parseFloat(amount);
      this.showAmountField = true;
      this.showProcessPay = true;
      this.showFetchBill = false;
    }
    if (providerId) this.model.providerId = providerId;

    setTimeout(() => {
      localStorage.removeItem('fastag_vehicleNumber');
      localStorage.removeItem('fastag_mobileNumber');
      localStorage.removeItem('fastag_amount');
      localStorage.removeItem('fastag_providerId');
    }, 1000);
  }

  restoreSelectedProvider() {
    const providerId = localStorage.getItem('fastag_providerId');
    if (providerId && this.fastTagProviderSelect) {
      this.fastTagProviderSelect.nativeElement.value = providerId;
      this.model.providerId = providerId;
    }
  }

  loadProviders() {
    this.fastagService.getFastTagBillers().subscribe({
      next: (res: any) => {
        this.providers = res.billers || [];
        console.log('FASTag providers loaded:', this.providers);
      },
      error: (err) => {
        console.error('Failed to load providers:', err);
        this.toastr.error('Failed to load FASTag providers');
      }
    });
  }

  onProviderChange(event: any) {
    this.model.providerId = event.target.value;
    localStorage.setItem('fastag_providerId', this.model.providerId);
  }

  fetchBill() {
    if (!this.model.providerId) {
      this.toastr.warning('Please select a FASTag provider');
      return;
    }
    if (!this.model.vehicleNumber) {
      this.toastr.warning('Please enter vehicle number');
      return;
    }
    if (!this.model.mobileNumber) {
      this.toastr.warning('Please enter mobile number');
      return;
    }

    this.isLoading = true;

    const payload = {
      creditCardLast4: this.model.vehicleNumber,
      customerMobile: this.model.mobileNumber,
      billerId: this.model.providerId
    };

    this.fastagService.fetchBill(payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;

        if (res.success) {
          this.paymentData = {
            paymentMode: res.paymentMode || '',
            enquiryReferenceId: res.enquiryReferenceId || '',
            param1: res.param1 || '',
            param2: res.param2 || '',
            billDate: res.billDate || '',
            consumerName: res.consumerName || '',
            totalAmount: res.totalAmount || 0,
            billerResponse: res.billerResponse || '',
            additionalInfo: res.adddditionalInfo || '',
            billFetchResponse: res.billFetchResponse || '',
            customerType: res.customerType || ''
          };

          this.customerDetails = {
            name: res.consumerName,
            balance: res.totalAmount,
            maxRecharge: res.minPayable || res.totalAmount
          };

          this.model.amount = res.totalAmount;
          this.showCustomerDetails = true;
          this.showAmountField = true;
          this.showProcessPay = true;
          this.showFetchBill = false;

          localStorage.setItem('fastag_vehicleNumber', this.model.vehicleNumber);
          localStorage.setItem('fastag_mobileNumber', this.model.mobileNumber);
          localStorage.setItem('fastag_amount', this.model.amount.toString());

          this.toastr.success('Bill fetched successfully');
        } else {
          this.toastr.warning(res.message || 'Failed to fetch bill');
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.toastr.error(err.error?.message || 'Failed to fetch bill');
      }
    });
  }

  processPayment() {
    this.checkUserSession();

    if (!this.model.amount || this.model.amount < 100) {
      this.toastr.warning('Minimum recharge amount is ₹100');
      return;
    }

    if (this.model.amount > 99999) {
      this.toastr.warning('Maximum recharge amount is ₹99,999');
      return;
    }

   

    // Check if user is logged in
    if (!this.isLoggedIn) {
      // Save current data to localStorage before showing login
      localStorage.setItem('fastag_vehicleNumber', this.model.vehicleNumber);
      localStorage.setItem('fastag_mobileNumber', this.model.mobileNumber);
      localStorage.setItem('fastag_amount', this.model.amount.toString());
      localStorage.setItem('fastag_providerId', this.model.providerId);
      
      // Show login popup
      this.openLoginModal();
      return;
    }

    // User is logged in, proceed with payment
    this.addFunds();
  }

  // Login Modal Methods
  openLoginModal() {
    this.closeModals();
    this.showLoginModal = true;
    this.loginData = { email: '', password: '' };
  }

  openSignupModal() {
    this.closeModals();
    this.showSignupModal = true;
    this.signupData = {
      firstName: '', lastName: '', email: '', phone: '', 
      password: '', confirmPassword: '', gender: ''
    };
  }

  openForgotPassword() {
    this.closeModals();
    this.showForgotModal = true;
    this.forgotData = { email: '' };
  }

  closeModals() {
    this.showLoginModal = false;
    this.showSignupModal = false;
    this.showForgotModal = false;
  }

  switchToSignup() {
    this.closeModals();
    this.openSignupModal();
  }

  switchToLogin() {
    this.closeModals();
    this.openLoginModal();
  }

  onLogin() {
    if (!this.loginData.email || !this.loginData.password) {
      this.toastr.warning('Please enter email and password');
      return;
    }

    this.isProcessing = true;
    this.authService.login(this.loginData).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.authService.saveToken(res.token, res.user);
          this.isLoggedIn = true;
          this.userPhone = res.user?.phone || res.user?.mobile || '';
          this.toastr.success('Login successful!');
          this.closeModals();
          
          // Reload stored data and proceed with payment
          this.loadStoredData();
          this.addFunds();
        } else {
          this.toastr.error(res.message || 'Login failed');
        }
        this.isProcessing = false;
      },
      error: (err) => {
        this.toastr.error(err.error?.message || 'Login failed');
        this.isProcessing = false;
      }
    });
  }

  onSignup() {
    if (!this.signupData.firstName || !this.signupData.lastName || !this.signupData.email || 
        !this.signupData.phone || !this.signupData.password || !this.signupData.confirmPassword) {
      this.toastr.warning('Please fill all fields');
      return;
    }
    
    if (this.signupData.phone.length !== 10) {
      this.toastr.warning('Please enter valid 10-digit mobile number');
      return;
    }
    
    if (this.signupData.password !== this.signupData.confirmPassword) {
      this.toastr.warning('Passwords do not match');
      return;
    }
    
    if (this.signupData.password.length < 6) {
      this.toastr.warning('Password must be at least 6 characters');
      return;
    }

    this.isProcessing = true;
    this.authService.signup(this.signupData).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.toastr.success('Account created successfully! Please login.');
          this.closeModals();
          this.openLoginModal();
        } else {
          this.toastr.error(res.message || 'Signup failed');
        }
        this.isProcessing = false;
      },
      error: (err) => {
        this.toastr.error(err.error?.message || 'Signup failed');
        this.isProcessing = false;
      }
    });
  }

  onForgotPassword() {
    if (!this.forgotData.email) {
      this.toastr.warning('Please enter email or mobile number');
      return;
    }

    this.isProcessing = true;
    this.authService.forgotPassword(this.forgotData).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.toastr.success('Reset link sent to your email!');
          this.closeModals();
          this.openLoginModal();
        } else {
          this.toastr.error(res.message || 'Failed to send reset link');
        }
        this.isProcessing = false;
      },
      error: (err) => {
        this.toastr.error(err.error?.message || 'Failed to send reset link');
        this.isProcessing = false;
      }
    });
  }

  addFunds(): void {

    
    const payload = {
      name: 'jurra',
      email: 'jurra@example.com',
      mobile: '9876543210',
      amount: this.model.amount,
      category: 'fastag',
      userPhone: '9849800697'
    };

    const encodedData = btoa(JSON.stringify(payload));

    window.location.href =
      `https://edu.thefinocrat.com/edu/edu-wallet?data=${encodedData}`;
  }

  openHistory() {
    this.router.navigate(['/fastag/history']);
  }
}