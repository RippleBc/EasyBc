<template>
    <div>
        <div class="crumbs">
            <i class="el-icon-share"></i>
            <el-breadcrumb separator="/" style="font-size: 18px;line-height: 18px;margin-left: 20px;">
                <el-breadcrumb-item>
                    <span>{{`索引 ${currentNode.index}`}}</span>
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
                        <ve-line ref="consensusTimeConsume" :data="consensusTimeConsumeData" :resizeable="true"></ve-line>
                    </el-card>
                </el-col>
            </el-row>
        </el-col>
    </div>
</template>

<script>
    import Schart from 'vue-schart';
    import bus from '../components/bus';
    import { mapState } from 'vuex';
    import {unls} from '../config.json';

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
            consensusTimeConsumeData:{
                columns: ['时间', '合并', '交易', '区块'],
                rows: [
                    { '时间': '1/1', '合并': 93, '交易': 94, '区块': 32 },
                    { '时间': '1/2', '合并': 30, '交易': 36, '区块': 26 },
                    { '时间': '1/3', '合并': 23, '交易': 28, '区块': 76 },
                    { '时间': '1/4', '合并': 23, '交易': 20, '区块': 49 },
                    { '时间': '1/5', '合并': 92, '交易': 422, '区块': 323 },
                    { '时间': '1/6', '合并': 93, '交易': 13, '区块': 78 }
                ]
            }
        }),
        created(){
            this.getCurrentNode();

            this.handleListener();
        },
        activated(){
            this.getCurrentNode();

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
                const nodeInfo = unls.find(n => nodeIndex == n.index)
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