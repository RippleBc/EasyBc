<template>
  <div class="container">
    <div style="display:flex;flex-direction:column;align-items:center;margin:20px 0px 20px 0px;">
        <crowd-fund></crowd-fund>
        <multi-sign></multi-sign>
        <side-chain></side-chain>
    </div>
  </div>
</template>

<script>
import axios from "../net/axios.js";
import CrowdFund from "../constracts/CrowdFund.vue";
import MultiSign from "../constracts/MultiSign.vue";
import SideChain from "../constracts/SideChain.vue";

export default {
  name: "Constracts",
    components: { CrowdFund, MultiSign, SideChain },
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
  justify-content: center;
  align-items: flex-start;
  width: 100%;
  line-height: 50px;
  border-bottom: 1px solid #ddd;
}

div {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
}
</style>