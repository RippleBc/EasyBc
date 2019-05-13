<template>
  <div id="app">
    <el-menu
      style="width:200px;height:100%;position:fixed;"
      :default-active="onRoute"
      unique-opened 
      router>
      <el-menu-item index="/">
        <i class="el-icon-location"></i>
        <span>首页</span>
      </el-menu-item>
      <el-menu-item index="/transactions">
        <i class="el-icon-date"></i>
        <span>交易记录</span>
      </el-menu-item>
      <el-menu-item index="/about" disabled>
        <i class="el-icon-document"></i>
        <span>关于</span>
      </el-menu-item>
    </el-menu>
    <div style="margin-left:200px;display:flex;flex-direction:column;width:100%;">
      <h1 style="position:fixed;width:calc(100% - 200px);height:80px;background-color:#ffff;z-index:1;">区块链交易系统</h1>
      <div style="margin-top:120px;">
        <router-view/>
      </div>
    </div>
    
  </div>
</template>

<script>
import axios from './net/axios.js'
import nodesInfo from './nodes.json'

  export default {
    name: 'App',
    data () {
      return {
        onRoute: '/'
      }
    },

    watch: {
      $route: function(){
        this.onRoute = this.$route.path;
      }
    }
  }
</script>

<style lang="scss">
#app {
  display: flex;
  font-family: "Helvetica Neue",Helvetica,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","微软雅黑",Arial,sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #606266;
}
#nav {
  padding: 30px;
  a {
    font-weight: bold;
    color: #2c3e50;
    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
