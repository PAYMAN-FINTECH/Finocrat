import { Routes } from '@angular/router';

// EDU PAGES
import { HomeComponent } from './edu/pages/home/home';
import { AboutComponent } from './edu/pages/about/about';
import { ContactComponent } from './edu/pages/contact/contact';
import { TermsComponent } from './edu/pages/terms/terms';
import { PrivacyComponent } from './edu/pages/privacy/privacy';
import { RefundComponent } from './edu/pages/refund/refund';
import { CoursesComponent } from './edu/pages/courses/courses';
import { CourseDetailsComponent } from './edu/pages/course-details/course-details';
import { LoginComponent } from './edu/pages/login/login';
import { SignupComponent } from './edu/pages/signup/signup';
import { MyLearningComponent } from './edu/pages/my-learning/my-learning';

// MAIN APP
import { DashboradComponent } from './main/pages/dashborad/dashborad';
import { AppEntryComponent } from './app-entry/app-entry';
import { AboutUsComponent } from './main/pages/about-us/about-us';
import { ContactUsComponent } from './main/pages/contact-us/contact-us';
import { ServicesComponent } from './main/pages/services/services';
import { MainLoginComponent } from './main/pages/login/login';
import { AuthGuard } from './services/mainservices/auth.guard';
import { LoginGuard } from './services/mainservices/login.auth.guard';
import { MainLayout } from './main/pages/main-layout/main-layout';
import { FinhomeComponent } from './main/pages/home/home';
import { WalletComponent } from './main/pages/wallet/wallet';
import { AdminUserLookupComponent } from './main/pages/admin-user-lookup/admin-user-lookup';
import { UsersComponent } from './main/pages/users/users';
import { PayInHistoryComponent } from './main/pages/payin-history/payin-history';
import { EduWalletComponent } from './edu/pages/edu-wallet/edu-wallet';
import { CcBillPaymentComponent } from './main/pages/cc-bill-payment/cc-bill-payment';
import { PrivacyPolicy } from './main/pages/privacy-policy/privacy-policy';
import { RefundPolicy } from './main/pages/refund-policy/refund-policy';
import { TermsConditions } from './main/pages/terms-conditions/terms-conditions';
import { PayoutHistoryComponent } from './main/pages/payout-history/payout-history';
import { ProfileComponent } from './main/pages/profile/profile';
import { KycComponent } from './main/pages/kyc/kyc';
import { ForgotPasswordComponent } from './main/pages/forgot-password/forgot-password';
import { AdminDashboardComponent } from './main/pages/admin-dashboard/admin-dashboard';

export const routes: Routes = [
  // ENTRY POINT (decides based on domain)
  {
    path: '',
    component: AppEntryComponent
  },

  // EDU ROUTES (only used on edu.thefinocrat.com)
  {
    path: 'edu',
    children: [
      { path: '', component: HomeComponent },
      { path: 'about', component: AboutComponent },
      
      { path: 'contact', component: ContactComponent },
      { path: 'terms', component: TermsComponent },
      { path: 'privacy', component: PrivacyComponent },
      { path: 'refund', component: RefundComponent },
      { path: 'courses', component: CoursesComponent },
      { path: 'course-details/:id', component: CourseDetailsComponent },
      { path: 'login', component: LoginComponent },
      { path: 'signup', component: SignupComponent },
      { path: 'my-learning', component: MyLearningComponent },
      { path: 'edu-wallet', component: EduWalletComponent },
    ]
  },

 // MAIN APP ROUTES
{
  path: 'dashboard',
  children: [
    { path: '', component: DashboradComponent },
    { path: 'privacy-policy', component: PrivacyPolicy },
    { path: 'refund-policy', component: RefundPolicy },
    { path: 'terms-conditions', component: TermsConditions },
    { path: 'login', component: MainLoginComponent },
    { path: 'kyc' , component: KycComponent},
    { path: 'about', component: AboutUsComponent },
    { path: 'contact', component: ContactUsComponent },
    { path: 'services', component: ServicesComponent },
    { path: 'forgot-password', component: ForgotPasswordComponent}
  ]
},

// // Separate login route
// { 
//   path: 'dashboard/login', 
//   component: MainLoginComponent, 
//   canActivate: [LoginGuard] 
// },

// --------- AUTHENTICATED APP (WITH SIDEBAR) ----------
{
  path: 'app',
  component: MainLayout,      // <-- SIDEBAR + HEADER WRAPPER
  canActivate: [AuthGuard],
  children: [
    { path: 'finhome', component: FinhomeComponent },
    { path: 'wallet', component: WalletComponent },
    { path: 'cc', component: CcBillPaymentComponent },
    { path: 'admin-user-lookup', component: AdminUserLookupComponent },
    { path: 'users', component: UsersComponent },
    { path: 'payin-history', component: PayInHistoryComponent },
    { path: 'payout-history', component: PayoutHistoryComponent },
    { path: 'profile', component: ProfileComponent},
    { path: 'admin-dash', component: AdminDashboardComponent}


  ]
},

  // FALLBACK
  { path: '**', redirectTo: '' }
];
