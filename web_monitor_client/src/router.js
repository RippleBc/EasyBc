import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export default new Router({
    routes: [
        {
            path: '/',
            redirect: '/overview'
        },
        {
            path: '/',
            component: () => import('./views/Home.vue'),
            meta: { title: '自述文件' },
            children:[
                {
                    path: '/overview',
                    component: () => import('./views/Overview.vue'),
                    meta: { title: '总览' }
                },
                {
                    path: '/nodeList',
                    component: () => import('./views/NodeList.vue'),
                    meta: { title: '服务器列表' }
                },
                {
                    path: '/permission',
                    component: () => import('./views/Permission.vue'),
                    meta: { title: '权限控制', permission: true }
                },
                {
                    path: '/dashboard/:index',
                    component: () => import('./views/Dashboard.vue'),
                    meta: { title: '节点概况' }
                },
                {
                    path: '/nodeDetail/:index',
                    component: () => import('./views/NodeDetail.vue'),
                    meta: { title: '节点详细信息' }
                },
                {
                    path: '/warnRule/:index',
                    component: () => import('./views/WarnRule.vue'),
                    meta: { title: '制定警报规则' }
                },
                {
                    path: '/404',
                    component: () => import('./views/404.vue'),
                    meta: { title: '404' }
                },
                {
                    path: '/403',
                    component: () => import('./views/403.vue'),
                    meta: { title: '403' }
                }
            ]
        },
        {
            path: '/login',
            component:  () => import('./views/Login.vue')
        },
        {
            path: '*',
            redirect: '/404'
        }
    ]
})
