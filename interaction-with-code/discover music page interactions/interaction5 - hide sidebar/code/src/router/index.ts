import { createRouter, createWebHashHistory, type NavigationGuardWithThis } from 'vue-router';
const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/discovery',
      meta: { auth: false }
    },
    {
      path: '/discovery',
      name: 'discovery',
      component: () => import('@/views/home/DiscoveryView.vue'),
      meta: { auth: false }
    }
  ]
});
export const registerRouteHook = (beforeEachFn: NavigationGuardWithThis<undefined>, beforeResolveFn: NavigationGuardWithThis<undefined>) => {
  router.beforeEach(beforeEachFn);
  router.beforeResolve(beforeResolveFn);
};
export default router;