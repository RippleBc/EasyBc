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
            name: 'home',
            component: () => import('./views/Home.vue'),
            meta: { title: '自述文件' },
            children:[
                {
                    path: '/overview',
                    name: 'overview',
                    component: () => import('./views/Overview.vue'),
                    meta: { 
                        title: '总览',
                        keepAlive: true
                     }
                },
                {
                    path: '/nodeList',
                    name: 'nodeList',
                    component: () => import('./views/NodeList.vue'),
                    meta: { 
                        title: '服务器列表',
                        keepAlive: true
                    }
                },
                {
                    path: '/permission',
                    name: 'permission',
                    component: () => import('./views/Permission.vue'),
                    meta: { 
                        title: '权限控制', 
                        permission: true,
                        keepAlive: true
                    }
                },
                {
                    path: '/dashboard/:index',
                    name: 'dashboard',
                    component: () => import('./views/Dashboard.vue'),
                    meta: { 
                        title: '节点概况',
                        keepAlive: false
                    }
                },
                {
                    path: '/nodeDetail/:index',
                    name: 'nodeDetail',
                    component: () => import('./views/NodeDetail.vue'),
                    meta: {
                        title: '节点详细信息',
                        keepAlive: false
                    }
                },
                {
                    path: '/warnRule/:index',
                    name: 'warnRule',
                    component: () => import('./views/WarnRule.vue'),
                    meta: {
                        title: '制定警报规则',
                        keepAlive: false
                    }
                },
                {
                    path: '/404',
                    name: '404',
                    component: () => import('./views/404.vue'),
                    meta: { 
                        title: '404',
                        keepAlive: true
                    }
                },
                {
                    path: '/403',
                    name: '403',
                    component: () => import('./views/403.vue'),
                    meta: { 
                        title: '403',
                        keepAlive: true
                    }
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
