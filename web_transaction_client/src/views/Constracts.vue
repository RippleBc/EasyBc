<template>
  <div class="container">
    <div style="margin:20px 0px 20px 0px;">
        <crowd-fund></crowd-fund>
        <multi-sign></multi-sign>
    </div>
  </div>
</template>

<script>
import axios from "../net/axios.js";
import CrowdFund from "../constracts/CrowdFund.vue";
import MultiSign from "../constracts/MultiSign.vue";

export default {
  name: "Constracts",
    components: { CrowdFund, MultiSign },
  data() {
    return {};
  },

  created() {},

  methods: {},

  computed: {
    currentNode: function() {
      return this.$store.state.currentNode;
    }
  }
};
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: flex-start;
  width: 100%;
  line-height: 50px;
}

div {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
}
</style>