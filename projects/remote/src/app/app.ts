import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { RemoteWidgetComponent } from './remote-widget';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet, RemoteWidgetComponent],
  template: `<header><span class="eyebrow">ANGULAR / MODULE FEDERATION LAB</span>
    <h1>Remote · два экспорта</h1><p>Приложение работает самостоятельно и отдаёт код обоим хостам.</p>
    <nav><a routerLink="/">Обзор</a><a routerLink="/routes">Маршруты</a></nav></header>
    <main><section class="panel"><remote-widget /></section><router-outlet /></main>
    <footer><a href="http://localhost:4200">MF host :4200</a> · <a href="http://localhost:4202">Plain host :4202</a></footer>`
})
export class App {}
