<template>
    <div class="table">
        <div class="container">
            <div class="handle-box">
                <el-input v-model="select_word" placeholder="筛选关键词" class="handle-input mr10"></el-input>
                <el-button type="primary" @click="search">用户筛选</el-button>
                <el-button type="primary" @click="delAll">批量删除</el-button>
                <el-button type="primary" class="mr10" @click="addVisible=true">新增用户</el-button>
            </div>
            <el-table :data="pageData" border class="table" @selection-change="handleSelectionChange">
                <el-table-column type="selection" width="55" align="center"></el-table-column>
                <el-table-column prop="id" label="id" sortable width="120">
                </el-table-column>
                <el-table-column prop="username" label="用户名" sortable width="120">
                </el-table-column>
                <el-table-column prop="privilege" label="权限" width="200">
                </el-table-column>
                <el-table-column prop="remarks" label="备注信息">
                </el-table-column>
                <el-table-column prop="createdAt" label="创建日期">
                </el-table-column>
                <el-table-column prop="updatedAt" label="更新日期">
                </el-table-column>
                <el-table-column label="操作" width="180" align="center">
                    <template slot-scope="scope">
                        <el-button type="text" @click="handleEdit(scope.row)">编辑</el-button>
                        <el-button type="text" class="red" @click="handleDelete(scope.row)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
            <div class="pagination">
                <el-pagination background @current-change="handleCurrentChange" layout="prev, pager, next" :page-size="pageSize" :total="tableData.length">
                </el-pagination>
            </div>
        </div>

        <!-- 新增弹出框 -->
        <el-dialog title="编辑" :visible.sync="addVisible" width="30%">
            <el-form :model="currentHandleUser" label-width="90px">
                <el-form-item label="用户名">
                    <el-input v-model="currentHandleUser.username"></el-input>
                </el-form-item>
                <el-form-item label="密码">
                    <el-input v-model="currentHandleUser.password"></el-input>
                </el-form-item>
                <el-form-item label="权限">
                    <el-input v-model="currentHandleUser.privilege"></el-input>
                </el-form-item>
                <el-form-item label="备注信息">
                    <el-input v-model="currentHandleUser.remarks"></el-input>
                </el-form-item>
            </el-form>
            <span slot="footer" class="dialog-footer">
                <el-button @click="addVisible = false">取 消</el-button>
                <el-button type="primary" @click="addUser">确 定</el-button>
            </span>
        </el-dialog>

        <!-- 编辑弹出框 -->
        <el-dialog title="编辑" :visible.sync="editVisible" width="30%">
            <el-form :model="currentHandleUser" label-width="90px">
                <el-form-item label="密码">
                    <el-input v-model="currentHandleUser.password"></el-input>
                </el-form-item>
                <el-form-item label="权限">
                    <el-input v-model="currentHandleUser.privilege"></el-input>
                </el-form-item>
                <el-form-item label="备注信息">
                    <el-input v-model="currentHandleUser.remarks"></el-input>
                </el-form-item>
            </el-form>
            <span slot="footer" class="dialog-footer">
                <el-button @click="editVisible=false">取 消</el-button>
                <el-button type="primary" @click="modifyUser">确 定</el-button>
            </span>
        </el-dialog>

        <!-- 删除提示框 -->
        <el-dialog title="提示" :visible.sync="delVisible" width="300px" center>
            <div class="del-dialog-cnt">删除不可恢复，是否确定删除？</div>
            <span slot="footer" class="dialog-footer">
                <el-button @click="delVisible=false">取 消</el-button>
                <el-button type="primary" @click="deleteUser">确 定</el-button>
            </span>
        </el-dialog>
    </div>
</template>

<script>
    export default {
        name: 'permission',
        data() {
            return {
                usersData: [],
                tableData: [],
                pageSize: 6,
                cur_page: 1,
                multipleSelection: [],
                select_word: '',
                addVisible: false,
                editVisible: false,
                delVisible: false,
                currentHandleUser: {
                    id: 0,
                    username: '',
                    _password: '',
                    get password(){
                        return this._password;
                    },
                    set password(val){
                        this._password = val || ''
                    },
                    privilege: '',
                    remarks: '',
                    createdAt: '',
                    updatedAt: ''
                }
            }
        },
        created() {
            this.getData();
        },
        watch: {
            select_word: function(val, oldVal)
            {
                if(oldVal !== '' && val === '')
                {
                    this.tableData = this.usersData;
                }
            },

            usersData: function(val, oldVal)
            {
                this.tableData = val;

                this.search();
            }
        },
        computed:
        {
            pageData() {
                return this.tableData.slice(this.pageSize * (this.cur_page - 1), this.pageSize * this.cur_page)
            }
        },
        methods: {
            handleCurrentChange(page) {
                this.cur_page = page;
            },
            search() {
                this.tableData = this.usersData.filter(data => {
                    if(data.username.includes(this.select_word))
                    {
                        return true;
                    }
                    else if(data.privilege.includes(this.select_word))
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
            delAll() {
                const errMsgs = [];

                (async () => {
                    for(let user of this.multipleSelection)
                    {
                        let res = await this.$axios.post('/deleteUser', user)
                        if(res.code !== 0)
                        {
                            errMsgs.push(res.msg)
                        }
                        else
                        {
                            this.$message.success(`删除成功, ${user.username}`);
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
                    this.getData()
                    this.multipleSelection = [];
                });
            },
            handleSelectionChange(val) {
                this.multipleSelection = val;
            },
            //
            handleEdit(row) {
                Object.assign(this.currentHandleUser, row)

                this.editVisible = true;
            },
            handleDelete(row) {
                Object.assign(this.currentHandleUser, row)
                
                this.delVisible = true;
            },
            //
            addUser(){
                this.addVisible = false;

                this.$axios.post('/addUser', this.currentHandleUser).then(res => {
                    if(res.code !== 0)
                    {
                        this.$message.error(res.msg);
                    }
                    else
                    {
                        this.$message.success(`新增成功`);
                        this.getData();
                    }
                }).catch(err => {
                    this.$message.error(err);
                });
            },
            modifyUser() {
                this.editVisible = false;
                
                this.$axios.post('/modifyUser', this.currentHandleUser).then(res => {
                    if(res.code !== 0)
                    {
                        this.$message.error(res.msg);
                    }
                    else
                    {
                        this.$message.success(`修改成功`);
                        this.getData();
                    }
                }).catch(err => {
                    this.$message.error(err);
                });
            },
            deleteUser(){
                this.delVisible = false;

                this.$axios.post('/deleteUser', this.currentHandleUser).then(res => {
                    if(res.code !== 0)
                    {
                        this.$message.error(res.msg);
                    }
                    else
                    {
                        this.$message.success(`删除成功`);
                        this.getData();
                    }
                }).catch(err => {
                    this.$message.error(err);
                });
            },
            getData(){
                this.$axios.get('/users', {}).then(res => {
                    if(res.code !== 0)
                    {
                        this.$message.error(res.msg);
                    }
                    else
                    {
                        this.usersData = res.data;
                    }
                })
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
