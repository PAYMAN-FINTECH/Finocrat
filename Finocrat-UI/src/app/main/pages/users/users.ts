import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment.prod';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './users.html',
  styleUrls: ['./users.css']
})
export class UsersComponent implements OnInit {

  private baseUrl = environment.apiUrl

  users: any[] = [];

  showModal = false;
  editMode = false;
  selectedId: string | null = null;

  form!: FormGroup;
  loading = false;

  constructor(private http: HttpClient, private fb: FormBuilder) {}

  ngOnInit() {
    this.initForm();
    this.loadUsers();
  }

  /* ================= INIT FORM ================= */

  initForm() {
    this.form = this.fb.group({
      userName: ['', Validators.required],
      password: [''],
      userPhone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      gender: [''],
      isActive: [true],
      isAdmin: [false]
    });
  }

  /* ================= LOAD USERS ================= */

  loadUsers() {
    this.loading = true;

    this.http.get<any[]>(`${this.baseUrl}/Auth/users`)
      .subscribe({
        next: (res) => {
          this.users = res || [];
          this.loading = false;
        },
        error: (err) => {
          console.error('Load Users Error:', err);
          this.loading = false;
        }
      });
  }

  /* ================= OPEN ADD ================= */

  openAdd() {
    this.editMode = false;
    this.selectedId = null;

    this.form.reset({
      userName: '',
      password: '',
      userPhone: '',
      email: '',
      gender: '',
      isActive: true,
      isAdmin: false
    });

    this.showModal = true;
  }

  /* ================= OPEN EDIT ================= */

  openEdit(user: any) {
    this.editMode = true;
    this.selectedId = user.id;

    this.form.patchValue({
      userName: user.userName,
      password: '',
      userPhone: user.userPhone,
      email: user.email,
      gender: user.gender,
      isActive: user.isActive,
      isAdmin: user.isAdmin
    });

    this.showModal = true;
  }

  /* ================= SAVE ================= */

  save() {

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    const request = this.editMode
      ? this.http.put(`${this.baseUrl}/Auth/${this.selectedId}`, this.form.value)
      : this.http.post(`${this.baseUrl}/Auth/add`, this.form.value);

    request.subscribe({
      next: () => {
        this.loadUsers();
        this.showModal = false;
        this.loading = false;
      },
      error: (err) => {
        console.error('Save Error:', err);
        this.loading = false;
        alert('Something went wrong');
      }
    });
  }

}
