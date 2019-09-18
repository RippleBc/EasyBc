<template>
  <div>
    <div style="width: 100%;height: 80px;background-color:#F7F7F7;display: flex;justify-content: center">
      <div style="width: 1140px;height:100%">
        <div style ="width:500px;height:60px;margin:10px 0px 20px 30px">
          <span style="font-size: 40px;font-weight: 500">区块</span>
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
            prop="id"
            label="id"
            width="200">
          </el-table-column>
          <el-table-column
            prop="height"
            label="区块高度"
            width="180">
            <template slot-scope="scope">
              <router-link to = "/" style="text-decoration: none;color: #42b983">
                {{scope.row.height}}
              </router-link>
            </template>
          </el-table-column>
          <el-table-column
            prop="from"
            label="发送账户"
            width="230">
          </el-table-column>
          <el-table-column
            prop="to"
            label="接收账户"
            width="230">
          </el-table-column>
          <el-table-column
            prop="number"
            label="数量"
            width="150">
          </el-table-column>
          <el-table-column
            prop="date"
            label="时间"
            width="150">
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
        name: "Blocks",
        data(){
            return{
                currentPage4:1,
                tableData: [{
                    id: 1,
                    height: '15612',
                    from: 'reewth34rtg5t4',
                    to: '34trret45',
                    number: '32',
                    date: '2016-05-02',
                }, {
                    id: 2,
                    height: '4512',
                    from: 'yhtg65re54reg',
                    to: '432tretg4rer',
                    number: '45',
                    date: '2016-05-02',
                }, {
                    id: 3,
                    height: '13846',
                    from: '2wrhnuy66yr',
                    to: '23erg56trg',
                    number: '29',
                    date: '2016-05-02',
                }, {
                    id: 4,
                    height: '8645',
                    from: '23er677gbfbhy',
                    to: '4trggf5r23',
                    number: '56',
                    date: '2016-05-02',
                }, {
                    id: 5,
                    height: '7462',
                    from: 'owejgw4905nk',
                    to: '43tregfd5rt',
                    number: '152',
                    date: '2016-05-02',
                }, {
                    id: 6,
                    height: '7412',
                    from: '4690ojndi95jn',
                    to: '234rt6t5tr',
                    number: '93',
                    date: '2016-05-02',
                }, {
                    id: 7,
                    height: '8632',
                    from: '23wer9flkgoi5',
                    to: '43t5yh78uy',
                    number: '41',
                    date: '2016-05-02',
                }, {
                    id: 8,
                    height: '6123',
                    from: '02ihw99jjg',
                    to: '23we67yuj897',
                    number: '23',
                    date: '2016-05-02',
                }, {
                    id: 9,
                    height: '8462',
                    from: '67uyjxcv244',
                    to: '134rgth6ytg',
                    number: '112',
                    date: '2016-05-02',
                }, {
                    id: 10,
                    height: '6127',
                    from: '934opwe9w4j4',
                    to: '243trgh76',
                    number: '19',
                    date: '2016-05-02',
                }, {
                    id: 11,
                    height: '4723',
                    from: '2984nr5jdrnk',
                    to: '7865ytgrf56tr',
                    number: '82',
                    date: '2016-05-02',
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
