<template>
    <div class="">
        <div class="crumbs">
            <el-breadcrumb separator="/">
                <el-breadcrumb-item><i class="el-icon-lx-notice"></i> 警告消息</el-breadcrumb-item>
            </el-breadcrumb>
        </div>
        <div class="container">
            <el-tabs v-model="message">
                <el-tab-pane :label="`未读消息(${unread.length})`" name="first">
                    <el-table :data="unread" :show-header="false" style="width: 100%">
                        <el-table-column>
                            <template slot-scope="scope">
                                <span class="message-title">{{scope.row.title}}</span>
                            </template>
                        </el-table-column>
                        <el-table-column prop="date" width="180"></el-table-column>
                        <el-table-column width="120">
                            <template slot-scope="scope">
                                <el-button size="small" @click="handleRead(scope.$index)">标为已读</el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                    <div class="handle-row">
                        <el-button type="primary">全部标为已读</el-button>
                    </div>
                </el-tab-pane>
                <el-tab-pane :label="`已读消息(${read.length})`" name="second">
                    <template v-if="message === 'second'">
                        <el-table :data="read" :show-header="false" style="width: 100%">
                            <el-table-column>
                                <template slot-scope="scope">
                                    <span class="message-title">{{scope.row.title}}</span>
                                </template>
                            </el-table-column>
                            <el-table-column prop="date" width="150"></el-table-column>
                            <el-table-column width="120">
                                <template slot-scope="scope">
                                    <el-button type="danger" @click="handleDel(scope.$index)">删除</el-button>
                                </template>
                            </el-table-column>
                        </el-table>
                        <div class="handle-row">
                            <el-button type="danger">删除全部</el-button>
                        </div>
                    </template>
                </el-tab-pane>
                <el-tab-pane :label="`回收站(${recycle.length})`" name="third">
                    <template v-if="message === 'third'">
                        <el-table :data="recycle" :show-header="false" style="width: 100%">
                            <el-table-column>
                                <template slot-scope="scope">
                                    <span class="message-title">{{scope.row.title}}</span>
                                </template>
                            </el-table-column>
                            <el-table-column prop="date" width="150"></el-table-column>
                            <el-table-column width="120">
                                <template slot-scope="scope">
                                    <el-button @click="handleRestore(scope.$index)">还原</el-button>
                                </template>
                            </el-table-column>
                        </el-table>
                        <div class="handle-row">
                            <el-button type="danger">清空回收站</el-button>
                        </div>
                    </template>
                </el-tab-pane>
                <el-tab-pane :label="`制定规则`" name="last">
                    <template v-if="message === 'last'">
                        <el-form ref="form" :model="form" label-width="80px">
                            <el-form-item label="规则名">
                                <el-input v-model="form.name"></el-input>
                            </el-form-item>
                            <el-form-item label="服务器名">
                                <el-select v-model="form.select" placeholder="请选择">
                                    <el-option v-for="(item,index) in selectName" :key="index" :value="item.name">{{item.name}}</el-option>
                                </el-select>
                            </el-form-item>
                            <el-form-item label="规则开关">
                                <el-switch v-model="form.delivery"></el-switch>
                            </el-form-item>
                            <el-form-item label="监控项目">
                                <el-checkbox-group v-model="form.type">
                                    <el-checkbox label="CPU" name="type"></el-checkbox>
                                    <el-checkbox label="内存" name="type"></el-checkbox>
                                    <el-checkbox label="磁盘" name="type"></el-checkbox>
                                </el-checkbox-group>
                            </el-form-item>
                            <el-form-item label="设置阀值">
                                <el-input v-model="form.threshold" style="width:120px">
                                    <template slot="append">%</template>
                                </el-input>
                            </el-form-item>
                            <el-form-item>
                                <el-button type="primary" @click="onSubmit">提交规则</el-button>
                                <el-button>取消</el-button>
                            </el-form-item>
                        </el-form>
                    </template>
                </el-tab-pane>
            </el-tabs>
        </div>
    </div>
</template>

<script>
    export default {
        name: 'tabs',
        data() {
            return {
                url: '../vuetable.json',
                message: 'first',
                showHeader: false,
                unread: [{
                    date: '201-03-19 20:00:00',
                    title: '【系统通知】内网服务器内存达到阀值',
                },{
                    date: '2019-03-19 21:00:00',
                    title: '【系统通知】蟠桃会服务器CPU使用达到阀值',
                }],
                read: [{
                    date: '2019-03-19 20:00:00',
                    title: '【系统通知】内网服务器内存达到阀值'
                }],
                recycle: [{
                    date: '2019-03-19 20:00:00',
                    title: '【系统通知】蟠桃会服务器CPU使用达到阀值'
                }],
                selectName: [],
                form: {
                    name: '',
                    region: '',
                    delivery: true,
                    type: ['CPU'],
                    options: [],
                    select: ''
                }
            }
        },
        created() {
            this.getData();
        },
        methods: {
            handleRead(index) {
                const item = this.unread.splice(index, 1);
                console.log(item);
                this.read = item.concat(this.read);
            },
            handleDel(index) {
                const item = this.read.splice(index, 1);
                this.recycle = item.concat(this.recycle);
            },
            handleRestore(index) {
                const item = this.recycle.splice(index, 1);
                this.read = item.concat(this.read);
            },
            getData(){
                this.$axios.get(this.url)
                .then(data => {
                    this.selectName = data.data.list;
                })
            },
            onSubmit() {
                this.$message.success('提交成功！');
            }
        },
        computed: {
            unreadNum(){
                return this.unread.length;
            }
        }
    }

</script>

<style>
.message-title{
    cursor: pointer;
}
.handle-row{
    margin-top: 30px;
}
</style>

