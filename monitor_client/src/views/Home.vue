<template>
    <div class="wrapper">
        <v-head :messageSize="messages.length"></v-head>
        <v-sidebar :items="navItems"></v-sidebar>
        <div class="content-box" :class="{'content-collapse': collapse}">
            <v-tags></v-tags>
            <div class="content">
                <transition name="move" mode="out-in">
                    <keep-alive :include="tagsList">
                        <router-view></router-view>
                    </keep-alive>
                </transition>
            </div>
        </div>
    </div>
</template>

<script>
    import vHead from '../components/Header.vue';
    import vSidebar from '../components/Sidebar.vue';
    import vTags from '../components/Tags.vue';
    import bus from '../components/bus';
    import { mapState } from 'vuex';

    export default {
        data(){
            return {
                tagsList: [],
                collapse: false,
                messages: [],
                mainNavItems: [
                    {
                        icon: 'el-icon-lx-home',
                        originIndex: '/overview',
                        index: '/overview',
                        title: '总览'
                    },
                    {
                        icon: 'el-icon-lx-sort',
                        originIndex: '/nodeList',
                        index: '/nodeList',
                        title: '节点列表'
                    },
                    {
                        icon: 'el-icon-edit-outline',
                        originIndex: '/permission',
                        index: '/permission',
                        title: '权限控制'
                    }
                ],

                nodeNavItems: [
                    {
                        icon: 'el-icon-lx-home',
                        originIndex: '/dashboard',
                        index: '',
                        title: '节点概况'
                    },
                    {
                        icon: 'el-icon-lx-sort',
                        originIndex: '/nodeDetail',
                        index: '',
                        title: '节点详细信息'
                    },
                    {
                        icon: 'el-icon-edit-outline',
                        originIndex: '/warnRule',
                        index: '',
                        title: '制定报警规则'
                    }
                ]
            }
        },
        components:{
            vHead, vSidebar, vTags
        },
        computed: {
            ...mapState({
                navItems(state) {
                    switch(state.navType)
                    {
                        case 'main':
                        {
                            return this.mainNavItems;
                        }
                        break;
                        case 'node':
                        {
                            return this.nodeNavItems;
                        }
                        break;
                        default:
                        {
                            this.$alert.error("invalid nav type");
                        }
                    }
                },

                currentNode: 'currentNode'
            }) 
        },
        watch:{
            currentNode: function(){
                for(let [index, value] of this.nodeNavItems.entries()){
                    this.nodeNavItems[index].index = `${this.nodeNavItems[index].originIndex}/${this.currentNode.id}`
                }
            }
        },
        created(){
            bus.$on('collapse', val => {
                this.collapse = val;
            })

            // 只有在标签页列表里的页面才使用keep-alive，即关闭标签之后就不保存到内存中了。
            bus.$on('tags', val => {
                let arr = [];
                for(let i = 0, len = val.length; i < len; i ++){
                    val[i].name && arr.push(val[i].name);
                }
                this.tagsList = arr;
            })

            //
            bus.$on('messages', val => {
                messages = val
            });

            this.$store.dispatch('getUnl', this);
        }
    }
</script>
