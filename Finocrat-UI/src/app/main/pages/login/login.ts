import { Component, OnInit, signal, computed, effect } from '@angular/core';
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

  loading = signal(false);
  showPassword = signal(false);

  // 🔥 NEW: form validity signal
  formValid = signal(false);

  // 🔥 computed disabled state
  isDisabled = computed(() =>
    this.loading() || !this.formValid()
  );

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

    // 🔥 Connect form status to signal
    this.loginForm.statusChanges.subscribe(() => {
      this.formValid.set(this.loginForm.valid);
    });

    // Initialize value
    this.formValid.set(this.loginForm.valid);
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  onLogin() {
    debugger;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.toastr.warning('Please enter User ID and Password');
      return;
    }

    //this.loading.set(true);

    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {

        this.authService.saveSession(res.token);

        this.tokenService.saveToken(res.token, {
          name: res.user?.name ?? '',
          userId: res.user?.userId ?? '',
          userPhone: res.user?.userPhone ?? '',
          isAdmin: res.user?.isAdmin ?? false
        });

        this.toastr.success('Login successful!');
        this.router.navigate(['/app/finhome']);
      },
      error: () => {
        this.toastr.error('Invalid credentials');
      },
      complete: () => {
        this.loading.set(false);
      }
    });
  }
}