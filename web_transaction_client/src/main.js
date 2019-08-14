import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './registerServiceWorker'
import '~/../../web_depends/assets/css/theme-green/index.css'

import ElementUI from 'element-ui';

Vue.config.productionTip = false
Vue.use(ElementUI, {
	size: 'medium'
});

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
