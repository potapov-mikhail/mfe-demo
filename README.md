# Angular Module Federation Lab

Учебный стенд: один remote с двумя экспортами и два способа его загрузки.
Все приложения созданы стандартным Angular CLI, затем MF-конфигурация добавлена в `mf-host` и `remote`.

| Приложение | URL | Сборка | Загрузчик |
| --- | --- | --- | --- |
| `mf-host` | http://localhost:4200 | `ngx-build-plus:browser` / Webpack | Angular Architects `loadRemoteModule` |
| `remote` | http://localhost:4201 | `ngx-build-plus:browser` / Webpack | Отдаёт `remoteEntry.js` |
| `plain-host` | http://localhost:4202 | **`@angular/build:application` / esbuild** | Enhanced MF pure runtime |

Angular 20.3.33, CLI 20.3.37, Angular Architects MF 20.0.0, Enhanced MF 2.9.2.
Точные версии записаны в `package.json` и `package-lock.json`. Рекомендуется Node.js 24 LTS; стенд создан на Node 24.16.0.

## Запуск

```sh
npm ci
npm start
```

Открыть http://localhost:4200 и http://localhost:4202. `npm start` запускает все три приложения.
Первичная Webpack-сборка может занять некоторое время. Дождитесь готовности всех трёх серверов.

Для отдельных терминалов:

```sh
npm run start:remote
npm run start:mf-host
npm run start:plain-host
```

Для production-сборок:

```sh
npm run build
npm run serve:dist
```

`serve:dist` обслуживает те же порты с CORS и fallback на index.html для маршрутов SPA.
Перед переключением с dev на production остановите dev-серверы, чтобы освободить порты.

## 1. Что отдаёт remote

В `projects/remote/webpack.config.js`:

```js
exposes: {
  './Routes': './projects/remote/src/app/remote.routes.ts',
  './Component': './projects/remote/src/app/remote-widget.ts',
}
```

Это **один remote, два exposed-модуля**, а не два remote-приложения.
`remoteEntry.js` содержит контейнер и информацию о загрузке chunks. Сам код экспортов загружается лениво.

- `./Routes` отдаёт `REMOTE_ROUTES`: удалённую страницу с дочерними маршрутами обзора и деталей.
- `./Component` отдаёт `RemoteWidgetComponent`: standalone-виджет с input `title`, output `incremented` и локальным счётчиком.
- Оба экспорта также отдают ссылки на `Injector`, `Router` и версию Angular для диагностики sharing.

Remote работает самостоятельно: http://localhost:4201/routes/details.
Его `App` и `bootstrap.ts` не запускаются при загрузке экспорта в хост: хост сам создаёт компонент или подключает маршруты.

Контейнер имеет `library: { type: 'var', name: 'remote' }`: classic script публикует `window.remote`.
В конфигурации явно отключён module output Angular-билдера, иначе `import.meta` несовместим с такой загрузкой.
`publicPath: 'auto'` позволяет remote загружать chunks со своего адреса.

## 2. Хост с MF-конфигурацией

Начните с `projects/mf-host/src/app/federation.ts`.
`loadRemoteModule` загружает script-контейнер, инициализирует его общим Webpack share scope и получает нужный export.
Адрес remote задаётся при выполнении приложения; статических imports из исходников remote нет.

`main.ts` делает `import('./bootstrap')`: асинхронная граница позволяет Webpack подготовить shared-зависимости до Angular bootstrap.
`webpack.config.js` подключает Module Federation Plugin через Angular Architects.

Общий список зависимостей для MF-хоста и remote находится в `federation.shared.js`.
`singleton: true` требует общую копию зависимости, `strictVersion: true` проверяет совместимость версии.
В этом стенде используются точные одинаковые версии.

## 3. Хост на стандартном Angular-билдере

Начните с `projects/plain-host/src/main.ts`, затем `projects/plain-host/src/app/federation.ts`.

У приложения обычный `bootstrapApplication`, нет Webpack-конфигурации и MF build-плагина.
В `angular.json` остаются `@angular/build:application` и `@angular/build:dev-server`.
MF подключён **как runtime-библиотека**, поэтому приложение уже умеет потреблять remote, хотя его сборка не настроена на федерацию.
Наличие Webpack-зависимостей в общем workspace не меняет билдер этого приложения.

Загрузчик выполняет:

1. При первом запросе создаёт Enhanced MF runtime через `createInstance`.
2. Регистрирует глобальный remote с URL `remoteEntry.js` и именем `remote`.
3. Передаёт собственные namespaces `@angular/core`, `@angular/common`, `@angular/router`, `@angular/platform-browser`, `rxjs` через `shared.lib`.
4. Вызывает `loadRemote('remote/Routes')` либо `loadRemote('remote/Component')`.
5. Передаёт результат Angular Router или механизму создания компонента.

Именно пункт 3 заменяет share scope, который обычный esbuild-билдер сам не генерирует.
Remote уже скомпилирован Angular AOT-компилятором; хост загружает готовый JavaScript.
Одного `import(remoteEntryUrl)` или добавления script недостаточно: контейнер нужно инициализировать и передать ему Angular-зависимости.

