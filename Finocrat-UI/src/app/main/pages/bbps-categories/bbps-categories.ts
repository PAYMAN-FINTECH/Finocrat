import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment.prod';
import { TokenService } from '../../../services/mainservices/token.service';
import {
  Zap,
  Smartphone,
  Home,
  Tv,
  Droplet,
  Flame,
  Wifi,
  GraduationCap,
  Truck,
  Building2,
  CreditCard,
  Search,
  ChevronRight,
  Loader,
  BarChart3,
  Shield,
  DollarSign,
  Eye,
  Fuel,
  Pill,
  Music,
  Package,
  ArrowLeft
} from 'lucide-angular';

interface BbpsCategory {
  categoryName: string;
  icon: any;
  color: string;
  description: string;
  billerCount?: number;
}

interface BbpsBiller {
  id: number;
  blrId: string;
  blrName: string;
  blrAliasName: string;
  blrCategoryName: string;
  blrCoverage: string;
  iconUrl?: string;
  billerInfo?: string;
  isActive: boolean;
}

@Component({
  selector: 'app-bbps-categories',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, FormsModule],
  templateUrl: './bbps-categories.html',
  styleUrls: ['./bbps-categories.css']
})
export class BbpsCategoriesComponent implements OnInit {

  categories: BbpsCategory[] = [];
  allCategories: BbpsCategory[] = [];
  billers: BbpsBiller[] = [];
  filteredBillers: BbpsBiller[] = [];
  
  searchQuery: string = '';
  billerSearchQuery: string = '';
  isLoading: boolean = true;
  isBillersLoading: boolean = false;
  
  selectedCategory: BbpsCategory | null = null;
  showBillersView: boolean = false;
  selectedBiller: BbpsBiller | null = null;
  billerDetails: any = null;
  fetchValues: { [name: string]: string } = {};
  fetchTouched: boolean = false;
  customerMobile: string = '';
  customerEmail: string = '';
  isFetching: boolean = false;
  fetchError: string = '';
  billDetails: any = null;
  payAmount: number | null = null;
  isPaying: boolean = false;
  payError: string = '';
  payResult: any = null;
  Smartphone = Smartphone;
  Home = Home;
  Tv = Tv;
  Droplet = Droplet;
  Flame = Flame;
  Wifi = Wifi;
  GraduationCap = GraduationCap;
  Truck = Truck;
  Building2 = Building2;
  CreditCard = CreditCard;
  Search = Search;
  ChevronRight = ChevronRight;
  Loader = Loader;
  BarChart3 = BarChart3;
  Shield = Shield;
  DollarSign = DollarSign;
  Eye = Eye;
  Fuel = Fuel;
  Pill = Pill;
  Music = Music;
  Package = Package;
  ArrowLeft = ArrowLeft;

  private baseUrl = environment.apiUrl;

  // Icon mapping for categories with specific keywords
  private iconMap: { [key: string]: any } = {
    'Electricity': Zap,
    'Mobile': Smartphone,
    'Broadband': Wifi,
    'DTH': Tv,
    'Water': Droplet,
    'Gas': Flame,
    'Internet': Wifi,
    'Education': GraduationCap,
    'Logistics': Truck,
    'Insurance': Building2,
    'Credit Card': CreditCard,
    'Fastag': Fuel,
    'Medicine': Pill,
    'Music': Music,
    'LPG': Flame,
    'Loan': DollarSign,
    'Investment': BarChart3,
    'Security': Shield,
    'Entertainment': Music,
    'Subscription': Package
  };

