import { Routes } from '@angular/router';
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

export const routes: Routes = [
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
  { path: 'my-learning', component: MyLearningComponent }, // 👈 ADD THIS

  { path: '**', redirectTo: '' }   // 👈 ALWAYS LAST
];

