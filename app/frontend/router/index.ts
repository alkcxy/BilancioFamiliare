import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import LoginView from '../views/LoginView.vue'
import StubView from '../views/StubView.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/login', component: LoginView },
    {
      path: '/logout',
      redirect: '/login',
      beforeEnter: () => {
        const auth = useAuthStore()
        auth.clearToken()
      },
    },

    { path: '/', component: StubView },
    { path: '/operations', component: StubView },
    { path: '/operations/new', component: StubView },
    { path: '/operations/year/:year', component: StubView },
    { path: '/operations/:year(\\d{4})/:month(\\d{1,2})', component: StubView },
    { path: '/operations/:id', component: StubView },
    { path: '/operations/:id/edit', component: StubView },

    { path: '/types', component: StubView },
    { path: '/types/new', component: StubView },
    { path: '/types/:id', component: StubView },
    { path: '/types/:id/edit', component: StubView },

    { path: '/users', component: StubView },
    { path: '/users/new', component: StubView },
    { path: '/users/:id', component: StubView },
    { path: '/users/:id/edit', component: StubView },

    { path: '/withdrawals', component: StubView },
    { path: '/withdrawals/all', component: StubView },
    { path: '/withdrawals/archive', component: StubView },
    { path: '/withdrawals/new', component: StubView },
    { path: '/withdrawals/:id', component: StubView },
    { path: '/withdrawals/:id/edit', component: StubView },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.path !== '/login' && !auth.isAuthenticated) {
    return '/login'
  }
})
