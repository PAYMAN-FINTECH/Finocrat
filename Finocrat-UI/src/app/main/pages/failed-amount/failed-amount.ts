import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HomeService } from '../../../services/mainservices/home.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-failed-amount',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './failed-amount.html',
  styleUrls: ['./failed-amount.css']
})
export class FailedAmountComponent implements OnInit {

  users: any[] = [];

  model: any = {
    userId: '',
    mode: '',
    amount: null,
    orderId: '',
    refId: '',
    customerMobile: ''

  };

  modes = [
    { name: 'PayIn', value: 'PayIn' },
    { name: 'PayOut', value: 'PayOut' },
    { name: 'Credit Card', value: 'CC' }
  ];

  isLoading = false;

  constructor(private adminService: HomeService,  private router: Router, private toastr: ToastrService,) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  // ✅ LOAD USERS
  loadUsers() {
    this.adminService.getAllUsers().subscribe({
      next: (res: any) => {
        this.users = res || [];
      },
      error: () => alert("Failed to load users ❌")
    });
  }

  // ✅ VALIDATION
  isValid(): boolean {
    if (!this.model.userId) {
      alert("Select User");
      return false;
    }

    if (!this.model.mode) {
      alert("Select Mode");
      return false;
    }

    if (!this.model.amount || this.model.amount <= 0) {
      alert("Enter valid amount");
      return false;
    }

    if (!this.model.refId) {
      alert("Reference ID is required (important for duplicate check)");
      return false;
    }

    return true;
  }

  // ✅ SUBMIT
  submit() {

    if (!this.isValid()) return;

    // 🔥 CONFIRMATION (VERY IMPORTANT)
    const confirmAction = confirm(
      `Are you sure?\n\nUser: ${this.model.userId}\nAmount: ₹${this.model.amount}`
    );

    if (!confirmAction) return;

    this.isLoading = true;

    const payload = {
      UserId: this.model.userId,
      Mode: this.model.mode,
      Amount: Number(this.model.amount),
      OrderId: this.model.orderId || '',
      RefId: this.model.refId,
      CustomerMobile: this.model.customerMobile || ''
    };

    console.log("Submit Payload 👉", payload);

    this.adminService.addFailedAmount(payload).subscribe({
      next: (res: any) => {

        this.isLoading = false;

        if (res.success) {
          this.toastr.success("Amount Added Successfully ✅");
            this.router.navigate(['/app/finhome']).then(() => {
    window.location.reload(); // reload dashboard & wallet data
  });

          this.resetForm();
        } else {
          this.toastr.error(res.message || "Failed ❌");
        }
      },
      error: () => {
        this.isLoading = false;
        this.toastr.error("Server Error ❌");
      }
    });
  }

  // ✅ RESET
  resetForm() {
    this.model = {
      userId: '',
      mode: '',
      amount: null,
      orderId: '',
      refId: '',
      customerMobile: ''
    };
  }
}