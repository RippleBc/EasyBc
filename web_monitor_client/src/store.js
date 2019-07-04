import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
  	currentNode: {
  		id: 0,
      name: "",
      address: "",
			host: "",
			port: 0,
			remarks: ""
  	},
    unl: []
  },
  mutations: {
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

      Vue.prototype.$axios.get('/nodes', {}).then(res => {
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
