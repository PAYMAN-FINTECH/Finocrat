import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HomeService } from '../../../services/mainservices/home.service';

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

  users: any[] = [];
  selectedUserPhone = '';

  loading = false;
  message = '';

  showAddSection = false;
  newKey = '';
  newValue: any = '';
  newValueType = 'string';

  constructor(private service: HomeService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  // ================= USERS =================
  loadUsers() {
    this.service.getUsers().subscribe({
      next: (res: any) => this.users = res,
      error: (err) => console.error(err)
    });
  }

  // ================= USER CHANGE =================
  onUserChange() {
    if (!this.selectedUserPhone) return;
    this.loadSettings();
  }

  // ================= LOAD SETTINGS =================
  loadSettings() {
    this.loading = true;

    this.service.getUserLookup(this.selectedUserPhone).subscribe({
      next: (res) => {
        this.settings = res;
        this.keys = Object.keys(this.settings);
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  // ================= SAVE =================
  save() {
    this.loading = true;

    this.service.saveUserLookup({
      userPhone: this.selectedUserPhone,
      settings: this.settings
    }).subscribe({
      next: () => {
        this.loading = false;
        this.message = 'Saved Successfully';
        setTimeout(() => this.message = '', 3000);
      },
      error: () => this.loading = false
    });
  }

  // ================= UTIL =================
  isBoolean(val: any) {
    return typeof val === 'boolean';
  }

  toggleAdd() {
    this.showAddSection = !this.showAddSection;
  }

  addSetting() {

    if (!this.newKey.trim()) return;

    let val: any = this.newValue;

    if (this.newValueType === 'number')
      val = Number(this.newValue);

    if (this.newValueType === 'boolean')
      val = this.newValue === true || this.newValue === 'true';

    this.settings[this.newKey] = val;
    this.keys = Object.keys(this.settings);

    this.newKey = '';
    this.newValue = '';
    this.toggleAdd();
  }
}
