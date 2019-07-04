<template>
    <div class="sidebar">
        <el-menu class="sidebar-el-menu" :default-active="onRoutes" :collapse="collapse" unique-opened router>
            <template v-for="item in items">
                <template v-if="item.subs">
                    <el-submenu :index="item.index">
                        <template slot="title">
                            <i :class="item.icon"></i>
                            <span>{{ item.title }}</span>
                        </template>
                        <template v-for="subItem in item.subs">
                            <el-menu-item :index="subItem.index">
                                <span>{{ subItem.title }}</span>
                            </el-menu-item>
                        </template>
                    </el-submenu>
                </template>
                <template v-else>
                    <el-menu-item :index="item.index">
                        <i :class="item.icon"></i>
                        <span slot="title">{{ item.title }}</span>
                    </el-menu-item>
                </template>
            </template>
        </el-menu>
    </div>
</template>

<script>
    const mainNavItems = [
        {
            icon: 'el-icon-lx-home',
            index: '/overview',
            title: '总览'
        },
        {
            icon: 'el-icon-lx-sort',
            index: '/nodeList',
            title: '节点列表'
        },
        {
            icon: 'el-icon-edit-outline',
            index: '/permission',
            title: '权限控制'
        }
    ];

    const nodeNavItems = [
        {
            icon: 'el-icon-lx-home',
            index: '/dashboard',
            title: '节点概况'
        },
        {
            icon: 'el-icon-lx-sort',
            index: '/nodeDetail',
            title: '节点详细信息'
        },
        {
            icon: 'el-icon-edit-outline',
            index: '/warnRule',
            title: '制定报警规则'
        }
    ];

    import bus from './bus';
    import { mapState } from 'vuex';

    export default {
        data() {
            return {
                collapse: false,
                onRoutes: mainNavItems[0].index,
                navType: 'main',
                items: mainNavItems
            }
        },
        computed: {
            ...mapState(['unl'])
        },
        watch:{
            $route: function() {
                const [, navName] = this.$route.path.split('/');

                // change nav
                switch(navName)
                {
                    case 'overview':
                    case 'nodeList':
                    case 'permission':
                    {
                        if(this.navType === 'node')
                        {
                            this.items = mainNavItems;
                        }

                        this.navType = 'main'
                        this.onRoutes =  `/${navName}`;
                    }
                    break;
                    case 'dashboard':
                    case 'nodeDetail':
                    case 'warnRule':
                    {
                        // get current node
                        const nodeIndex = this.$route.path.split('/')[2];
                        const nodeInfo = this.unl.find(n => nodeIndex == n.id)
                        const currentNode = nodeInfo;

                        //
                        this.items = nodeNavItems.map(item => {
                            const eles = item.index.split('/')
                            item.index = `/${eles[1]}/${currentNode.id}`
                        
                            return item;
                        });;
                        
                        this.navType = 'node';
                        this.onRoutes =  `/${navName}/${currentNode.id}`;
                    }
                    break;
                    default:
                    {
                        this.onRoutes = '/';
                    }
                }
            }
        },
        created(){
            // 通过 Event Bus 进行组件间通信，来折叠侧边栏
            bus.$on('collapse', msg => {
                this.collapse = msg;
            })
        }
    }
</script>

<style scoped>
    .sidebar{
        display: block;
        position: absolute;
        left: 0;
        top: 70px;
        bottom:0;
        overflow-y: scroll;
    }
    .sidebar::-webkit-scrollbar{
        width: 0;
    }
    .sidebar-el-menu:not(.el-menu--collapse){
        width: 250px;
    }
    .sidebar > ul {
        height:100%;
    }
</style>
