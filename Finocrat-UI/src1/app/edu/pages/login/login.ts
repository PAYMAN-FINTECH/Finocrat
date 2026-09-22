import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/eduservices/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements OnInit {

  loginForm!: FormGroup;
  submitted = false;
  showSignupSuccess = false;
  isLoading = false; // 👈 ADD THIS

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {

    // Show signup success message
    const nav = this.router.getCurrentNavigation();
    if (nav?.extras?.state?.['signupSuccess']) {
      this.showSignupSuccess = true;
      setTimeout(() => this.showSignupSuccess = false, 3000);
    }

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  onLogin(): void {
    this.submitted = true;
    if (this.loginForm.invalid) return;
    this.isLoading = true; // 👈 START LOADING

    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        this.isLoading = false; // 👈 STOP LOADING
        console.log('Login response:', res);
        // Navigate to My Learning and pass backend message (fallback if missing)
        this.router.navigate(['/edu/my-learning'], {
          state: { loginSuccess: true, message: res?.message ?? 'Login successful' }
        });
      },
      error: (err) => {
        this.isLoading = false; // 👈 STOP LOADING
        alert(err?.error?.message || 'Invalid credentials');
      }
    });
  }
}
