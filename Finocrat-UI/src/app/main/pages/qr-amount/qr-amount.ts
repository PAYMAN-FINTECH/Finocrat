import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HomeService } from '../../../services/mainservices/home.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-qr-amount',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './qr-amount.html',
  styleUrls: ['./qr-amount.css']
})
export class QrAmountComponent implements OnInit {

  users: any[] = [];

  model: any = {
    customerMobileNumber: '',
    customerEmail: '',
    customerName: '',
    amount: null,
    cardNumber: '',
    bankName: '',
    transactionId: '',
    agentMobile: ''
  };

  isLoading = false;

  constructor(private adminService: HomeService, private router: Router, private toastr: ToastrService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    this.adminService.getAllUsers().subscribe({
      next: (res: any) => {
        debugger;
        this.users = res || [];
      },
      error: () => this.toastr.error("Failed to load users ❌")
    });
  }

  onCustomerMobileChange() {
    const selected = this.users.find(u => u.userPhone === this.model.customerMobileNumber);
    if (selected) {
      this.model.customerName = selected.userName;
      this.model.customerEmail = selected.email;
    }
  }

  onCustomerEmailChange() {
    const selected = this.users.find(u => u.email === this.model.customerEmail);
    if (selected) {
      this.model.customerName = selected.userName;
      this.model.customerMobileNumber = selected.userPhone;
    }
  }

  isValid(): boolean {
    if (!this.model.customerMobileNumber) {
      this.toastr.error("Select Customer Mobile Number");
      return false;
    }

    if (!this.model.customerEmail) {
      this.toastr.error("Select Customer Email");
      return false;
    }

    if (!this.model.amount || this.model.amount <= 0) {
      this.toastr.error("Enter valid amount");
      return false;
    }

    if (!this.model.cardNumber) {
      this.toastr.error("Enter Card Number");
      return false;
    }

    if (!this.model.bankName) {
      this.toastr.error("Enter Bank Name");
      return false;
    }

    if (!this.model.transactionId) {
      this.toastr.error("Enter Transaction ID");
      return false;
    }

    if (!this.model.agentMobile) {
      this.toastr.error("Select Agent Mobile");
      return false;
    }

    if (!this.model.customerName) {
      this.toastr.error("Enter Customer Name");
      return false;
    }

    return true;
  }

  submit() {
    if (!this.isValid()) return;

    const confirmAction = confirm(
      `Are you sure?\n\nCustomer Mobile: ${this.model.customerMobileNumber}\nAmount: ₹${this.model.amount}`
    );

    if (!confirmAction) return;

    this.isLoading = true;

    const payload = {
      CustomerMobileNumber: this.model.customerMobileNumber,
      CustomerEmail: this.model.customerEmail,
      Amount: Number(this.model.amount),
      CardNumber: this.model.cardNumber,
      BankName: this.model.bankName,
      TransactionId: this.model.transactionId,
      AgentMobile: this.model.agentMobile,
      CustomerName: this.model.customerName
    };

    console.log("QR Amount Payload 👉", payload);

    this.adminService.addQrAmount(payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;

        if (res.success) {
          this.toastr.success("QR Amount Added Successfully ✅");
          this.router.navigate(['/app/finhome']).then(() => {
            window.location.reload();
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

  resetForm() {
    this.model = {
      customerMobileNumber: '',
      customerEmail: '',
      amount: null,
      cardNumber: '',
      bankName: '',
      transactionId: '',
      agentMobile: '',
      customerName: ''
    };
  }
}
