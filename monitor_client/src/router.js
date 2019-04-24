import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export default new Router({
    routes: [
        {
            path: '/',
            redirect: '/dashboard'
        },
        {
            path: '/',
            component: resolve => require(['./views/Home.vue'], resolve),
            meta: { title: '自述文件' },
            children:[
                {
                    path: '/dashboard',
                    component: resolve => require(['./views/Dashboard.vue'], resolve),
                    meta: { title: '系统首页' }
                },
                {
                    path: '/icon',
                    component: resolve => require(['./views/Icon.vue'], resolve),
                    meta: { title: '自定义图标' }
                },
                {
                    path: '/table',
                    component: resolve => require(['./views/BaseTable.vue'], resolve),
                    meta: { title: '服务器列表' }
                },
                {
                    path: '/tabs',
                    component: resolve => require(['./views/Tabs.vue'], resolve),
                    meta: { title: '警告消息' }
                },
                {
                    // vue-schart组件
                    path: '/charts',
                    component: resolve => require(['./views/BaseCharts.vue'], resolve),
                    meta: { title: '可视化图表' }
                },
                {
                    // 权限页面
                    path: '/permission',
                    component: resolve => require(['./views/Permission.vue'], resolve),
                    meta: { title: '权限测试', permission: true }
                },
                {
                    path: '/404',
                    component: resolve => require(['./views/404.vue'], resolve),
                    meta: { title: '404' }
                },
                {
                    path: '/403',
                    component: resolve => require(['./views/403.vue'], resolve),
                    meta: { title: '403' }
                }
            ]
        },
        {
            path: '/login',
            component: resolve => require(['./views/Login.vue'], resolve)
        },
        {
            path: '*',
            redirect: '/404'
        }
    ]
})
