<template>
    <div>
        <el-col>
            <el-row v-for="(node, index) in nodes" :key="index" style="margin-bottom:20px;">
                <el-card>
                    <div style="margin-bottom:20px;">
                                <div class="crumbs">
                                    <i class="el-icon-share"></i>
                                    <el-breadcrumb separator="/" style="font-size: 16px;line-height: 16px;margin-left: 20px;">
                                        <el-breadcrumb-item>
                                            <span>{{`索引 ${node.index}`}}</span>
                                        </el-breadcrumb-item>
                                        <el-breadcrumb-item>
                                            <span>{{`名称 ${node.name}`}}</span>
                                        </el-breadcrumb-item>
                                        <el-breadcrumb-item>
                                            <span>{{`${node.host}:${node.port}`}}</span>
                                        </el-breadcrumb-item>
                                    </el-breadcrumb>
                                </div>
                    </div>
                    <div style="display: flex;">
                        <template v-for="(block, index) in node.blocks">
                            <div style="display: flex;flex-direction: column;width: 100%" :key="index">
                                <transition name="move">
                                    <div style="display: flex;flex-direction: row; align-items: center; height: 80px;">
                                        <div @click="block.show = !block.show" style="display: flex;align-items: center; justify-content: center; border-radius:50%;width: 30px;height: 30px;border: 2px solid #67c23a;">
                                            <span>{{block.number}}</span>
                                        </div>
                                        
                                        <p style="width: 100%;border: 1px solid #67c23a;height: 2px;box-sizing: border-box;"/>
                                    </div>
                                </transition>
                                <transition name="fade">
                                    <div v-show="block.show">
                                        <div>
                                            <span>哈西: </span>
                                            <span style="margin-bottom: 20px;">{{block.hash}}</span>
                                        </div>
                                        <div>
                                            <span>父节点哈西: </span>
                                            <span style="margin-bottom: 20px;">{{block.parentHash}}</span>
                                        </div>
                                        <div>
                                            <span>状态树根节点: </span>
                                            <span style="margin-bottom: 20px;">{{block.stateRoot}}</span> 
                                        </div>
                                        <div>
                                            <span>交易树根节点: </span>
                                            <span style="margin-bottom: 20px;">{{block.transactionsTrie}}</span>
                                        </div>
                                        <div>
                                            <span>时间戳: </span>
                                            <span>{{block.timestamp}}</span>
                                        </div>
                                    </div>
                                </transition>
                            </div>
                        </template>
                        
                        <div style="display: flex;flex-direction: column;align-items: center;">
                            <div style="display: flex;flex-direction: row; align-items: center; height: 80px;">
                                <div class="spinner">
                                    <div class="double-bounce1"></div>
                                    <div class="double-bounce2"></div>
                                </div>
                            </div>
                            <span>生成中</span>
                        </div>
                    </div>
                </el-card>
            </el-row>
        </el-col>
    </div>
</template>

<script>
    import bus from '../components/bus';
    import { mapState } from 'vuex';

    export default {
        name: 'overview',
        data(){
            return {
                nodes: []
            }
        },
        computed: {
            ...mapState(['unl'])
        },
        watch:
        {
            unl: function(val, oldVal)
            {
                const nodeInfoSet = [];

                (async () => {
                    for(let node of this.$store.state.unl)
                    {
                        let res = await this.$axios.get('/blocks', {
                            url: `${node.host}:${node.port}`
                        });

                        for(let index of res.data.keys())
                        {
                            res.data[index].show = false;
                        }

                        let nodeInfo = {...{

                            index: node.index,
                            name: node.name,
                            host: node.host,
                            port: node.port
                        }, ...{blocks: res.data}}

                        nodeInfoSet.push(nodeInfo);
                    }
                })().then(() => {
                    this.nodes = nodeInfoSet;
                }).catch(err => {
                    this.$message.error(err);
                });
            }
        },
        created() {
            this.$store.commit('switchNavType', 'main');
        },

        activated(){
            this.$store.commit('switchNavType', 'main');
        },

        methods: {
            
        }
    }
</script>

<style scoped>
.spinner {
  width: 60px;
  height: 60px;
  position: relative;
}
 
.double-bounce1, .double-bounce2 {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: #67CF22;
  opacity: 0.6;
  position: absolute;
  top: 0;
  left: 0;
   
  -webkit-animation: bounce 2.0s infinite ease-in-out;
  animation: bounce 2.0s infinite ease-in-out;
}

.double-bounce2 {
  -webkit-animation-delay: -1.0s;
  animation-delay: -1.0s;
}
 
@-webkit-keyframes bounce {
  0%, 100% { -webkit-transform: scale(0.0) }
  50% { -webkit-transform: scale(1.0) }
}
 
@keyframes bounce {
  0%, 100% {
    transform: scale(0.0);
    -webkit-transform: scale(0.0);
  } 50% {
    transform: scale(1.0);
    -webkit-transform: scale(1.0);
  }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity .5s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}

.move-enter-active, .move-leave-active {
  transition: all 10s;
}
.move-enter, .move-leave-to {
  opacity: 0;
}

</style>