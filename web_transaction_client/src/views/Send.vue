<template>
	<div class="container">
		<div class="border" style="margin:20px 0px 20px 0px;">
      <div style="flex-direction:row;">
        <el-input style="margin:20px;" v-model="privateKey" placeholder="privateKey"></el-input>
        <el-button type="primary" style="margin:20px;" @click="importAccount">账号导入</el-button>
        <el-button type="primary" style="margin-right:20px;" @click="generateKeyPiar">生成密匙对</el-button>
      </div>
      <div style="flex-direction:row;justify-content:end;">
        <el-input style="margin:20px;" v-model="transactionHash"/>
        <el-button type="info" style="margin:20px;" @click="getTransactionState">获取交易状态</el-button>
      </div>
		</div>
    <div style="margin:20px 0px 20px 0px;">
      <div class="border">
        <div style="flex-direction:row;margin:20px 20px 20px 0px;">
          <span style="width:100px;">发送者</span>
          <el-input v-model="from" placeholder="请输入发送者id"/>
        </div>
        <div style="flex-direction:row;margin:20px 20px 20px 0px;">
          <span  style="width:100px;">接收者</span>
          <el-input v-model="to" placeholder="请输入接收者id"/>
        </div>
        <div style="flex-direction:row;margin:20px 20px 20px 0px;">
          <span  style="width:100px;">值</span>
          <el-input v-model="value" placeholder="请输入值"/>
        </div>
        <div style="flex-direction:row;justify-content:end;margin:20px 20px 20px 0px;">
          <el-button type="primary" @click="sendTransaction">发送交易</el-button>
        </div>
      </div>
    </div>
    <div style="flex-direction:row;">
      <div class="border" style="height: 500px;justify-content:start;align-items:start;padding:20px;margin:20px 20px 20px 0px;">
        <span>账户列表</span>
        <div style="overflow: auto;justify-content: start;">
          <div v-bind:key="account" v-for="account in accounts">
            <div>
              <p style="cursor:pointer;width:100%;text-align:left;">{{account}}</p>
              <div style="flex-direction:row;justify-content:end;">
                <el-button type="primary" @click="getTransactions(account)">获取交易记录</el-button>
                <el-button type="primary" @click="getAccountInfo(account)">获取账户信息</el-button>
                <el-button type="primary" @click="getPrivateKey(account)">获取私钥</el-button>
              </div>
            </div>
            <HR style="FILTER: alpha(opacity=100,finishopacity=0,style=3)" width="99%" color=#C0C4CC SIZE=1></HR>
          </div>  
        </div>
      </div>
    </div>
		<div style="flex-direction:row;">
			<div class="border" style="height: 500px;justify-content:start;align-items:start;padding:20px;margin:20px 20px 20px 0px;">
        <span>发送者记录</span>
        <div style="overflow: auto;justify-content: start;">
          <div v-bind:key="from" v-for="from in froms">
            <div>
              <p style="cursor:pointer;width:100%;text-align:left;" @dblclick="chooseFrom(from)">{{from}}</p>
              <div style="flex-direction:row;justify-content:end;">
                <el-button type="primary" @click="getTransactions(from)">获取交易记录</el-button>
                <el-button type="primary" @click="getAccountInfo(from)">获取账户信息</el-button>
                <el-button type="primary" @click="getPrivateKey(from)">获取私钥</el-button>
              </div>
            </div>
            <HR style="FILTER: alpha(opacity=100,finishopacity=0,style=3)" width="99%" color=#C0C4CC SIZE=1></HR>
          </div>  
        </div>
			</div>
			<div class="border" style="height: 500px;justify-content:start;align-items:start;padding:20px;margin:20px 0px 20px 0px;">
				<span>接收者记录</span>
        <div style="overflow: auto;justify-content: start;">
          <div v-bind:key="to" v-for="to in tos">
            <div>
              <p style="cursor:pointer;width:100%;text-align:left;" @dblclick="chooseTo(to)">{{to}}</p>
              <div style="flex-direction:row;justify-content:end;">
                <el-button type="primary" @click="getTransactions(to)">获取交易记录</el-button>
                <el-button type="primary" @click="getAccountInfo(to)">获取账户信息</el-button>
                <el-button type="primary" @click="getPrivateKey(to)">获取私钥</el-button>
              </div>
            </div>
            <HR style="FILTER: alpha(opacity=100,finishopacity=0,style=3)" width="99%" color=#C0C4CC SIZE=1></HR>
          </div>  
        </div>
			</div>
		</div>

    <el-dialog title="账户详细信息" :visible.sync="accontInfoVisisble">
      <div style="flex-direction:row;justify-content:start;">
        <span style="width:100px">地址</span><p style="width:100%;">{{address}}</p>
      </div>
      <div style="flex-direction:row;justify-content:start;">
        <span style="width:100px">临时数</span><p style="width:100%;">{{nonce}}</p>
      </div>
      <div style="flex-direction:row;justify-content:start;">
        <span style="width:100px">余额</span><p style="width:100%;">{{balance}}</p>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="accontInfoVisisble = false">确 定</el-button>
      </span>
    </el-dialog>

    <el-dialog title="私钥信息" :visible.sync="privateKeyInfoVisible">
      <div style="flex-direction:row;justify-content:start;">
        <span style="width:100px">私钥</span><p style="width:100%;">{{privateKeyInfo}}</p>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="privateKeyInfoVisible = false">确 定</el-button>
      </span>
    </el-dialog>

    <el-dialog title="交易信息" :visible.sync="transactionInfoVisible">
      <div style="flex-direction:row;justify-content:start;">
        <span style="width:100px">交易哈希值</span><p style="width:100%;">{{transactionHashInfo}}</p>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="transactionInfoVisible = false">确 定</el-button>
      </span>
    </el-dialog>
	</div>
