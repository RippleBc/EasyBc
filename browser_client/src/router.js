import Vue from 'vue';
import Router from 'vue-router';
import Home from './view/Home.vue';
import Transactions from "./view/Transactions.vue";
import Blocks from "./view/Blocks.vue";
import SmartContracts from "./view/SmartContracts.vue";
import NodeMember from "./view/NodeMember.vue";
import Account from "./view/Account.vue";
import subHome from "./view/subHome.vue";
import shouye from "./view/shouye.vue";

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      component: shouye
    },
    {
      path:'/subhome',
      component: subHome,
      redirect: "/home",
      children: [
        {
          // 当 /user/:id/profile 匹配成功，
          // UserProfile 会被渲染在 User 的 <router-view> 中
          path: '/home',
          component: Home
        },
        {
          path:'/transactions',
          component: Transactions
        },
        {
          path:"/blocks",
          component:Blocks
        },
        {
          path:'/smartcontracts',
          component:SmartContracts
        },
        {
          path:'/nodemember',
          component:NodeMember
        },
        {
          path:'/account',
          component:Account
        }
      ]
    },

  ]
})
