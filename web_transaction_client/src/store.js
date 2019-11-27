import Vue from 'vue'
import Vuex from 'vuex'
import axios from './net/axios.js'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
  	currentNode: {},
    nodesInfo: [],
  },
  mutations: {
  	switchCurrentNode(state, node)
  	{
  		state.currentNode = node;
  	},

    updateNodesInfo(state, nodesInfo)
    {
      state.nodesInfo = nodesInfo;
    }
  },
  actions: {
  	getNodesInfo: function(context) {
			(async () => {
				// fetch nodes info
				const { data: nodesInfo } = await axios.get('getNodesInfo');

				// fetch nodes block info
				for(let nodeInfo of nodesInfo) {
					const response = await axios.get('getLastestBlock', { url: nodeInfo.url });
					
					if (response.code === 0) {
						nodeInfo.detail = response.data
					} else {
						Vue.prototype.$notify.error({
							title: 'getLastestBlock',
							message: response.msg
						});
					}
				}
  		})().then(() => {
        context.commit('updateNodesInfo', nodesInfo);
  			context.commit('switchCurrentNode', nodesInfo[0] || {});
  		}).catch(e => {
  			Vue.prototype.$notify.error({
          title: 'getLastestBlock',
          message: e
        });
  		})
  	}
  }
})
