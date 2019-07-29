<template>
  <div class="container">
    <div class="border" style="margin:20px 0px 20px 0px;">
        <strong>众筹合约</strong>
        <el-button @click="createVisible = true;">创建</el-button>
        <el-button @click="createVisible = true;">查找</el-button>
    </div>
    <el-dialog title="新增" :visible.sync="createVisible" width="30%">
        <el-form :model="constract" label-width="90px">
            <el-form-item label="创建者">
                <el-input v-model="constract.from"></el-input>
            </el-form-item>
        </el-form>
        <span slot="footer" class="dialog-footer">
            <el-button @click="createVisible = false">取 消</el-button>
            <el-button type="primary" @click="saveCreate">确 定</el-button>
        </span>
    </el-dialog>
    <el-dialog title="新增" :visible.sync="createVisible" width="30%">
        <el-form label-width="90px">
            <el-form-item label="地址">
                <el-input v-model="constractAddress"></el-input>
            </el-form-item>
        </el-form>
        <span slot="footer" class="dialog-footer">
            <el-button @click="createVisible = false">取 消</el-button>
            <el-button type="primary" @click="saveCreate">确 定</el-button>
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
        createVisible: false,
        constract: {

        },
        constractAddress
    };
  },

  created() {},

  methods: {
      saveCreate: function() {
          createVisible.createVisible = true;
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
    width: 300px;
    display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  float: left;
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