import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'home',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('./views/Home.vue')
    },
    {
      path: '/send',
      name: 'send',
      component: () => import('./views/Send.vue')
    },
    {
      path: '/transactions/:address',
      name: 'transactions',
      component: () => import('./views/Transactions.vue')
    },
     {
      path: '/transactions',
      name: 'transactions',
      component: () => import('./views/Transactions.vue')
    }
  ]
})
