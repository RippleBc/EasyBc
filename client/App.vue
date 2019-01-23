<template>
	<div>
		<h1 style="text-align:center;">Welcome to Easy Block Chain Coin System</h1>
		<div style="display:flex;justify-content;center;height:300px;margin:20px">
			<dvi style="height:100%;width:50%;overflow:auto">
				<span>from history:</span>
				<ul id="fromHistory">
					<li v-for="from in froms">
						<p @dblclick="chooseFrom(from)">{{from}}</p><button @click="getAccountInfo(from)">get account info</button>
					</li>
				</ul>
			</dvi>
			<div style="height:100%;width:50%;overflow:auto">
				<span>to history:</span>
				<ul id="toHistory">
					<li v-for="to in tos">
						<p @dblclick="chooseTo(to)">{{to}}</p>
					</li>
				</ul>
			</div>
		</div>
		
		<div style="display:flex;flex-direction:column;justify-content;center;">
			<div style="display:flex;align-items:center;">
				<span style="width:50px;">from: </span><input style="width:100%;margin:20px;" v-model="from"/>
			</div>
			<div style="display:flex;align-items:center;">
				<span style="width:50px;">to: </span><input style="width:100%;margin:20px;" v-model="to"/>
			</div>
			<div style="display:flex;align-items:center;">
				<span style="width:50px;">value: </span><input style="width:100%;margin:20px;" v-model="value"/>
			</div>
		</div>

		<div style="display:flex;justify-content:flex-end;margin:20px;">
			<button @click="generateKeyPiar">generate key piar</button>
		  <button @click="sendTransaction">send transaction</button>
		</div>

		<div style="display:flex;flex-direction:column;margin:20px;">
			<div style="display:flex">
				<span style="width:200px;">transaction hash: </span><input style="width:100%;" v-model="transactionHash"/>
			</div>
			<div style="display:flex;justify-content:flex-end;margin-top:20px;">
				<button @click="getTransactionState">get transaction state</button>
			</div>
		</div>
	</div>
</template>

<script>
import axios from "./front/axios.js";

export default {
  name: "App",

  data()
  {
    return {
    	froms: [],
    	tos: [],
    	from: "",
    	to: "",
    	value: 0,
    	transactionHash: ""
    }
  },

  created()
  {
		this.getFromHistory();
		this.getToHistory();
  },

  methods:
  {
  	chooseFrom: function(value)
  	{
			this.from = value;
  	},

  	chooseTo: function(value)
  	{
			this.to = value;
  	},

  	generateKeyPiar: function()
  	{
  		const self = this;
  		axios.get("generateKeyPiar", {}, response => {
				if(response.status >= 200 && response.status < 300)
				{
					if(response.data.code === 0)
					{
						self.getFromHistory();
					}
					else
					{
						alert(response.data.msg);
					}
				}
				else
				{
					alert(response);
				}
			});
  	},

    getFromHistory: function()
    {
    	const self = this;

    	axios.get("getFromHistory", {}, response => {
				if (response.status >= 200 && response.status < 300)
				{
					if(response.data.code === 0)
					{
						self.froms = response.data.data;
					}
					else
					{
						alert(response.data.msg);
					}
				}
				else
				{
					alert(response);
				}
			});
    },

    getToHistory: function()
    {
    	const self = this;

    	axios.get("getToHistory", {}, response => {
				if (response.status >= 200 && response.status < 300)
				{
					if(response.data.code === 0)
					{
						self.tos = response.data.data;
					}
					else
					{
						alert(response.data.msg);
					}
				}
				else
				{
					alert(response);
				}
			});
    },

    sendTransaction: function()
    {
    	const self = this;

      axios.get("sendTransaction", {
      	from: self.from,
      	to: self.to,
      	value: self.value
      }, response => {
				if (response.status >= 200 && response.status < 300)
				{
					if(response.data.code === 0)
					{
						alert("transaction hash: " + response.data.data);
						self.getToHistory();
					}
					else
					{
						alert(response.data.msg);
					}
				}
				else
				{
					alert(response);
				}
			});
    },

    getTransactionState: function()
    {
    	const self = this;

      axios.get("getTransactionState", {
      	hash: self.transactionHash
      }, response => {
				if (response.status >= 200 && response.status < 300)
				{
					if(response.data.code === 0)
					{
						alert(response.data.data);
					}
					else
					{
						alert(response.data.msg);
					}
				}
				else
				{
					alert(response);
				}
			});
    },

    getAccountInfo: function(address)
    {
    	const self = this;

      axios.get("getAccountInfo", {
      	address: address
      }, response => {
				if (response.status >= 200 && response.status < 300)
				{
					if(response.data.code === 0)
					{
						alert(response.data.data);
					}
					else
					{
						alert(response.data.msg);
					}
				}
				else
				{
					alert(response);
				}
			});
    }
  }
}
</script>