import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './registerServiceWorker'
import '~/../../web_depends/assets/css/theme-green/index.css'

import { TableColumn, Table, DatePicker, Dialog, Card, Button, Select, Input, Notification, Menu, Submenu, MenuItemGroup, MenuItem } from 'element-ui';

Vue.use(TableColumn);
Vue.use(Table);
Vue.use(DatePicker);
Vue.use(Dialog);
Vue.use(Card);
Vue.use(Button);
Vue.use(Select);
Vue.use(Input);
Vue.use(Menu);
Vue.use(Submenu);
Vue.use(MenuItemGroup);
Vue.use(MenuItem);

Vue.config.productionTip = false

Vue.prototype.$notify = {
	success: opts => {
		Notification.success(opts);
	},

	error: opts => {
		Notification.error(opts);
	},

	warn: opts => {
		Notification.warning(opts);
	}
}

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
