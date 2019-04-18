<template>
	<div class="container">
    <div style="max-width:1280px;flex-direction:row;">
      <p style="width:120px;">当前节点地址</p>
      <el-card shadow="always">{{currentNode.consensus.url}}</el-card>
    </div>
    
    <div class="border" style="max-width:1280px;height:500px;overflow:scroll;margin:20px 0px 20px 0px;padding-top:20px;">
      <div style="justify-content:left;" v-for="nodeInfo in nodesInfo">
        <div style="flex-direction:row;justify-content:start;cursor:pointer;" @dblclick="chooseNode(nodeInfo)">
          <span style="width:100px;">节点地址</span>
          <p style="width:100%;">{{nodeInfo.consensus.url}}</p>
        </div>
        <div style="flex-direction:row;justify-content:start;">
          <span style="width:100px;">区块哈希值</span>
          <p style="width:100%;">{{nodeInfo.detail.hash ? nodeInfo.detail.hash : "未知"}}</p>
        </div>
        <div style="flex-direction:row;justify-content:start;">
          <span style="width:100px;">区块链高度</span>
          <p style="width:100%;">{{nodeInfo.detail.number ? nodeInfo.detail.number : "未知"}}</p>
        </div>
        <HR style="FILTER: alpha(opacity=100,finishopacity=0,style=3)" width="99%" color=#C0C4CC SIZE=1></HR>
      </div>
    </div>
		
		<div class="border" style="max-width:1280px;margin:20px 0px 20px 0px;">
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
    <div style="max-width:1280px;margin:20px 0px 20px 0px;">
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
		<div style="flex-direction:row;max-width:1280px;">
			<div class="border" style="height:500px;justify-content:start;align-items:start;padding:20px;margin:20px 20px 20px 0px;">
        <span>发送者记录</span>
        <div v-for="from in froms">
          <div style="flex-direction:row;justify-content:end">
            <p style="cursor:pointer;width:100%" @dblclick="chooseFrom(from)">{{from}}</p>
            <el-button type="primary" @click="getAccountInfo(from)">获取账户信息</el-button>
            <el-button type="primary" @click="getPrivateKey(from)">获取私钥</el-button>
          </div>
          <HR style="FILTER: alpha(opacity=100,finishopacity=0,style=3)" width="99%" color=#C0C4CC SIZE=1></HR>
        </div>	
			</div>
			<div class="border" style="height:500px;justify-content:start;align-items:start;padding:20px;margin:20px 0px 20px 0px;">
				<span>接收者记录</span>
				<div v-for="to in tos">
					<p style="cursor:pointer;width:100%;" @dblclick="chooseTo(to)">{{to}}</p>
          <HR style="FILTER: alpha(opacity=100,finishopacity=0,style=3)" width="99%" color=#C0C4CC SIZE=1></HR>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import axios from '../net/axios.js'
import nodesInfo from '../nodes.json'

const TRANSACTION_STATE_PACKED = 1
const TRANSACTION_STATE_NOT_EXISTS = 2

