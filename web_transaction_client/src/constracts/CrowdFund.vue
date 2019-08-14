<template>
  <div class="container">
    <div class="border" style="margin:20px 20px 20px 0px;width: 200px;height: 420px;">
      <strong>众筹合约</strong>
      <el-button style="width:100px;margin:10px;" type="primary" @click="searchVisible = true;">查找</el-button>
      <el-button style="width:100px;margin:10px;" type="primary" @click="createVisible = true;">创建</el-button>
      <el-button style="width:100px;margin:10px;" type="primary" @click="fundVisible = true;">投资</el-button>
      <el-button style="width:100px;margin:10px;" type="primary" @click="refundVisible = true;">赎回</el-button>
      <el-button
        style="width:100px;margin:10px;"
        type="primary"
        @click="receiveVisible = true;"
      >众筹提取</el-button>
    </div>
    <div class="border" style="margin:20px 0px 20px 0px;width: 600px;overflow:scroll;" v-if="searchConstractDetail.state">
      <div style="display:flex;width:100%;margin-bottom:10px;">
        <span>地址</span>
        <strong style="margin-left:10px;">{{constractAddress}}</strong>
      </div>
      <div style="display:flex;width:100%;margin-bottom:10px;">
        <span>余额</span>
        <strong style="margin-left:10px;">{{searchConstractDetail.balance}}</strong>
      </div>
      <div style="display:flex;width:100%;margin-bottom:10px;">
        <span>状态</span>
        <strong style="margin-left:10px;">{{searchConstractDetail.state}}</strong>
      </div>
      <div style="display:flex;width:100%;margin-bottom:10px;">
        <span>众筹接受账户</span>
        <strong style="margin-left:10px;">{{searchConstractDetail.receiveAddress}}</strong>
      </div>
      <div style="display:flex;width:100%;margin-bottom:10px;">
        <span>开始时间</span>
        <strong style="margin-left:10px;">{{new Date(searchConstractDetail.beginTime).toString()}}</strong>
      </div>
      <div style="display:flex;width:100%;margin-bottom:10px;">
        <span>结束时间</span>
        <strong style="margin-left:10px;">{{new Date(searchConstractDetail.endTime).toString()}}</strong>
      </div>
      <div style="display:flex;width:100%;margin-bottom:10px;">
        <span>目标额度</span>
        <strong style="margin-left:10px;">{{searchConstractDetail.target}}</strong>
      </div>
      <div style="display:flex;width:100%;margin-bottom:10px;">
        <span>最低投资额</span>
        <strong style="margin-left:10px;">{{searchConstractDetail.limit}}</strong>
      </div>
      <div style="display:flex;width:100%;margin-bottom:10px;" v-for="(value, index) in searchConstractDetail.fundInfo" :key= "index">
        <span>{{value[0]}}</span>
        <strong style="margin-left:10px;">{{value[1]}}</strong>
      </div>
    </div>
    <el-dialog title="查找" :visible.sync="searchVisible" width="80%">
      <el-form label-width="90px">
        <el-form-item label="合约地址">
          <el-input v-model="constractAddress"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="searchVisible = false">取 消</el-button>
        <el-button type="primary" @click="search">确 定</el-button>
      </span>
    </el-dialog>
    <el-dialog title="新增" :visible.sync="createVisible" width="80%">
      <el-form :model="createConstractDetail" label-width="90px">
        <el-form-item label="私钥">
          <el-input v-model="privateKey"></el-input>
        </el-form-item>
        <div style="display:flex;align-items:center;">
          <el-form-item label="开始时间">
            <el-date-picker
              style="width: 100%;margin: 20px;"
              v-model="createConstractDetail.beginTime"
              align="right"
              type="datetime"
              placeholder="选择日期"
              value-format='timestamp'>
            </el-date-picker>
          </el-form-item>
          <el-form-item label="结束时间">
            <el-date-picker
              style="width: 100%;margin: 20px;"
              v-model="createConstractDetail.endTime"
              align="right"
              type="datetime"
              placeholder="选择日期"
              value-format='timestamp'>
            </el-date-picker>
          </el-form-item>
        </div>
        <el-form-item label="接受账户">
          <el-input v-model="createConstractDetail.receiveAddress"></el-input>
        </el-form-item>
        <el-form-item label="目标额度">
          <el-input v-model="createConstractDetail.target"></el-input>
        </el-form-item>
        <el-form-item label="最低投资额">
          <el-input v-model="createConstractDetail.limit"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="createVisible = false">取 消</el-button>
        <el-button type="primary" @click="create">确 定</el-button>
      </span>
    </el-dialog>
    <el-dialog title="投资" :visible.sync="fundVisible" width="80%">
      <el-form label-width="90px">
        <el-form-item label="私钥">
          <el-input v-model="privateKey"></el-input>
        </el-form-item>
        <el-form-item label="合约地址">
          <el-input v-model="constractAddress"></el-input>
        </el-form-item>
        <el-form-item label="投资额">
          <el-input v-model="fundValue"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="fundVisible = false">取 消</el-button>
        <el-button type="primary" @click="fund">确 定</el-button>
      </span>
    </el-dialog>
    <el-dialog title="赎回" :visible.sync="refundVisible" width="80%">
      <el-form label-width="90px">
        <el-form-item label="私钥">
          <el-input v-model="privateKey"></el-input>
        </el-form-item>
        <el-form-item label="合约地址">
          <el-input v-model="constractAddress"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="refundVisible = false">取 消</el-button>
        <el-button type="primary" @click="refund">确 定</el-button>
      </span>
    </el-dialog>
    <el-dialog title="众筹提取" :visible.sync="receiveVisible" width="80%">
      <el-form label-width="90px">
        <el-form-item label="私钥">
          <el-input v-model="privateKey"></el-input>
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="constractAddress"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="receiveVisible = false">取 消</el-button>
        <el-button type="primary" @click="receive">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import axios from "../net/axios.js";

