<template>
	<div>
		<h1>Welcome to Easy Block Chain Coin System</h1>
		<dvi>
			<span>from history:</span>
			<ul id="example-1">
				<li v-for="from in froms">
					<p @click="chooseFrom(from)">{{from}}</p>
				</li>
			</ul>
		</dvi>
		<div>
			<span>to history:</span>
			<ul id="example-3">
				<li v-for="to in tos">
					<p @click="chooseTo(to)">{{to}}</p>
				</li>
			</ul>
		</div>
		<div>
			<span>from: </span><span>{{from}}</span>
		</div>
		<div>
			<span>to: </span><span>{{to}}</span>
		</div>
	  <button @click="sendTransaction">send transaction</button>
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
    	to: ""
    }
  },

  created()
  {
		axios.get("user/login", {
		    "a": "b"
		}, response => {
				if (response.status >= 200 && response.status < 300)
				{
					alert(response.data);
				}
				else
				{
					alert(response.message);
				}
		});
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

    sendTransaction: function(){
      alert("yes")
    }
  }
}
</script>