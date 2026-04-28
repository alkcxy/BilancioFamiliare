import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import LoginView from '../views/LoginView.vue'
import StubView from '../views/StubView.vue'
import TypesList from '../views/types/TypesList.vue'
import TypeShow from '../views/types/TypeShow.vue'
import TypeForm from '../views/types/TypeForm.vue'
import WithdrawalsList from '../views/withdrawals/WithdrawalsList.vue'
import WithdrawalsAll from '../views/withdrawals/WithdrawalsAll.vue'
import WithdrawalsArchive from '../views/withdrawals/WithdrawalsArchive.vue'
import WithdrawalShow from '../views/withdrawals/WithdrawalShow.vue'
import WithdrawalForm from '../views/withdrawals/WithdrawalForm.vue'
import UsersList from '../views/users/UsersList.vue'
import UserShow from '../views/users/UserShow.vue'
import UserForm from '../views/users/UserForm.vue'
import OperationsList from '../views/operations/OperationsList.vue'
import OperationShow from '../views/operations/OperationShow.vue'
import OperationForm from '../views/operations/OperationForm.vue'
import MonthView from '../views/operations/MonthView.vue'
import YearView from '../views/operations/YearView.vue'
import HomeView from '../views/HomeView.vue'

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

    { path: '/', component: HomeView },
    { path: '/operations', component: OperationsList },
    { path: '/operations/new', component: OperationForm },
    { path: '/operations/year/:year', component: YearView },
    { path: '/operations/:year(\\d{4})/:month(\\d{1,2})', component: MonthView },
    { path: '/operations/:id/edit', component: OperationForm },
    { path: '/operations/:id', component: OperationShow },

    { path: '/types', component: TypesList },
    { path: '/types/new', component: TypeForm },
    { path: '/types/:id/edit', component: TypeForm },
    { path: '/types/:id', component: TypeShow },

    { path: '/users', component: UsersList },
    { path: '/users/new', component: UserForm },
    { path: '/users/:id/edit', component: UserForm },
    { path: '/users/:id', component: UserShow },

    { path: '/withdrawals', component: WithdrawalsList },
    { path: '/withdrawals/all', component: WithdrawalsAll },
    { path: '/withdrawals/archive', component: WithdrawalsArchive },
    { path: '/withdrawals/new', component: WithdrawalForm },
    { path: '/withdrawals/:id/edit', component: WithdrawalForm },
    { path: '/withdrawals/:id', component: WithdrawalShow },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.path !== '/login' && !auth.isAuthenticated) {
    return '/login'
  }
})
