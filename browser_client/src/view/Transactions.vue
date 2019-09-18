<template>
  <div>
    <div style="width: 100%;height: 80px;background-color:#F7F7F7;display: flex;justify-content: center">
      <div style="width: 1140px;height:100%">
        <div style ="width:500px;height:60px;margin:10px 0px 20px 30px">
          <span style="font-size: 40px;font-weight: 500">交易</span>
          <span>（展示最新500条记录）</span>
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
            prop="name"
            label="哈希值"
            width="200">
          </el-table-column>
          <el-table-column
            prop="name"
            label="区块号"
            width="180">
          </el-table-column>
          <el-table-column
            prop="address"
            label="发送方"
            width="200">
          </el-table-column>
          <el-table-column
            prop="address"
            label="接收方"
            width="200">
          </el-table-column>
          <el-table-column
            prop="number"
            label="数量"
            width="180">
          </el-table-column>
          <el-table-column
            prop="date"
            label="时间"
            width="180">
          </el-table-column>
        </el-table>
        <div style="width: 540px;height: 50px;margin-left: 600px">
          <el-pagination
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            :current-page="currentPage4"
            :page-sizes="[100, 200, 300, 400]"
            :page-size="100"
            layout="total, sizes, prev, pager, next, jumper"
            :total="400">
          </el-pagination>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
    export default {
        name: "Transactions",
        data(){
            return{
                currentPage4:1,
                tableData: [{
                    date: '2016-05-02',
                    name: '43ree5er5r',
                    address: '43r6ytgfgfd',
                    number: 123
                }, {
                    date: '2016-05-04',
                    name: '132ew5tghtg',
                    address: '65trg23wefd',
                    number: 34
                }, {
                    date: '2016-05-04',
                    name: '12wedf6tgbhg',
                    address: '76hy23efdg',
                    number: 23
                }, {
                    date: '2016-05-04',
                    name: '123erf5t6yh',
                    address: '132wef56thyujyh',
                    number:73
                }, {
                    date: '2016-05-04',
                    name: '132ewfr5rgth',
                    address: '78ujyh23wer',
                    number: 90
                }, {
                    date: '2016-05-04',
                    name: '234t5gr76hy',
                    address: '132wef67jyh',
                    number: 83
                }, {
                    date: '2016-05-04',
                    name: '132ewf67yhjy',
                    address: '23rwefryht7juy',
                    number: 67
                }, {
                    date: '2016-05-04',
                    name: '132ewfg6hjuyn',
                    address: '1324retg6tgjyh',
                    number: 29
                }, {
                    date: '2016-05-04',
                    name: '1324rg6h7jyh',
                    address: '43rgbjyht4re',
                    number:95
                }, {
                    date: '2016-05-04',
                    name: '132refwjyhtg',
                    address: '65htbgthbg234r',
                    number: 77
                }, {
                    date: '2016-05-03',
                    name: '893wuediwodjs',
                    address: '283eywuidshjd',
                    number: 81
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
