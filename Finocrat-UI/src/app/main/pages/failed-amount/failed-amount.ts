import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { HomeService } from '../../../services/mainservices/home.service';

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
    type: '',
    amount: '',
    orderId: '',
    refId: ''
  };

  modes = [
    { name: 'PayIn', value: 'PayIn' },
    { name: 'PayOut', value: 'PayOut' },
    { name: 'Credit Card', value: 'CC' }
  ];

  isLoading = false;

  constructor(private adminService: HomeService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  // LOAD USERS
  loadUsers() {
    this.adminService.getAllUsers().subscribe({
      next: (res: any) => {
        this.users = res || [];
      },
      error: () => alert("Failed to load users")
    });
  }

  // SUBMIT
  submit() {

    if (!this.model.userId || !this.model.mode || !this.model.amount) {
      alert("Please fill all required fields");
      return;
    }

    this.isLoading = true;

    const payload = {
      UserId: this.model.userId,
      Mode: this.model.mode,
      Amount: Number(this.model.amount),
      OrderId: this.model.orderId,
      RefId: this.model.refId
    };

    console.log("Submit Payload 👉", payload);

    this.adminService.addFailedAmount(payload).subscribe({
      next: (res: any) => {

        this.isLoading = false;

        if (res.success) {
          alert("Amount Added Successfully ✅");
          this.resetForm();
        } else {
          alert(res.message || "Failed ❌");
        }
      },
      error: () => {
        this.isLoading = false;
        alert("Error ❌");
      }
    });
  }

  resetForm() {
    this.model = {
      userId: '',
      mode: '',
      amount: '',
      orderId: '',
      refId: ''
    };
  }
}