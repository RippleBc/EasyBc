import Vue from 'vue'
import VCharts from 'v-charts';
import App from './App.vue'
import router from './router'
import store from './store'
import './registerServiceWorker'
import axios from './net/axios';
import ElementUI from 'element-ui';
import '~/../../web_depends/assets/css/theme-green/index.css'
import "~/../../web_depends/assets/css/main.css";
import "~/../../web_depends/assets/css/color-green.css";

Vue.use(VCharts)
Vue.config.productionTip = false
Vue.use(ElementUI, {
    size: 'medium'
});
Vue.prototype.$axios = axios;

router.beforeEach((to, from, next) => {
    // check privallege
    const username = localStorage.getItem('ms_username');
    if (!username && to.path !== '/login') {
        return next('/login');
    } else if (to.meta.permission) {
        // 如果是管理员权限则可进入，这里只是简单的模拟管理员权限而已
        if(username !== 'admin')
        {
            return next('/403')
        }

        return next();
    } else {
        // 简单的判断IE10及以下不进入富文本编辑器，该组件不兼容
        if (navigator.userAgent.indexOf('MSIE') > -1 && to.path === '/editor') {
            return Vue.prototype.$message.error('vue-quill-editor组件不兼容IE10及以下浏览器，请使用更高版本的浏览器查看');
        }

        // login or 403 page, do not init data
        if(to.path === '/login' || to.path === '/403')
        {
            return next();
        }

        // unl has inited, continue pipeline
        if(store.state.unl.length > 0)
        {
            return next()
        }

        // init data
        axios.get('/nodes', {}).then(res => {
            if(res.code !== 0)
            {
                if(res.code === 100)
                {
                    return next('/login');
                }
               
                Vue.prototype.$message.error(`初始化数据获取失败，${res.msg}`);
            }
            else
            {
                store.commit('setUnl', res.data)
                next()
            }
            
        }).catch(err => {
            Vue.prototype.$message.error(`初始化数据获取失败，${err}`);
        })
    }
})


new Vue({
    router,
    store,
    render: h => h(App)
}).$mount('#app')