import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
  	navType: 'main',
  	currentNode: {
  		index: 0,
			name: "",
			host: "",
			port: 0,
			remarks: ""
  	},
    unl: []
  },
  mutations: {
  	switchNavType(state, type)
  	{
  		state.navType = type;
  	},
  	switchCurrentNode(state, node)
  	{
  		state.currentNode = node;
  	},
    getUnl(state, unl)
    {
      state.unl = unl;
    }
  },
  actions: {
    getUnl(context, vueInstance){
      const loading = Vue.prototype.$loading({
        lock: true,
        text: 'Loading',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      });

      Vue.prototype.$axios.get('/unl', {}).then(res => {
        if(res.code !== 0)
        {
          Vue.prototype.$message.error(res.msg);
        }
        else
        {
          context.commit('getUnl', res.data)
        }
        
      }).catch(err => {
        Vue.prototype.$message.error(err);
      }).finally(() => {
        loading.close();
      })
    }
  }
})
