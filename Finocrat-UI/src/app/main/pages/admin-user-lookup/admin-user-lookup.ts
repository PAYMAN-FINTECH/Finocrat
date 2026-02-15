import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HomeService } from '../../../services/mainservices/home.service';
import { TokenService } from '../../../services/mainservices/token.service';

@Component({
  selector: 'app-admin-user-lookup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-user-lookup.html',
  styleUrls: ['./admin-user-lookup.css']
})
export class AdminUserLookupComponent implements OnInit {

  settings: any = {};
  keys: string[] = [];

  loading = false;
  message = '';

  username: string = '';
  userId: string = '';
  userPhone: string = '';

  // 🔹 ADD FEATURE PROPERTIES
  showAddSection = false;
  newKey: string = '';
  newValue: any = '';
  newValueType: string = 'string'; // string | number | boolean

  constructor(
    private service: HomeService,
    private tokenService: TokenService
  ) {}

  ngOnInit(): void {
    const user = this.tokenService.getUser();

    if (user) {
      this.username = user.name;
      this.userId = user.userId;
      this.userPhone = user.userPhone;
    }

    this.loadSettings();
  }

  // =============================
  // LOAD SETTINGS
  // =============================
  loadSettings() {
    this.loading = true;

    this.service.getUserLookup(this.userPhone).subscribe({
      next: (res) => {
        this.settings = res || {};
        this.keys = Object.keys(this.settings);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  // =============================
  // SAVE SETTINGS
  // =============================
  save() {
    this.loading = true;

    const payload = {
      userPhone: this.userPhone,
      settings: this.settings
    };

    this.service.saveUserLookup(payload).subscribe({
      next: () => {
        this.loading = false;
        this.message = 'Saved Successfully';
        setTimeout(() => this.message = '', 3000);
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  // =============================
  // BOOLEAN CHECK
  // =============================
  isBoolean(value: any): boolean {
    return typeof value === 'boolean';
  }

  // =============================
  // TOGGLE ADD SECTION
  // =============================
  toggleAdd() {
    this.showAddSection = !this.showAddSection;
    this.newKey = '';
    this.newValue = '';
    this.newValueType = 'string';
  }

  // =============================
  // ADD NEW SETTING
  // =============================
  addSetting() {

    if (!this.newKey || this.newKey.trim() === '') {
      alert('Key is required');
      return;
    }

    if (this.settings.hasOwnProperty(this.newKey)) {
      alert('Key already exists');
      return;
    }

    let finalValue: any;

    switch (this.newValueType) {
      case 'number':
        finalValue = Number(this.newValue);
        break;

      case 'boolean':
        finalValue = this.newValue === true || this.newValue === 'true';
        break;

      default:
        finalValue = this.newValue;
    }

    this.settings[this.newKey] = finalValue;
    this.keys = Object.keys(this.settings);

    this.toggleAdd();
  }

}