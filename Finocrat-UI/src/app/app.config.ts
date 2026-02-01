import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { AuthService } from './services/eduservices/auth.service';
import { provideToastr } from 'ngx-toastr';
import { provideAnimations } from '@angular/platform-browser/animations';
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),   // 👈 THIS IS MANDATORY
    provideHttpClient()  ,
    provideAnimations(),
    provideToastr({
      positionClass: 'toast-top-right',   // ✅ IMPORTANT LINE
      timeOut: 3000,
      closeButton: true,
      progressBar: true
    })   // 👈 REQUIRED FOR API CALLS
    ,
    {
      provide: APP_INITIALIZER,
      useFactory: (auth: AuthService) => {
        return () => {
          // Clear any existing token on fresh application start
          auth.logout();
        };
      },
      deps: [AuthService],
      multi: true
    }
  ]
};
