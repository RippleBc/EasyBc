<template>
    <div>
      <div style="width: 100%;height: 1050px;display: flex;justify-content: center">
        <div style="width:1140px;height: 100%;margin-top: 30px;display: flex;flex-direction: row">
          <div style="width: 360px;height: 100%;margin-right: 30px">
            <div class="box" style="width: 100%;height: 500px;background-color: #FFFFFF;display: flex;flex-direction: column;;border:1px solid #F7F7F7">
              <div style="width:320px;height: 30px;margin: 15px 20px 10px 20px">
                <i class="el-icon-discover"></i>
                <span style="font-size: 18px;font-weight: 500">活跃度理事会成员</span>
              </div>
              <div style="width: 360px;height: 100%;">
                <el-table
                  border
                  :data="activeMember"
                  stripe
                  style="width: 100%">
                  <el-table-column
                    prop="account"
                    label="账户"
                    width="270">
                  </el-table-column>
                  <el-table-column
                    prop="active"
                    label="活跃度">
                  </el-table-column>
                </el-table>
              </div>
            </div>
            <div class="box" style="width: 100%;height: 500px;margin-top: 30px;background-color: #FFFFFF;display: flex;flex-direction: column;;border:1px solid #F7F7F7">
              <div style="width:320px;height: 30px;margin: 15px 20px 10px 20px">
                <i class="el-icon-coordinate"></i>
                <span style="font-size: 18px;font-weight: 500">活跃度公信节点</span>
              </div>
              <div style="width: 360px;height: 100%;">
                <el-table
                  border
                  :data="activeNode"
                  stripe
                  style="width: 100%">
                  <el-table-column
                    prop="node"
                    label="公信节点"
                    width="100">
                  </el-table-column>
                  <el-table-column
                    prop="last"
                    label="最近确认"
                    width="150">
                  </el-table-column>
                  <el-table-column
                    prop="active"
                    label="活跃度"
                    width="100">
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </div>
          <div class="box" style="width: 750px;height: 100%;background-color: #FFFFFF">
            <div style="width:320px;height: 30px;margin: 15px 20px 10px 20px">
              <i class="el-icon-s-custom"></i>
              <span style="font-size: 18px;font-weight: 500">公信节点候选人</span>
            </div>
            <div style="width: 750px;height: 100%;">
              <el-table
                border
                :data="tableData"
                stripe
                style="width: 100%">
                <el-table-column
                  prop="account"
                  label="账户"
                  width="270">
                </el-table-column>
                <el-table-column
                  prop="active"
                  label="活跃度">
                </el-table-column>
                <el-table-column
                  prop="money"
                  label="金额"
                  width ="100">
                </el-table-column>
                <el-table-column
                  prop="vote"
                  label="得票数"
                  width ="100">
                </el-table-column>
              </el-table>
            </div>
          </div>
        </div>
      </div>
    </div>
</template>

<script>
    export default {
        name: "NodeMember",
        data(){
            return{
                activeNode:[{

                }],
                activeMember:[{
                    account: "34ertvgeffe",
                    active: 96,
                },{
                    account: "eporjio940i",
                    active: 45,
                },{
                    account: "904ioter40",
                    active: 23,
                },{
                    account: "45iotio4334",
                    active: 61,
                },{
                    account: "0943iorj032",
                    active: 37,
                },{
                    account: "4309ireo34",
                    active: 70,
                },{
                    account: "w39j093isij",
                    active: 78,
                },{
                    account: "9we83w39eie",
                    active: 54,
                }],
                tableData: [{
                    account: '54tgrgtrgtr',
                    active: '123',
                    money: '13542',
                    vote: '234',
                }, {
                    account: '2gr4frgg56gt',
                    active: '542',
                    money: '535',
                    vote: '4554',
                }, {
                    account: '566tgf66hgf',
                    active: '5421',
                    money: '78124',
                    vote: '1253',
                }, {
                    account: '123rf65rffd',
                    active: '7524',
                    money: '7854',
                    vote: '1433',
                }, {
                    account: '123derhtgfv',
                    active: '785',
                    money: '9654',
                    vote: '14123',
                }, {
                    account: '123det6hygf',
                    active: '645',
                    money: '7542',
                    vote: '23423',
                }, {
                    account: '12ev6hytgfv',
                    active: '158',
                    money: '87695',
                    vote: '32423',
                }, {
                    account: '1wf45gt6htrfg',
                    active: '12356',
                    vote: '1243',
                }]
            }
        }
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
