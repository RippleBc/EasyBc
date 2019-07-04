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
                        <ve-line :data="timeConsume" :resizeable="true"></ve-line>
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
            switch: false,
            currentNode: undefined,
            timeoutNodesData:{
                columns: ['address', 'times', 'frequency'],
                rows: []
            },
            timeoutNodesSettings:{
                axisSite: { right: ['超时频率'] },
                yAxisType: ['normal', 'normal'],
                yAxisName: ['超时次数', '超时频率/小时                               ']
            },
            cheatedNodesData:{
                columns: ['address', 'times', 'frequency'],
                rows: []
            },
            cheatedNodesSettings:{
                axisSite: { right: ['作弊频率'] },
                yAxisType: ['normal', 'normal'],
                yAxisName: ['作弊次数', '作弊频率/小时                                ']
            },
            timeConsume: {
                columns: ['createdAt', 'consume'],
                rows: []
            }
        }),
        computed: {
            ...mapState(['unl'])
        },
        created(){
            if(this.currentNode === undefined)
            {
                this.getCurrentNode();
            }
        },
        watch: {
            $route(newVal, oldVal)
            {
                if(!this.switch)
                {
                    this.getCurrentNode();

                    this.getTimeConsume();
                    this.getCheatedNodes();
                    this.getTimeoutNodes();

                    this.handleListener();
                }

                this.switch = false;
            }
        },
        
        activated(){
            this.switch = true;

            this.getCurrentNode();

            this.getTimeConsume();
            this.getCheatedNodes();
            this.getTimeoutNodes();

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
            },
            getTimeConsume() {
                this.$axios.get("timeConsume", {
                    url: `${this.currentNode.host}:${this.currentNode.port}`,
                    beginTime: Date.now() - 2 * 60 * 60 * 1000,
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
                        this.timeConsume.rows = res.data.map(n => {
                            return {
                                createdAt: new Date(n.createdAt).toLocaleString(),
                                consume: n.data
                            }
                        }).reverse();
                    }
                });
            },
            getTimeoutNodes() {
                this.$axios.get("abnormalNodes", {
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
                this.$axios.get("abnormalNodes", {
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