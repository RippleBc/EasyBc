<template>
	<div class="container">
		<h1>欢迎进入区块链交易系统</h1>
    <div class="common">
      <p style="width:100%;text-align:left;">当前选择节点: {{currentNode.consensus.url}}</p>
      <div class="node_list">
        <span>节点列表:</span>
        <ul id="nodesInfo">
          <li v-for="nodeInfo in nodesInfo">
            <p style="cursor:pointer;" @dblclick="chooseNode(nodeInfo)">{{nodeInfo.consensus.url}}</p>
            
            <span class="chain_text">开始生成</span>
            <span class="chain_text">{{nodeInfo.detail.number}}</span>
            <span class="chain_text">{{nodeInfo.detail.hash}}</span>
              
            <p></p>
          </li>
        </ul>
      </div>
    </div>
		
		<div style="display:flex;justify-content:center;align-items:center;margin:10px 0px 10px 0px;">
			<el-input v-model="privateKey" placeholder="privateKey" style="width:100%"></el-input><el-button @click="importAccount">import account</el-button>
		</div>
		<div class="main_left">
			<div class="senderRecord">
				<span>发送者记录:</span>
				<ul id="fromHistory">
					<li v-for="from in froms">
						<p style="cursor:pointer;" @dblclick="chooseFrom(from)">{{from}}
						</p>
						<button @click="getAccountInfo(from)" class="obtain1">获取账户信息</button>
						<button @click="getPrivateKey(from)" class="obtain2">获取私钥</button>
					</li>
				</ul>
			</div>
			<div class="recipientRecord">
				<span>接收者记录:</span>
				<ul id="toHistory">
					<li v-for="to in tos">
						<p style="cursor:pointer;" @dblclick="chooseTo(to)">{{to}}</p>
					</li>
				</ul>
			</div>
		</div>
		<div class="main_right">
			<div class="input_list">
				<div class="from">
					<span>发送者: </span>
					<input v-model="from" placeholder="请输入发送者id"/>
				</div>
				<div class="to">
					<span>接收者: </span>
					<input v-model="to" placeholder="请输入接收者id"/>
				</div>
				<div class="value">
					<span>值: </span>
					<input v-model="value" placeholder="请输入值"/>
				</div>
				<button type="primary" @click="generateKeyPiar">生成密匙piar</button>
			  <button type="primary" @click="sendTransaction">发送交易</button>
			</div>
			<div class="transactionHash">
				<div class="tHash">
					<span>交易哈希值: </span>
				<input v-model="transactionHash"/>
				</div>
				<button @click="getTransactionState">获取交易状态</button>
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
    	froms: [],
    	tos: [],
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

    // setInterval(this.getLastestBlock, 2000);
  },

  methods:
  {
  	getLastestBlock: function () {
  		this.nodesInfo.forEach(function (nodeInfo) {
  			axios.get('getLastestBlock', { url: nodeInfo.query.url }, response => {
          if (response.status >= 200 && response.status < 300) {
            if (response.data.code === 0) {
              nodeInfo.detail = response.data.data
            } else {
              alert(response.data.msg)
            }
          } else {
            alert(response)
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
            self.getFromHistory()
            alert('import success')
          } else {
            alert(response.data.msg)
          }
        } else {
          alert(response)
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
  		const self = this
  		axios.get('generateKeyPiar', {}, response => {
        if (response.status >= 200 && response.status < 300) {
          if (response.data.code === 0) {
            self.getFromHistory()
          } else {
            alert(response.data.msg)
          }
        } else {
          alert(response)
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
            alert(response.data.msg)
          }
        } else {
          alert(response)
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
            alert(response.data.msg)
          }
        } else {
          alert(response)
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
            alert('transaction hash: ' + response.data.data)
            self.getToHistory()
          } else {
            alert(response.data.msg)
          }
        } else {
          alert(response)
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
              alert('transaction has packed')
            } else if (response.data.data === TRANSACTION_STATE_NOT_EXISTS) {
              alert('transaction not packet for now')
            } else {
              alert('getTransactionState failed')
            }
          } else {
            alert(response.data.msg)
          }
        } else {
          alert(response)
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
            alert(`address: ${response.data.data.address}\nnonce: ${response.data.data.nonce}\nbalance: ${response.data.data.balance}`)
          } else {
            alert(response.data.msg)
          }
        } else {
          alert(response)
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
            alert(response.data.data)
          } else {
            alert(response.data.msg)
          }
        } else {
          alert(response)
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
}

.common
{
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
}
</style>