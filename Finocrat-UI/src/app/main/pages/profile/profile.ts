import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TokenService } from '../../../services/mainservices/token.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class ProfileComponent implements OnInit {

  user: any = {
    name: '',
    email: '',
    userPhone: ''
  };

  isEditing = false;
  isLoading = false;

  constructor(
    private tokenService: TokenService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    const data = this.tokenService.getUser();
    if (data) {
      this.user = {
        name: data.name || '',
        email: data.email || '',
        userPhone: data.userPhone || ''
      };
    }
  }

  enableEdit() {
    this.isEditing = true;
  }

  cancelEdit() {
    this.isEditing = false;
    this.ngOnInit(); // reload original data
  }

  saveProfile() {
    this.isLoading = true;

    // 👉 simulate API (replace with real API)
    setTimeout(() => {
      this.isLoading = false;
      this.isEditing = false;

      // update local storage
      localStorage.setItem('user', JSON.stringify(this.user));

      this.toastr.success('Profile updated successfully');
    }, 1000);
  }
}
