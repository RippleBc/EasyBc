<template>
    <div class="table">
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
            <div class="handle-box">
                <el-input v-model="select_word" placeholder="筛选关键词" class="handle-input mr10"></el-input>
                <el-button type="primary" @click="search">服务器筛选</el-button>
                <el-button type="primary" @click="delBatch">批量删除</el-button>
                <el-button type="primary" class="mr10" @click="addVisible=true">新增节点</el-button>
            </div>
            <el-table :data="pageData" border class="table" @selection-change="handleSelectionChange">
                <el-table-column type="selection" width="55" align="center"></el-table-column>
                <el-table-column prop="id" label="id" sortable width="120">
                </el-table-column>
                <el-table-column prop="address" label="公钥" sortable width="120">
                </el-table-column>
                <el-table-column prop="host" label="地址" width="200">
                </el-table-column>
                <el-table-column prop="port" label="端口">
                </el-table-column>
                <el-table-column label="操作" width="180" align="center">
                    <template slot-scope="scope">
                        
                        <el-button type="text" @click="handleEdit(scope.row)">编辑</el-button>
                        <el-button type="text" class="red" @click="handleDelete(scope.row)">删除</el-button>
                        <el-button type="text" @click="checkNodeDetail(scope.row)">查看详情</el-button>
                    </template>
                </el-table-column>
            </el-table>
            <div class="pagination">
                <el-pagination background @current-change="handleCurrentChange" layout="prev, pager, next" :page-size="pageSize" :total="tableData.length">
                </el-pagination>
            </div>
        </div>

        <!-- 新增弹出框 -->
        <el-dialog title="新增" :visible.sync="addVisible" width="30%">
            <el-form :model="currentHandleNode" label-width="90px">
                <el-form-item label="公钥">
                    <el-input v-model="currentHandleNode.address"></el-input>
                </el-form-item>
                <el-form-item label="地址">
                    <el-input v-model="currentHandleNode.host"></el-input>
                </el-form-item>
                <el-form-item label="端口">
                    <el-input v-model="currentHandleNode.port"></el-input>
                </el-form-item>
                <el-form-item label="备注信息">
                    <el-input v-model="currentHandleNode.remarks"></el-input>
                </el-form-item>
            </el-form>
            <span slot="footer" class="dialog-footer">
                <el-button @click="addVisible = false">取 消</el-button>
                <el-button type="primary" @click="saveAdd">确 定</el-button>
            </span>
        </el-dialog>

        <!-- 编辑弹出框 -->
        <el-dialog title="编辑" :visible.sync="editVisible" width="30%">
            <el-form :model="currentHandleNode" label-width="90px">
                <el-form-item label="地址">
                    <el-input v-model="currentHandleNode.host"></el-input>
                </el-form-item>
                <el-form-item label="端口">
                    <el-input v-model="currentHandleNode.port"></el-input>
                </el-form-item>
                <el-form-item label="备注信息">
                    <el-input v-model="currentHandleNode.remarks"></el-input>
                </el-form-item>
            </el-form>
            <span slot="footer" class="dialog-footer">
                <el-button @click="editVisible=false">取 消</el-button>
                <el-button type="primary" @click="saveEdit">确 定</el-button>
            </span>
        </el-dialog>

        <!-- 删除提示框 -->
        <el-dialog title="提示" :visible.sync="delVisible" width="300px" center>
            <div class="del-dialog-cnt">删除不可恢复，是否确定删除？</div>
            <span slot="footer" class="dialog-footer">
                <el-button @click="delVisible=false">取 消</el-button>
                <el-button type="primary" @click="saveDelete">确 定</el-button>
            </span>
        </el-dialog>
    </div>
</template>

