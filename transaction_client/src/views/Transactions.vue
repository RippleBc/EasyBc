<template>
	<div class="container">
    <div class="border">
    	<div style="padding: 20px;box-sizing: border-box;">
  			<div style="flex-direction: row;">
  				<span style="width: 100px;flex-shrink: 0;">hash</span>
					<el-input v-model="hash" style="margin: 20px;"></el-input>
  			</div>
  			
				<div style="flex-direction: row;">
					<span style="width: 100px;flex-shrink: 0;">from</span>
					<el-input v-model="from" style="margin: 20px;"></el-input>
					<span style="width: 100px;flex-shrink: 0;">to</span>
					<el-input v-model="to" style="margin: 20px;"></el-input>
  			</div>
				
				<div style="flex-direction: row;">
					<span style="width: 100px;flex-shrink: 0;">开始时间</span>
					<el-date-picker
						style="width: 100%;margin: 20px;"
						v-model="beginTime"
						align="right"
						type="datetime"
						placeholder="选择日期"
						:picker-options="pickerOptions">
					</el-date-picker>
					
					<span style="width: 100px;flex-shrink: 0;">结束时间</span>
					<el-date-picker
						style="width: 100%;margin: 20px;"
						v-model="endTime"
						align="right"
						type="datetime"
						placeholder="选择日期"
						:picker-options="pickerOptions">
					</el-date-picker>
					
  			</div>
  			<div style="flex-direction: row; justify-content: end;">
  				<el-button type="info" @click="search()">搜索</el-button>
  			</div>
    	</div>
    </div>

    <div class="border" style="margin:20px 0px 20px 0px;">
    	<el-table
	      :data="transactions"
	      style="width: 100%">
	      <el-table-column
	        prop="id"
	        label="id"
	        width="180">
	      </el-table-column>
	      <el-table-column
	        prop="nonce"
	        label="nonce"
	        width="180">
	      </el-table-column>
	      <el-table-column
	        prop="createdAt"
	        label="日期">
	      </el-table-column>
	      <el-table-column
	        prop="from"
	        label="发送账户">
	      </el-table-column>
	      <el-table-column
	        prop="to"
	        label="接收账户"
	        width="180">
	      </el-table-column>
	      <el-table-column
	        prop="value"
	        label="金额"
	        width="180">
	      </el-table-column>
	      <el-table-column
	        prop="createdAt"
	        label="创建时间"
	        width="180">
	      </el-table-column>
	    </el-table>
    </div>
	</div>
</template>

<script>
import axios from '../net/axios.js'

	export default {
	  name: 'Transaction',

	  data () {
	    return {
	    	transactions: [],
	    	hash: '',
	   		from: '',
	   		to: '',
	   		beginTime: '',
	   		endTime: ''
	    }
	  },

	  computed: {
      currentNode: function()
      {
        return this.$store.state.currentNode;
      }
    },
    
	  created () {
	    this.from = this.$route.path.split('/')[2];
	  },

	  methods:
	  {
	  	search: function()
	  	{
	  		axios.get('/getTransactions', {
	  			url: this.currentNode.url,
	  			hash: this.hash,
	  			from: this.from,
	  			to: this.to,
	  			beginTime: this.beginTime,
	  			endTime: this.endTime
	  		}, response => {
					if (response.code === 0) {
            this.transactions = response.data
          } else {
            Vue.prototype.$notify.error({
              title: 'getTransactions',
              message: response.msg
            });
          }

          resolve()
        })
	  	}
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