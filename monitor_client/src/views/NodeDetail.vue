<template>
    <div>
        <div class="crumbs">
            <i class="el-icon-share"></i>
            <el-breadcrumb separator="/" style="font-size: 18px;line-height: 18px;margin-left: 20px;">
                <el-breadcrumb-item>
                    <span>{{`索引 ${currentNode.id}`}}</span>
                </el-breadcrumb-item>
                <el-breadcrumb-item>
                    <span>{{`名称 ${currentNode.name}`}}</span>
                </el-breadcrumb-item>
                <el-breadcrumb-item>
                    <span>{{`${currentNode.host}:${currentNode.port}`}}</span>
                </el-breadcrumb-item>
            </el-breadcrumb>
        </div>
        <el-col>
            <el-row :gutter="20" style="margin-bottom: 20px;">
                <el-col :span="24">
                    <el-card shadow="hover">
                        <ve-histogram ref="timeoutNodes" :data="timeoutNodesData" :settings="timeoutNodesSettings" :resizeable="true"></ve-histogram>
                    </el-card>
                </el-col>
            </el-row>
            <el-row :gutter="20" style="margin-bottom: 20px;">
                <el-col :span="24">
                    <el-card shadow="hover">
                        <ve-histogram ref="cheatedNodes" :data="cheatedNodesData" :settings="cheatedNodesSettings" :resizeable="true"></ve-histogram>
                    </el-card>
                </el-col>
            </el-row>
            <el-row :gutter="20" style="margin-bottom: 20px;">
                <el-col :span="24">
                    <el-card shadow="hover">
                        <ve-line :data="cpuConsume" :resizeable="true"></ve-line>
                    </el-card>
                </el-col>
            </el-row>
            <el-row :gutter="20" style="margin-bottom: 20px;">
                <el-col :span="24">
                    <el-card shadow="hover">
                        <ve-line :data="memoryConsume" :resizeable="true"></ve-line>
                    </el-card>
                </el-col>
            </el-row>
        </el-col>
    </div>
</template>

<script>
    import bus from '../components/bus';
    import { mapState } from 'vuex';

    export default {
        name: 'nodeDetail',
        data: () => ({
            currentNode: undefined,
            timeoutNodesData:{
                columns: ['节点', '超时次数', '超时频率'],
                rows: [
                    { '节点': 'aaa', '超时次数': 18000, '超时频率': 20000 },
                    { '节点': 'bbb', '超时次数': 101, '超时频率': 101 },
                    { '节点': 'bbb', '超时次数': 102, '超时频率': 102 },
                    { '节点': 'bbb', '超时次数': 103, '超时频率': 103 },
                    { '节点': 'bbb', '超时次数': 104, '超时频率': 104 },
                    { '节点': 'bbb', '超时次数': 105, '超时频率': 105 }
                ]
            },
            timeoutNodesSettings:{
                axisSite: { right: ['超时频率'] },
                yAxisType: ['normal', 'normal'],
                yAxisName: ['数值', '频率']
            },
            cheatedNodesData:{
                columns: ['节点', '作弊次数', '作弊频率'],
                rows: [
                    { '节点': 'aaa', '作弊次数': 18000, '作弊频率': 20000 },
                    { '节点': 'bbb', '作弊次数': 101, '作弊频率': 101 },
                    { '节点': 'bbb', '作弊次数': 102, '作弊频率': 102 },
                    { '节点': 'bbb', '作弊次数': 103, '作弊频率': 103 },
                    { '节点': 'bbb', '作弊次数': 104, '作弊频率': 104 },
                    { '节点': 'bbb', '作弊次数': 105, '作弊频率': 105 }
                ]
            },
            cheatedNodesSettings:{
                axisSite: { right: ['作弊频率'] },
                yAxisType: ['normal', 'normal'],
                yAxisName: ['数值', '频率']
            },
            cpuConsume:{
                columns: ['createTime', '处理器'],
                rows: []
            },
            memoryConsume:{
                columns: ['createTime', '内存'],
                rows: []
            }
        }),
        computed: {
            ...mapState(['unl'])
        },
        created(){
            this.getCurrentNode();

            this.handleListener();
        },
        activated(){
            this.getCurrentNode();

            this.$axios.get("nodeStatus", {
                address: this.currentNode.address
            }).then(res => {
                if(res.code !== 0)
                {
                    this.$message.error(res.msg);
                }
                else
                {
                    this.cpuConsume.rows = res.data.cpus.map(n => {
                        return {
                            createTime: n.createdAt,
                            '处理器': n.consume
                        }
                    });
                    this.memoryConsume.rows = res.data.memories.map(n => {
                        return {
                            createTime: n.createdAt,
                            '内存': n.consume / 1024 / 1024
                        }
                    });
                }
            });

            this.handleListener();
        },
        deactivated(){
            bus.$off('collapse', this.renderCharts);
        },
        methods:
        {
            handleListener(){
                bus.$on('collapse', this.renderCharts);
            },

            renderCharts(){
                
            },
            getCurrentNode(){
                const nodeIndex = this.$route.path.split('/')[2];
                const nodeInfo = this.unl.find(n => nodeIndex == n.id)
                this.currentNode = nodeInfo;
            }
        }
    }
</script>

<style scoped>
    .schart{
        width: 500px;
        height: 400px;
    }
    .content-title{
        clear: both;
        font-weight: 400;
        line-height: 50px;
        margin: 10px 0;
        font-size: 22px;
        color: #1f2f3d;
    }
    
</style>