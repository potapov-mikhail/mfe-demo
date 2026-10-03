import { InjectionToken, type Type } from '@angular/core';
import type { Routes } from '@angular/router';

export interface RemoteWidget {
  title: string;
  incremented: { subscribe(callback: (value: number) => void): { unsubscribe(): void } };
}
export interface SharedIdentity {
  SHARED_INJECTOR: unknown;
  SHARED_ROUTER: unknown;
  ANGULAR_VERSION: string;
}
export interface RoutesExport extends SharedIdentity { REMOTE_ROUTES: Routes }
export interface ComponentExport extends SharedIdentity { RemoteWidgetComponent: Type<RemoteWidget> }
export type RemoteExport = './Routes' | './Component';
export type RemoteLoader = (exposed: RemoteExport) => Promise<RoutesExport | ComponentExport>;
export const REMOTE_LOADER = new InjectionToken<RemoteLoader>('REMOTE_LOADER');
export const HOST_NAME = new InjectionToken<string>('HOST_NAME');