</template>

<script>
import axios from '../net/axios.js'

const TRANSACTION_STATE_IN_CACHE = 1;
const TRANSACTION_STATE_PROCESSING = 2;
const TRANSACTION_STATE_PACKED = 3;

  export default {
    name: 'Send',

    data () {
      return {
        accounts: ["test", "test"],
      	froms: ["test", "test"],
      	tos: ["test", "test"],
      	from: '',
      	to: '',
      	value: 0,
      	transactionHash: '',
      	privateKey: '',
        accontInfoVisisble: false,
        address: "",
        nonce: "",
        balance: "",
        privateKeyInfoVisible: false,
        privateKeyInfo: '',
        transactionInfoVisible: false,
        transactionHashInfo: ''
        
      }
    },

    created () {
      this.getFromHistory()
      this.getToHistory()
      this.getAccounts()
    },

    methods:
    {
    	importAccount () {
        axios.get('importAccount', {
          privateKey: this.privateKey
        }, response => {
          if (response.code === 0) {
            this.getAccounts();

            this.$notify.success({
              title: 'importAccount',
              message: "import success"
            });
          } else {
            this.$notify.error({
              title: 'importAccount',
              message: response.msg
            });
          }
        })
      },

    	chooseFrom: function (value) {
        this.from = value
    	},

    	chooseTo: function (value) {
        this.to = value
    	},

    	generateKeyPiar: function () {
    		axios.get('generateKeyPiar', {
          cacheAccount: true
        }, response => {
          if (response.code === 0) {
            this.getAccounts()
          } else {
            this.$notify.error({
              title: 'generateKeyPiar',
              message: response.msg
            });
          }
        })
    	},

      getAccounts: function() {
        axios.get('getAccounts', {offset: 0}, response => {
          if (response.code === 0) {
            this.accounts = response.data
          } else {
            this.$notify.error({
              title: 'getAccounts',
              message: response.msg
            });
          }
        })
      },

      getFromHistory: function () {
      	axios.get('getFromHistory', {offset: 0}, response => {
          if (response.code === 0) {
            this.froms = response.data
          } else {
            this.$notify.error({
              title: 'getFromHistory',
              message: response.msg
            });
          }
        })
      },

      getToHistory: function () {
      	axios.get('getToHistory', {offset: 0}, response => {
          if (response.code === 0) {
            this.tos = response.data
          } else {
            this.$notify.error({
              title: 'getToHistory',
              message: response.msg
            });
          }
        })
      },

      sendTransaction: function () {
        axios.get('sendTransaction', {
        	url: this.currentNode.url,
        	from: this.from,
        	to: this.to,
        	value: this.value
        }, response => {
          if (response.code === 0) {
            this.transactionHash = this.transactionHashInfo = response.data;
            this.transactionInfoVisible = true;

            this.getFromHistory();
            this.getToHistory();
          } else {
            this.$notify.error({
              title: 'sendTransaction',
              message: response.msg
            });
          }
        })
      },
      
      getTransactionState: function () {
        axios.get('getTransactionState', {
        	url: this.currentNode.url,
        	hash: this.transactionHash
        }, response => {
          if (response.code === 0) {
            if (response.data === TRANSACTION_STATE_PACKED) {
              this.$notify.warn({
                title: 'getTransactionState',
                message: 'transaction has packed'
              });
            } else if (response.data === TRANSACTION_STATE_PROCESSING) {
              this.$notify.warn({
                title: 'getTransactionState',
                message: 'transaction is processing'
              });
            } else if (response.data === TRANSACTION_STATE_IN_CACHE) {
              this.$notify.warn({
                title: 'getTransactionState',
                message: 'transaction is in cache, waiting to be process'
              });
            } else {
              this.$notify.error({
                title: 'getTransactionState',
                message: 'getTransactionState failed, get a invalid code'
              });
            }
          } else {
            this.$notify.error({
              title: 'getTransactionState',
              message: response
            });
          }
        })
      },

      getAccountInfo: function (address) {
        axios.get('getAccountInfo', {
        	url: this.currentNode.url,
        	address: address
        }, response => {
          if (response.code === 0) {
            this.address = address;
            this.nonce = response.data.nonce;
            this.balance = response.data.balance;
            this.accontInfoVisisble = true;
          } else {
            this.$notify.error({
              title: 'getAccountInfo',
              message: response.msg
            });
          }
        })
      },

      getPrivateKey: function (address) {
        axios.get('getPrivateKey', {
        	address: address
        }, response => {
          if (response.code === 0) {
            this.privateKeyInfo = response.data;
            this.privateKeyInfoVisible = true;
          } else {
            this.$notify.error({
              title: 'getPrivateKey',
              message: response.msg
            });
          }
        })
      },

      getTransactions: function(address) {
        this.$router.push(`transactions/${address}`);
      }
    },

    computed: {
      currentNode: function()
      {
        return this.$store.state.currentNode;
      }
    },
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