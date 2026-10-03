import { Component, EventEmitter, Injector, Input, Output, VERSION, signal } from '@angular/core';
import { Router } from '@angular/router';

// Reference equality lets each host verify real dependency sharing.
export const SHARED_INJECTOR = Injector;
export const SHARED_ROUTER = Router;
export const ANGULAR_VERSION = VERSION.full;

@Component({
  selector: 'remote-widget',
  template: `
    <article>
      <small>REMOTE WIDGET · ./Component</small>
      <h3>{{ title }}</h3>
      <p>Счётчик: <strong data-testid="remote-count">{{ count() }}</strong></p>
      <button (click)="increment()">Увеличить счётчик</button>
      <p>Angular {{ version }} · компонент создан в injector хоста</p>
    </article>
  `,
  styles: `
    :host { display: block; margin: 24px 0; }
    article { padding: 24px; border: 1px solid #78b6a4; border-radius: 16px; background: #edf8f3; color: #153b30; }
    small { letter-spacing: .1em; }
    button { padding: 12px 18px; border: 0; border-radius: 8px; background: #146b54; color: white; cursor: pointer; }
  `,
})
export class RemoteWidgetComponent {
  @Input() title = 'Самостоятельный remote';
  @Output() readonly incremented = new EventEmitter<number>();
  readonly count = signal(0);
  readonly version = VERSION.full;
  increment(): void { this.count.update(value => value + 1); this.incremented.emit(this.count()); }
}
