import { hostRoutes } from '../../../host-ui/host';
import { loadRemote } from './federation';

export const routes = hostRoutes(loadRemote);
