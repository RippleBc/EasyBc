<template>
  <div id = "App">
    <el-container>
      <el-header>
        <!--头部-->
        <headerweb></headerweb>
      </el-header>
      <el-main>
        <!--首页-->
        <router-view></router-view>
      </el-main>

      <el-footer>
        <!--底部-->
        <footerweb></footerweb>
      </el-footer>
    </el-container>
  </div>
</template>

<script>
    import Header from "../components/Header.vue";
    import Home from "./Home.vue";
    import Footer from "../components/Footer.vue";
    export default {
        name: 'App',
        components:{
            'headerweb': Header,
            'homeweb': Home,
            'footerweb':Footer
        },

        data(){
            return{
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
                    {number:2301542,transactions:4,interval:15},
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
                option1 : {
                    tooltip : {
                        trigger: 'axis',
                        axisPointer: {
                            type: 'cross',
                            label: {
                                backgroundColor: '#6a7985'
                            }
                        }
                    },
                    color:['#595C63'],
                    toolbox: {
                        feature: {
                        }
                    },
                    textStyle:{
                        color:["#A4A5A7"],
                    },
                    grid: {
                        left: '3%',
                        right: '4%',
                        bottom: '3%',
                        containLabel: true
                    },
                    xAxis : [
                        {
                            type : 'category',
                            boundaryGap : false,
                            data : ['July 30','July 31','Aug 1','Aug 2','Aug 3','Aug 4','Aug 5','Aug 6','Aug 7','Aug 8','Aug 9'],
                        }
                    ],
                    yAxis : [
                        {
                            type : 'value',
                            splitLine: {
                                show: false
                            },
                        }
                    ],
                    series : [
                        {
                            name:'数量',
                            type:'line',
                            stack: '总量',
                            label: {
                                normal: {
                                    show: false,
                                    position: 'top'
                                }
                            },
                            areaStyle: {normal: {}},
                            data:[2019, 1938, 2375, 1523, 1985, 1423,1690,2286,1600,1333,1879],
                            smooth: true
                        }
                    ]
                },
                option2 : {
                    tooltip : {
                        trigger: 'axis',
                        axisPointer: {
                            type: 'cross',
                            label: {
                                backgroundColor: '#6a7985'
                            }
                        }
                    },
                    color:['#0057FF'],
                    toolbox: {
                        feature: {
                        }
                    },
                    grid: {
                        left: '3%',
                        right: '4%',
                        bottom: '3%',
                        containLabel: true
                    },
                    xAxis : [
                        {
                            type : 'category',
                            boundaryGap : false,
                            data : ['Jun 25','July 2','July 9','July 16','July 23','July 30','Aug 6']
                        }
                    ],
                    yAxis : [
                        {
                            type : 'value',
                            splitLine: {
                                show: false
                            },
                        }
                    ],
                    series : [
                        {
                            name:'数量',
                            type:'line',
                            stack: '总量',
                            label: {
                                normal: {
                                    show: false,
                                    position: 'top'
                                }
                            },
                            areaStyle: {normal: {}},
                            data:[530, 932, 731, 1099, 889, 896,1096],
                            smooth: true
                        }
                    ]
                },
                option3 : {
                    title : {
                        text: '',
                        subtext: '',
                        x:'center'
                    },
                    tooltip : {
                        trigger: 'item',
                        formatter: "{a} <br/>{b} : {c} ({d}%)"
                    },
                    color:['#0057FF', '#5992FF'],

                    series : [
                        {
                            name: '新地址数量',
                            type: 'pie',
                            radius : '50%',
                            center: ['50%', '50%'],
                            data:[
                                {value:33, name:'新地址数量'},
                                {value:1548, name:'地址总数量'}
                            ],
                            itemStyle: {
                                emphasis: {
                                    shadowBlur: 8,
                                    shadowOffsetX: 0,
                                    shadowColor: 'rgba(0, 0, 0, 0)'
                                }
                            }
                        }
                    ]
                },
            }
        },
        methods: {
        },
        mounted() {
            var myCharts1 = this.$echarts.init(document.getElementById("dailyTransactions"));
            var myCharts2 = this.$echarts.init(document.getElementById("increatedaddress"));
            var myCharts3 = this.$echarts.init(document.getElementById("pieCharts"));
            myCharts1.setOption(this.option1);
            myCharts2.setOption(this.option2);
            myCharts3.setOption(this.option3);
        }
    }
</script>

<style scoped>
  .el-header {
    color: #333;
    text-align: center;
    padding: 0px;
    min-height: 185px;
    background-image: url("../assets/banner.png");
  }
  .el-main {
    background-color: #F2F2F2;
    color: #333;
    min-height: 1150px;
    padding: 0px;
  }
  .el-footer {
    background-color: #F7F7F7;
    color: #333;
    text-align: center;
    line-height: 60px;
    min-height: 80px;
  }
</style>
