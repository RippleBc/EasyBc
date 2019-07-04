<template>
    <div class="wrapper">
        <v-head :messageSize="messages.length"></v-head>
        <v-sidebar></v-sidebar>
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
                messages: []
            }
        },
        components:{
            vHead, vSidebar, vTags
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
