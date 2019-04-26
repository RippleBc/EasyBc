<template>
    <div class="wrapper">
        
    </div>
</template>

<script>
    import bus from '../components/bus';
    import { mapState } from 'vuex'

    export default {
        name: 'overview',
        data(){
            return {
               
            }
        },
        created() {
             this.$store.commit('switchNavType', 'main');
        },

        activated(){
            this.$store.commit('switchNavType', 'main');
        }
    }
</script>
