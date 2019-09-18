<template>
  <div id = "App">
    <router-view></router-view>
    <!--<shouye></shouye>-->
    <!--<subhomeWeb></subhomeWeb>-->
  </div>
</template>

<script>
  import shouye from "./view/shouye.vue";
  import subHome from "./view/subHome.vue";
export default {
  name: 'App',
    components:{
      //subhomeWeb: subHome
        shouye: shouye
    },
    data(){
        return{
        }
    },
}
</script>

<style scoped>

  </style>
