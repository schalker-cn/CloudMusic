import { createRouter, createWebHashHistory, type NavigationGuardWithThis } from 'vue-router';
const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/songList/6775208219',
      meta: { auth: false }
    },
    {
      path: '/songList/:id',
      name: 'songListDetail',
      component: () => import('@/views/songList/SongListDetail.vue'),
      meta: { auth: false }
    }
  ]
});
export const registerRouteHook = (beforeEachFn: NavigationGuardWithThis<undefined>, beforeResolveFn: NavigationGuardWithThis<undefined>) => {
  router.beforeEach(beforeEachFn);
  router.beforeResolve(beforeResolveFn);
};
export default router;