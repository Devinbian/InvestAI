<template>
  <div class="risk-assessment-container">
    <el-card class="assessment-card">
      <template #header>
        <div class="card-header">
          <h2>风险承受能力测评</h2>
        </div>
      </template>
      <div class="card-content">
        <el-form :model="form" label-width="120px">
          <el-form-item label="投资经验">
            <el-radio-group v-model="form.experience">
              <el-radio label="novice">新手（1年以下）</el-radio>
              <el-radio label="intermediate">有经验（1-3年）</el-radio>
              <el-radio label="expert">资深（3年以上）</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="投资目标">
            <el-radio-group v-model="form.goal">
              <el-radio label="preserve">保值</el-radio>
              <el-radio label="growth">稳健增长</el-radio>
              <el-radio label="aggressive">激进增长</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="可承受最大亏损">
            <el-radio-group v-model="form.maxLoss">
              <el-radio label="10">10%以内</el-radio>
              <el-radio label="20">20%以内</el-radio>
              <el-radio label="30">30%以内</el-radio>
              <el-radio label="more">30%以上</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="submitAssessment">下一步</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserConfigStore } from '../store/userConfig'

const router = useRouter()
const userConfig = useUserConfigStore()
const form = reactive({
  experience: '',
  goal: '',
  maxLoss: ''
})

const submitAssessment = () => {
  userConfig.setRiskProfile({ ...form })
  router.push('/industry-preference')
}
</script>

<style scoped>
.risk-assessment-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
}

.assessment-card {
  width: 100%;
  max-width: 800px;
}

.card-header {
  text-align: center;
}

.card-content {
  padding: 20px;
}
</style> 
