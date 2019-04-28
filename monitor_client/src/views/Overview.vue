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
                                <div style="display: flex;flex-direction: row; align-items: center; height: 100px;">
                                    <div style="display: flex;align-items: center; justify-content: center; border-radius:50%;width: 30px;height: 30px;border: 2px solid #67c23a;">
                                        <i class="el-icon-edit"></i>
                                    </div>
                                    
                                    <p style="width: 100%;border: 1px solid #67c23a;height: 2px;box-sizing: border-box;"/>
                                </div>
                                <span>{{block.name}}</span>                            
                                <span>{{block.description}}</span>
                            </div>
                        </template>
                        
                        <div style="display: flex;flex-direction: column;align-items: center;">
                            <div style="display: flex;flex-direction: row; align-items: center; height: 100px;">
                                <div class="spinner">
                                    <div class="double-bounce1"></div>
                                    <div class="double-bounce2"></div>
                                </div>
                            </div>
                            <span>aaa</span>
                            <span>bbb</span>
                        </div>
                    </div>
                </el-card>
            </el-row>
        </el-col>
    </div>
</template>

<script>
    import bus from '../components/bus';
    import { mapState } from 'vuex'

    export default {
        name: 'overview',
        data(){
            return {
                nodes: [{
                    index: 1,
                    name: 'a',
                    host: 'localhost',
                    port: 9090,
                    blocks: [{
                        name: '区块',
                        description: '2018-04-12 20:46'
                    }, {
                        name: '区块',
                        description: '2018-04-12 20:46'
                    }, {
                        name: '区块',
                        description: '2018-04-12 20:46'
                    }, {
                        name: '区块',
                        description: '2018-04-12 20:46'
                    }]
                }, {
                    index: 2,
                    name: 'b',
                    host: 'localhost',
                    port: 9090,
                    blocks: [{
                        name: '区块',
                        description: '2018-04-12 20:46'
                    }, {
                        name: '区块',
                        description: '2018-04-12 20:46'
                    }, {
                        name: '区块',
                        description: '2018-04-12 20:46'
                    }, {
                        name: '区块',
                        description: '2018-04-12 20:46'
                    }]
                }, {
                    index: 3,
                    name: 'c',
                    host: 'localhost',
                    port: 9090,
                    blocks: [{
                        name: '区块',
                        description: '2018-04-12 20:46'
                    }, {
                        name: '区块',
                        description: '2018-04-12 20:46'
                    }, {
                        name: '区块',
                        description: '2018-04-12 20:46'
                    }, {
                        name: '区块',
                        description: '2018-04-12 20:46'
                    }]
                }]
            }
        },
        created() {
             this.$store.commit('switchNavType', 'main');
        },

        activated(){
            this.$store.commit('switchNavType', 'main');
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
</style>