(function(t){function e(e){for(var i,r,s=e[0],c=e[1],l=e[2],u=0,f=[];u<s.length;u++)r=s[u],a[r]&&f.push(a[r][0]),a[r]=0;for(i in c)Object.prototype.hasOwnProperty.call(c,i)&&(t[i]=c[i]);d&&d(e);while(f.length)f.shift()();return o.push.apply(o,l||[]),n()}function n(){for(var t,e=0;e<o.length;e++){for(var n=o[e],i=!0,r=1;r<n.length;r++){var c=n[r];0!==a[c]&&(i=!1)}i&&(o.splice(e--,1),t=s(s.s=n[0]))}return t}var i={},a={app:0},o=[];function r(t){return s.p+"js/"+({about:"about"}[t]||t)+"."+{about:"f5659b58"}[t]+".js"}function s(e){if(i[e])return i[e].exports;var n=i[e]={i:e,l:!1,exports:{}};return t[e].call(n.exports,n,n.exports,s),n.l=!0,n.exports}s.e=function(t){var e=[],n=a[t];if(0!==n)if(n)e.push(n[2]);else{var i=new Promise(function(e,i){n=a[t]=[e,i]});e.push(n[2]=i);var o,c=document.createElement("script");c.charset="utf-8",c.timeout=120,s.nc&&c.setAttribute("nonce",s.nc),c.src=r(t),o=function(e){c.onerror=c.onload=null,clearTimeout(l);var n=a[t];if(0!==n){if(n){var i=e&&("load"===e.type?"missing":e.type),o=e&&e.target&&e.target.src,r=new Error("Loading chunk "+t+" failed.\n("+i+": "+o+")");r.type=i,r.request=o,n[1](r)}a[t]=void 0}};var l=setTimeout(function(){o({type:"timeout",target:c})},12e4);c.onerror=c.onload=o,document.head.appendChild(c)}return Promise.all(e)},s.m=t,s.c=i,s.d=function(t,e,n){s.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:n})},s.r=function(t){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},s.t=function(t,e){if(1&e&&(t=s(t)),8&e)return t;if(4&e&&"object"===typeof t&&t&&t.__esModule)return t;var n=Object.create(null);if(s.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var i in t)s.d(n,i,function(e){return t[e]}.bind(null,i));return n},s.n=function(t){var e=t&&t.__esModule?function(){return t["default"]}:function(){return t};return s.d(e,"a",e),e},s.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},s.p="/",s.oe=function(t){throw console.error(t),t};var c=window["webpackJsonp"]=window["webpackJsonp"]||[],l=c.push.bind(c);c.push=e,c=c.slice();for(var u=0;u<c.length;u++)e(c[u]);var d=l;o.push([0,"chunk-vendors"]),n()})({0:function(t,e,n){t.exports=n("56d7")},"0463":function(t,e,n){"use strict";var i=n("6ff8"),a=n.n(i);a.a},"21bb":function(t,e,n){"use strict";var i=n("b954"),a=n.n(i);a.a},"2b2a":function(t,e,n){},"56d7":function(t,e,n){"use strict";n.r(e);n("3a0c"),n("aea1");var i=n("ba30"),a=n.n(i),o=(n("d33b"),n("b43f")),r=n.n(o),s=(n("0d20"),n("bd0b")),c=n.n(s),l=(n("4857"),n("d1e6")),u=n.n(l),d=(n("53b0"),n("ccab")),f=n.n(d),p=(n("6417"),n("37d6")),h=n.n(p),y=(n("85ee"),n("9bb2")),m=n.n(y),v=(n("7c1a"),n("aa47")),g=n.n(v),b=(n("6cd1"),n("030e")),x=n.n(b),w=(n("e739"),n("5fed")),S=n.n(w),_=(n("cd10"),n("fb78")),k=n.n(_),T=(n("ed66"),n("956c")),I=n.n(T),C=(n("8711"),n("5764")),j=n.n(C),$=(n("dac5"),n("6e26"),n("9604"),n("df67"),n("6e6d")),A=function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{attrs:{id:"app"}},[n("el-menu",{staticStyle:{width:"200px",height:"100%",position:"fixed"},attrs:{"default-active":t.onRoute,"unique-opened":"",router:""}},[n("el-menu-item",{attrs:{index:"/"}},[n("i",{staticClass:"el-icon-location"}),n("span",[t._v("首页")])]),n("el-menu-item",{attrs:{index:"/send"}},[n("i",{staticClass:"el-icon-folder"}),n("span",[t._v("交易")])]),n("el-menu-item",{attrs:{index:"/transactions"}},[n("i",{staticClass:"el-icon-date"}),n("span",[t._v("记录")])]),n("el-menu-item",{attrs:{index:"/about",disabled:""}},[n("i",{staticClass:"el-icon-document"}),n("span",[t._v("关于")])])],1),n("div",{staticStyle:{"margin-left":"210px",display:"flex","flex-direction":"column",width:"100%","box-sizing":"border-box"}},[n("h1",{staticStyle:{position:"fixed",width:"calc(100% - 200px)",height:"80px","background-color":"#ffff","z-index":"1"}},[t._v("区块链交易系统")]),n("div",{staticStyle:{"margin-top":"120px"}},[n("keep-alive",[n("router-view")],1)],1)])],1)},K=[],N={name:"App",data:function(){return{onRoute:"/"}},created:function(){},watch:{$route:function(){this.onRoute=this.$route.path}}},H=N,P=(n("5c0b"),n("17cc")),E=Object(P["a"])(H,A,K,!1,null,null,null),R=E.exports,O=n("1e6f"),V=function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{staticClass:"container"},[n("div",{staticStyle:{width:"100%"}},[n("el-card",{attrs:{shadow:"always"}},[n("h2",[t._v(t._s(t.currentNode.url))])])],1),n("div",{staticClass:"border",staticStyle:{width:"100%",height:"500px",overflow:"auto",margin:"20px 0px 20px 0px","padding-top":"20px"}},t._l(t.nodesInfo,function(e){return n("div",{staticStyle:{"justify-content":"left"}},[n("div",{staticStyle:{display:"flex","flex-direction":"row","justify-content":"start",cursor:"pointer"},on:{dblclick:function(n){return t.chooseNode(e)}}},[n("span",{staticStyle:{width:"100px"}},[t._v("节点地址")]),n("p",{staticStyle:{width:"100%"}},[t._v(t._s(e.url))])]),n("div",{staticStyle:{display:"flex","flex-direction":"row","justify-content":"start"}},[n("span",{staticStyle:{width:"100px"}},[t._v("区块哈希值")]),n("p",{staticStyle:{width:"100%"}},[t._v(t._s(e.detail.hash?e.detail.hash:"未知"))])]),n("div",{staticStyle:{display:"flex","flex-direction":"row","justify-content":"start"}},[n("span",{staticStyle:{width:"100px"}},[t._v("区块链高度")]),n("p",{staticStyle:{width:"100%"}},[t._v(t._s(e.detail.number?e.detail.number:0))])]),n("HR",{staticStyle:{FILTER:"alpha(opacity=100,finishopacity=0,style=3)"},attrs:{width:"99%",color:"#C0C4CC",SIZE:"1"}})],1)}),0)])},F=[],L={name:"Home",data:function(){return{}},created:function(){this.$store.dispatch("getNodesInfo")},computed:{currentNode:function(){return this.$store.state.currentNode},nodesInfo:function(){return this.$store.state.nodesInfo}},methods:{chooseNode:function(t){this.$store.commit("switchCurrentNode",t)}}},U=L,q=(n("21bb"),Object(P["a"])(U,V,F,!1,null,null,null)),B=q.exports,M=function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{staticClass:"container"},[n("div",{staticClass:"border",staticStyle:{margin:"20px 0px 20px 0px"}},[n("div",{staticStyle:{"flex-direction":"row"}},[n("el-input",{staticStyle:{margin:"20px"},attrs:{placeholder:"privateKey"},model:{value:t.privateKey,callback:function(e){t.privateKey=e},expression:"privateKey"}}),n("el-button",{staticStyle:{margin:"20px"},attrs:{type:"primary"},on:{click:t.importAccount}},[t._v("账号导入")]),n("el-button",{staticStyle:{"margin-right":"20px"},attrs:{type:"primary"},on:{click:t.generateKeyPiar}},[t._v("生成密匙对")])],1),n("div",{staticStyle:{"flex-direction":"row","justify-content":"end"}},[n("el-input",{staticStyle:{margin:"20px"},model:{value:t.transactionHash,callback:function(e){t.transactionHash=e},expression:"transactionHash"}}),n("el-button",{staticStyle:{margin:"20px"},attrs:{type:"info"},on:{click:t.getTransactionState}},[t._v("获取交易状态")])],1)]),n("div",{staticStyle:{margin:"20px 0px 20px 0px"}},[n("div",{staticClass:"border"},[n("div",{staticStyle:{"flex-direction":"row",margin:"20px 20px 20px 0px"}},[n("span",{staticStyle:{width:"100px"}},[t._v("发送者")]),n("el-input",{attrs:{placeholder:"请输入发送者id"},model:{value:t.from,callback:function(e){t.from=e},expression:"from"}})],1),n("div",{staticStyle:{"flex-direction":"row",margin:"20px 20px 20px 0px"}},[n("span",{staticStyle:{width:"100px"}},[t._v("接收者")]),n("el-input",{attrs:{placeholder:"请输入接收者id"},model:{value:t.to,callback:function(e){t.to=e},expression:"to"}})],1),n("div",{staticStyle:{"flex-direction":"row",margin:"20px 20px 20px 0px"}},[n("span",{staticStyle:{width:"100px"}},[t._v("值")]),n("el-input",{attrs:{placeholder:"请输入值"},model:{value:t.value,callback:function(e){t.value=e},expression:"value"}})],1),n("div",{staticStyle:{"flex-direction":"row","justify-content":"end",margin:"20px 20px 20px 0px"}},[n("el-button",{attrs:{type:"primary"},on:{click:t.sendTransaction}},[t._v("发送交易")])],1)])]),n("div",{staticStyle:{"flex-direction":"row"}},[n("div",{staticClass:"border",staticStyle:{height:"500px","justify-content":"start","align-items":"start",padding:"20px",margin:"20px 20px 20px 0px"}},[n("span",[t._v("账户列表")]),n("div",{staticStyle:{overflow:"auto","justify-content":"start"}},t._l(t.accounts,function(e){return n("div",[n("div",[n("p",{staticStyle:{cursor:"pointer",width:"100%","text-align":"left"}},[t._v(t._s(e))]),n("div",{staticStyle:{"flex-direction":"row","justify-content":"end"}},[n("el-button",{attrs:{type:"primary"},on:{click:function(n){return t.getTransactions(e)}}},[t._v("获取交易记录")]),n("el-button",{attrs:{type:"primary"},on:{click:function(n){return t.getAccountInfo(e)}}},[t._v("获取账户信息")]),n("el-button",{attrs:{type:"primary"},on:{click:function(n){return t.getPrivateKey(e)}}},[t._v("获取私钥")])],1)]),n("HR",{staticStyle:{FILTER:"alpha(opacity=100,finishopacity=0,style=3)"},attrs:{width:"99%",color:"#C0C4CC",SIZE:"1"}})],1)}),0)])]),n("div",{staticStyle:{"flex-direction":"row"}},[n("div",{staticClass:"border",staticStyle:{height:"500px","justify-content":"start","align-items":"start",padding:"20px",margin:"20px 20px 20px 0px"}},[n("span",[t._v("发送者记录")]),n("div",{staticStyle:{overflow:"auto","justify-content":"start"}},t._l(t.froms,function(e){return n("div",[n("div",[n("p",{staticStyle:{cursor:"pointer",width:"100%","text-align":"left"},on:{dblclick:function(n){return t.chooseFrom(e)}}},[t._v(t._s(e))]),n("div",{staticStyle:{"flex-direction":"row","justify-content":"end"}},[n("el-button",{attrs:{type:"primary"},on:{click:function(n){return t.getTransactions(e)}}},[t._v("获取交易记录")]),n("el-button",{attrs:{type:"primary"},on:{click:function(n){return t.getAccountInfo(e)}}},[t._v("获取账户信息")]),n("el-button",{attrs:{type:"primary"},on:{click:function(n){return t.getPrivateKey(e)}}},[t._v("获取私钥")])],1)]),n("HR",{staticStyle:{FILTER:"alpha(opacity=100,finishopacity=0,style=3)"},attrs:{width:"99%",color:"#C0C4CC",SIZE:"1"}})],1)}),0)]),n("div",{staticClass:"border",staticStyle:{height:"500px","justify-content":"start","align-items":"start",padding:"20px",margin:"20px 0px 20px 0px"}},[n("span",[t._v("接收者记录")]),n("div",{staticStyle:{overflow:"auto","justify-content":"start"}},t._l(t.tos,function(e){return n("div",[n("div",[n("p",{staticStyle:{cursor:"pointer",width:"100%","text-align":"left"},on:{dblclick:function(n){return t.chooseTo(e)}}},[t._v(t._s(e))]),n("div",{staticStyle:{"flex-direction":"row","justify-content":"end"}},[n("el-button",{attrs:{type:"primary"},on:{click:function(n){return t.getTransactions(e)}}},[t._v("获取交易记录")]),n("el-button",{attrs:{type:"primary"},on:{click:function(n){return t.getAccountInfo(e)}}},[t._v("获取账户信息")]),n("el-button",{attrs:{type:"primary"},on:{click:function(n){return t.getPrivateKey(e)}}},[t._v("获取私钥")])],1)]),n("HR",{staticStyle:{FILTER:"alpha(opacity=100,finishopacity=0,style=3)"},attrs:{width:"99%",color:"#C0C4CC",SIZE:"1"}})],1)}),0)])]),n("el-dialog",{attrs:{title:"账户详细信息",visible:t.accontInfoVisisble},on:{"update:visible":function(e){t.accontInfoVisisble=e}}},[n("div",{staticStyle:{"flex-direction":"row","justify-content":"start"}},[n("span",{staticStyle:{width:"100px"}},[t._v("地址")]),n("p",{staticStyle:{width:"100%"}},[t._v(t._s(t.address))])]),n("div",{staticStyle:{"flex-direction":"row","justify-content":"start"}},[n("span",{staticStyle:{width:"100px"}},[t._v("临时数")]),n("p",{staticStyle:{width:"100%"}},[t._v(t._s(t.nonce))])]),n("div",{staticStyle:{"flex-direction":"row","justify-content":"start"}},[n("span",{staticStyle:{width:"100px"}},[t._v("余额")]),n("p",{staticStyle:{width:"100%"}},[t._v(t._s(t.balance))])]),n("span",{staticClass:"dialog-footer",attrs:{slot:"footer"},slot:"footer"},[n("el-button",{attrs:{type:"primary"},on:{click:function(e){t.accontInfoVisisble=!1}}},[t._v("确 定")])],1)]),n("el-dialog",{attrs:{title:"私钥信息",visible:t.privateKeyInfoVisible},on:{"update:visible":function(e){t.privateKeyInfoVisible=e}}},[n("div",{staticStyle:{"flex-direction":"row","justify-content":"start"}},[n("span",{staticStyle:{width:"100px"}},[t._v("私钥")]),n("p",{staticStyle:{width:"100%"}},[t._v(t._s(t.privateKeyInfo))])]),n("span",{staticClass:"dialog-footer",attrs:{slot:"footer"},slot:"footer"},[n("el-button",{attrs:{type:"primary"},on:{click:function(e){t.privateKeyInfoVisible=!1}}},[t._v("确 定")])],1)]),n("el-dialog",{attrs:{title:"交易信息",visible:t.transactionInfoVisible},on:{"update:visible":function(e){t.transactionInfoVisible=e}}},[n("div",{staticStyle:{"flex-direction":"row","justify-content":"start"}},[n("span",{staticStyle:{width:"100px"}},[t._v("交易哈希值")]),n("p",{staticStyle:{width:"100%"}},[t._v(t._s(t.transactionHashInfo))])]),n("span",{staticClass:"dialog-footer",attrs:{slot:"footer"},slot:"footer"},[n("el-button",{attrs:{type:"primary"},on:{click:function(e){t.transactionInfoVisible=!1}}},[t._v("确 定")])],1)])],1)},Z=[],z=n("64ca"),D=n.n(z),G=n("7dc5"),J=D.a.create({baseURL:"http://".concat(G["a"],":").concat(G["b"]),withCredentials:!0,headers:{"Content-Type":"application/x-www-form-urlencoded;charset=utf-8"},transformRequest:[function(t){var e="";for(var n in t)!0===t.hasOwnProperty(n)&&(e+=encodeURIComponent(n)+"="+encodeURIComponent(t[n])+"&");return e}]});function Y(t,e,n,i){J({method:t,url:e,data:"POST"===t||"PUT"===t?n:null,params:"GET"===t||"DELETE"===t?n:null}).then(function(t){t.status<200||t.status>=300?Vue.prototype.$notify.error({title:"apiAxios",message:i}):i(t.data)}).catch(function(t){i(t)})}var Q={get:function(t,e,n){return Y("GET",t,e,n)},post:function(t,e,n){return Y("POST",t,e,n)},put:function(t,e,n){return Y("PUT",t,e,n)},delete:function(t,e,n){return Y("DELETE",t,e,n)}},W=1,X=2,tt=3,et={name:"Send",data:function(){return{accounts:["test","test"],froms:["test","test"],tos:["test","test"],from:"",to:"",value:0,transactionHash:"",privateKey:"",accontInfoVisisble:!1,address:"",nonce:"",balance:"",privateKeyInfoVisible:!1,privateKeyInfo:"",transactionInfoVisible:!1,transactionHashInfo:""}},created:function(){this.getFromHistory(),this.getToHistory(),this.getAccounts()},methods:{importAccount:function(){var t=this;Q.get("importAccount",{privateKey:this.privateKey},function(e){0===e.code?(t.getAccounts(),t.$notify.success({title:"importAccount",message:"import success"})):t.$notify.error({title:"importAccount",message:e.msg})})},chooseFrom:function(t){this.from=t},chooseTo:function(t){this.to=t},generateKeyPiar:function(){var t=this;Q.get("generateKeyPiar",{cacheAccount:!0},function(e){0===e.code?t.getAccounts():t.$notify.error({title:"generateKeyPiar",message:e.msg})})},getAccounts:function(){var t=this;Q.get("getAccounts",{offset:0},function(e){0===e.code?t.accounts=e.data:t.$notify.error({title:"getAccounts",message:e.msg})})},getFromHistory:function(){var t=this;Q.get("getFromHistory",{offset:0},function(e){0===e.code?t.froms=e.data:t.$notify.error({title:"getFromHistory",message:e.msg})})},getToHistory:function(){var t=this;Q.get("getToHistory",{offset:0},function(e){0===e.code?t.tos=e.data:t.$notify.error({title:"getToHistory",message:e.msg})})},sendTransaction:function(){var t=this;Q.get("sendTransaction",{url:this.currentNode.url,from:this.from,to:this.to,value:this.value},function(e){0===e.code?(t.transactionHash=t.transactionHashInfo=e.data,t.transactionInfoVisible=!0,t.getFromHistory(),t.getToHistory()):t.$notify.error({title:"sendTransaction",message:e.msg})})},getTransactionState:function(){var t=this;Q.get("getTransactionState",{url:this.currentNode.url,hash:this.transactionHash},function(e){0===e.code?e.data===tt?t.$notify.warn({title:"getTransactionState",message:"transaction has packed"}):e.data===X?t.$notify.warn({title:"getTransactionState",message:"transaction is processing"}):e.data===W?t.$notify.warn({title:"getTransactionState",message:"transaction is in cache, waiting to be process"}):t.$notify.error({title:"getTransactionState",message:"getTransactionState failed, get a invalid code"}):t.$notify.error({title:"getTransactionState",message:e})})},getAccountInfo:function(t){var e=this;Q.get("getAccountInfo",{url:this.currentNode.url,address:t},function(n){0===n.code?(e.address=t,e.nonce=n.data.nonce,e.balance=n.data.balance,e.accontInfoVisisble=!0):e.$notify.error({title:"getAccountInfo",message:n.msg})})},getPrivateKey:function(t){var e=this;Q.get("getPrivateKey",{address:t},function(t){0===t.code?(e.privateKeyInfo=t.data,e.privateKeyInfoVisible=!0):e.$notify.error({title:"getPrivateKey",message:t.msg})})},getTransactions:function(t){this.$router.push("transactions/".concat(t))}},computed:{currentNode:function(){return this.$store.state.currentNode}}},nt=et,it=(n("db20"),Object(P["a"])(nt,M,Z,!1,null,"f4d2ad90",null)),at=it.exports,ot=function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{staticClass:"container"},[n("div",{staticClass:"border"},[n("div",{staticStyle:{padding:"20px","box-sizing":"border-box"}},[n("div",{staticStyle:{"flex-direction":"row"}},[n("span",{staticStyle:{width:"100px","flex-shrink":"0"}},[t._v("hash")]),n("el-input",{staticStyle:{margin:"20px"},model:{value:t.hash,callback:function(e){t.hash=e},expression:"hash"}})],1),n("div",{staticStyle:{"flex-direction":"row"}},[n("span",{staticStyle:{width:"100px","flex-shrink":"0"}},[t._v("from")]),n("el-input",{staticStyle:{margin:"20px"},model:{value:t.from,callback:function(e){t.from=e},expression:"from"}}),n("span",{staticStyle:{width:"100px","flex-shrink":"0"}},[t._v("to")]),n("el-input",{staticStyle:{margin:"20px"},model:{value:t.to,callback:function(e){t.to=e},expression:"to"}})],1),n("div",{staticStyle:{"flex-direction":"row"}},[n("span",{staticStyle:{width:"100px","flex-shrink":"0"}},[t._v("开始时间")]),n("el-date-picker",{staticStyle:{width:"100%",margin:"20px"},attrs:{align:"right",type:"datetime",placeholder:"选择日期","value-format":"timestamp"},model:{value:t.beginTime,callback:function(e){t.beginTime=e},expression:"beginTime"}}),n("span",{staticStyle:{width:"100px","flex-shrink":"0"}},[t._v("结束时间")]),n("el-date-picker",{staticStyle:{width:"100%",margin:"20px"},attrs:{align:"right",type:"datetime",placeholder:"选择日期","value-format":"timestamp"},model:{value:t.endTime,callback:function(e){t.endTime=e},expression:"endTime"}})],1),n("div",{staticStyle:{"flex-direction":"row","justify-content":"end"}},[n("el-button",{attrs:{type:"info"},on:{click:function(e){return t.search()}}},[t._v("搜索")])],1)])]),n("div",{staticClass:"border",staticStyle:{margin:"20px 0px 20px 0px"}},[n("el-table",{staticStyle:{width:"100%"},attrs:{data:t.transactions}},[n("el-table-column",{attrs:{prop:"id",label:"id",width:"50"}}),n("el-table-column",{attrs:{prop:"nonce",label:"nonce",width:"180"}}),n("el-table-column",{attrs:{prop:"createdAt",label:"日期"}}),n("el-table-column",{attrs:{prop:"hash",label:"哈希值"}}),n("el-table-column",{attrs:{prop:"from",label:"发送账户"}}),n("el-table-column",{attrs:{prop:"to",label:"接收账户"}}),n("el-table-column",{attrs:{prop:"value",label:"金额",width:"50"}}),n("el-table-column",{attrs:{prop:"createdAt",label:"创建时间",width:"180"}})],1)],1)])},rt=[],st=(n("7bc1"),{name:"Transaction",data:function(){return{transactions:[],hash:"",from:"",to:"",beginTime:"",endTime:""}},computed:{currentNode:function(){return this.$store.state.currentNode}},created:function(){this.from=this.$route.path.split("/")[2]},activated:function(){this.from=this.$route.path.split("/")[2]},methods:{search:function(){var t=this;Q.get("/getTransactions",{offset:0,limit:100,url:this.currentNode.url,hash:this.hash,from:this.from,to:this.to,beginTime:this.beginTime,endTime:this.endTime},function(e){0===e.code?t.transactions=e.data.transactions:t.$notify.error({title:"getTransactions",message:e.msg})})}}}),ct=st,lt=(n("0463"),Object(P["a"])(ct,ot,rt,!1,null,"1f76dcf0",null)),ut=lt.exports;$["default"].use(O["a"]);var dt=new O["a"]({mode:"history",base:"/",routes:[{path:"/",name:"home",component:B},{path:"/send",name:"send",component:at},{path:"/transactions/:address",name:"transactions",component:ut},{path:"/transactions",name:"transactions",component:ut},{path:"/about",name:"about",component:function(){return n.e("about").then(n.bind(null,"f820"))}}]}),ft=(n("0eb5"),n("a4c5"),n("f763"),n("4453"),n("089b")),pt=n("591a"),ht=n("6d9a");$["default"].use(pt["a"]);var yt=new pt["a"].Store({state:{currentNode:ht[0],nodesInfo:ht},mutations:{switchCurrentNode:function(t,e){t.currentNode=e},updateNodesInfo:function(t,e){t.nodesInfo=e}},actions:{getNodesInfo:function(t){Object(ft["a"])(regeneratorRuntime.mark(function t(){var e,n,i,a,o,r;return regeneratorRuntime.wrap(function(t){while(1)switch(t.prev=t.next){case 0:e=!0,n=!1,i=void 0,t.prev=3,a=regeneratorRuntime.mark(function t(){var e,n;return regeneratorRuntime.wrap(function(t){while(1)switch(t.prev=t.next){case 0:return e=r.value,n=new Promise(function(t,n){Q.get("getLastestBlock",{url:e.url},function(n){0===n.code?e.detail=n.data:$["default"].prototype.$notify.error({title:"getLastestBlock",message:n.msg}),t()})}),t.next=4,n;case 4:case"end":return t.stop()}},t)}),o=ht[Symbol.iterator]();case 6:if(e=(r=o.next()).done){t.next=11;break}return t.delegateYield(a(),"t0",8);case 8:e=!0,t.next=6;break;case 11:t.next=17;break;case 13:t.prev=13,t.t1=t["catch"](3),n=!0,i=t.t1;case 17:t.prev=17,t.prev=18,e||null==o.return||o.return();case 20:if(t.prev=20,!n){t.next=23;break}throw i;case 23:return t.finish(20);case 24:return t.finish(17);case 25:case"end":return t.stop()}},t,null,[[3,13,17,25],[18,,20,24]])}))().then(function(){t.commit("updateNodesInfo",ht),t.commit("switchCurrentNode",ht[0])}).catch(function(t){$["default"].prototype.$notify.error({title:"getLastestBlock",message:t})})}}}),mt=n("e1bc");Object(mt["a"])("".concat("/","service-worker.js"),{ready:function(){console.log("App is being served from cache by a service worker.\nFor more details, visit https://goo.gl/AFskqB")},registered:function(){console.log("Service worker has been registered.")},cached:function(){console.log("Content has been cached for offline use.")},updatefound:function(){console.log("New content is downloading.")},updated:function(){console.log("New content is available; please refresh.")},offline:function(){console.log("No internet connection found. App is running in offline mode.")},error:function(t){console.error("Error during service worker registration:",t)}}),$["default"].use(j.a),$["default"].use(I.a),$["default"].use(k.a),$["default"].use(S.a),$["default"].use(x.a),$["default"].use(g.a),$["default"].use(m.a),$["default"].use(h.a),$["default"].use(f.a),$["default"].use(u.a),$["default"].use(c.a),$["default"].use(r.a),$["default"].config.productionTip=!1,$["default"].prototype.$notify={success:function(t){a.a.success(t)},error:function(t){a.a.error(t)},warn:function(t){a.a.warning(t)}},new $["default"]({router:dt,store:yt,render:function(t){return t(R)}}).$mount("#app")},"5c0b":function(t,e,n){"use strict";var i=n("2b2a"),a=n.n(i);a.a},"6d9a":function(t){t.exports=[{url:"http://localhost:8081",detail:{number:"未知",hash:"未知"}},{url:"http://123.157.68.243:10011",detail:{number:"未知",hash:"未知"}},{url:"http://123.157.68.243:10051",detail:{number:"未知",hash:"未知"}},{url:"http://115.233.227.46:35003",detail:{number:"未知",hash:"未知"}},{url:"http://115.233.227.46:35008",detail:{number:"未知",hash:"未知"}}]},"6ff8":function(t,e,n){},"7dc5":function(t){t.exports={a:"localhost",b:8082}},"9e36":function(t,e,n){},b954:function(t,e,n){},db20:function(t,e,n){"use strict";var i=n("9e36"),a=n.n(i);a.a}});
//# sourceMappingURL=app.3a6b6037.js.map