import { createRouter, createWebHashHistory, type NavigationGuardWithThis } from 'vue-router';
const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/latestMusic',
      meta: { auth: false }
    },
    {
      path: '/latestMusic',
      name: 'latestMusic',
      component: () => import('@/views/music/LatestMusicView.vue'),
      meta: { auth: false }
    }
  ]
});
export const registerRouteHook = (beforeEachFn: NavigationGuardWithThis<undefined>, beforeResolveFn: NavigationGuardWithThis<undefined>) => {
  router.beforeEach(beforeEachFn);
  router.beforeResolve(beforeResolveFn);
};
export default router;