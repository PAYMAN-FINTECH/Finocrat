// fastag/components/fastag-header/fastag-header.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { FastagAuthService } from '../../../services/fastgservices/fastag-auth.service';

@Component({
  selector: 'app-fastag-header',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <header class="fastag-header">
      <div class="container">
        <div class="logo">
          <a routerLink="/fastag">
            <span class="logo-icon">🚗</span>
            <span class="logo-text">Finocrat FASTag</span>
          </a>
        </div>
        
        <!-- <nav class="nav-links">
          <a routerLink="/fastag" routerLinkActive="active">Recharge</a>
          <a routerLink="/fastag/history" routerLinkActive="active">History</a>
          <a routerLink="/fastag/support" routerLinkActive="active">Support</a>
        </nav> -->

        <!-- Login/User Section -->
        <div class="user-section">
          <div *ngIf="!isLoggedIn" class="auth-buttons">
            <button class="btn-login" (click)="openLoginModal()">Login</button>
            <button class="btn-signup" (click)="openSignupModal()">Sign Up</button>
          </div>
          <div *ngIf="isLoggedIn" class="user-menu" (click)="toggleDropdown()">
            <div class="user-avatar">
              {{ userName.charAt(0) || 'U' }}
            </div>
            <span class="user-name">{{ userName }}</span>
            <span class="dropdown-icon">▼</span>
            <div class="dropdown-menu" *ngIf="showDropdown">
              <a (click)="goToProfile()">My Profile</a>
              <a (click)="logout()">Logout</a>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Login Modal -->
    <div class="modal-overlay" *ngIf="showLoginModal" (click)="closeModals()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Login to Your Account</h3>
          <button class="close-btn" (click)="closeModals()">✕</button>
        </div>
        <div class="modal-body">
          <form (ngSubmit)="onLogin()">
            <div class="form-group">
              <label>Email / Mobile Number</label>
              <input type="text" [(ngModel)]="loginData.email" name="email" required placeholder="Enter email or mobile">
            </div>
            <div class="form-group">
              <label>Password</label>
              <input type="password" [(ngModel)]="loginData.password" name="password" required placeholder="Enter password">
            </div>
            <div class="form-footer">
              <a (click)="openForgotPassword()">Forgot Password?</a>
            </div>
            <button type="submit" class="btn-submit" [disabled]="isLoading">
              {{ isLoading ? 'Logging in...' : 'Login' }}
            </button>
            <p class="switch-auth">
              Don't have an account? 
              <a (click)="switchToSignup()">Sign Up</a>
            </p>
          </form>
        </div>
      </div>
    </div>

    <!-- Signup Modal -->
    <div class="modal-overlay" *ngIf="showSignupModal" (click)="closeModals()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Create New Account</h3>
          <button class="close-btn" (click)="closeModals()">✕</button>
        </div>
        <div class="modal-body">
          <form (ngSubmit)="onSignup()">
            <div class="form-row">
              <div class="form-group">
                <label>First Name</label>
                <input type="text" [(ngModel)]="signupData.firstName" name="firstName" required placeholder="First name">
              </div>
              <div class="form-group">
                <label>Last Name</label>
                <input type="text" [(ngModel)]="signupData.lastName" name="lastName" required placeholder="Last name">
              </div>
            </div>
            <div class="form-group">
              <label>Email Address</label>
              <input type="email" [(ngModel)]="signupData.email" name="email" required placeholder="Enter email">
            </div>
            <div class="form-group">
              <label>Mobile Number</label>
              <input type="tel" [(ngModel)]="signupData.phone" name="phone" maxlength="10" required placeholder="10-digit mobile number">
            </div>
            <div class="form-group">
              <label>Password</label>
              <input type="password" [(ngModel)]="signupData.password" name="password" required placeholder="Create password">
            </div>
            <div class="form-group">
              <label>Confirm Password</label>
              <input type="password" [(ngModel)]="signupData.confirmPassword" name="confirmPassword" required placeholder="Confirm password">
            </div>
            <div class="form-group">
              <label>Gender</label>
              <select [(ngModel)]="signupData.gender" name="gender">
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <button type="submit" class="btn-submit" [disabled]="isLoading">
              {{ isLoading ? 'Creating Account...' : 'Sign Up' }}
            </button>
            <p class="switch-auth">
              Already have an account? 
              <a (click)="switchToLogin()">Login</a>
            </p>
          </form>
        </div>
      </div>
    </div>

    <!-- Forgot Password Modal -->
    <div class="modal-overlay" *ngIf="showForgotModal" (click)="closeModals()">
      <div class="modal-container small" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Reset Password</h3>
          <button class="close-btn" (click)="closeModals()">✕</button>
        </div>
        <div class="modal-body">
          <form (ngSubmit)="onForgotPassword()">
            <div class="form-group">
              <label>Email / Mobile Number</label>
              <input type="text" [(ngModel)]="forgotData.email" name="email" required placeholder="Enter registered email or mobile">
            </div>
            <button type="submit" class="btn-submit" [disabled]="isLoading">
              {{ isLoading ? 'Sending...' : 'Send Reset Link' }}
            </button>
            <p class="switch-auth">
              <a (click)="switchToLogin()">Back to Login</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .fastag-header {
      background: white;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      padding: 15px 0;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo a {
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .logo-icon {
      font-size: 28px;
    }
    .logo-text {
      font-size: 20px;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .nav-links {
      display: flex;
      gap: 30px;
    }
    .nav-links a {
      text-decoration: none;
      color: #4a5568;
      font-weight: 500;
      transition: color 0.2s;
      cursor: pointer;
    }
    .nav-links a:hover, .nav-links a.active {
      color: #667eea;
    }
    
    /* User Section */
    .user-section {
      position: relative;
    }
    .auth-buttons {
      display: flex;
      gap: 12px;
    }
    .btn-login, .btn-signup {
      padding: 8px 20px;
      border-radius: 25px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s;
      border: none;
    }
    .btn-login {
      background: transparent;
      color: #667eea;
      border: 1px solid #667eea;
    }
    .btn-login:hover {
      background: #667eea;
      color: white;
    }
    .btn-signup {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .btn-signup:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    .user-menu {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      position: relative;
      padding: 5px 10px;
      border-radius: 30px;
      background: #f8fafc;
    }
    .user-avatar {
      width: 35px;
      height: 35px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 16px;
    }
    .user-name {
      font-size: 14px;
      font-weight: 500;
      color: #334155;
    }
    .dropdown-icon {
      font-size: 10px;
      color: #94a3b8;
    }
    .dropdown-menu {
      position: absolute;
      top: 100%;
      right: 0;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      min-width: 150px;
      margin-top: 10px;
      overflow: hidden;
      z-index: 1000;
    }
    .dropdown-menu a {
      display: block;
      padding: 12px 20px;
      color: #334155;
      text-decoration: none;
      font-size: 14px;
      transition: background 0.2s;
      cursor: pointer;
    }
    .dropdown-menu a:hover {
      background: #f1f5f9;
    }
    
    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.6);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal-container {
      background: white;
      border-radius: 24px;
      width: 90%;
      max-width: 450px;
      max-height: 90vh;
      overflow-y: auto;
      animation: slideUp 0.3s ease;
    }
    .modal-container.small {
      max-width: 380px;
    }
    @keyframes slideUp {
      from {
        transform: translateY(30px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
    .modal-header {
      padding: 20px 24px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .modal-header h3 {
      margin: 0;
      color: #1e293b;
    }
    .close-btn {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #94a3b8;
    }
    .modal-body {
      padding: 24px;
    }
    .form-group {
      margin-bottom: 18px;
    }
    .form-group label {
      display: block;
      margin-bottom: 6px;
      font-size: 13px;
      font-weight: 500;
      color: #475569;
    }
    .form-group input, .form-group select {
      width: 100%;
      padding: 12px 14px;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      font-size: 14px;
      transition: all 0.3s;
    }
    .form-group input:focus, .form-group select:focus {
      outline: none;
      border-color: #667eea;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }
    .form-footer {
      text-align: right;
      margin-bottom: 20px;
    }
    .form-footer a {
      color: #667eea;
      text-decoration: none;
      font-size: 13px;
      cursor: pointer;
    }
    .btn-submit {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 14px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }
    .btn-submit:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }
    .btn-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .switch-auth {
      text-align: center;
      margin-top: 20px;
      font-size: 13px;
      color: #64748b;
    }
    .switch-auth a {
      color: #667eea;
      text-decoration: none;
      cursor: pointer;
      font-weight: 500;
    }
    
    @media (max-width: 768px) {
      .logo-text { display: none; }
      .nav-links { gap: 15px; }
      .user-name { display: none; }
      .form-row { grid-template-columns: 1fr; }
      .modal-container { max-width: 95%; }
    }
  `]
})
export class FastagHeaderComponent implements OnInit {
  isLoggedIn = false;
  userName = '';
  showDropdown = false;
  isLoading = false;
  
  // Modal visibility
  showLoginModal = false;
  showSignupModal = false;
  showForgotModal = false;
  
  // Form data
  loginData = { email: '', password: '' };
  signupData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    gender: ''
  };
  forgotData = { email: '' };

  constructor(
    private authService: FastagAuthService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit() {
    this.checkLoginStatus();
  }

  checkLoginStatus() {
    this.isLoggedIn = this.authService.isLoggedIn();
    if (this.isLoggedIn) {
      const user = this.authService.getUser();
      this.userName = user?.firstName || user?.name || user?.email?.split('@')[0] || 'User';
    }
  }

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
    this.showDropdown = false;
  }

  switchToSignup() {
    this.closeModals();
    this.openSignupModal();
  }

  switchToLogin() {
    this.closeModals();
    this.openLoginModal();
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  onLogin() {
    if (!this.loginData.email || !this.loginData.password) {
      this.toastr.warning('Please enter email and password');
      return;
    }

    this.isLoading = true;
    this.authService.login(this.loginData).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.authService.saveToken(res.token, res.user);
          this.isLoggedIn = true;
          this.userName = res.user?.firstName || res.user?.name || this.loginData.email.split('@')[0];
          this.toastr.success('Login successful!');
          this.closeModals();
          this.router.navigate(['/fastag']);
        } else {
          this.toastr.error(res.message || 'Login failed');
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.toastr.error(err.error?.message || 'Login failed');
        this.isLoading = false;
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

    this.isLoading = true;
    this.authService.signup(this.signupData).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.toastr.success('Account created successfully! Please login.');
          this.closeModals();
          this.openLoginModal();
        } else {
          this.toastr.error(res.message || 'Signup failed');
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.toastr.error(err.error?.message || 'Signup failed');
        this.isLoading = false;
      }
    });
  }

  onForgotPassword() {
    if (!this.forgotData.email) {
      this.toastr.warning('Please enter email or mobile number');
      return;
    }

    this.isLoading = true;
    this.authService.forgotPassword(this.forgotData).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.toastr.success('Reset link sent to your email!');
          this.closeModals();
          this.openLoginModal();
        } else {
          this.toastr.error(res.message || 'Failed to send reset link');
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.toastr.error(err.error?.message || 'Failed to send reset link');
        this.isLoading = false;
      }
    });
  }

  goToProfile() {
    this.showDropdown = false;
    this.router.navigate(['/fastag/profile']);
  }

  logout() {
    this.authService.logout();
    this.isLoggedIn = false;
    this.userName = '';
    this.showDropdown = false;
    this.toastr.success('Logged out successfully');
    this.router.navigate(['/fastag']);
  }
}