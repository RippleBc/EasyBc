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
        <div class="container">
            <el-tabs v-model="message">
                <el-tab-pane label="超时情况" name="first">
                    <el-card shadow="hover">
                        <ve-histogram ref="timeoutNodes" :data="timeoutNodesData" :settings="timeoutNodesSettings" :resizeable="true"></ve-histogram>
                    </el-card>
                </el-tab-pane>
                <el-tab-pane label="作弊情况" name="second">
                    <template v-if="message === 'second'">
                        <el-card shadow="hover">
                            <ve-histogram ref="cheatedNodes" :data="cheatedNodesData" :settings="cheatedNodesSettings" :resizeable="true"></ve-histogram>
                        </el-card>
                    </template>
                </el-tab-pane>
            </el-tabs>
        </div>
    </div>
</template>

<script>
    export default {
        name: 'nodeDetail',
        data: () => ({
            message: 'first',
            currentNode: undefined,
            timeoutNodesData:{
                columns: ['address', 'times', 'frequency'],
                rows: []
            },
            timeoutNodesSettings:{
                axisSite: { right: ['超时频率'] },
                yAxisType: ['normal', 'normal'],
                yAxisName: ['超时次数', '超时频率/小时']
            },
            cheatedNodesData:{
                columns: ['address', 'times', 'frequency'],
                rows: []
            },
            cheatedNodesSettings:{
                axisSite: { right: ['作弊频率'] },
                yAxisType: ['normal', 'normal'],
                yAxisName: ['作弊次数', '作弊频率/小时']
            }
        }),
        created(){
            const nodeIndex = this.$route.path.split('/')[2];
            const nodeInfo = this.$store.state.unl.find(n => nodeIndex == n.id)
            this.currentNode = nodeInfo;
            
            this.getCheatedNodes();
            this.getTimeoutNodes();
        },

        methods:
        {
            getTimeoutNodes() {
                this.$axios.post("abnormalNodes", {
                    url: `${this.currentNode.host}:${this.currentNode.port}`,
                    type: 1,
                    beginTime: Date.now() - 24 * 60 * 60 * 1000,
                    endTime: Date.now(),
                    offset: 0,
                    limit: 499
                }).then(res => {
                    if(res.code !== 0)
                    {
                        this.$message.error(res.msg);
                    }
                    else
                    {
                        this.timeoutNodesData.rows = res.data.map(n => {
                            return {
                                address: n.address,
                                times: n.frequency,
                                frequency: n.frequency / 24
                            }
                        });
                    }
                });
            },
            getCheatedNodes() {
                this.$axios.post("abnormalNodes", {
                    url: `${this.currentNode.host}:${this.currentNode.port}`,
                    type: 2,
                    beginTime: Date.now() - 24 * 60 * 60 * 1000,
                    endTime: Date.now(),
                    offset: 0,
                    limit: 499
                }).then(res => {
                    if(res.code !== 0)
                    {
                        this.$message.error(res.msg);
                    }
                    else
                    {
                        this.cheatedNodesData.rows = res.data.map(n => {
                            return {
                                address: n.address,
                                times: n.frequency,
                                frequency: parseInt(n.frequency) / 24
                            }
                        });
                    }
                });
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