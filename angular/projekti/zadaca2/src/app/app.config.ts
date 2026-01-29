import { ApplicationConfig, provideBrowserGlobalErrorListeners, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { Config } from './services/config';
import { Authentication } from './services/authentication';
import { credentialsInterceptor } from './interceptors/credentials.interceptor';

export function initializeApp(config: Config, auth: Authentication) {
  return async () => {
    await config.loadConfig();
    await auth.initialize();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([credentialsInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [Config, Authentication],
      multi: true
    }
  ]
};
