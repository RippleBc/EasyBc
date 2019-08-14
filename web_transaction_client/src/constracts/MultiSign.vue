<template>
  <div class="container">
    <div class="border" style="margin:20px 20px 20px 0px;width: 200px;height: 420px;">
      <strong>多重签名合约</strong>
      <el-button style="width:100px;margin:10px;" type="primary" @click="searchVisible = true;">查找</el-button>
      <el-button style="width:100px;margin:10px;" type="primary" @click="createVisible = true;">创建</el-button>
      <el-button style="width:100px;margin:10px;" type="primary" @click="sendVisible = true;">发送</el-button>
      <el-button style="width:100px;margin:10px;" type="primary" @click="agreeVisible = true;">同意</el-button>
      <el-button
        style="width:100px;margin:10px;"
        type="primary"
        @click="rejectVisible = true;"
      >拒绝</el-button>
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
        <span>时间戳</span>
        <strong style="margin-left:10px;">{{new Date(searchConstractDetail.timestamp).toString()}}</strong>
      </div>
      <div style="display:flex;width:100%;margin-bottom:10px;">
        <span>超时时长</span>
        <strong style="margin-left:10px;">{{searchConstractDetail.expireInverval}}</strong>
      </div>
      <div style="display:flex;width:100%;margin-bottom:10px;">
        <span>接受人</span>
        <strong style="margin-left:10px;">{{searchConstractDetail.to}}</strong>
      </div>
      <div style="display:flex;width:100%;margin-bottom:10px;">
        <span>额度</span>
        <strong style="margin-left:10px;">{{searchConstractDetail.value}}</strong>
      </div>
      <div style="display:flex;width:100%;margin-bottom:10px;">
        <span>阀值</span>
        <strong style="margin-left:10px;">{{searchConstractDetail.threshold}}%</strong>
      </div>
      <div style="display:flex;flex-direction:column;width:100%;margin-bottom:10px;">
        <span>授权地址</span>
        <strong style="margin-left:10px;" v-for="(value, index) in searchConstractDetail.authorityAddresses" :key= "index">{{value}}</strong>
      </div>
      <div style="display:flex;flex-direction:column;width:100%;margin-bottom:10px;">
        <span>同意地址</span>
        <strong style="margin-left:10px;" v-for="(value, index) in searchConstractDetail.agreeAddresses" :key= "index">{{value}}</strong>
      </div>
      <div style="display:flex;flex-direction:column;width:100%;margin-bottom:10px;">
        <span>拒绝地址</span>
        <strong style="margin-left:10px;" v-for="(value, index) in searchConstractDetail.rejectAddresses" :key= "index">{{value}}</strong>
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
    <el-dialog title="创建" :visible.sync="createVisible" width="80%">
      <el-form :model="createConstractDetail" label-width="90px">
        <el-form-item label="私钥">
          <el-input v-model="privateKey"></el-input>
        </el-form-item>
        <el-form-item label="超时时长">
          <el-input v-model="createConstractDetail.expireInverval"></el-input>
        </el-form-item>
        <el-form-item label="阀值">
          <el-input v-model="createConstractDetail.threshold"></el-input>
        </el-form-item>
        <el-form-item label="授权账号">
          <div style="display:flex;justify-content:flex-end;align-items:center;">
            <el-input v-model="authorityAddress"></el-input>
            <el-button style="margin:10px;" type="primary" @click="addNewAuthorityAddress">添加授权账号</el-button>
          </div>
          <el-table 
            :data="createConstractDetail.authorityAddresses"
            style="width: 100%:"
            :border="true">
            <el-table-column label="类型">
              <template slot-scope="scope">
                <strong>{{createConstractDetail.authorityAddresses[scope.$index]}}</strong>
              </template>
            </el-table-column>
            <el-table-column label="操作菜单">
              <template slot-scope="scope">
                <div style="display:flex;width:600px;">
                  <el-button
                    style="margin-right:10px;"
                    type="primary"
                    @click="createConstractDetail.authorityAddresses.splice(scope.$index, 1)"
                  >删除</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="createVisible = false">取 消</el-button>
        <el-button type="primary" @click="create">确 定</el-button>
      </span>
    </el-dialog>
    <el-dialog title="发送" :visible.sync="sendVisible" width="80%">
      <el-form label-width="90px">
        <el-form-item label="私钥">
          <el-input v-model="privateKey"></el-input>
        </el-form-item>
        <el-form-item label="合约地址">
          <el-input v-model="constractAddress"></el-input>
        </el-form-item>
        <el-form-item label="接受人">
          <el-input v-model="sendTo"></el-input>
        </el-form-item>
        <el-form-item label="金额">
          <el-input v-model="sendValue"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="sendVisible = false">取 消</el-button>
        <el-button type="primary" @click="send">确 定</el-button>
      </span>
    </el-dialog>
    <el-dialog title="同意" :visible.sync="agreeVisible" width="80%">
      <el-form label-width="90px">
        <el-form-item label="私钥">
          <el-input v-model="privateKey"></el-input>
        </el-form-item>
        <el-form-item label="合约地址">
          <el-input v-model="constractAddress"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="agreeVisible = false">取 消</el-button>
        <el-button type="primary" @click="agree">确 定</el-button>
      </span>
    </el-dialog>
    <el-dialog title="拒绝" :visible.sync="rejectVisible" width="80%">
      <el-form label-width="90px">
        <el-form-item label="私钥">
          <el-input v-model="privateKey"></el-input>
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="constractAddress"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="rejectVisible = false">取 消</el-button>
        <el-button type="primary" @click="reject">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import axios from "../net/axios.js";