  // Color mapping for visual variety (Material Design Colors)
  private colorMap: { [key: string]: string } = {
    'Electricity': '#FF6B6B',
    'Mobile': '#4ECDC4',
    'Broadband': '#45B7D1',
    'DTH': '#96CEB4',
    'Water': '#FFD93D',
    'Gas': '#6C63FF',
    'Internet': '#74B9FF',
    'Education': '#A29BFE',
    'Logistics': '#FFA502',
    'Insurance': '#6C5CE7',
    'Credit Card': '#00B894',
    'Fastag': '#FF7675',
    'Medicine': '#EE5A6F',
    'Music': '#BE42F5',
    'LPG': '#F79F1F',
    'Loan': '#1DD1A1',
    'Investment': '#5F27CD',
    'Security': '#FF3838',
    'Entertainment': '#A4DE6C',
    'Subscription': '#003D82'
  };

  // Description mapping
  private descriptionMap: { [key: string]: string } = {
    'Electricity': 'Pay your electricity bills online',
    'Mobile': 'Recharge mobile and pay bills',
    'Broadband': 'Pay broadband connection bills',
    'DTH': 'Recharge DTH subscriptions',
    'Water': 'Pay water supply bills',
    'Gas': 'Pay gas utility bills',
    'Internet': 'Pay internet service bills',
    'Education': 'Pay education fees and subscriptions',
    'Logistics': 'Pay shipping and logistics fees',
    'Insurance': 'Pay insurance premiums',
    'Credit Card': 'Pay credit card bills',
    'Fastag': 'Recharge FASTag and toll payments',
    'Medicine': 'Order medicine and healthcare products',
    'Music': 'Subscribe to music streaming services',
    'LPG': 'Book and pay for LPG cylinder refills',
    'Loan': 'Pay your loan EMIs',
    'Investment': 'Manage investments and payments',
    'Security': 'Pay for security and protection services',
    'Entertainment': 'Pay for entertainment and events',
    'Subscription': 'Manage various subscriptions'
  };

  constructor(
    private http: HttpClient,
    private toastr: ToastrService,
    private router: Router,
    private tokenService: TokenService
  ) {}

  ngOnInit(): void {
    this.loadBbpsCategories();
  }

  loadBbpsCategories(): void {
    this.isLoading = true;
    this.http.get<any>(`${this.baseUrl}/BharatConnectBillers/distinct-categories`).subscribe({
      next: (response: any) => {
        if (response && response.success && response.data) {
          const categoryNames = response.data;
          this.allCategories = categoryNames.map((categoryName: string) => ({
            categoryName: categoryName.trim(),
            icon: this.getIconForCategory(categoryName),
            color: this.getColorForCategory(categoryName),
            description: this.getDescriptionForCategory(categoryName)
          }));

          // Sort alphabetically
          this.allCategories.sort((a, b) => a.categoryName.localeCompare(b.categoryName));
          this.categories = [...this.allCategories];
          this.isLoading = false;
          this.toastr.success(`✅ Loaded ${this.categories.length} BBPS categories`);
        } else {
          this.isLoading = false;
          this.toastr.info('No BBPS categories found');
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error loading BBPS categories:', err);
        this.toastr.error('❌ Failed to load BBPS categories');
      }
    });
  }

  getIconForCategory(categoryName: string): any {
    const normalized = categoryName.toLowerCase().trim();
    for (const [key, icon] of Object.entries(this.iconMap)) {
      if (normalized.includes(key.toLowerCase())) {
        return icon;
      }
    }
    return Building2;
  }

  getColorForCategory(categoryName: string): string {
    const normalized = categoryName.toLowerCase().trim();
    for (const [key, color] of Object.entries(this.colorMap)) {
      if (normalized.includes(key.toLowerCase())) {
        return color;
      }
    }

    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFD93D',
      '#6C63FF', '#74B9FF', '#A29BFE', '#FFA502', '#6C5CE7',
      '#00B894', '#FF7675', '#EE5A6F', '#BE42F5', '#F79F1F'
    ];
    const hash = categoryName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }

  getDescriptionForCategory(categoryName: string): string {
    const normalized = categoryName.toLowerCase().trim();
    for (const [key, desc] of Object.entries(this.descriptionMap)) {
      if (normalized.includes(key.toLowerCase())) {
        return desc;
      }
    }
    return 'Pay your bills and manage payments easily';
  }

