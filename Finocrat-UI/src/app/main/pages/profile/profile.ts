import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TokenService } from '../../../services/mainservices/token.service';
import { ToastrService } from 'ngx-toastr';
import { HomeService } from '../../../services/mainservices/home.service';

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
    userPhone: '',
    isKyc: false
  };

  isEditing = false;
  isLoading = false;
  originalUser: any = {};

  constructor(
    private tokenService: TokenService,
    private toastr: ToastrService,
    private router: Router,
    private homeService: HomeService
  ) {}

  ngOnInit(): void {
    this.loadUserData();
  }

  loadUserData() {
    const data = this.tokenService.getUser();
    console.log('Profile - User data:', data);
    
    if (data) {
      this.user = {
        name: data.name || '',
        email: data.email || '',
        userPhone: data.userPhone || '',
        isKyc: data.isKyc || false
      };
      // Store original data for cancel
      this.originalUser = { ...this.user };
    }
  }

  enableEdit() {
    this.isEditing = true;
  }

  cancelEdit() {
    this.user = { ...this.originalUser };
    this.isEditing = false;
  }

  saveProfile() {
    if (!this.user.name || !this.user.email) {
      this.toastr.warning('Please fill all required fields');
      return;
    }

    this.isLoading = true;

    // Prepare payload for API
    const payload = {
      UserPhone: this.user.userPhone,
      Name: this.user.name,
      Email: this.user.email
    };

    // Call API to update profile
    this.homeService.updateProfile(payload).subscribe({
      next: (response) => {
        console.log('Profile updated:', response);
        
        // Update local storage with new data
        const currentUser = this.tokenService.getUser();
        const updatedUser = {
          ...currentUser,
          name: this.user.name,
          email: this.user.email
        };
        
        // Save updated user to localStorage
        const token = this.tokenService.getToken();
        this.tokenService.saveToken(token!, updatedUser);
        
        this.isLoading = false;
        this.isEditing = false;
        this.originalUser = { ...this.user };
        
        this.toastr.success('Profile updated successfully');
      },
      error: (err) => {
        console.error('Profile update error:', err);
        this.isLoading = false;
        this.toastr.error(err.error?.message || 'Failed to update profile');
      }
    });
  }

  // Navigate to Change PIN page
  goToChangePin() {
    this.router.navigate(['/app/change-pin']);
  }

  // Logout
  logout() {
    this.tokenService.clear();
    sessionStorage.clear();
    this.router.navigate(['/dashboard/login']);
    this.toastr.success('Logged out successfully');
  }
}