export default {
  name: "CrowdFund",
  data() {
    return {
      searchVisible: false,
      createVisible: false,
      fundVisible: false,
      refundVisible: false,
      receiveVisible: false,
      createConstractDetail: {
        beginTime: "",
        endTime: "",
        receiveAddress: "",
        target: "",
        limit: ""
      },
      searchConstractDetail: {
        balance: "",
        state: "",
        receiveAddress: "",
        beginTime: "",
        endTime: "",
        receiveAddress: "",
        target: "",
        limit: "",
        fundInfo: {}
      },
      constractAddress: "",
      privateKey: "",
      fundValue: ""
    };
  },

  created() {},

  methods: {
    search: function() {
      axios.get("getCrowdFundConstract", {
        url: this.currentNode.url,
        address: this.constractAddress
      }).then(({ code, data, msg }) => {
        if(code === 0)
        {
          this.$notify.success({
            title: 'getCrowdFundConstract',
            message: `getCrowdFundConstract success`
          });

          this.searchConstractDetail = data;
        }
        else
        {
          this.$notify.error({
            title: 'getCrowdFundConstract',
            message: `getCrowdFundConstract failed, ${msg}`
          });
        }
      }).finally(() => {
        this.searchVisible = false;
      });
    },
    create: function() {
      axios.get("createCrowdFundConstract", Object.assign({
        url: this.currentNode.url,
        privateKey: this.privateKey,
        value: 10,
      }, this.createConstractDetail)).then(({ code, data, msg }) => {
        if(code === 0)
        {
          this.$notify.success({
            title: 'createCrowdFundConstract',
            message: `createCrowdFundConstract success`
          });

          this.constractAddress = data.ctAddress;

          setTimeout(() => {
            this.search();
          }, 1000);
        }
        else
        {
          this.$notify.error({
            title: 'createCrowdFundConstract',
            message: `createCrowdFundConstract failed, ${msg}`
          });
        }
      }).finally(() => {
        this.createVisible = false;
      });
    },
    fund: function() {
      const now = Date.now();

      if(now > this.searchConstractDetail.endTime || now < this.searchConstractDetail.beginTime)
      {
        return this.$notify.error({
          title: 'fundCrowdFundConstract',
          message: `fundCrowdFundConstract contract has expired`
        });
      }

      axios.get("fundCrowdFundConstract", {
        url: this.currentNode.url,
        to: this.constractAddress,
        privateKey: this.privateKey,
        value: this.fundValue
      }).then(({ code, data, msg }) => {
        if(code === 0)
        {
          this.$notify.success({
            title: 'fundCrowdFundConstract',
            message: `fundCrowdFundConstract success`
          });

          setTimeout(() => {
            this.search();
          }, 1000);
        }
        else
        {
          this.$notify.error({
            title: 'fundCrowdFundConstract',
            message: `fundCrowdFundConstract failed, ${msg}`
          });
        }
      }).finally(() => {
        this.fundVisible = false;
      });
      
    },
    refund: function() {
      const now = Date.now();

      if(now < this.searchConstractDetail.endTime)
      {
        return this.$notify.error({
          title: 'reFundCrowdFundConstract',
          message: `reFundCrowdFundConstract contract has not ended`
        });
      }
      
      axios.get("reFundCrowdFundConstract", {
        url: this.currentNode.url,
        to: this.constractAddress,
        privateKey: this.privateKey,
        value: 10
      }).then(({ code, data, msg }) => {
        if(code === 0)
        {
          this.$notify.success({
            title: 'reFundCrowdFundConstract',
            message: `reFundCrowdFundConstract success`
          });

          setTimeout(() => {
            this.search();
          }, 1000);
        }
        else
        {
          this.$notify.error({
            title: 'reFundCrowdFundConstract',
            message: `reFundCrowdFundConstract failed, ${msg}`
          });
        }
      }).finally(() => {
        this.refundVisible = false;
      });
    },
    receive: function() {
      const now = Date.now();

      if(now < this.searchConstractDetail.endTime)
      {
        return this.$notify.error({
          title: 'receiveCrowdFundConstract',
          message: `receiveCrowdFundConstract contract has not ended`
        });
      }

      axios.get("receiveCrowdFundConstract", {
        url: this.currentNode.url,
        to: this.constractAddress,
        privateKey: this.privateKey,
        value: 10
      }).then(({ code, data, msg }) => {
        if(code === 0)
        {
          this.$notify.success({
            title: 'receiveCrowdFundConstract',
            message: `receiveCrowdFundConstract success`
          });

          setTimeout(() => {
            this.search();
          }, 1000);
        }
        else
        {
          this.$notify.error({
            title: 'receiveCrowdFundConstract',
            message: `receiveCrowdFundConstract failed, ${msg}`
          });
        }
      }).finally(() => {
        this.receiveVisible = false;
      });
    }
  },

  computed: {
    currentNode: function() {
      return this.$store.state.currentNode;
    }
  }
};
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
}

.border {
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12), 0 0 6px rgba(0, 0, 0, 0.04);
  border-radius: 4px;
}
</style>