  onSearch(): void {
    if (!this.searchQuery.trim()) {
      this.categories = [...this.allCategories];
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.categories = this.allCategories.filter(category =>
      category.categoryName.toLowerCase().includes(query) ||
      category.description.toLowerCase().includes(query)
    );
  }

  selectCategory(category: BbpsCategory): void {
    this.selectedCategory = category;
    this.showBillersView = true;
    this.loadBillersForCategory(category.categoryName);
  }

  loadBillersForCategory(categoryName: string): void {
    this.isBillersLoading = true;
    this.billerSearchQuery = '';
    
    this.http.get<any>(`${this.baseUrl}/BharatConnectBillers/category/${categoryName}`).subscribe({
      next: (response: any) => {
        if (response && response.success && response.data) {
          this.billers = response.data;
          this.filteredBillers = [...this.billers];
          this.isBillersLoading = false;
          this.toastr.success(`✅ Loaded ${this.billers.length} billers for ${categoryName}`);
        } else {
          this.isBillersLoading = false;
          this.toastr.info('No billers found for this category');
        }
      },
      error: (err) => {
        this.isBillersLoading = false;
        console.error('Error loading billers:', err);
        this.toastr.error('❌ Failed to load billers');
      }
    });
  }

  onBillerSearch(): void {
    if (!this.billerSearchQuery.trim()) {
      this.filteredBillers = [...this.billers];
      return;
    }

    const query = this.billerSearchQuery.toLowerCase();
    this.filteredBillers = this.billers.filter(biller =>
      biller.blrName.toLowerCase().includes(query) ||
      biller.blrId.toLowerCase().includes(query) ||
      biller.blrAliasName.toLowerCase().includes(query)
    );
  }

  selectBiller(biller: BbpsBiller): void {
    this.toastr.success(`✅ Selected: ${biller.blrName}`);
    this.isBillersLoading = true;
    this.http.post<any>(`${this.baseUrl}/BharatConnectBillers/${encodeURIComponent(biller.blrId)}/info`, {}).subscribe({
      next: (res: any) => {
        this.isBillersLoading = false;
        this.selectedBiller = biller;
        this.billerDetails = res.biller;
        this.fetchValues = {};
        this.billDetails = null;
        this.fetchError = '';
        this.fetchTouched = false;
      },
      error: (err) => {
        this.isBillersLoading = false;
        console.error('Error fetching biller info:', err);
        this.toastr.error(err?.error?.message || '❌ Failed to fetch biller info');
      }
    });
  }

  get visibleParams(): any[] {
    return (this.billerDetails?.inputParams || []).filter((p: any) => p.visibility);
  }

  getParamError(p: any): string {
    const v = (this.fetchValues[p.paramName] || '').trim();
    if (!v) return p.isOptional ? '' : `${p.paramName} is required`;
    if (p.minLength && v.length < p.minLength) return `Minimum ${p.minLength} characters`;
    if (p.maxLength && v.length > p.maxLength) return `Maximum ${p.maxLength} characters`;
    if (p.regEx) {
      try {
        if (!new RegExp(p.regEx).test(v)) return `Invalid ${p.paramName}`;
      } catch { /* ignore regex the browser cannot parse; server validates */ }
    }
    return '';
  }

  get mobileError(): string {
    const m = (this.customerMobile || '').trim();
    if (!m) return 'Customer mobile is required';
    return /^[6-9][0-9]{9}$/.test(m) ? '' : 'Enter a valid 10 digit mobile number';
  }

  isFetchFormValid(): boolean {
    return !this.mobileError && this.visibleParams.every(p => !this.getParamError(p));
  }

  formatPaise(v: any): string {
    const n = Number(v);
    if (v === null || v === undefined || v === '' || isNaN(n)) return '-';
    return '₹ ' + (n / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  submitFetch(): void {
    this.fetchTouched = true;
    this.fetchError = '';
    if (!this.isFetchFormValid()) {
      this.toastr.warning('Please correct the highlighted fields');
      return;
    }
    const body = {
      customerMobile: this.customerMobile.trim(),
      customerEmail: this.customerEmail.trim(),
      inputParams: this.visibleParams
        .map(p => ({ paramName: p.paramName, paramValue: (this.fetchValues[p.paramName] || '').trim() }))
        .filter(i => i.paramValue)
    };
    this.isFetching = true;
    this.billDetails = null;
    this.payResult = null;
    this.payError = '';
    this.http.post<any>(`${this.baseUrl}/BharatConnectBillers/${encodeURIComponent(this.selectedBiller!.blrId)}/fetch-bill`, body).subscribe({
      next: (res) => {
        this.isFetching = false;
        if (res.success) {
          this.billDetails = res.bill;
          this.payAmount = null;
          this.toastr.success('✅ Bill fetched');
        } else {
          this.fetchError = res.message || 'Bill fetch failed';
        }
      },
      error: (err) => {
        this.isFetching = false;
        this.fetchError = err?.error?.message || 'Failed to fetch bill';
      }
    });
  }

  payBill(): void {
    this.payError = '';
    if (!this.billDetails || !this.selectedBiller) return;
    if (!this.payAmount || this.payAmount <= 0) {
      this.payError = 'Enter an amount greater than zero';
      return;
    }

    const userPhone = this.tokenService.getUser()?.userPhone;
    if (!userPhone) {
      this.payError = 'Your session has expired. Please log in again.';
      return;
    }

    const billerResponse: Record<string, string> = {};
    for (const key of ['customerName', 'billAmount', 'billNumber', 'billDate', 'billPeriod', 'dueDate']) {
      const value = this.billDetails[key];
      if (value !== null && value !== undefined && String(value).trim() !== '') {
        billerResponse[key] = String(value).trim();
      }
    }

    const body = {
      userPhone,
      customerMobile: this.customerMobile.trim(),
      customerEmail: this.customerEmail.trim(),
      amount: this.payAmount,
      billerResponse,
      additionalInfo: (this.billDetails.additionalInfo || []).map((i: any) => ({ paramName: i.infoName, paramValue: i.infoValue })),
      inputParams: (this.billDetails.inputParams || []).map((i: any) => ({ paramName: i.paramName, paramValue: i.paramValue }))
    };

    this.isPaying = true;
    this.payResult = null;
    this.http.post<any>(`${this.baseUrl}/BharatConnectBillers/${encodeURIComponent(this.selectedBiller.blrId)}/pay`, body).subscribe({
      next: (res) => {
        this.isPaying = false;
        this.payResult = res;
        if (res.success) {
          this.toastr.success('✅ Payment successful');
          this.payAmount = null;
        } else {
          this.payError = res.message || 'Payment failed';
        }
      },
      error: (err) => {
        this.isPaying = false;
        this.payError = err?.error?.message || 'Failed to pay bill';
      }
    });
  }

  backToBillers(): void {
    this.billDetails = null;
    this.fetchError = '';
    this.payError = '';
    this.payResult = null;
    this.payAmount = null;
    this.selectedBiller = null;
    this.billerDetails = null;
    this.fetchValues = {};
    this.fetchTouched = false;
  }

  backToCategories(): void {
    this.showBillersView = false;
    this.selectedBiller = null;
    this.billerDetails = null;
    this.selectedCategory = null;
    this.billers = [];
    this.filteredBillers = [];
    this.billerSearchQuery = '';
  }

  clearBillerSearch(): void {
    this.billerSearchQuery = '';
    this.filteredBillers = [...this.billers];
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.categories = [...this.allCategories];
  }

  onIconLoadError(event: any): void {
    // If image fails to load, hide it and show default icon
    event.target.style.display = 'none';
  }

  goBack(): void {
    if (this.selectedBiller) {
      this.backToBillers();
    } else if (this.showBillersView) {
      this.backToCategories();
    } else {
      this.router.navigate(['/app/finhome']);
    }
  }
}