<script>
    import { mapState } from 'vuex'

    export default {
        name: 'nodeList',
        data() {
            return {
                tableData: [],
                pageSize: 6,
                cur_page: 1,
                multipleSelection: [],
                select_word: '',
                addVisible: false,
                editVisible: false,
                delVisible: false,
                currentHandleNode: {
                    id: 0,
                    address: '',
                    host: '',
                    port: '',
                }
            }
        },
        created() {
            this.tableData = this.unl;
        },
        watch: {
            select_word: function(val, oldVal)
            {
                if(oldVal !== '' && val === '')
                {
                    this.tableData = this.unl;
                }
            },

            unl: function(val, oldVal)
            {
                this.tableData = val;
                this.search();
            }
        },
        computed:
        {
            pageData() {
                return this.tableData.slice(this.pageSize * (this.cur_page - 1), this.pageSize * this.cur_page)
            },

            ...mapState(['unl'])
        },
        methods: {
            search() {
                this.tableData = this.unl.filter(data => {
                    else if(data.address.includes(this.select_word))
                    {
                        return true;
                    }
                    else if(data.host.includes(this.select_word))
                    {
                        return true;
                    }
                    else if(data.port.toString().includes(this.select_word))
                    {
                        return true;
                    }
                    else if(data.remarks.includes(this.select_word))
                    {
                        return true;
                    }

                    return false;
                })
            },
            handleCurrentChange(page) {
                this.cur_page = page;
            },
            handleEdit(row) {
                this.currentHandleNode = row;
                this.editVisible = true;
            },
            handleDelete(row) {
                this.currentHandleNode = row;
                this.delVisible = true;
            },          
            handleSelectionChange(val) {
                this.multipleSelection = val;
            },
            checkNodeDetail(row)
            {
                this.$router.push(`dashboard/${row.id}`);
            },
            delBatch() {
                const errMsgs = [];

                (async () => {
                    for(let node of this.multipleSelection)
                    {
                        let res = await this.$axios.post('/deleteNode', node)
                        if(res.code !== 0)
                        {
                            errMsgs.push(res.msg)
                        }
                        else
                        {
                            this.$message.success(`删除成功, ${node.address}`);
                        }
                    }
                })().then(() => {
                    if(errMsgs.length > 0)
                    {
                        this.$message.error(errMsgs.join(', '));
                    }
                }).catch(err => {
                    this.$message.error(err);
                }).finally(() => {
                    this.$store.dispatch('getUnl');
                    this.multipleSelection = [];
                });
            },
            saveAdd() {
                this.addVisible = false;

                this.$axios.post('/addNode', this.currentHandleNode).then(res => {
                    if(res.code !== 0)
                    {
                        this.$message.error(res.msg);
                    }
                    else
                    {
                        this.$message.success('新增成功');
                        this.$store.dispatch('getUnl');
                    }
                }).catch(err => {
                    this.$message.error(err);
                });
            },
            saveEdit() {
                this.editVisible = false;
                
                this.$axios.post('/modifyNode', this.currentHandleNode).then(res => {
                    if(res.code !== 0)
                    {
                        this.$message.error(res.msg);
                    }
                    else
                    {
                        this.$message.success('修改成功');
                        this.$store.dispatch('getUnl');
                    }
                }).catch(err => {
                    this.$message.error(err);
                });
            },
            saveDelete(){
                this.delVisible = false;

                this.$axios.post('/deleteNode', this.currentHandleNode).then(res => {
                    if(res.code !== 0)
                    {
                        this.$message.error(res.msg);
                    }
                    else
                    {
                        this.$message.success('删除成功');
                        this.$store.dispatch('getUnl');
                    }
                }).catch(err => {
                    this.$message.error(err);
                });
            }
        }
    }

</script>

<style scoped>
    .handle-box {
        margin-bottom: 20px;
    }

    .handle-select {
        width: 120px;
    }

    .handle-input {
        width: 300px;
        display: inline-block;
        margin-left: 10px;
    }
    .del-dialog-cnt{
        font-size: 16px;
        text-align: center
    }
    .table{
        width: 100%;
        font-size: 14px;
    }
    .red{
        color: #ff0000;
    }
    .mr10{
        margin-right: 10px;
    }
    .line{
        text-align: center;
        height: 32px;
        line-height: 30px;
    }
</style>
