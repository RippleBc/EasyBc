(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-3e07851b"],{a55b:function(e,s,r){"use strict";r.r(s);var t=function(){var e=this,s=e.$createElement,r=e._self._c||s;return r("div",{staticClass:"login-wrap"},[r("div",{staticClass:"ms-login"},[r("div",{staticClass:"ms-title"},[e._v("欢迎进入点对点交易平台节点监控系统")]),r("el-form",{ref:"loginForm",staticClass:"ms-content",attrs:{model:e.userInfo,rules:e.rules,"label-width":"auto"}},[r("el-form-item",{attrs:{prop:"username"}},[r("el-input",{attrs:{placeholder:"username"},model:{value:e.userInfo.username,callback:function(s){e.$set(e.userInfo,"username",s)},expression:"userInfo.username"}},[r("el-button",{attrs:{slot:"prepend",icon:"el-icon-lx-people"},slot:"prepend"})],1)],1),r("el-form-item",{attrs:{prop:"password"}},[r("el-input",{attrs:{type:"password",placeholder:"password"},nativeOn:{keyup:function(s){return!s.type.indexOf("key")&&e._k(s.keyCode,"enter",13,s.key,"Enter")?null:e.submitForm()}},model:{value:e.userInfo.password,callback:function(s){e.$set(e.userInfo,"password",s)},expression:"userInfo.password"}},[r("el-button",{attrs:{slot:"prepend",icon:"el-icon-lx-lock"},slot:"prepend"})],1)],1),r("div",{staticClass:"login-btn"},[r("el-button",{attrs:{type:"primary"},on:{click:function(s){return e.submitForm()}}},[e._v("登录")])],1),r("p",{staticClass:"login-tips"},[e._v("Tips : 用户名和密码随便填。")])],1)],1)])},n=[],o={data:function(){return{userInfo:{username:"",password:""},rules:{username:[{required:!0,message:"请输入用户名",trigger:"blur"}],password:[{required:!0,message:"请输入密码",trigger:"blur"}]}}},methods:{submitForm:function(){var e=this;this.$refs.loginForm.validate(function(s){s&&(localStorage.setItem("ms_username",e.userInfo.username),e.$axios.post("login",{username:e.userInfo.username,password:e.userInfo.password}).then(function(s){0!==s.code?e.$message.error(s.msg):e.$router.push("/")}))})}}},a=o,u=(r("e0a6"),r("17cc")),l=Object(u["a"])(a,t,n,!1,null,"0a079b25",null);s["default"]=l.exports},e0a6:function(e,s,r){"use strict";var t=r("f526"),n=r.n(t);n.a},f526:function(e,s,r){}}]);
//# sourceMappingURL=chunk-3e07851b.2948871c.js.map