<template>
	<div class="container">
    <div class="border" style="max-width:1280px;">
    	<div style="flex-direction: row;padding: 20px;box-sizing: border-box;">
    		<span slot="prepend">address</span>
				<el-input v-model="address" style="margin: 20px;"></el-input>
    		<el-button type="info">搜索</el-button>
    	</div>
    </div>

    <div class="border" style="max-width:1280px;margin:20px 0px 20px 0px;">
    	<el-table
	      :data="transactions"
	      style="width: 100%">
	      <el-table-column
	        prop="date"
	        label="日期"
	        width="180">
	      </el-table-column>
	      <el-table-column
	        prop="name"
	        label="发送账户"
	        width="180">
	      </el-table-column>
	      <el-table-column
	        prop="address"
	        label="接受账户">
	      </el-table-column>
	    </el-table>
    </div>
	</div>
</template>

<script>
import axios from '../net/axios.js'
import nodesInfo from '../nodes.json'

	export default {
	  name: 'Transaction',

	  data () {
	    return {
	    	transactions: []
	   		address: ''
	    }
	  },

	  created () {
	    this.address = this.$route.path.split('/')[2];
	  },

	  methods:
	  {
	  	
	  }
	}
</script>

<style scoped>
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

div
{
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
}
</style>