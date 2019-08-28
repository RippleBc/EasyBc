<template>
  <div class="container">
    <div class="border" style="margin:20px 20px 20px 0px;width: 200px;height: 420px;">
      <strong>侧链合约</strong>
      <el-button style="width:100px;margin:10px;" type="primary" @click="searchVisible = true;">查找</el-button>
      <el-button style="width:100px;margin:10px;" type="primary" @click="createVisible = true;">创建</el-button>
      <el-button style="width:150px;margin:10px;" type="primary" @click="newAuthorityAddressesVisible = true;">新增授权账户</el-button>
      <el-button style="width:150px;margin:10px;" type="primary" @click="delAuthorityAddressesVisible = true;">删除授权账户</el-button>
      <el-button style="width:100px;margin:10px;" type="primary" @click="agreeVisible = true;">同意</el-button>
      <el-button
        style="width:100px;margin:10px;"
        type="primary"
        @click="rejectVisible = true;"
      >拒绝</el-button>
    </div>
    <div class="border" style="margin:20px 0px 20px 0px;width: 600px;overflow:scroll;" v-if="searchConstractDetail.state">
      <div style="display:flex;width:100%;margin-bottom:10px;border-bottom: solid 1px #45a613">
        <span>地址</span>
        <strong style="margin-left:10px;">{{constractAddress}}</strong>
      </div>
      <div style="display:flex;width:100%;margin-bottom:10px;border-bottom: solid 1px #45a613">
        <span>余额</span>
        <strong style="margin-left:10px;">{{searchConstractDetail.balance}}</strong>
      </div>
      <div style="display:flex;width:100%;margin-bottom:10px;border-bottom: solid 1px #45a613">
        <span>侧链代码</span>
        <strong style="margin-left:10px;">{{searchConstractDetail.code}}</strong>
      </div>
      <div style="display:flex;width:100%;margin-bottom:10px;border-bottom: solid 1px #45a613">
        <span>状态</span>
        <strong style="margin-left:10px;">{{searchConstractDetail.state}}</strong>
      </div>
      <div style="display:flex;width:100%;margin-bottom:10px;border-bottom: solid 1px #45a613">
        <span>时间戳</span>
        <strong style="margin-left:10px;">{{new Date(searchConstractDetail.timestamp).toString()}}</strong>
      </div>
      <div style="display:flex;width:100%;margin-bottom:10px;border-bottom: solid 1px #45a613">
        <span>超时时长</span>
        <strong style="margin-left:10px;">{{searchConstractDetail.expireInterval}}</strong>
      </div>
      <div style="display:flex;flex-direction:column;width:100%;margin-bottom:10px;border-bottom: solid 1px #45a613;align-items:flex-start;">
        <span>新增授权地址请求</span>
        <strong style="margin-left:10px;" v-for="(value, index) in searchConstractDetail.newAuthorityAddresses" :key= "index">{{value}}</strong>
      </div>
      <div style="display:flex;flex-direction:column;width:100%;margin-bottom:10px;border-bottom: solid 1px #45a613;align-items:flex-start;">
        <span>删除授权地址请求</span>
        <strong style="margin-left:10px;" v-for="(value, index) in searchConstractDetail.delAuthorityAddresses" :key= "index">{{value}}</strong>
      </div>
      <div style="display:flex;width:100%;margin-bottom:10px;border-bottom: solid 1px #45a613">
        <span>阀值</span>
        <strong style="margin-left:10px;">{{searchConstractDetail.threshold}}%</strong>
      </div>
      <div style="display:flex;flex-direction:column;width:100%;margin-bottom:10px;border-bottom: solid 1px #45a613;align-items:flex-start;">
        <span>授权地址</span>
        <strong style="margin-left:10px;" v-for="(value, index) in searchConstractDetail.authorityAddresses" :key= "index">{{value}}</strong>
      </div>
      <div style="display:flex;flex-direction:column;width:100%;margin-bottom:10px;border-bottom: solid 1px #45a613;align-items:flex-start;">
        <span>同意地址</span>
        <strong style="margin-left:10px;" v-for="(value, index) in searchConstractDetail.agreeAddresses" :key= "index">{{value}}</strong>
      </div>
      <div style="display:flex;flex-direction:column;width:100%;margin-bottom:10px;border-bottom: solid 1px #45a613;align-items:flex-start;">
        <span>拒绝地址</span>
        <strong style="margin-left:10px;" v-for="(value, index) in searchConstractDetail.rejectAddresses" :key= "index">{{value}}</strong>
      </div>
      <div style="display:flex;flex-direction:column;width:100%;margin-bottom:10px;;align-items:flex-start;">
        <span>转账请求</span>
        <template style="margin-left:10px;" v-for="(payRequest, index) in searchConstractDetail.crossPayRequests">
          <div style="display:flex;flex-direction:column;border-bottom: solid 1px #45a613;align-items:flex-start;" :key= "index">
            <div style="display:flex;">
              <span style="width:100px;text-align:left;">交易哈西</span>
              <strong style="margin-left:10px;">{{payRequest.txHash}}</strong>
            </div>
            <div style="display:flex;">
              <span style="width:100px;text-align:left;">时间戳</span>
              <strong style="margin-left:10px;">{{payRequest.timestamp}}</strong>
            </div>
            <div style="display:flex;">
              <span style="width:100px;text-align:left;">接受人</span>
              <strong style="margin-left:10px;">{{payRequest.to}}</strong>
            </div>
            <div style="display:flex;">
              <span style="width:100px;text-align:left;">金额</span>
              <strong style="margin-left:10px;">{{payRequest.value}}</strong>
            </div>
            <div style="display:flex;">
              <span style="width:100px;text-align:left;">发起人</span>
              <strong v-for="(sponsor, index) in payRequest.sponsors" :key="index">{{sponsor}}</strong>
            </div>
          </div>
        </template>
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
        <el-form-item label="侧链代码">
          <el-input v-model="createConstractDetail.code"></el-input>
        </el-form-item>
        <el-form-item label="超时时长">
          <el-input v-model="createConstractDetail.expireInterval"></el-input>
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
    <el-dialog title="新增授权账号" :visible.sync="newAuthorityAddressesVisible" width="80%">
      <el-form label-width="120px">
        <el-form-item label="私钥">
          <el-input v-model="privateKey"></el-input>
        </el-form-item>
        <el-form-item label="合约地址">
          <el-input v-model="constractAddress"></el-input>
        </el-form-item>
        <el-form-item label="新增授权账号">
          <div style="display:flex;justify-content:flex-end;align-items:center;">
            <el-input v-model="authorityAddress"></el-input>
            <el-button style="margin:10px;" type="primary" @click="newAuthorityAddress">添加授权账号</el-button>
          </div>
          <el-table 
            :data="newAuthorityAddresses"
            style="width: 100%:"
            :border="true">
            <el-table-column label="类型">
              <template slot-scope="scope">
                <strong>{{newAuthorityAddresses[scope.$index]}}</strong>
              </template>
            </el-table-column>
            <el-table-column label="操作菜单">
              <template slot-scope="scope">
                <div style="display:flex;width:600px;">
                  <el-button
                    style="margin-right:10px;"
                    type="primary"
                    @click="newAuthorityAddresses.splice(scope.$index, 1)"
                  >删除</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="newAuthorityAddressesVisible = false">取 消</el-button>
        <el-button type="primary" @click="commitNewAuthorityAddress">确 定</el-button>
      </span>
    </el-dialog>
    <el-dialog title="删除授权账号" :visible.sync="delAuthorityAddressesVisible" width="80%">
      <el-form label-width="120px">
        <el-form-item label="私钥">
          <el-input v-model="privateKey"></el-input>
        </el-form-item>
        <el-form-item label="合约地址">
          <el-input v-model="constractAddress"></el-input>
        </el-form-item>
        <el-form-item label="删除授权账号">
          <div style="display:flex;justify-content:flex-end;align-items:center;">
            <el-input v-model="authorityAddress"></el-input>
            <el-button style="margin:10px;" type="primary" @click="delAuthorityAddress">添加授权账号</el-button>
          </div>
          <el-table 
            :data="delAuthorityAddresses"
            style="width: 100%:"
            :border="true">
            <el-table-column label="类型">
              <template slot-scope="scope">
                <strong>{{delAuthorityAddresses[scope.$index]}}</strong>
              </template>
            </el-table-column>
            <el-table-column label="操作菜单">
              <template slot-scope="scope">
                <div style="display:flex;width:600px;">
                  <el-button
                    style="margin-right:10px;"
                    type="primary"
                    @click="delAuthorityAddresses.splice(scope.$index, 1)"
                  >删除</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="delAuthorityAddressesVisible = false">取 消</el-button>
        <el-button type="primary" @click="commitDelAuthorityAddress">确 定</el-button>
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
  name: "SideChain",
  data() {
    return {
      searchVisible: false,
      createVisible: false,
      newAuthorityAddressesVisible: false,
      delAuthorityAddressesVisible: false,
      agreeVisible: false,
      rejectVisible: false,
      createConstractDetail: {
        code: "",
        expireInterval: 360000,
        threshold: "",
        authorityAddresses: []
      },
      searchConstractDetail: {
        code: "",
        balance: "",
        state: "",
        timestamp: "",
        expireInterval: "",
        to: "",
        value: "",
        threshold: "",
        authorityAddresses: [],
        agreeAddresses: [],
        rejectAddresses: [],
        crossPayRequests: []
      },
      constractAddress: "",
      privateKey: "",
      newAuthorityAddresses: [],
      delAuthorityAddresses: [],
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
    newAuthorityAddress: function() {
      if(this.newAuthorityAddresses.find(el => {
        return el === this.authorityAddress;
      }))
      {
        return this.$notify.error(`repeat authorityAddress ${this.authorityAddress}`);
      }

      if(this.authorityAddress === "")
      {
        return this.$notify.error("authorityAddress can not be empty");
      }

      this.newAuthorityAddresses.push(this.authorityAddress);
    },
    delAuthorityAddress: function() {
      if(this.delAuthorityAddresses.find(el => {
        return el === this.authorityAddress;
      }))
      {
        return this.$notify.error(`repeat authorityAddress ${this.authorityAddress}`);
      }

      if(this.authorityAddress === "")
      {
        return this.$notify.error("authorityAddress can not be empty");
      }

      this.delAuthorityAddresses.push(this.authorityAddress);
    },
    search: function() {
      axios.get("getSideChainConstract", {
        url: this.currentNode.url,
        address: this.constractAddress
      }).then(({ code, data, msg }) => {
        if(code === 0)
        {
          this.$notify.success({
            title: 'getSideChainConstract',
            message: `getSideChainConstract success`
          });

          this.searchConstractDetail = data;

          // parse crossPayRequests
          const formattedCrossPayRequests = []
          for(let i = 0; i < this.searchConstractDetail.crossPayRequests.length; i += 5)
          {
            formattedCrossPayRequests.push({
              txHash: this.searchConstractDetail.crossPayRequests[0],
              timestamp: this.searchConstractDetail.crossPayRequests[1],
              to: this.searchConstractDetail.crossPayRequests[2],
              value: this.searchConstractDetail.crossPayRequests[3],
              sponsors: this.searchConstractDetail.crossPayRequests[4]
            })
          }
          this.searchConstractDetail.crossPayRequests = formattedCrossPayRequests;
        }
        else
        {
          this.$notify.error({
            title: 'getSideChainConstract',
            message: `getSideChainConstract failed, ${msg}`
          });
        }
      }).finally(() => {
        this.searchVisible = false;
      });
    },
    create: function() {
      axios.get("createSideChainConstract", Object.assign({
        url: this.currentNode.url,
        privateKey: this.privateKey,
        value: 10,
      }, this.createConstractDetail)).then(({ code, data, msg }) => {
        if(code === 0)
        {
          this.$notify.success({
            title: 'createSideChainConstract',
            message: `createSideChainConstract success`
          });

          this.constractAddress = data.ctAddress;

          setTimeout(() => {
            this.search();
          }, 1000);
        }
        else
        {
          this.$notify.error({
            title: 'createSideChainConstract',
            message: `createSideChainConstract failed, ${msg}`
          });
        }
      }).finally(() => {
        this.createVisible = false;
      });
    },

    commitNewAuthorityAddress: function() {
      const now = Date.now();

      if(now < this.searchConstractDetail.timestamp + this.searchConstractDetail.expireInterval)
      {
        return this.$notify.error({
          title: 'newSideChainConstract',
          message: `newSideChainConstract authority addresses modify request has not expired`
        });
      }

      axios.get("newSideChainConstract", {
        url: this.currentNode.url,
        to: this.constractAddress,
        value: 10,
        privateKey: this.privateKey,
        newAuthorityAddresses: this.newAuthorityAddresses
      }).then(({ code, data, msg }) => {
        if(code === 0)
        {
          this.$notify.success({
            title: 'newSideChainConstract',
            message: `newSideChainConstract success`
          });

          setTimeout(() => {
            this.search();
          }, 1000);
        }
        else
        {
          this.$notify.error({
            title: 'newSideChainConstract',
            message: `newSideChainConstract failed, ${msg}`
          });
        }
      }).finally(() => {
        this.newAuthorityAddressesVisible = false;
      });
      
    },

    commitDelAuthorityAddress: function() {
      const now = Date.now();

      if(now < this.searchConstractDetail.timestamp + this.searchConstractDetail.expireInterval)
      {
        return this.$notify.error({
          title: 'delSideChainConstract',
          message: `delSideChainConstract authority addresses modify request has not expired`
        });
      }

      axios.get("delSideChainConstract", {
        url: this.currentNode.url,
        to: this.constractAddress,
        value: 10,
        privateKey: this.privateKey,
        delAuthorityAddresses: this.delAuthorityAddresses
      }).then(({ code, data, msg }) => {
        if(code === 0)
        {
          this.$notify.success({
            title: 'delSideChainConstract',
            message: `delSideChainConstract success`
          });

          setTimeout(() => {
            this.search();
          }, 1000);
        }
        else
        {
          this.$notify.error({
            title: 'delSideChainConstract',
            message: `delSideChainConstract failed, ${msg}`
          });
        }
      }).finally(() => {
        this.delAuthorityAddressesVisible = false;
      });
      
    },

    agree: function() {
      const now = Date.now();

      if(now > this.searchConstractDetail.timestamp + this.searchConstractDetail.expireInterval)
      {
        return this.$notify.error({
          title: 'agreeSideChainConstract',
          message: `agreeSideChainConstract send request has expired`
        });
      }
      
      axios.get("agreeSideChainConstract", {
        url: this.currentNode.url,
        to: this.constractAddress,
        privateKey: this.privateKey,
        value: 10,
        timestamp: this.searchConstractDetail.timestamp
      }).then(({ code, data, msg }) => {
        if(code === 0)
        {
          this.$notify.success({
            title: 'agreeSideChainConstract',
            message: `agreeSideChainConstract success`
          });

          setTimeout(() => {
            this.search();
          }, 1000);
        }
        else
        {
          this.$notify.error({
            title: 'agreeSideChainConstract',
            message: `agreeSideChainConstract failed, ${msg}`
          });
        }
      }).finally(() => {
        this.agreeVisible = false;
      });
    },
    reject: function() {
      const now = Date.now();

      if(now > this.searchConstractDetail.timestamp + this.searchConstractDetail.expireInterval)
      {
        return this.$notify.error({
          title: 'rejectSideChainConstract',
          message: `rejectSideChainConstract send request has expired`
        });
      }

      axios.get("rejectSideChainConstract", {
        url: this.currentNode.url,
        to: this.constractAddress,
        privateKey: this.privateKey,
        value: 10,
        timestamp: this.searchConstractDetail.timestamp
      }).then(({ code, data, msg }) => {
        if(code === 0)
        {
          this.$notify.success({
            title: 'rejectSideChainConstract',
            message: `rejectSideChainConstract success`
          });

          setTimeout(() => {
            this.search();
          }, 1000);
        }
        else
        {
          this.$notify.error({
            title: 'rejectSideChainConstract',
            message: `rejectSideChainConstract failed, ${msg}`
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