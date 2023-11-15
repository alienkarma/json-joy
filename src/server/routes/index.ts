import {routes} from './routes';
import {TypeSystem} from '../../json-type';
import {TypeRouter} from '../../json-type/system/TypeRouter';
import {TypeRouterCaller} from '../../reactive-rpc/common/rpc/caller/TypeRouterCaller';
import {RpcError} from '../../reactive-rpc/common/rpc/caller';
import type {Services} from '../services/Services';
import type {RouteDeps} from './types';

export const createRouter = (services: Services) => {
  const system = new TypeSystem();
  const r = new TypeRouter({system, routes: {}});
  const deps: RouteDeps = {services};
  return routes(deps)(r);
};

export const createCaller = (services: Services) => {
  const router = createRouter(services);
  const caller = new TypeRouterCaller<typeof router>({
    router,
    wrapInternalError: (error: unknown) => {
      if (error instanceof RpcError) console.error(error.toJson());
      else console.error(error);
      return RpcError.valueFrom(error);
    },
  });
  return caller;
};
