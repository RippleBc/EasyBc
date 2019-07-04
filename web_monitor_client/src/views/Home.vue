<template>
    <div class="wrapper">
        <v-head :messageSize="messages.length"></v-head>
        <v-sidebar></v-sidebar>
        <div class="content-box" :class="{'content-collapse': collapse}">
            <v-tags></v-tags>
            <div class="content">
                <transition name="move" mode="out-in">
                    <div>
                        <keep-alive>
                            <router-view v-if="this.$route.meta.keepAlive"></router-view>
                        </keep-alive>
                        <router-view v-if="!this.$route.meta.keepAlive"></router-view>
                    </div>
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

            //
            bus.$on('messages', val => {
                messages = val
            });

            this.$store.dispatch('getUnl');
        }
    }
</script>
