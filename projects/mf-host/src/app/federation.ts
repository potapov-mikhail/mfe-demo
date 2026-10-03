import { loadRemoteModule } from '@angular-architects/module-federation';
import type { RemoteLoader } from '../../../host-ui/contracts';

export const loadRemote: RemoteLoader = exposedModule => loadRemoteModule({
  type: 'script',
  remoteEntry: 'http://localhost:4201/remoteEntry.js',
  remoteName: 'remote',
  exposedModule,
});
