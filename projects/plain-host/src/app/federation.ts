import * as core from '@angular/core';
import * as common from '@angular/common';
import * as router from '@angular/router';
import * as platformBrowser from '@angular/platform-browser';
import * as rxjs from 'rxjs';
import { createInstance } from '@module-federation/enhanced/runtime';
import type { ComponentExport, RemoteLoader, RoutesExport } from '../../../host-ui/contracts';
import { version as rxjsVersion } from 'rxjs/package.json';

// esbuild cannot generate Webpack's share scope. Supply the host's actual
// module namespaces explicitly; these include Angular's AOT runtime exports.
const singleton = (lib: unknown, version: string) => ({
  version,
  lib: () => lib,
  shareConfig: { singleton: true, requiredVersion: version, strictVersion: true },
});

let runtime: ReturnType<typeof createInstance> | undefined;
export const loadRemote: RemoteLoader = async exposed => {
  runtime ??= createInstance({
    name: 'plain_host',
    remotes: [{
      name: 'remote', entry: 'http://localhost:4201/remoteEntry.js',
      type: 'global', entryGlobalName: 'remote',
    }],
    shared: {
      '@angular/core': singleton(core, core.VERSION.full),
      '@angular/common': singleton(common, core.VERSION.full),
      '@angular/router': singleton(router, core.VERSION.full),
      '@angular/platform-browser': singleton(platformBrowser, core.VERSION.full),
      'rxjs': singleton(rxjs, rxjsVersion),
    },
  });
  const module = await runtime.loadRemote<RoutesExport | ComponentExport>(`remote/${exposed.slice(2)}`);
  if (!module) throw new Error(`Remote не вернул ${exposed}`);
  return module;
};
