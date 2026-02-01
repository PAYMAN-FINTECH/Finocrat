import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MainAuthService } from '../../../services/mainservices/mainauth.service';
import { ToastrService } from 'ngx-toastr';
import { TokenService } from '../../../services/mainservices/token.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class MainLoginComponent implements OnInit {

  loginForm!: FormGroup;
  loading = false;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: MainAuthService,
    private router: Router,
    private toastr: ToastrService,
    private tokenService: TokenService
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      userId: ['', Validators.required],
      password: ['', Validators.required],
      rememberMe: [true]
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.toastr.warning('Please enter User ID and Password', 'Login Required');
      return;
    }

    this.loading = true;

    const payload = this.loginForm.value;

    this.authService.login(payload).subscribe({
      next: (res) => {
        debugger;
        this.loading = false;
        this.authService.saveSession(res.token, false);

        const user = {
    name: 'ACHYUTH BUTTI',
    userId: 'PSR3163'
  };
        this.tokenService.saveToken(res.token, user);

        this.toastr.success('Login successful!', 'Welcome');
       this.router.navigate(['/app/finhome']);

      },
      error: (err) => {
        this.loading = false;
        const msg = err?.error?.message || 'Invalid credentials';
        this.toastr.error(msg, 'Login Failed');
      }
    });
  }
}
