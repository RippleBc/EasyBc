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
        <el-row :gutter="20">
            <el-col>
                <el-row :gutter="20" class="mgb20">
                    <el-col :span="6">
                        <el-card shadow="hover" :body-style="{padding: '0px'}" style="cursor:pointer;">
                            <div class="grid-content grid-con-1" @click="type='INFO'">
                                <i class="el-icon-lx-notice grid-con-icon"></i>
                                <div class="grid-cont-right">
                                    <div class="grid-num">{{infoLogsCount}}</div>
                                    <div>系统消息</div>
                                </div>
                            </div>
                        </el-card>
                    </el-col>
                    <el-col :span="6">
                        <el-card shadow="hover" :body-style="{padding: '0px'}" style="cursor:pointer;">
                            <div class="grid-content grid-con-2" @click="type='WARNING'">
                                <i class="el-icon-lx-notice grid-con-icon"></i>
                                <div class="grid-cont-right">
                                    <div class="grid-num">{{warnLogsCount}}</div>
                                    <div>警告消息</div>
                                </div>
                            </div>
                        </el-card>
                    </el-col>
                    <el-col :span="6">
                        <el-card shadow="hover" :body-style="{padding: '0px'}" style="cursor:pointer;">
                            <div class="grid-content grid-con-3" @click="type='ERROR'">
                                <i class="el-icon-lx-notice grid-con-icon"></i>
                                <div class="grid-cont-right">
                                    <div class="grid-num">{{errorLogsCount}}</div>
                                    <div>错误提醒</div>
                                </div>
                            </div>
                        </el-card>
                    </el-col>
                    <el-col :span="6">
                        <el-card shadow="hover" :body-style="{padding: '0px'}" style="cursor:pointer;">
                            <div class="grid-content grid-con-4" @click="type='FATAL'">
                                <i class="el-icon-lx-notice grid-con-icon"></i>
                                <div class="grid-cont-right">
                                    <div class="grid-num">{{fatalLogsCount}}</div>
                                    <div>报警提醒</div>
                                </div>
                            </div>
                        </el-card>
                    </el-col>
                </el-row>
                <v-messages :type="type" :logs="infoLogs" v-show="type === 'INFO'"></v-messages>
                <v-messages :type="type" :logs="warnLogs" v-show="type === 'WARNING'"></v-messages>
                <v-messages :type="type" :logs="errorLogs" v-show="type === 'ERROR'"></v-messages>
                <v-messages :type="type" :logs="fatalLogs" v-show="type === 'FATAL'"></v-messages>
            </el-col>
        </el-row>
    </div>
</template>

<script>
    import vMessages from '../components/Messages.vue'

    export default {
        name: 'dashboard',
        data() {
            return {
                type: 'INFO',
                infoLogsCount: 0,
                infoLogs: [],
                warnLogsCount: 0,
                warnLogs: [],
                errorLogsCount: 0,
                errorLogs: [],
                fatalLogsCount: 0,
                fatalLogs: [],
                currentNode: undefined,
            }
        },
        components:{
            vMessages
        },
        methods: {
            getLogs(type)
            {
                this.$axios.post('/logs', {
                    url: `${this.currentNode.host}:${this.currentNode.port}`,
                    type: type,
                    offset: 0,
                    limit: 100
                }).then(res => {
                    if(res.code !== 0)
                    {
                        return this.$message.error(`${type}信息加载错误, ${res.msg}`);
                    }
                    if(type === 'INFO')
                    {
                        this.infoLogsCount = res.data.count;
                        this.infoLogs = res.data.logs.map(log => {
                            log.time = new Date(parseInt(log.time)).toLocaleString()
                            return log
                        });
                    }
                    if(type === 'WARNING')
                    {
                        this.warnLogsCount = res.data.count;
                        this.warnLogs = res.data.logs.map(log => {
                            log.time = new Date(parseInt(log.time)).toLocaleString()
                            return log
                        });
                    }
                    if(type === 'ERROR')
                    {
                        this.errorLogsCount = res.data.count;
                        this.errorLogs = res.data.logs.map(log => {
                            log.time = new Date(parseInt(log.time)).toLocaleString()
                            return log
                        });
                    }
                    if(type === 'FATAL')
                    {
                        this.fatalLogsCount = res.data.count;
                        this.fatalLogs = res.data.logs.map(log => {
                            log.time = new Date(parseInt(log.time)).toLocaleString()
                            return log
                        });
                    }
                })
            }
        },

        created() {
            const nodeIndex = this.$route.path.split('/')[2];
            const nodeInfo = this.$store.state.unl.find(n => nodeIndex == n.id)
            this.currentNode = nodeInfo;

            this.getLogs('INFO')
            this.getLogs('WARNING')
            this.getLogs('ERROR')
            this.getLogs('FATAL')
        }
    }

</script>


<style scoped>
    .el-row {
        margin-bottom: 20px;
    }

    .grid-content {
        display: flex;
        align-items: center;
        height: 100px;
    }

    .grid-cont-right {
        flex: 1;
        text-align: center;
        font-size: 14px;
        color: #999;
    }

    .grid-num {
        font-size: 30px;
        font-weight: bold;
    }

    .grid-con-icon {
        font-size: 50px;
        width: 100px;
        height: 100px;
        text-align: center;
        line-height: 100px;
        color: #fff;
    }

    .grid-con-1 .grid-con-icon {
        background: rgb(45, 140, 240);
    }

    .grid-con-1 .grid-num {
        color: rgb(45, 140, 240);
    }

    .grid-con-2 .grid-con-icon {
        background: rgb(100, 213, 114);
    }

    .grid-con-2 .grid-num {
        color: rgb(45, 140, 240);
    }

    .grid-con-3 .grid-con-icon {
        background: rgb(242, 94, 67);
    }

    .grid-con-3 .grid-num {
        color: rgb(242, 94, 67);
    }

    .grid-con-4 .grid-con-icon {
        background: rgb(128, 0, 128);
    }

    .grid-con-4 .grid-num {
        color: rgb(128, 0, 128);
    }

    .user-info {
        display: flex;
        align-items: center;
        padding-bottom: 20px;
        border-bottom: 2px solid #ccc;
        margin-bottom: 20px;
    }

    .user-avator {
        width: 80px;
        height: 80px;
        border-radius: 50%;
    }

    .user-info-cont {
        padding-left: 50px;
        flex: 1;
        font-size: 14px;
        color: #999;
    }

    .user-info-cont div:first-child {
        font-size: 30px;
        color: #222;
    }

    .user-info-list {
        font-size: 14px;
        color: #999;
        line-height: 25px;
    }

    .user-info-list span {
        margin-left: 70px;
    }

    .mgb20 {
        margin-bottom: 20px;
    }

    .todo-item {
        font-size: 14px;
    }

    .todo-item-del {
        text-decoration: line-through;
        color: #999;
    }

    .schart {
        width: 100%;
        height: 300px;
    }

</style>
