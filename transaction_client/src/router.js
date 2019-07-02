import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
import Send from './views/Send.vue'
import Transactions from './views/Transactions.vue'

Vue.use(Router)

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/send',
      name: 'send',
      component: Send
    },
    {
      path: '/transactions/:address',
      name: 'transactions',
      component: Transactions
    },
     {
      path: '/transactions',
      name: 'transactions',
      component: Transactions
    }
  ]
})