export default {
  name: "MultiSign",
  data() {
    return {
      searchVisible: false,
      createVisible: false,
      sendVisible: false,
      agreeVisible: false,
      rejectVisible: false,
      createConstractDetail: {
        expireInverval: 360000,
        threshold: "",
        authorityAddresses: []
      },
      searchConstractDetail: {
        balance: "",
        state: "",
        timestamp: "",
        expireInverval: "",
        to: "",
        value: "",
        threshold: "",
        authorityAddresses: [],
        agreeAddresses: [],
        rejectAddresses: []
      },
      constractAddress: "",
      privateKey: "",
      sendTo: "",
      sendValue: "",
      authorityAddress: ""
    };
  },

  created() {},

  methods: {
    addNewAuthorityAddress: function() {
      if(this.createConstractDetail.authorityAddresses.find(el => {
        return el === this.authorityAddress;
      }))
      {
        return this.$notify.error(`repeat authorityAddress ${this.authorityAddress}`);
      }

      if(this.authorityAddress === "")
      {
        return this.$notify.error("authorityAddress can not be empty");
      }

      this.createConstractDetail.authorityAddresses.push(this.authorityAddress);
    },
    search: function() {
      axios.get("getMultiSignConstract", {
        url: this.currentNode.url,
        address: this.constractAddress
      }).then(({ code, data, msg }) => {
        if(code === 0)
        {
          this.$notify.success({
            title: 'getMultiSignConstract',
            message: `getMultiSignConstract success`
          });

          this.searchConstractDetail = data;
        }
        else
        {
          this.$notify.error({
            title: 'getMultiSignConstract',
            message: `getMultiSignConstract failed, ${msg}`
          });
        }
      }).finally(() => {
        this.searchVisible = false;
      });
    },
    create: function() {
      axios.get("createMultiSignConstract", Object.assign({
        url: this.currentNode.url,
        privateKey: this.privateKey,
        value: 10,
      }, this.createConstractDetail)).then(({ code, data, msg }) => {
        if(code === 0)
        {
          this.$notify.success({
            title: 'createMultiSignConstract',
            message: `createMultiSignConstract success`
          });

          this.constractAddress = data.ctAddress;

          setTimeout(() => {
            this.search();
          }, 1000);
        }
        else
        {
          this.$notify.error({
            title: 'createMultiSignConstract',
            message: `createMultiSignConstract failed, ${msg}`
          });
        }
      }).finally(() => {
        this.createVisible = false;
      });
    },
    send: function() {
      const now = Date.now();

      if(now < this.searchConstractDetail.timestamp + this.searchConstractDetail.expireInverval)
      {
        return this.$notify.error({
          title: 'sendMultiSignConstract',
          message: `sendMultiSignConstract send request has not expired`
        });
      }

      axios.get("sendMultiSignConstract", {
        url: this.currentNode.url,
        to: this.constractAddress,
        value: 10,
        privateKey: this.privateKey,
        constractTo: this.sendTo,
        constractValue: this.sendValue
      }).then(({ code, data, msg }) => {
        if(code === 0)
        {
          this.$notify.success({
            title: 'sendMultiSignConstract',
            message: `sendMultiSignConstract success`
          });

          setTimeout(() => {
            this.search();
          }, 1000);
        }
        else
        {
          this.$notify.error({
            title: 'sendMultiSignConstract',
            message: `sendMultiSignConstract failed, ${msg}`
          });
        }
      }).finally(() => {
        this.sendVisible = false;
      });
      
    },
    agree: function() {
      const now = Date.now();

      if(now > this.searchConstractDetail.timestamp + this.searchConstractDetail.expireInverval)
      {
        return this.$notify.error({
          title: 'agreeMultiSignConstract',
          message: `agreeMultiSignConstract send request has expired`
        });
      }
      
      axios.get("agreeMultiSignConstract", {
        url: this.currentNode.url,
        to: this.constractAddress,
        privateKey: this.privateKey,
        value: 10,
        timestamp: this.searchConstractDetail.timestamp
      }).then(({ code, data, msg }) => {
        if(code === 0)
        {
          this.$notify.success({
            title: 'agreeMultiSignConstract',
            message: `agreeMultiSignConstract success`
          });

          setTimeout(() => {
            this.search();
          }, 1000);
        }
        else
        {
          this.$notify.error({
            title: 'agreeMultiSignConstract',
            message: `agreeMultiSignConstract failed, ${msg}`
          });
        }
      }).finally(() => {
        this.agreeVisible = false;
      });
    },
    reject: function() {
      const now = Date.now();

      if(now > this.searchConstractDetail.timestamp + this.searchConstractDetail.expireInverval)
      {
        return this.$notify.error({
          title: 'rejectMultiSignConstract',
          message: `rejectMultiSignConstract send request has expired`
        });
      }

      axios.get("rejectMultiSignConstract", {
        url: this.currentNode.url,
        to: this.constractAddress,
        privateKey: this.privateKey,
        value: 10,
        timestamp: this.searchConstractDetail.timestamp
      }).then(({ code, data, msg }) => {
        if(code === 0)
        {
          this.$notify.success({
            title: 'rejectMultiSignConstract',
            message: `rejectMultiSignConstract success`
          });

          setTimeout(() => {
            this.search();
          }, 1000);
        }
        else
        {
          this.$notify.error({
            title: 'rejectMultiSignConstract',
            message: `rejectMultiSignConstract failed, ${msg}`
          });
        }
      }).finally(() => {
        this.rejectVisible = false;
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
  justify-content: flex-start;
  align-items: flex-start;
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