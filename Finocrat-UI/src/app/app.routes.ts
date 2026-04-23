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
import { PinGuard } from './services/mainservices/pin.guard';
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
import { FailedAmountComponent } from './main/pages/failed-amount/failed-amount';
import { PinVerificationComponent } from './main/pages/pin-verification/pin-verification';
import { SetPinComponent } from './main/pages/set-pin/set-pin';
import { ChangePinComponent } from './main/pages/change-pin/change-pin';
import { VerifyPinPageComponent } from './main/pages/verify-pin-page/verify-pin-page';
import { ForgotPinComponent } from './main/pages/forgot-pin/forgot-pin';
import { PassbookComponent } from './main/pages/pass-book/pass-book';
import { KycDetailsComponent } from './main/pages/kyc-details/kyc-details';
import { FastagLayoutComponent } from './fastag/components/fastag-layout/fastag-layout';
import { FastagHomeComponent } from './fastag/pages/fastag-home/fastag-home';
import { FastagHistoryComponent } from './fastag/pages/fastag-history/fastag-history';
import { PaymentStatusComponent } from './edu/pages/payment-status/payment-status';
import { FastagAboutComponent } from './fastag/pages/fastag-about/fastag-about';
import { FastagPrivacyPolicyComponent } from './fastag/pages/fastag-privacy-policy/fastag-privacy-policy';
import { FastagRefundPolicyComponent } from './fastag/pages/fastag-refund-policy/fastag-refund-policy';
import { FastagTermsComponent } from './fastag/pages/fastag-terms/fastag-terms';
import { FastagContactComponent } from './fastag/pages/fastag-contact/fastag-contact';
import { FastagFaqComponent } from './fastag/pages/fastag-faq/fastag-faq';
import { FastagSupportComponent } from './fastag/pages/fastag-support/fastag-support';

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
      { path: 'payment-status', component: PaymentStatusComponent }
    ]
  },

   // FASTAG ROUTES (Similar to EDU)
  {
    path: 'fastag',
    component: FastagLayoutComponent,
    children: [
      { path: '', component: FastagHomeComponent },
      { path: 'history', component: FastagHistoryComponent },
      { path: 'about', component: FastagAboutComponent },                     // /fastag/about
      { path: 'privacy-policy', component: FastagPrivacyPolicyComponent },    // /fastag/privacy-policy
      { path: 'refund-policy', component: FastagRefundPolicyComponent },      // /fastag/refund-policy
      { path: 'terms', component: FastagTermsComponent },                     // /fastag/terms
      { path: 'contact', component: FastagContactComponent },                 // /fastag/contact
      { path: 'faq', component: FastagFaqComponent },                         // /fastag/faq
      { path: 'support', component: FastagSupportComponent },                 // /fastag/support
      //{ path: 'support', component: FastagSupportComponent }, // Optional
    ]
  },

  // MAIN APP ROUTES (Public & Pre-login)
  {
    path: 'dashboard',
    children: [
      { path: '', component: DashboradComponent },
      { path: 'privacy-policy', component: PrivacyPolicy },
      { path: 'refund-policy', component: RefundPolicy },
      { path: 'terms-conditions', component: TermsConditions },
      { path: 'login', component: MainLoginComponent, canActivate: [LoginGuard] },
      { path: 'kyc', component: KycComponent },
      { path: 'about', component: AboutUsComponent },
      { path: 'contact', component: ContactUsComponent },
      { path: 'services', component: ServicesComponent },
      { path: 'forgot-password', component: ForgotPasswordComponent },
      // PIN Routes
      { path: 'set-pin', component: SetPinComponent, canActivate: [AuthGuard] },
      { path: 'verify-pin', component: VerifyPinPageComponent },
      { path: 'forgot-pin', component: ForgotPinComponent },
    ]
  },

  // AUTHENTICATED APP (WITH SIDEBAR) - Requires PIN verification
  {
    path: 'app',
    component: MainLayout,
    canActivate: [AuthGuard, PinGuard],
    children: [
      { path: 'finhome', component: FinhomeComponent },
      { path: 'wallet', component: WalletComponent },
      { path: 'failed', component: FailedAmountComponent },
      { path: 'cc', component: CcBillPaymentComponent },
      { path: 'admin-user-lookup', component: AdminUserLookupComponent },
      { path: 'users', component: UsersComponent },
      { path: 'payin-history', component: PayInHistoryComponent },
      { path: 'payout-history', component: PayoutHistoryComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'change-pin', component: ChangePinComponent },  // Add this
      { path: 'admin-dash', component: AdminDashboardComponent },
      { path: 'passbook', component: PassbookComponent },
      { path: 'kyc-details', component: KycDetailsComponent }

    ]
  },

  // FALLBACK
  { path: '**', redirectTo: '' }
];