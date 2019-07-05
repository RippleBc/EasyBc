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
        <el-row :gutter="20" style="margin-bottom: 20px;">
            <el-col :span="24">
                <el-card shadow="hover">
                    <el-form ref="form" :model="form" label-width="80px">
                        <el-form-item label="规则名">
                            <el-input v-model="form.name"></el-input>
                        </el-form-item>
                        <el-form-item label="规则开关">
                            <el-switch v-model="form.switch"></el-switch>
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
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>

<script>
    export default {
        name: 'warnRule',
        data(){
            return {
                currentNode: undefined,
                form: {
                    name: '',
                    switch: true,
                    type: ['CPU'],
                    threshold: 0,
                }
            }
        },
        created(){
            const nodeIndex = this.$route.path.split('/')[2];
            const nodeInfo = this.$store.state.unl.find(n => nodeIndex == n.id)
            this.currentNode = nodeInfo;
        },
        methods: {
            onSubmit(){

            }
        }
    }
</script>
