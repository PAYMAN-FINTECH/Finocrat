import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';

import { routes } from './app.routes';
import { AuthService } from './services/eduservices/auth.service';
import { loaderInterceptor } from './services/mainservices/loader.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // ✅ Router
    provideRouter(routes),

    // ✅ HTTP Client (For API Calls)
    provideHttpClient(withInterceptors([loaderInterceptor])),

    // ✅ Required for Toastr
    provideAnimations(),

    // ✅ Toastr Configuration
    provideToastr({
      positionClass: 'toast-top-right',
      timeOut: 3000,
      closeButton: true,
      progressBar: true,
      preventDuplicates: true
    }),

    // ✅ Run on App Start
    {
      provide: APP_INITIALIZER,
      useFactory: (auth: AuthService) => {
        return () => {
          // Optional: Clear token on fresh start
          auth.logout();
        };
      },
      deps: [AuthService],
      multi: true
    }
  ]
};
