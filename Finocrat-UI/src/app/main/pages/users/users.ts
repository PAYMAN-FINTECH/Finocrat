import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './users.html',
  styleUrls: ['./users.css']
})
export class UsersComponent implements OnInit {

  baseUrl = 'https://thefinocrat.com/api';
  users: any[] = [];
  margins: any[] = [];

  showModal = false;
  editMode = false;
  selectedId: string | null = null;

  form!: FormGroup;

  constructor(private http: HttpClient, private fb: FormBuilder) {}

  ngOnInit() {
    this.initForm();
    this.loadUsers();
    this.loadMargins();
  }

  /* ---------------- FORM INIT ---------------- */

  initForm() {
    this.form = this.fb.group({
      userName: ['', Validators.required],
      password: [''],
      userPhone: ['', Validators.required],
      email: ['', Validators.required],
      gender: [''],
      marginId: ['', Validators.required],
      isActive: [true],
      isRazorpayEnabled: [false]
    });
  }

  /* ---------------- LOAD USERS ---------------- */

  loadUsers() {
    this.http.get<any[]>(`${this.baseUrl}/Auth/users`)
      .subscribe({
        next: (res) => {
          this.users = res;
        },
        error: (err) => {
          console.error('Load Users Error:', err);
        }
      });
  }

  /* ---------------- LOAD MARGINS ---------------- */

  loadMargins() {
    this.http.get<any[]>(`${this.baseUrl}/Auth/margin`)
      .subscribe({
        next: (res) => {
          this.margins = res;
        },
        error: (err) => {
          console.error('Load Margins Error:', err);
        }
      });
  }

  /* ---------------- OPEN ADD ---------------- */

  openAdd() {
    this.editMode = false;
    this.selectedId = null;

    this.form.reset({
      userName: '',
      password: '',
      userPhone: '',
      email: '',
      gender: '',
      marginId: '',
      isActive: true,
      isRazorpayEnabled: false
    });

    this.showModal = true;
  }

  /* ---------------- OPEN EDIT ---------------- */

  openEdit(user: any) {
    this.editMode = true;
    this.selectedId = user.id;

    this.form.patchValue({
      userName: user.userName,
      password: '',
      userPhone: user.userPhone,
      email: user.email,
      gender: user.gender,
      marginId: user.marginId,
      isActive: user.isActive,
      isRazorpayEnabled: user.isRazorpayEnabled
    });

    this.showModal = true;
  }

  /* ---------------- SAVE ---------------- */

  save() {
    if (this.form.invalid) return;

    const request = this.editMode
      ? this.http.put(`${this.baseUrl}/Auth/${this.selectedId}`, this.form.value)
      : this.http.post(`${this.baseUrl}/Auth/add`, this.form.value);

    request.subscribe({
      next: () => {
        debugger;
        this.loadUsers();       // refresh table
        this.showModal = false; // close popup
      },
      error: (err) => {
        console.error('Save Error:', err);
        alert('Something went wrong. Please check console.');
      }
    });
  }

}