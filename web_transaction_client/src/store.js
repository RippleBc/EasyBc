import Vue from 'vue'
import Vuex from 'vuex'
import nodesInfo from './nodes.json'
import axios from './net/axios.js'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
  	currentNode: nodesInfo[0],
    nodesInfo: nodesInfo,
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
				for(let nodeInfo of nodesInfo) {
					const promise =  new Promise((resolve, reject) => {
	        	axios.get('getLastestBlock', { url: nodeInfo.url }, response => {
		          if (response.code === 0) {
		            nodeInfo.detail = response.data
		          } else {
		            Vue.prototype.$notify.error({
		              title: 'getLastestBlock',
		              message: response.msg
		            });
		          }

		          resolve()
		        })
	        });

	        await promise;
				}
  		})().then(() => {
        context.commit('updateNodesInfo', nodesInfo);
  			context.commit('switchCurrentNode', nodesInfo[0]);
  		}).catch(e => {
  			Vue.prototype.$notify.error({
          title: 'getLastestBlock',
          message: e
        });
  		})

  		
  	}
  }
})
