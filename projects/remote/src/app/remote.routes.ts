import { Component, Injector, VERSION, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet, type Routes } from '@angular/router';

export const SHARED_INJECTOR = Injector;
export const SHARED_ROUTER = Router;
export const ANGULAR_VERSION = VERSION.full;

@Component({
  selector: 'remote-page',
  imports: [RouterLink, RouterOutlet],
  template: `<section class="panel">
    <span class="eyebrow">EXPOSE: ./Routes</span><h2>Удалённый раздел</h2>
    <p>Эта страница и её дочерние маршруты пришли из remote.</p>
    <p>Текущий URL из общего Router: <strong>{{ router.url }}</strong></p>
    <nav><a routerLink="./">Обзор</a><a routerLink="details">Детали</a></nav>
    <router-outlet />
  </section>`,
})
export class RemotePage { readonly router = inject(Router); }

@Component({ selector: 'remote-overview', template: `<h3>Обзор remote</h3><p>Это дочерний маршрут по умолчанию.</p>` })
export class RemoteOverview {}

@Component({ selector: 'remote-details', template: `<h3>Детали remote</h3><p>Дочерний маршрут /details работает внутри маршрутизации хоста.</p>` })
export class RemoteDetails {}

export const REMOTE_ROUTES: Routes = [{
  path: '', component: RemotePage,
  children: [
    { path: '', pathMatch: 'full', component: RemoteOverview },
    { path: 'details', component: RemoteDetails },
  ],
}];
