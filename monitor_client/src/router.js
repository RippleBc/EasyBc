import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export default new Router({
    mode: 'history',
    routes: [
        {
            path: '/',
            redirect: '/overview'
        },
        {
            path: '/',
            component: resolve => require(['./views/Home.vue'], resolve),
            meta: { title: '自述文件' },
            children:[
                {
                    path: '/overview',
                    component: resolve => require(['./views/Overview.vue'], resolve),
                    meta: { title: '总览' }
                },
                {
                    path: '/nodeList',
                    component: resolve => require(['./views/NodeList.vue'], resolve),
                    meta: { title: '服务器列表' }
                },
                {
                    // 权限页面
                    path: '/permission',
                    component: resolve => require(['./views/Permission.vue'], resolve),
                    meta: { title: '权限测试', permission: true }
                },
                {
                    path: '/dashboard/:index',
                    component: resolve => require(['./views/Dashboard.vue'], resolve),
                    meta: { title: '节点概况' }
                },
                {
                    path: '/nodeDetail/:index',
                    component: resolve => require(['./views/NodeDetail.vue'], resolve),
                    meta: { title: '节点详细信息' }
                },
                {
                    path: '/warnRule/:index:',
                    component: resolve => require(['./views/WarnRule.vue'], resolve),
                    meta: { title: '制定警报规则' }
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
