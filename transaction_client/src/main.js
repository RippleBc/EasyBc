import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './registerServiceWorker'
import { Card, Button, Select, Input, Notification, Menu, Submenu, MenuItemGroup, MenuItem } from 'element-ui';

Vue.use(Card);
Vue.use(Button);
Vue.use(Select);
Vue.use(Input);
Vue.use(Notification);
Vue.use(Menu);
Vue.use(Submenu);
Vue.use(MenuItemGroup);
Vue.use(MenuItem);

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
