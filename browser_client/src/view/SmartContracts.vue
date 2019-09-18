<template>

  <div>
    <div style="width: 100%;height: 80px;background-color:#F7F7F7;display: flex;justify-content: center">
      <div style="width: 1140px;height:100%">
        <div style ="width:500px;height:60px;margin:10px 0px 20px 30px">
          <span style="font-size: 40px;font-weight: 500">智能合约</span>
          <span>（找到XXX条合约）</span>
        </div>
      </div>
    </div>
    <!--表格-->
    <div style="width: 100%;height: 100%;background-color:#F2F2F2;display: flex;justify-content: center">
      <div style="width: 1140px;height:100%;background-color: #FFFFFF">
        <el-table
          :header-cell-style="{background:'#eef1f6',color:'#606266'}"
          :data="tableData"
          stripe
          style="width: 100%">
          <el-table-column
            prop="date"
            label="哈希值"
            width="200">
          </el-table-column>
          <el-table-column
            prop="name"
            label="区块号"
            width="130">
          </el-table-column>
          <el-table-column
            prop="address"
            label="发送方"
            width="220">
          </el-table-column>
          <el-table-column
            prop="address"
            label="接收方"
            width="220">
          </el-table-column>
          <el-table-column
            prop="address"
            label="数量"
            width="220">
          </el-table-column>
          <el-table-column
            prop="date"
            label="产生日期"
            width="150">
          </el-table-column>
        </el-table>
        <div style="width: 540px;height: 50px;margin-left: 600px">
          <el-pagination
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            :current-page="currentPage4"
            :page-sizes="[10, 20, 30, 40]"
            :page-size="10"
            layout="total, sizes, prev, pager, next, jumper"
            :total="40">
          </el-pagination>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
    export default {
        name: "SmartContracts",
        data(){
                return{
                    currentPage4:1,
                    tableData: [{
                        date: '2016-05-02',
                        name: '12dg76uyh',
                        address: '2wefg56th'
                    }, {
                        date: '2016-05-04',
                        name: 'n546yth34',
                        address: '234rdgfbh'
                    }, {
                        date: '2016-05-04',
                        name: '234576yt43reg',
                        address: '234erg56yh'
                    }, {
                        date: '2016-05-04',
                        name: '132ergthjnghf',
                        address: 'er34regfbgh'
                    }, {
                        date: '2016-05-04',
                        name: '56y7hg23werf',
                        address: '234rtgf5trg'
                    }, {
                        date: '2016-05-04',
                        name: '1324erfgb',
                        address: '65yhbgfdgdf'
                    }, {
                        date: '2016-05-04',
                        name: 'hgtt434re4erg',
                        address: 'thdrg43erfg5trgf'
                    }, {
                        date: '2016-05-04',
                        name: '122wefdvbh65t',
                        address: 'nhg5e3werfd'
                    }, {
                        date: '2016-05-04',
                        name: '234t56juyhtgf',
                        address: 'muj87uy623'
                    }, {
                        date: '2016-05-04',
                        name: 'rgfh345th',
                        address: '12ewfd56hy34'
                    }, {
                        date: '2016-05-03',
                        name: '23ergfb6tyh',
                        address: 'nh76543werf'
                    }]
                }

        },
        methods:{
            handleSizeChange(val) {
                console.log(`每页 ${val} 条`);
            },
            handleCurrentChange(val) {
                console.log(`当前页: ${val}`);
            }
        }
    }
</script>

<style scoped>

</style>
