import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { HOST_NAME, REMOTE_LOADER } from '../../../host-ui/contracts';
import { loadRemote } from './federation';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: HOST_NAME, useValue: 'Plain host · стандартный Angular builder' },
    { provide: REMOTE_LOADER, useValue: loadRemote },
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes)
  ]
};
