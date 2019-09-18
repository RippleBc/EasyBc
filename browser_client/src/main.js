import Vue from 'vue'
import Echarts from 'echarts';
import china from 'echarts/map/json/china';

import App from './App.vue'
import router from './router'
import store from './store'
import axios from './net/axios';

import ElementUI from 'element-ui';
import '~/../../web_depends/assets/css/theme-green/index.css'
import "~/../../web_depends/assets/css/main.css";
import "~/../../web_depends/assets/css/color-green.css";

Vue.config.productionTip = false
Vue.use(ElementUI)

Vue.prototype.$axios = axios;

Vue.prototype.$echarts = Echarts
Echarts.registerMap('china', china)

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
