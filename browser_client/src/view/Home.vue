<template>
  <div>
    <!--1-->
    <div style="display: flex;justify-content: center">
      <div style="width: 1140px;height: 350px;background-color: #F2F2F2;display: flex;flex-direction: row">
        <div style="width: 555px;height: 350px;margin-right: 30px;;background-color:#2D3647">
          <div style="width: 100%">
            <div style="width: 200px;height: 60px;float: left;margin: 30px 0px 20px 30px">
              <span style="font-size: x-large;font-weight: bold;color: white">今日交易数量</span>
            </div>
            <div style="width: 120px;height: 60px;float: right;margin: 30px 30px 20px 80px">
              <span style="font-size: small;color: #A4A5A7">本日</span>
              <span style="font-size: x-large;font-weight: bold;color: #A4A5A7">28笔</span>
            </div>
          </div>
          <!--折线图-->
          <div id = "dailyTransactions" style="height:220px;width:100%"></div>
        </div>
        <!--NAC Price-->
        <div style="width: 555px;height: 350px;background-color:#2D3647">
          <div style="width: 500px;height: 60px;margin-top: 30px;margin-right: 30px;margin-left: 30px">
            <div style="width: 300px;height: 40px;float: left">
              <span style="font-size: x-large;font-weight: bold;color: white">NAC Price</span>
            </div>
            <div style="width:180px;height: 30px;float: right">
              <span style="font-size: small;color: #A4A5A7">Update Time: 4 Mins Ago</span>
            </div>
          </div>
          <div style="width: 480px;height: 100px;margin-top: 10px;margin-right: 30px;margin-left: 30px">
            <span style="font-size: x-large;font-weight: 400;color: white">$</span>
            <span style="font-size:60px;color: white">0.75</span>
            <span style="font-size: x-large;color: red;font-weight: 400">(-3.7%)</span>
          </div>
          <div style="width: 480px;height: 80px;margin-top: 30px;margin-right: 30px;margin-left: 30px">
            <div style="width: 240px;height: 60px;float: left">
              <span style = "color: white;font-size: small">Market Cap</span><br>
              <span style = "color: white;font-size: x-large">$36476283</span>
            </div>
            <div style="width: 240px;height: 60px;float: right">
              <span style = "color: white;font-size: small">24h Volume</span><br>
              <span style = "color: white;font-size: x-large">$347356.16</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!--2-->
    <div style="display: flex;justify-content: center;margin-top: 30px">
      <div  class = "box" style = "width: 1140px;height: 170px;background-color: #FFFFFF;display: flex;flex-direction: row;">
        <div style="width: 150px;height: 120px;margin:30px 0px 0px 20px">
          <div style="width: 100px;height: 50px;margin-left: 30px">
            <img src="../assets/block_logo.png" style="height: 40px;width: 40px"/>
            <p style="font-size: 25px;font-weight: 500;margin: 0px">区块</p><br/>
            <p style="font-size: 10px;color: #909399;margin:0px 0px 0px 0px">区块的状态</p>
          </div>
        </div>
        <div style="height: 120px;width: 100%;margin:25px 25px 25px 60px">
          <div v-for="value in blockStatus">
            <el-popover
              title="区块信息"
              placement="top-start"
              trigger="hover">
              <span>编号：{{value.number}}</span><br>
              <span>交易数量： {{value.transactions}}</span><br>
              <span>区块产生时间间隔： {{value.interval}}</span>
              <div style="width: 20px;height: 120px;margin-left: 15px;background-color: #D9E6FF;float: left" slot="reference"></div>
            </el-popover>
          </div>
        </div>
      </div>
    </div>

    <!--3-->
    <div style="display: flex;justify-content: center;">
      <div style="width: 1140px;height: 170px;display: flex;flex-direction: row">
        <div class="box" style="width: 24%;height: 110px;background-color:#ffffff;margin-top:30px;margin-right: 1.3%">
          <div style="width: 65%;height: 100%;float:left;">
            <div style="width: 100%;height: 60%;margin-top: 30px;text-align:center">
              <span style = "font-size: x-large;font-weight: bold">2305188</span><br>
              <router-link to="/blocks" style="font-size: x-small;text-decoration: none;color: #909399">区块高度></router-link>
            </div>
          </div>
          <div style="width: 35%;height: 100%;margin-top:35px;float: right;text-align: center">
            <img src="../assets/dashboard-1.png" width="44px">
          </div>
        </div>
        <div class="box" style="width: 24%;height: 110px;background-color:#ffffff;margin-top:30px;margin-right: 1.3%">
          <div style="width: 65%;height: 100%;float:left;">
            <div style="width: 100%;height: 60%;margin-top: 30px;text-align:center">
              <span style = "font-size: x-large;font-weight: bold">1697060</span><br>
              <router-link to="/transactions" style="font-size: x-small;text-decoration: none;color: #909399">交易总数量></router-link>
            </div>
          </div>
          <div style="width: 35%;height: 100%;margin-top:35px;float: right;text-align: center">
            <img src="../assets/dashboard-2.png" width="44px">
          </div>
        </div>
        <div class="box" style="width: 24%;height: 110px;background-color:#ffffff;margin-top:30px;margin-right: 1.3%">
          <div style="width: 65%;height: 100%;float:left;">
            <div style="width: 100%;height: 60%;margin-top: 30px;text-align:center">
              <span style = "font-size: x-large;font-weight: bold">48853</span><br>
              <router-link to="/smartcontracts" style="font-size: x-small;text-decoration: none;color: #909399">智能合约总数量></router-link>
            </div>
          </div>
          <div style="width: 35%;height: 100%;margin-top:35px;float: right;text-align: center">
            <img src="../assets/dashboard-3.png" width="44px">
          </div>
        </div>
        <div class="box" style="width: 24%;height: 110px;background-color:#ffffff;margin-top:30px">
          <div style="width: 65%;height: 100%;float:left;">
            <div style="width: 100%;height: 60%;margin-top: 30px;text-align:center">
              <span style = "font-size: x-large;font-weight: bold">111990</span><br>
              <a href="" style="font-size: x-small;text-decoration: none;color: #909399">地址总数量></a>
            </div>
          </div>
          <div style="width: 35%;height: 100%;margin-top:35px;float: right;text-align: center">
            <img src="../assets/dashboard-4.png" width="44px">
          </div>
        </div>
      </div>
    </div>

    <!--4-->
    <div style="display: flex;justify-content: center">
      <div style="width: 1140px;height: 360px;display: flex;flex-direction: row">
        <div class="box" style="width: 560px;height: 100%;background-color: #FFFFFF;margin-right: 30px">
          <div style="width: 100%;height: 48px;margin-top: 25px;margin-left: 40px">
            <span style = "font-weight: bold;font-size: x-large">新地址所占百分比</span><br>
            <span style="font-size: x-small">新地址指90天内所产生的地址</span>
          </div>
          <div id="pieCharts" style = "width: 350px;height: 200px;margin-top: 25px;float: left"></div>
          <div style = "width: 104px;height: 200px;float: right;margin-top: 25px;margin-right: 30px">
            <div>
              <span style = "font-weight: bold;font-size: x-large">1456</span><br>
              <span style = "font-size: x-small">新地址</span>
            </div>
            <div style="margin-top: 50px">
              <span style = "font-weight: bold;font-size: x-large">111988</span><br>
              <span style = "font-size: x-small">地址总数</span>
            </div>
          </div>
        </div>
        <div class="box" style="width: 560px;height: 100%;background-color: #FFFFFF">
          <div style = "width: 540px;height:330px;background-color: #ffffff;float: right;margin-left: 15px">
            <div style="width: 220px;height: 40px;margin-top: 25px;margin-left: 25px;text-align: center;font-size: 20px;font-weight: bold">
              最近新增地址数量</div>
            <!--折线图-->
            <div id = "increatedaddress" style="width: 510px;height: 240px;margin-bottom: 30px"></div>
          </div>
        </div>
      </div>
    </div>

    <!--5-->
    <div style="display: flex;justify-content: center;margin-top: 30px;margin-bottom: 30px">
      <div style="width: 1140px;height: 520px;display: flex;flex-direction: row">
        <!--Blocks-->
        <div class="box" style="width: 560px;height: 100%;background-color: #FFFFFF;margin-right: 30px">
          <div style="width: 500px;height: 430px;padding-left: 30px;padding-top: 23px;padding-bottom: 23px">
            <div style="width:124px;height: 30px;float: left;font-size: 20px;font-weight: bold"><span>区块</span></div>
            <div style="float: right">
              <router-link to="/blocks" style="color:#909399;text-decoration: none">查看全部<i class="el-icon-view el-icon--right"></i> </router-link>
            </div>
            <!--表格-->
            <el-table
              :data="blocks"
              style="width: 100%">
              <el-table-column
                prop = "height"
                label="高度"
                width="100">
              </el-table-column>
              <el-table-column
                prop="name"
                label="哈希值"
                width="270">
                <template slot-scope="scope">
                  <router-link to = "/blocks" style="color: cornflowerblue;text-decoration: none">{{scope.row.name}}</router-link>
                </template>
              </el-table-column>
              <el-table-column
                prop="time"
                label="时间">
              </el-table-column>
            </el-table>
          </div>
        </div>
        <!--Transactions-->
        <div class="box" style="width: 560px;height: 100%;background-color: #FFFFFF">
          <div style="width: 500px;height: 430px;padding-left: 30px;padding-left: 30px;padding-top: 23px;padding-bottom: 23px">
            <div style="width:124px;height: 30px;float: left;font-size: 20px;font-weight: bold"><span>交易</span></div>
            <div style="float: right">
              <router-link to="/transactions" style="color:#909399;text-decoration: none">查看全部<i class="el-icon-view el-icon--right"></i> </router-link>
            </div>
            <!--表格-->
            <el-table
              :data="transactions"
              style="width: 100%">
              <el-table-column
                prop="name"
                label="哈希值"
                width="110">
              </el-table-column>
              <el-table-column
                prop="from"
                label="发送账户"
                width="130">
              </el-table-column>
              <el-table-column
                prop="to"
                label="接收账户"
                width="130">
              </el-table-column>
              <el-table-column
                prop="time"
                label="时间">
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>
    </div>


  </div>
