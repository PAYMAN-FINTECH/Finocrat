import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment.prod';
import { TokenService } from '../../../services/mainservices/token.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './users.html',
  styleUrls: ['./users.css']
})
export class UsersComponent implements OnInit {

  private baseUrl = environment.apiUrl;

  users: any[] = [];
  userTypes: any[] = [];

  showModal = false;
  editMode = false;
  selectedId: string | null = null;

  form!: FormGroup;
  loading = false;

  constructor(private http: HttpClient, private fb: FormBuilder, private tokenService: TokenService,) {}

  ngOnInit() {
    this.initForm();
    this.loadUsers();
    this.loadUserTypes();
  }

  initForm() {
    this.form = this.fb.group({
      userName: ['', Validators.required],
      password: [''],
      userPhone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      gender: [''],
      isActive: [true],
      isAdmin: [false],
      userTypeId: ['', Validators.required],  
      currentLoginPhone: '' // new dropdown field
    });
  }

  loadUsers() {
    var loginUser = this.tokenService.getuserPhone();

    this.loading = true;
    this.http.get<any[]>(`${this.baseUrl}/Auth/users?userPhone=${loginUser}`)
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

  loadUserTypes() {
    var loginUser = this.tokenService.getuserPhone();
    this.http.get<any[]>(`${this.baseUrl}/Auth/UserTypes?userPhone=${loginUser}`)
      .subscribe({
        next: (res) => {
          this.userTypes = res || [];
        },
        error: (err) => {
          console.error('Load User Types Error:', err);
          // fallback static data
          this.userTypes = [
            { id: 1, name: 'Super Distribution' },
            { id: 2, name: 'Distribution' },
            { id: 3, name: 'Retailer' }
          ];
        }
      });
  }

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
      isAdmin: false,
      userTypeId: '',
      currentLoginPhone: ''
    });
    this.showModal = true;
  }

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
      isAdmin: user.isAdmin,
      userTypeId: user.userTypeId
    });
    this.showModal = true;
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const user = this.tokenService.getuserPhone();
    this.form.patchValue({ currentLoginPhone: user });

    this.loading = true;
    const payload = this.form.value;

    const request = this.editMode
      ? this.http.put(`${this.baseUrl}/Auth/${this.selectedId}`, payload)
      : this.http.post(`${this.baseUrl}/Auth/add`, payload);

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