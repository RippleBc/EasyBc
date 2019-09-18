<template>
  <div>
    <div style="display: flex;justify-content: center">
      <div style="width: 1140px;height: 60px;margin: 0px;display: flex;flex-direction: row-reverse">
        <div style="width:450px;height: 100%">
          <ul style="list-style: none">
            <li style="float:right;width:50px"><router-link to = "/home" style="color: #EEEEEE;text-decoration: none" @click.native="refresh">关于</router-link></li>
            <li style="float:right;width:70px"><router-link to = "/nodemember" style="color: #EEEEEE;text-decoration: none">节点成员</router-link></li>
            <li style="float:right;width:50px"><router-link to = "/blocks" style="color: #EEEEEE;text-decoration: none">区块</router-link></li>
            <li style="float:right;width:50px"><router-link to = "/smartcontracts" style="color: #EEEEEE;text-decoration: none">合约</router-link></li>
            <li style="float:right;width:50px"><router-link to = "/account" style="color: #EEEEEE;text-decoration: none">账户</router-link></li>
            <li style="float:right;width:50px"><router-link to = "/transactions" style="color: #EEEEEE;text-decoration: none">交易</router-link></li>
            <li style="float:right;width:50px"><router-link to = "/home" style="color: #EEEEEE;text-decoration: none" @click.native="refresh">首页</router-link></li>
          </ul>
        </div>
      </div>
    </div>
    <div style="display: flex;justify-content: center">
      <div style="width: 500px;height: 50px">
        <p style="font-size: 30px;font-weight: 500;color: #FFFFFF;margin-top: 0px">区块链交易系统</p>
      </div>
    </div>
    <div style="display: flex;justify-content: center">
      <div style="width: 800px;height: 50px">
        <el-input
          placeholder="在此输入区块id、交易id(txid)、账户id或者账户名进行查询"
          prefix-icon="el-icon-search"
          style="width: 700px;margin-right: 20px;margin-left: 30px"
          v-model="input"
          @change="search">
        </el-input>
      </div>
    </div>
  </div>
</template>

<script>
    export default {
        name: "Header",
        data(){
            return{
                input:"",
            }
        },
        methods:{
            //重新加载页面
            refresh:function(){
                this.$router.go(0);
            },
            //搜索
            search:function () {
                console.log("搜索中....")
            }
        }

    }
</script>

<style scoped>

</style>
