<template>
    <div>
        <div class="crumbs">
            <el-breadcrumb separator="/">
                <el-breadcrumb-item><i class="el-icon-lx-rank"></i> 可视化图表</el-breadcrumb-item>
            </el-breadcrumb>
        </div>
        <div class="container">
            <div class="schart-box">
                <div class="content-title">CPU占用图</div>
                <ve-line :data="chartData1" style="width:auto;height:400px;"></ve-line>
            </div>
            <div class="schart-box">
                <div class="content-title">内存占用图</div>
                <ve-line :data="chartData2" style="width:auto;height:400px;"></ve-line>
            </div>
            <div class="schart-box">
                <div class="content-title">磁盘占用图</div>
                <ve-line :data="chartData3" style="width:auto;height:400px;"></ve-line>
            </div>
        </div>
    </div>
</template>

<script>
    import Schart from 'vue-schart';
    export default {
        name: 'basecharts',
        components: {
            Schart
        },
        data: () => ({
            chartData1: {
                columns: ['时间', '内网服务器', '营商通服务器', '蟠桃会服务器'],
                rows: [
                    { '时间': '08：01', '内网服务器': 50, '营商通服务器': 63, '蟠桃会服务器': 45 },
                    { '时间': '08：02', '内网服务器': 52, '营商通服务器': 60, '蟠桃会服务器': 42 },
                    { '时间': '08：03', '内网服务器': 51, '营商通服务器': 63, '蟠桃会服务器': 50 },
                    { '时间': '08：04', '内网服务器': 45, '营商通服务器': 63, '蟠桃会服务器': 49 },
                    { '时间': '08：05', '内网服务器': 38, '营商通服务器': 62, '蟠桃会服务器': 53 },
                    { '时间': '08：06', '内网服务器': 59, '营商通服务器': 63, '蟠桃会服务器': 40 }
                ]
            },
            chartData2: {
                columns: ['时间', '内网服务器', '营商通服务器', '蟠桃会服务器'],
                rows: [
                    { '时间': '08：01', '内网服务器': 63, '营商通服务器': 53, '蟠桃会服务器': 42 },
                    { '时间': '08：02', '内网服务器': 60, '营商通服务器': 50, '蟠桃会服务器': 46 },
                    { '时间': '08：03', '内网服务器': 63, '营商通服务器': 53, '蟠桃会服务器': 46 },
                    { '时间': '08：04', '内网服务器': 63, '营商通服务器': 53, '蟠桃会服务器': 49 },
                    { '时间': '08：05', '内网服务器': 62, '营商通服务器': 52, '蟠桃会服务器': 43 },
                    { '时间': '08：06', '内网服务器': 63, '营商通服务器': 53, '蟠桃会服务器': 48 }
                ]
            },
            chartData3: {
                columns: ['时间', '内网服务器', '营商通服务器', '蟠桃会服务器'],
                rows: [
                    { '时间': '08：01', '内网服务器': 53, '营商通服务器': 63, '蟠桃会服务器': 72 },
                    { '时间': '08：02', '内网服务器': 50, '营商通服务器': 60, '蟠桃会服务器': 76 },
                    { '时间': '08：03', '内网服务器': 53, '营商通服务器': 63, '蟠桃会服务器': 76 },
                    { '时间': '08：04', '内网服务器': 53, '营商通服务器': 63, '蟠桃会服务器': 79 },
                    { '时间': '08：05', '内网服务器': 52, '营商通服务器': 62, '蟠桃会服务器': 73 },
                    { '时间': '08：06', '内网服务器': 53, '营商通服务器': 63, '蟠桃会服务器': 78 }
                ]
            },
        })
    }
</script>

<style scoped>
.schart-box{
    width: 45%;
    display: inline-block;
    margin-right: 40px;
}
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