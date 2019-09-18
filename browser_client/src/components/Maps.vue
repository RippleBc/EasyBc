<template>
      <div style="height: 100%" id="myMapChina">
      </div>
</template>

<script>
    let geoCoordMap = {
        '广州': [113.5107,23.2196],
        '北京': [116.4551,40.2539],
        '天津': [117.4219,39.4189],
        '上海': [121.4648,31.2891],
        '重庆': [106.557165,29.563206],
        '河北': [114.508958,38.066606],
        '河南': [113.673367,34.748062],
        '云南': [102.721896,25.047632],
        '辽宁': [123.445621,41.806698],
        '黑龙江': [126.655705,45.759581],
        '湖南': [112.950888,28.229114],
        '安徽': [117.300842,31.887672],
        '山东': [117.029895,36.677424],
        '新疆': [87.616327,43.800508],
        '江苏': [118.814345,32.061445],
        '浙江': [120.16991,30.272236],
        '江西': [115.904962,28.674132],
        '湖北': [114.290138,30.595623],
        '广西': [108.381781,22.815042],
        '甘肃': [103.851217,36.061978],
        '山西': [112.57197,37.879532],
        '内蒙古': [112.57197,37.879532],
        '陕西': [108.960062,34.285251],
        '吉林': [126.572746,43.86785],
        '福建': [119.319713,26.072564],
        '贵州': [106.557165,29.563206],
        '广东': [113.238778,23.161621],
        '青海': [101.787147,36.621234],
        '西藏': [91.154492,29.665953],
        '四川': [104.082256,30.652565],
        '宁夏': [106.234805,38.487468],
        '海南': [109.910757,19.108187],
        '台湾': [121.098613,23.778734],
        '香港': [114.168545,22.36641],
        '澳门': [113.549978,22.1943]
    };
    let GZData = [
        [{name: '北京',value:96}, {name:'广州'}],
        [{name: '广州',value:50}, {name:'北京'}],
        [{name: '山西',value:66}, {name:'广州'}],
        [{name: '广州',value:66}, {name:'山西'}],
        [{name: '西藏',value:51}, {name:'广州'}],
        [{name: '广州',value:70}, {name:'西藏'}],
        [{name: '陕西',value:32}, {name:'广州'}],
        [{name: '广州',value:70}, {name:'陕西'}],
        [{name: '广西',value:79}, {name:'广州'}],
        [{name: '广州',value:70}, {name:'广西'}],
        [{name: '新疆',value:15}, {name:'广州'}],
        [{name: '广州',value:51}, {name:'新疆'}],
        [{name: '青海',value:67}, {name:'广州'}],
        [{name: '广州',value:70}, {name:'青海'}],
        [{name: '海南',value:30}, {name:'广州'}],
        [{name: '广州',value:70}, {name:'海南'}],
        [{name: '云南',value:56}, {name:'广州'}],
        [{name: '广州',value:70}, {name:'云南'}],
        [{name: '四川',value:96}, {name:'广州'}],
        [{name: '广州',value:70}, {name:'四川'}],
        [{name: '福建',value:74}, {name:'广州'}],
        [{name: '广州',value:70}, {name:'福建'}],
    ];
    let convertData = function(data) {
        let res = [];
        for (let i = 0; i < data.length; i++) {
            let dataItem = data[i];
            let fromCoord = geoCoordMap[dataItem[0].name];
            let toCoord = geoCoordMap[dataItem[1].name];
            if (fromCoord && toCoord) {
                res.push([{
                    coord: fromCoord,
                    value: dataItem[0].value//来源或流向修改
                }, {
                    coord: toCoord,
                }]);
            }
        }
        return res;
    };
    let series = [];
    [['广州', GZData]].forEach(function (item, i) {
        series.push(
            {//线
                name: item[2],
                type: 'lines',
                zlevel: 2,
                symbol: ['none', 'arrow'], //'circle', 'rect', 'roundRect', 'triangle', 'diamond', 'pin', 'arrow'线两端的标记类型
                symbolSize: 5, //箭头大小
                lineStyle: {
                    normal: {
                        width: 1,
                        opacity: 0.4,
                        curveness: 0.3
                    },
                },
                effect: {
                    show: true, //是否显示特效
                    period: 2,  //特效动画的时间，单位为 s
                    symbol:'pin', //特效图形的类型
                    constantSpeed: 60, //固定速度，大于0的值后会忽略period配置项
                    symbolSize: 5,
                    color: '#fff',
                    shadowBlur: 8
                },
                data: convertData(item[1])
            },
            {
                type: 'effectScatter',
                coordinateSystem: 'geo',
                zlevel: 2,
                rippleEffect: { //涟漪特效相关配置
                    period:'4', //动画的时间
                    scale:'20', //动画中波纹的最大缩放比例
                    brushType: 'stroke'
                },
                label: { //图形上的城市文本标签
                    normal: {
                        show: true,
                        position: 'right',
                        formatter: '{b}',
                        textStyle:{
                            color:'#fff',
                            fontStyle: 'normal',
                            fontFamily: 'arial',
                            fontSize: 12,
                        }
                    }
                },
                symbolSize: 3,//点大小
                data: item[1].map(function (dataItem) {
                    return {
                        name: dataItem[0].name,//来源或流向修改
                        value: geoCoordMap[dataItem[0].name].concat([dataItem[0].value])//来源或流向修改
                    };
                })
            });
    });
    var html = '<input id="Button1" type="button" value="button"  οnclick="return devDisplay()'
    export default {
        name: "Maps",
        data(){
            return{
                option:{},
                DialogVisible: false
            }
        },
        methods:{
        },
        mounted() {
            this.option = {
                //标题
                title : {
                    text: '国脉区块链浏览器',
                    subtext: 'kongchun',
                    left: 'center',
                    textStyle : {
                        color: '#fff'
                    }
                },
                backgroundColor: '#23243a',
                tooltip : {  //提示组件
                    trigger: 'item',
                },
                visualMap:{
                    min: 0,
                    max: 100,
                    //seriesIndex:['0','1'],//选择应用那几条数据
                    calculable: true,
                    color: ['#ff3333', 'orange', 'yellow', 'lime', 'aqua'],
                    textStyle: {
                        color: '#fff'
                    }
                },
                geo: {
                    map: 'china',
                    tooltip: {
                        show: true,
                        formatter: function (params) {
                            var info = '<p style="font-size:14px">' + '节点名称: XXXXX' + '</p><p style="font-size:14px">节点状态: XXXXX</p>'+
                                '<p style="font-size:14px">22222222</p>'
                            return info;
                        },
                        backgroundColor: "#f2f2f2",//提示标签背景颜色
                        textStyle: { color: "#000000" } //提示标签字体颜色
                    },
                    label: {
                        emphasis: {
                            show: false
                        }
                    },
                    roam: false, //开启缩放或者平移
                    zoom: 1.1,  //缩放比例
                    itemStyle: {
                        normal: {
                            areaColor: 'none',
                            borderColor: 'rgba(100,149,237,1)'
                        },
                        emphasis: {
                            areaColor: '#1b1b1b'
                        }
                    }
                },
                series: series
            };
            let myMap = this.$echarts.init(document.getElementById('myMapChina'));
            myMap.setOption(this.option);
            myMap.on('click',function (params) {
                alert(params.name+'11111');

            })
        }
    }
</script>

<style scoped>

</style>
