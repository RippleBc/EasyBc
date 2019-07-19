import Vue from 'vue'
import Vuex from 'vuex'
import bus from './components/bus';

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    unl: []
  },
  mutations: {
    setUnl(state, unl)
    {
      state.unl = unl;
    }
  },
  actions: {
    getUnl(context){
      const loading = Vue.prototype.$loading({
        lock: true,
        text: 'Loading',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      });

      Vue.prototype.$axios.post('/monitorNodes', {}).then(res => {
        if(res.code !== 0)
        {
          Vue.prototype.$message.error(res.msg);
        }
        else
        {
          context.commit('setUnl', res.data)
        }
        
      }).catch(err => {
        Vue.prototype.$message.error(err);
      }).finally(() => {
        loading.close();
      })
    }
  }
})
