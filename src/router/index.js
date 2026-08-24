import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes = [
  {
    path: '/',
    component: () => import('../layouts/AppLayout.vue'),
    children: [
      { path: '', name: 'home', component: () => import('../views/HomeView.vue') },
      { path: 'pretraga', name: 'search', component: () => import('../views/SearchView.vue') },
      { path: 'pjesma/:slug', name: 'song', component: () => import('../views/SongView.vue'), props: true },
      { path: 'izvodjac/:slug', name: 'artist', component: () => import('../views/ArtistView.vue'), props: true },
      { path: 'sacuvano', name: 'favorites', component: () => import('../views/FavoritesView.vue'), meta: { requiresAuth: true } }
    ]
  },
  { path: '/prijava', name: 'login', component: () => import('../views/LoginView.vue') },
  { path: '/registracija', name: 'register', component: () => import('../views/RegisterView.vue') },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFoundView.vue') }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: (to, from, saved) => saved || { top: 0 }
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
});

export default router;
