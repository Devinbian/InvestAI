<template>
  <div class="investment-goals-container">
    <el-card class="goals-card">
      <template #header>
        <div class="card-header">
          <h2>投资目标确认</h2>
        </div>
      </template>
      <div class="card-content">
        <el-form :model="form" label-width="120px">
          <el-form-item label="预期年化收益">
            <el-radio-group v-model="form.expectedReturn">
              <el-radio label="5">5%以下</el-radio>
              <el-radio label="10">5%-10%</el-radio>
              <el-radio label="15">10%-15%</el-radio>
              <el-radio label="20">15%以上</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="投资金额">
            <el-input-number 
              v-model="form.investmentAmount" 
              :min="1000" 
              :max="1000000"
              :step="1000"
            />
          </el-form-item>

          <el-form-item label="投资策略">
            <el-select v-model="form.strategy" placeholder="请选择投资策略">
              <el-option label="价值投资" value="value" />
              <el-option label="成长投资" value="growth" />
              <el-option label="趋势投资" value="trend" />
              <el-option label="量化投资" value="quantitative" />
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="submitGoals">完成设置</el-button>
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
  expectedReturn: '',
  investmentAmount: 10000,
  strategy: ''
})

const submitGoals = () => {
  userConfig.setInvestmentGoals({ ...form })
  router.push('/main')
}
</script>

<style scoped>
.investment-goals-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
}

.goals-card {
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
