import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'routes', loadChildren: () => import('./remote.routes').then(module => module.REMOTE_ROUTES) },
];