</template>

<script>
  import Maps from "../components/Maps.vue";
    export default {
        name: "Home",
        components:{
            'Maps': Maps
        },
        data() {
            return {
                transactions:[{name:"b6b81e12....",from:"n1cjGTzvnF....",to:"n1cjGTzvnFk....",time:"1 mins ago"},
                    {name:"78a0bfy1....",from:"n1F6s2GUv....",to:"n1eMPWpH2....",time:"3 mins ago"},
                    {name:"93ed4b78....",from:"n1F6s2GUv....",to:"n1cjGTzvnFk....",time:"5 mins ago"},
                    {name:"181a4f79....",from:"n1cjGTzvnF....",to:"n1eMPWpHM....",time:"6 mins ago"},
                    {name:"85c863df....",from:"n1JvS1LDTJ....",to:"n1JvS1LDTJR....",time:"11 mins ago"},
                    {name:"8e4ffbb0....",from:"n1JvS1LDTJ....",to:"n1JvS1LDTJR....",time:"23 mins ago"},
                    {name:"be427d86....",from:"n1cjGTzvnF....",to:"n1cjGTzvnFk....",time:"38 mins ago"},
                    {name:"ceadd7bd....",from:"n1XoTiM1x5....",to:"n1uTwRNPG....",time:"37 mins ago"},],
                blocks:[{height:"2310166",name:"aa5s4852sdf68e12xc",time:"34 secs ago"},
                    {height:"2310165",name:"df465dfg45er12xc8v79",time:"56 secs ago"},
                    {height:"2310164",name:"wer79s1651ws154x6v5",time:"3 mins ago"},
                    {height:"2310163",name:"sdfcx6vs1dwsdv1x365",time:"6 mins ago"},
                    {height:"2310162",name:"jlkvxc461oj651x6vcx",time:"7 mins age"},
                    {height:"2310161",name:"46xcv41dfds56dsijk",time:"12 mins ago"},
                    {height:"2310160",name:"jlx795zxweopsdk626",time:"18 mins ago"},
                    {height:"2310159",name:"ozvohw4ef61w5sdx66",time:"24 mins ago"},],
                blockStatus:[{number:2301552,transactions:2,interval:15},
                    {number:2301552,transactions:0,interval:9},
                    {number:2301251,transactions:2,interval:4},
                    {number:2301855,transactions:1,interval:15},
                    {number:2301744,transactions:2,interval:16},
                    {number:2301152,transactions:2,interval:9},
                    {number:2301632,transactions:1,interval:6},
                    {number:2301852,transactions:2,interval:3},
                    {number:2301352,transactions:0,interval:8},
                    {number:2301123,transactions:2,interval:10},
                    {number:2301153,transactions:2,interval:15},
                    {number:2301269,transactions:0,interval:9},
                    {number:2301732,transactions:2,interval:15},
                    {number:2301352,transactions:3,interval:5},
                    {number:2301245,transactions:2,interval:9},
                    {number:2301542,transactions:4,interval:15},
                    {number:2301422,transactions:2,interval:11},
                    {number:2301123,transactions:0,interval:7},
                    {number:2301323,transactions:3,interval:2},
                    {number:2301423,transactions:7,interval:6},
                    {number:2301183,transactions:1,interval:11},
                    {number:2301253,transactions:5,interval:4},
                    {number:2301623,transactions:6,interval:9},
                    {number:2301713,transactions:0,interval:15},
                    {number:2301372,transactions:2,interval:12},],
            }
        },



    }
</script>

<style scoped>
  div.box{
    /*边框线*/
    border:1px solid #E0E0E0;
    /*过渡效果*/
    transition: all .25s linear 0s;
  }
  div.box:hover {
    transform: translateY(-1px);
    box-shadow: 2px 2px 10px 2px #808080;
  }
</style>
