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
      { path: 'my-learning', component: MyLearningComponent }
    ]
  },

  // MAIN APP ROUTES
  {
    path: 'dashboard',
    children: [
      { path: '', component: DashboradComponent },
      { path: 'about', component: AboutUsComponent },
      { path: 'contact', component: ContactUsComponent },    
      { path: 'services', component: ServicesComponent }
    ]
  },

  // FALLBACK
  { path: '**', redirectTo: '' }
];
