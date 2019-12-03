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
                                    <span>{{`索引 ${node.id}`}}</span>
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
                    <div style="display: flex;padding:40px; border-bottom: 1px solid #ddd;margin-right: 20%;margin-bottom: 20px;">
                        <div style="display: flex;margin-right: 20px;border-right: 1px solid #ddd;align-items:center;">
                            <span style="margin: 10px;">错误监控状态</span>
                            <span v-if="node.state.error===1" style="background:rgb(119,136,153);" class="monitorState">关闭</span>
                            <span v-else-if="node.state.error===2" style="background:rgb(0,191,255);" class="monitorState">进行中</span>
                            <span v-else-if="node.state.error===3" style="background:rgb(255,255,0);" class="monitorState">发现错误</span>
                            <span v-else class="monitorState">已经报警</span>
                        </div>
                            
                        <div style="display: flex;margin-right: 20px;border-right: 1px solid #ddd;align-items:center;">
                            <span style="margin: 10px;">奔溃监控状态</span>
                            <span v-if="node.state.fatal===1" style="background:rgb(119,136,153)" class="monitorState">关闭</span>
                            <span v-else-if="node.state.fatal===2" style="background:rgb(0,191,255)" class="monitorState">进行中</span>
                            <span v-else-if="node.state.fatal===3" style="background:rgb(255,255,0)" class="monitorState">发现异常</span>
                            <span v-else class="monitorState">已经报警</span>
                        </div>
                        
                        <el-button type="primary" @click = "openCheckProcessException(node.address)" style="margin-right: 20px;">开始/重置 监控</el-button>
                        <el-button type="primary" @click = "closeCheckProcessException(node.address)">关闭监控</el-button>
                    </div>
                    <div style="display: flex;">
                        <template v-for="(block, index) in node.blocks">
                            <div class="block-move" @mouseenter="block.show = true" @mouseleave="block.show = false" :key="index">
                                <div style="display: flex;flex-direction: row; align-items: center; height: 80px;">
                                    <div style="display: flex;align-items: center; justify-content: center; border-radius:50%;width: 30px;height: 30px;border: 2px solid #67c23a;">
                                        <span>{{block.number}}</span>
                                    </div>
                                    
                                    <p style="width: 100%;border: 1px solid #67c23a;height: 2px;box-sizing: border-box;"/>
                                </div>
                                <transition name="fade">
                                    <div v-show="block.show" style="overflow: auto; height: 220px;">
                                        <div style="display: flex;flex-direction: row;justify-content: start;align-items: center;">
                                            <strong style="width: 100px;flex-shrink: 0;">哈西</strong>
                                            <span style="margin: 20px;">{{block.hash}}</span>
                                        </div>
                                        <div style="display: flex;flex-direction: row;justify-content: start;align-items: center;">
                                            <strong style="width: 100px;flex-shrink: 0;">父节点</strong>
                                            <span style="margin: 20px;">{{block.parentHash}}</span>
                                        </div>
                                        <div style="display: flex;flex-direction: row;justify-content: start;align-items: center;">
                                            <strong style="width: 100px;flex-shrink: 0;">状态树</strong>
                                            <span style="margin: 20px;">{{block.stateRoot}}</span> 
                                        </div>
                                        <div style="display: flex;flex-direction: row;justify-content: start;align-items: center;">
                                            <strong style="width: 100px;flex-shrink: 0;">时间戳</strong>
                                            <span style="margin: 20px;">{{block.timestamp}}</span>
                                        </div>
                                    </div>
                                </transition>
                            </div>
                        </template>
                        
                        <div style="display: flex;flex-direction: column;align-items: center;">
                            <div style="display: flex;flex-direction: row; align-items: center;height: 80px;">
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
        watch: {
            unl: function() {
                this.getNodesInfo()
            }
        },
        created() {
            this.getNodesInfo()
        },
        methods: {

            openCheckProcessException(address) {
                this.$axios.post('/openCheckProcessException', {
                    address: address
                }).then(res => {
                    if(res.code !== 0)
                    {
                        this.$message.error(res.msg);
                    }
                    else
                    {
                       this.$message.success("sucess")
                    }
                });
            },

            closeCheckProcessException(address)
            {
                this.$axios.post('/closeCheckProcessException', {
                    address: address
                }).then(res => {
                    if(res.code !== 0)
                    {
                        this.$message.error(res.msg);
                    }
                    else
                    {
                       this.$message.success("sucess")
                    }
                });
            },

            getNodesInfo() {
                const nodesInfo = new Map;
            

                const nodesInfoPromises = [];

                for(let node of this.unl)
                {
                    nodesInfoPromises.push(new Promise((resolve, reject) => {
                        this.$axios.post('/blocks', {
                            url: `${node.host}:${node.port}`
                        }).then(res => {
                            if(res.code !== 0)
                            {
                                this.$message.error(res.msg);
                            }
                            else
                            {
                                // add show filed
                                for(let index of res.data.keys())
                                {
                                    res.data[index].show = false;
                                }

                                // get nodeInfo
                                let nodeInfo = nodesInfo.get(node.address);
                                if(!nodeInfo)
                                {
                                    nodeInfo = {
                                        id: node.id,
                                        address: node.address,
                                        name: node.name,
                                        host: node.host,
                                        port: node.port
                                    }
                                }

                                // add block info
                                Object.assign(nodeInfo, {blocks: res.data});

                                // 
                                nodesInfo.set(node.address, nodeInfo);
                            }

                            resolve();
                        });
                    }));

                    nodesInfoPromises.push(new Promise((resolve, reject) => {
                        this.$axios.post('/fetchCheckProcessExceptionState', {
                            address: node.address
                        }).then(res => {
                            if(res.code !== 0)
                            {
                                this.$message.error(res.msg);
                            }
                            else
                            {
                                // get nodeInfo
                                let nodeInfo = nodesInfo.get(node.address);
                                if(!nodeInfo)
                                {
                                    nodeInfo = {
                                        id: node.id,
                                        address: node.address,
                                        name: node.name,
                                        host: node.host,
                                        port: node.port
                                    }
                                }

                                // add process state
                                Object.assign(nodeInfo, {state: res.data});

                                // 
                                nodesInfo.set(node.address, nodeInfo);
                            }

                            resolve();
                        });
                    }));
                }

                Promise.all(nodesInfoPromises).finally(() => {
                    // 优先显示连接成功以及id比较小的节点的节点
                    this.nodes = [...nodesInfo.values()].sort((a, b) => { 
                        const comp1 = (b.blocks ? 1 : 0) - (a.blocks ? 1 : 0) 
                        if(comp1 !== 0)
                        {
                            return comp1;
                        }

                        return a.id - b.id;
                    });
                });
            }
        }
    }
</script>

<style lang="scss" scoped type>
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
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}

.block-move {
    &:hover {
        width: calc(100%/5*1.5);
        height: 300px;
    }
    width: calc(100%/5);
    height: 80px;
    transition: all 2s;
    flex-shrink: 0;
}

.monitorState
{
    color: white;
    text-align:center;
    width:100px;
    margin:10px;
    background:rgb(220,20,60);
    border-radius:5px;
}

</style>