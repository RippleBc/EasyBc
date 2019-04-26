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
  	}
  },
  mutations: {
  	switchNavType(state, type)
  	{
  		state.navType = type;
  	},
  	switchCurrentNode(state, node)
  	{
  		state.currentNode = node;
  	}
  },
  actions: {

  }
})
