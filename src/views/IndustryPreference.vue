<template>
  <div class="industry-preference-container">
    <el-card class="preference-card">
      <template #header>
        <div class="card-header">
          <h2>行业偏好设置</h2>
        </div>
      </template>
      <div class="card-content">
        <el-form :model="form" label-width="120px">
          <el-form-item label="关注行业">
            <el-checkbox-group v-model="form.industries">
              <el-checkbox label="technology">科技</el-checkbox>
              <el-checkbox label="finance">金融</el-checkbox>
              <el-checkbox label="healthcare">医疗健康</el-checkbox>
              <el-checkbox label="consumer">消费</el-checkbox>
              <el-checkbox label="energy">能源</el-checkbox>
              <el-checkbox label="realestate">房地产</el-checkbox>
              <el-checkbox label="manufacturing">制造业</el-checkbox>
              <el-checkbox label="agriculture">农业</el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <el-form-item label="投资周期">
            <el-radio-group v-model="form.investmentPeriod">
              <el-radio label="short">短期（1年以内）</el-radio>
              <el-radio label="medium">中期（1-3年）</el-radio>
              <el-radio label="long">长期（3年以上）</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="submitPreferences">下一步</el-button>
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
  industries: [],
  investmentPeriod: ''
})

const submitPreferences = () => {
  userConfig.setIndustryPreferences({ ...form })
  router.push('/investment-goals')
}
</script>

<style scoped>
.industry-preference-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
}

.preference-card {
  width: 100%;
  max-width: 800px;
}

.card-header {
  text-align: center;
}

.card-content {
  padding: 20px;
}

.el-checkbox-group {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
</style> 