export default {
  name: 'App',

  data () {
    return {
    	froms: ["test", "test"],
    	tos: ["test", "test"],
    	from: '',
    	to: '',
    	value: 0,
    	transactionHash: '',
    	currentNode: nodesInfo[0],
    	nodesInfo: nodesInfo,
    	privateKey: ''
    }
  },

  created () {
    this.getFromHistory()
    this.getToHistory()
    this.getLastestBlock()
  },

  methods:
  {
  	getLastestBlock: function () {
      const self = this;

  		this.nodesInfo.forEach(function (nodeInfo) {
  			axios.get('getLastestBlock', { url: nodeInfo.query.url }, response => {
          if (response.status >= 200 && response.status < 300) {
            if (response.data.code === 0) {
              nodeInfo.detail = response.data.data
            } else {
              self.$notify.error({
                title: 'getLastestBlock',
                message: response.data.msg
              });
            }
          } else {
            self.$notify.error({
              title: 'getLastestBlock',
              message: response
            });
          }
        })
  		})
  	},

  	importAccount () {
    	const self = this

      axios.get('importAccount', {
        privateKey: this.privateKey
      }, response => {
        if (response.status >= 200 && response.status < 300) {
          if (response.data.code === 0) {
            self.getFromHistory();

            self.$notify.success({
              title: 'importAccount',
              message: "import success"
            });
          } else {
            self.$notify.error({
              title: 'importAccount',
              message: response.data.msg
            });
          }
        } else {
          self.$notify.error({
            title: 'importAccount',
            message: response
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
  		const self = this;

  		axios.get('generateKeyPiar', {}, response => {
        if (response.status >= 200 && response.status < 300) {
          if (response.data.code === 0) {
            self.getFromHistory();
          } else {
            self.$notify.error({
              title: 'generateKeyPiar',
              message: response.data.msg
            });
          }
        } else {
          self.$notify.error({
            title: 'generateKeyPiar',
            message: response
          });
        }
      })
  	},

    getFromHistory: function () {
    	const self = this

    	axios.get('getFromHistory', {}, response => {
        if (response.status >= 200 && response.status < 300) {
          if (response.data.code === 0) {
            self.froms = response.data.data
          } else {
            self.$notify.error({
              title: 'getFromHistory',
              message: response.data.msg
            });
          }
        } else {
          self.$notify.error({
            title: 'getFromHistory',
            message: response
          });
        }
      })
    },

    getToHistory: function () {
    	const self = this

    	axios.get('getToHistory', {}, response => {
        if (response.status >= 200 && response.status < 300) {
          if (response.data.code === 0) {
            self.tos = response.data.data
          } else {
            self.$notify.error({
              title: 'getToHistory',
              message: response.data.msg
            });
          }
        } else {
          self.$notify.error({
            title: 'getToHistory',
            message: response
          });
        }
      })
    },

    sendTransaction: function () {
    	const self = this

      axios.get('sendTransaction', {
      	queryUrl: self.currentNode.query.url,
        transactionUrl: self.currentNode.transaction.url,
      	from: self.from,
      	to: self.to,
      	value: self.value
      }, response => {
        if (response.status >= 200 && response.status < 300) {
          if (response.data.code === 0) {
            self.$alert('交易哈希值', response.data.data, {
              confirmButtonText: '确定'
            });
            self.getToHistory();
          } else {
            self.$notify.error({
              title: 'sendTransaction',
              message: response.data.msg
            });
          }
        } else {
          self.$notify.error({
            title: 'sendTransaction',
            type: "",
            message: response
          });
        }
      })
    },

    getTransactionState: function () {
    	const self = this

      axios.get('getTransactionState', {
      	url: self.currentNode.query.url,
      	hash: self.transactionHash
      }, response => {
        if (response.status >= 200 && response.status < 300) {
          if (response.data.code === 0) {
            if (response.data.data === TRANSACTION_STATE_PACKED) {
              self.$notify.warn({
                title: 'getTransactionState',
                message: 'transaction has packed'
              });
            } else if (response.data.data === TRANSACTION_STATE_NOT_EXISTS) {
              self.$notify.warn({
                title: 'getTransactionState',
                message: 'transaction not packet for now'
              });
            } else {
              self.$notify.error({
                title: 'getTransactionState',
                message: 'getTransactionState failed, get a invalid code'
              });
            }
          } else {
            self.$notify.error({
              title: 'getTransactionState',
              message: response.data.msg
            });
          }
        } else {
          self.$notify.error({
            title: 'getTransactionState',
            message: response
          });
        }
      })
    },

    getAccountInfo: function (address) {
    	const self = this

      axios.get('getAccountInfo', {
      	url: self.currentNode.query.url,
      	address: address
      }, response => {
        if (response.status >= 200 && response.status < 300) {
          if (response.data.code === 0) {
            self.$alert('账户信息', `地址: ${response.data.data.address}\nnonce: ${response.data.data.nonce}\n余额: ${response.data.data.balance}`, {
              confirmButtonText: '确定'
            });
          } else {
            self.$notify.error({
              title: 'getAccountInfo',
              message: response.data.msg
            });
          }
        } else {
          self.$notify.error({
            title: 'getAccountInfo',
            message: response
          });
        }
      })
    },

    getPrivateKey: function (address) {
    	const self = this

      axios.get('getPrivateKey', {
      	url: self.currentNode.query.url,
      	address: address
      }, response => {
        if (response.status >= 200 && response.status < 300) {
          if (response.data.code === 0) {
            self.$alert('私钥', response.data.data, {
              confirmButtonText: '确定'
            });
          } else {
            self.$notify.error({
              title: 'getPrivateKey',
              message: response.data.msg
            });
          }
        } else {
          self.$notify.error({
            title: 'getPrivateKey',
            message: response
          });
        }
      })
    },

    chooseNode: function (node) {
    	this.currentNode = node
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