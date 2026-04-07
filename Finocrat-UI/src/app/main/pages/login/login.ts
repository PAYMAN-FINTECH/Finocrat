import { Component, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MainAuthService } from '../../../services/mainservices/mainauth.service';
import { ToastrService } from 'ngx-toastr';
import { TokenService } from '../../../services/mainservices/token.service';
import { InactivityService } from '../../../services/mainservices/inactivity.service';
import { email } from '@angular/forms/signals';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class MainLoginComponent implements OnInit {

  loginForm!: FormGroup;
  loading = signal(false);
  showPassword = signal(false);
  formValid = signal(false);
  isDisabled = computed(() => this.loading() || !this.formValid());

  constructor(
    private fb: FormBuilder,
    private authService: MainAuthService,
    private router: Router,
    private toastr: ToastrService,
    private tokenService: TokenService,
    private inactivityService: InactivityService
  ) {}

  ngOnInit(): void {
    // Check if already logged in
    const token = this.tokenService.getToken();
    const user = this.tokenService.getUser();
    
    console.log('Login Init - Token:', !!token);
    console.log('Login Init - User:', !!user);
    
    if (token && user) {
      console.log('Already logged in, redirecting');
      if (user.pin) {
        const isPinVerified = sessionStorage.getItem('pin_verified') === 'true';
        if (isPinVerified) {
          this.router.navigate(['/app/finhome']);
        } else {
          this.router.navigate(['/dashboard/verify-pin']);
        }
      } else {
        this.router.navigate(['/dashboard/set-pin']);
      }
      return;
    }
    
    this.loginForm = this.fb.group({
      userId: ['', Validators.required],
      password: ['', Validators.required],
      rememberMe: [true]
    });

    this.loginForm.statusChanges.subscribe(() => {
      this.formValid.set(this.loginForm.valid);
    });

    this.formValid.set(this.loginForm.valid);
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  onLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.toastr.warning('Please enter User ID and Password');
      return;
    }

    this.loading.set(true);

    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        console.log('Login Response:', res);
        
        const userData = res.user || res;
        const authToken = res.token;
        
        console.log('Token to save:', authToken);
        
        const userToSave = {
          name: userData?.name ?? '',
          userId: userData?.userId ?? '',
          userPhone: userData?.userPhone ?? '',
          isAdmin: userData?.isAdmin ?? false,
          isKyc: userData?.iskyc ?? userData?.isKyc ?? false,
          pin: userData?.pin ?? null,
          email: userData?.email ?? ''
        };
        
        console.log('Saving user with PIN:', userToSave.pin);
        
        // Save token and user
        this.tokenService.saveToken(authToken, userToSave);
        
        // Verify token was saved
        const savedToken = this.tokenService.getToken();
        console.log('Verified token saved:', !!savedToken);

        const isKycCompleted = userData?.iskyc ?? userData?.isKyc ?? false;
        
        if (!isKycCompleted) {
          this.toastr.info('Please complete your KYC');
          this.loading.set(false);
          this.router.navigate(['/dashboard/kyc']);
          return;
        }

        this.inactivityService.startWatching(() => {
          console.log('Inactivity timeout triggered');
          window.dispatchEvent(new Event('lockApp'));
        });

        const hasPin = userData?.pin && userData.pin.toString().length > 0;
        
        this.loading.set(false);
        
        if (!hasPin) {
          console.log('No PIN set, navigating to set-pin');
          this.router.navigate(['/dashboard/set-pin']);
        } else {
          console.log('PIN exists, navigating to verify-pin');
          this.router.navigate(['/dashboard/verify-pin']);
        }
      },
      error: (err) => {
        console.error('Login error:', err);
        this.toastr.error(err.error?.message || 'Invalid credentials');
        this.loading.set(false);
      }
    });
  }
}