<template>
  <div class='container'>
    <div style="width:100%;">
      <el-card shadow="always">
        <h2>{{currentNode.url}}</h2>
      </el-card>
    </div>
    
    <div class="border" style="width:100%;height:500px;overflow:auto;margin:20px 0px 20px 0px;padding-top:20px;">
      <div style="justify-content:left;" v-for="nodeInfo in nodesInfo">
        <div style="display: flex;flex-direction:row;justify-content:start;cursor:pointer;" @dblclick="chooseNode(nodeInfo)">
          <span style="width:100px;">节点地址</span>
          <p style="width:100%;">{{nodeInfo.url}}</p>
        </div>
        <div style="display: flex;flex-direction:row;justify-content:start;">
          <span style="width:100px;">区块哈希值</span>
          <p style="width:100%;">{{nodeInfo.detail.hash ? nodeInfo.detail.hash : "未知"}}</p>
        </div>
        <div style="display: flex;flex-direction:row;justify-content:start;">
          <span style="width:100px;">区块链高度</span>
          <p style="width:100%;">{{nodeInfo.detail.number ? nodeInfo.detail.number : 0}}</p>
        </div>
        <HR style="FILTER: alpha(opacity=100,finishopacity=0,style=3)" width="99%" color=#C0C4CC SIZE=1></HR>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'Home',
    data () {
      return {
        
      }
    },

    created () {
      this.$store.dispatch('getNodesInfo');
    },

    computed: {
      currentNode: function()
      {
        return this.$store.state.currentNode;
      },

      nodesInfo: function()
      {
        return this.$store.state.nodesInfo;
      }
    },

    methods: {
      chooseNode: function (node) {
        this.$store.commit('switchCurrentNode', node);
      },
    }
  }
</script>

<style lang="scss" type scoped>
.container
{
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  line-height: 50px;
}

.border
{
  box-shadow: 0 2px 4px rgba(0, 0, 0, .12), 0 0 6px rgba(0, 0, 0, .04);
  border-radius: 4px;
}
</style>