Полные namespaces Angular сохраняют runtime-экспорты `ɵ…`, необходимые AOT-коду remote.
Цена простого учебного решения — более крупная initial-сборка plain-host; стандартный бюджет 500 kB может выдавать предупреждение.
Это осознанный компромисс стенда, не оптимизация размера production-приложения.
Если remote начнёт использовать вторичные entrypoints, например `@angular/common/http`, их тоже нужно согласованно добавить в shared обеих конфигураций.

## 4. Как Angular использует exports

`projects/host-ui/host.ts` содержит одинаковый локальный интерфейс обоих хостов; он собирается в каждый хост обычным способом.
Этот каталог не является remote или дополнительным MF-контейнером.

- `hostRoutes()` использует `loadChildren` и возвращает `REMOTE_ROUTES` из remote.
- `WidgetDemo.load()` получает класс и вызывает `ViewContainerRef.createComponent()`.
- `setInput('title', ...)` передаёт и обновляет input.
- Подписка на `incremented` принимает событие; она снимается при уничтожении компонента.
- `ViewContainerRef.clear()` уничтожает виджет. Повторное создание начинает новый счётчик, но не выгружает загруженный JS из браузера.

Встраиваемому компоненту доступен injector хоста. `RemotePage` использует общий `Router` через `inject(Router)`.
Проверка сравнивает ссылки на классы Injector и Router, а не только строки версий: одинаковые версии могут быть двумя отдельными копиями.

Глобальные стили remote автоматически в хост не переносятся. Виджет содержит собственные component styles;
для оформления страниц у всех приложений подключён один локальный файл `projects/host-ui/styles.css`.

## 5. Эксперименты по порядку

1. Откройте MF-хост и DevTools → Network. До нажатия «Загрузить компонент» запросов к remote нет.
2. Нажмите кнопку: появятся `remoteEntry.js`, chunks виджета и сообщение «Injector и Router совпадают».
3. Измените input из хоста, увеличьте счётчик и проверьте output в хосте.
4. Удалите и снова создайте виджет: счётчик начнётся с нуля; код останется закешированным.
5. Откройте «Удалённые маршруты» → «Детали» и обновите `/remote/details`. В Console появится диагностика shared-зависимостей.
6. Повторите всё в plain-host и сравните `federation.ts` двух приложений.
7. Измените текст виджета в remote, дождитесь пересборки и обновите хост. Исходники хоста менять не требуется.
8. Запустите только один хост без remote. Загрузка покажет ошибку, локальный интерфейс продолжит работать.
9. Запустите remote и повторите загрузку компонента. Для восстановления маршрутов обновите страницу: Router кеширует результат `loadChildren`, включая fallback при ошибке.

DevTools → Disable cache удобен для просмотра запросов. HMR remote не гарантирует автоматическое обновление уже загруженного экспорта внутри другого приложения: обновляйте страницу хоста.
URL remote в этом стенде фиксирован для наглядности; в реальном приложении его можно вынести в runtime-конфигурацию.

## Проверки

```sh
npm test
```

Playwright запускает dev-серверы, если plain-host ещё не доступен. Нужен установленный Google Chrome.
Тесты проверяют ленивую загрузку, настоящий sharing, input/output, уничтожение/создание, дочерние маршруты,
прямой URL, ошибки недоступного remote и повторную попытку, самостоятельную работу remote.
Если запускаете серверы сами, запустите все три; Playwright переиспользует уже запущенный стенд.

Для production (при остановленных dev-серверах):

```powershell
npm run build
$env:TEST_PRODUCTION = '1'
npm test
Remove-Item Env:TEST_PRODUCTION
```

## Как создан workspace

Использованы стандартные генераторы, затем schematic MF-плагина:

```sh
npx @angular/cli@20.3.37 new mfe-demo --directory . --create-application=false --skip-git --skip-install --defaults --package-manager=npm
ng generate application mf-host --routing --style=css --standalone --skip-tests
ng generate application remote --routing --style=css --standalone --skip-tests
ng generate application plain-host --routing --style=css --standalone --skip-tests
```

До MF schematic явно заданы `outputPath` для всех проектов: плагину 20 они нужны для обработки multi-project workspace.

```sh
ng generate @angular-architects/module-federation:init --project mf-host --port 4200 --type host --stack module-federation-webpack --skip-confirmation
ng generate @angular-architects/module-federation:init --project remote --port 4201 --type remote --stack module-federation-webpack --skip-confirmation
```

После генерации exports, shared и загрузчики адаптированы под этот эксперимент.
Angular 20 выбран как совместимая база для классического Webpack MF; это не демонстрация Native Federation.

## Документация

- [Angular: стандартные builders](https://angular.dev/tools/cli/build)
- [Module Federation: Angular CLI setup](https://module-federation.io/integrations/framework/angular/angular-cli.html)
- [Enhanced MF: pure runtime и createInstance](https://module-federation.io/guide/runtime/runtime-api)
- [Webpack: ModuleFederationPlugin](https://webpack.js.org/plugins/module-federation-plugin/)
