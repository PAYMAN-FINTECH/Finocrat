import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { AuthService } from './services/eduservices/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),   // 👈 THIS IS MANDATORY
    provideHttpClient()      // 👈 REQUIRED FOR API CALLS
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
