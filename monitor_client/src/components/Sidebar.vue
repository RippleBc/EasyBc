<template>
    <div class="sidebar">
        <el-menu class="sidebar-el-menu" :default-active="onRoutes" :collapse="collapse" unique-opened router>
            <template v-for="item in items">
                <template v-if="item.subs">
                    <el-submenu :index="item.originIndex">
                        <template slot="title">
                            <i :class="item.icon"></i>
                            <span>{{ item.title }}</span>
                        </template>
                        <template v-for="subItem in item.subs">
                            <el-menu-item :route="subItem.index" :index="subItem.originIndex">
                                <span>{{ subItem.title }}</span>
                            </el-menu-item>
                        </template>
                    </el-submenu>
                </template>
                <template v-else>
                    <el-menu-item :route="item.index" :index="item.originIndex">
                        <i :class="item.icon"></i>
                        <span slot="title">{{ item.title }}</span>
                    </el-menu-item>
                </template>
            </template>
        </el-menu>
    </div>
</template>

<script>
    import bus from './bus';
    export default {
        props: {
            items: {
                type: Array,
                required: true,
                default: []
            }
        },
        data() {
            return {
                collapse: false,
                onRoutes: ''
            }
        },
        watch:{
            $route: function(){
                const items = this.$route.path.split('/');
                const mainItem = items[1];

                const item = this.items.flat().find(n => {
                    return n.originIndex === `/${mainItem}`
                })

                if(item === undefined)
                {
                    return;
                }

                if(mainItem)
                {
                    this.onRoutes =  `/${mainItem}`;
                }
                else
                {
                    this.onRoutes = '/';
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
