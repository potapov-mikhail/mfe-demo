import { Component, DestroyRef, Injector, VERSION, ViewContainerRef, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, type Routes } from '@angular/router';
import { ComponentExport, HOST_NAME, REMOTE_LOADER, RemoteLoader, RoutesExport, SharedIdentity } from './contracts';

function describeIdentity(module: SharedIdentity): string {
  if (module.ANGULAR_VERSION !== VERSION.full) {
    throw new Error(`Версии Angular отличаются: host ${VERSION.full}, remote ${module.ANGULAR_VERSION}`);
  }
  if (module.SHARED_INJECTOR !== Injector || module.SHARED_ROUTER !== Router) {
    throw new Error('Angular или Router продублирован: проверьте shared-зависимости.');
  }
  return `Общий Angular ${VERSION.full} · Injector и Router совпадают`;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header><span class="eyebrow">ANGULAR / MODULE FEDERATION LAB</span>
      <h1>{{ name }}</h1>
      <p>Один remote, два независимых экспорта. Выберите способ загрузки.</p>
      <nav>
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Компонент</a>
        <a routerLink="/remote" routerLinkActive="active">Удалённые маршруты</a>
      </nav>
    </header>
    <main><router-outlet /></main>
    <footer>remote → http://localhost:4201/remoteEntry.js<br>
      <a href="http://localhost:4200">MF host :4200</a> ·
      <a href="http://localhost:4202">Plain host :4202</a> ·
      <a href="http://localhost:4201">Remote :4201</a>
    </footer>
  `,
})
export class HostShell { readonly name = inject(HOST_NAME); }

@Component({
  selector: 'app-widget-demo',
  template: `
    <section class="panel">
      <span class="eyebrow">EXPOSE: ./Component</span>
      <h2>Компонент внутри хоста</h2>
      <p>Код виджета загрузится только после нажатия кнопки.</p>
      <button (click)="load()" [disabled]="loading() || loaded()">
        {{ loading() ? 'Загрузка…' : loaded() ? 'Компонент загружен' : 'Загрузить компонент' }}
      </button>
      @if (error()) { <p role="alert" class="error">{{ error() }}</p> }
      @if (identity()) { <p class="success" data-testid="shared-identity">{{ identity() }}</p> }
      <ng-container #slot />
      @if (loaded()) {
        <label>Input из хоста <input [value]="title()" (input)="updateTitle($event)" /></label>
        <p data-testid="host-event">Последнее событие из remote: {{ lastEvent() }}</p>
        <button class="secondary" (click)="unload()">Удалить компонент</button>
      }
    </section>
  `,
})
export class WidgetDemo {
  readonly title = signal('Привет из хоста');
  readonly loading = signal(false);
  readonly loaded = signal(false);
  readonly error = signal('');
  readonly identity = signal('');
  readonly lastEvent = signal<number | string>('пока нет');
  private readonly slot = viewChild.required('slot', { read: ViewContainerRef });
  private readonly loader = inject(REMOTE_LOADER);
  private readonly destroyRef = inject(DestroyRef);
  private component?: ReturnType<ViewContainerRef['createComponent']>;
  private unsubscribe?: () => void;

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const module = await this.loader('./Component') as ComponentExport;
      if (this.destroyRef.destroyed) return;
      this.identity.set(describeIdentity(module));
      const component = this.slot().createComponent(module.RemoteWidgetComponent);
      component.setInput('title', this.title());
      const subscription = component.instance.incremented.subscribe(value => this.lastEvent.set(value));
      this.unsubscribe = () => subscription.unsubscribe();
      component.onDestroy(() => subscription.unsubscribe());
      this.component = component;
      this.loaded.set(true);
    } catch (error) {
      this.error.set(`Не удалось загрузить remote. Проверьте порт 4201 и попробуйте снова. ${String(error)}`);
    } finally {
      this.loading.set(false);
    }
  }
  updateTitle(event: Event): void {
    this.title.set((event.target as HTMLInputElement).value);
    this.component?.setInput('title', this.title());
  }
  unload(): void {
    this.unsubscribe?.();
    this.slot().clear();
    this.component = undefined;
    this.loaded.set(false);
    this.identity.set('');
    this.lastEvent.set('пока нет');
  }
}

@Component({
  selector: 'app-remote-error',
  imports: [RouterLink],
  template: `<section class="panel"><h2>Remote недоступен</h2>
    <p role="alert">Не удалось загрузить удалённые маршруты. Проверьте remote на порту 4201.</p>
    <p>После запуска remote обновите страницу, чтобы повторить загрузку маршрутов.</p>
    <a routerLink="/">Вернуться к локальному компоненту</a></section>`,
})
export class RemoteError {}

export function hostRoutes(loader: RemoteLoader): Routes {
  return [
    { path: '', pathMatch: 'full', component: WidgetDemo },
    {
      path: 'remote',
      loadChildren: async () => {
        try {
          const module = await loader('./Routes') as RoutesExport;
          console.info('[MF: ./Routes]', describeIdentity(module));
          return module.REMOTE_ROUTES;
        } catch (error) {
          console.error('[MF: ./Routes]', error);
          // Router caches loaded route configs; reload the page after recovery.
          return [{ path: '**', component: RemoteError }];
        }
      },
    },
    { path: '**', redirectTo: '' },
  ];
}
