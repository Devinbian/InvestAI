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
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useUserConfigStore } from '../store/userConfig';

const router = useRouter();
const userConfig = useUserConfigStore();
const form = reactive({
  industries: [],
  investmentPeriod: ''
});

const submitPreferences = () => {
  userConfig.setIndustryPreferences({ ...form });
  router.push('/investment-goals');
};
</script>

<style scoped>
.industry-preference-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 16px;
}

.preference-card {
  width: 100%;
  max-width: 1000px;
}

.card-header {
  text-align: center;
}

.card-content {
  padding: 24px;
}

.el-checkbox-group {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.el-button[type="primary"] {
  background-color: #18181b !important;
  border-color: #18181b !important;
}

.el-button[type="primary"]:hover {
  background-color: #000000 !important;
  border-color: #000000 !important;
}

.el-checkbox.is-checked .el-checkbox__input .el-checkbox__inner {
  background-color: #18181b !important;
  border-color: #18181b !important;
}

.el-checkbox:hover .el-checkbox__input .el-checkbox__inner {
  border-color: #18181b !important;
}

/* 移动端响应式优化 - 充分利用屏幕空间 */
@media (max-width: 767px) {
  .industry-preference-container {
    padding: 8px;
    min-height: 100vh;
  }

  .preference-card {
    max-width: 100%;
    margin: 0;
    border-radius: 12px;
  }

  .card-header h2 {
    font-size: 1.25rem;
    margin: 0;
  }

  .card-content {
    padding: 16px;
  }

  .el-form-item {
    margin-bottom: 20px;
  }

  .el-form-item__label {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 12px;
  }

  .el-checkbox-group {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .el-checkbox {
    margin: 0;
    padding: 14px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 10px;
    transition: all 0.2s ease;
  }

  .el-checkbox:hover {
    border-color: #18181b;
    background-color: #f8f9fa;
  }

  .el-checkbox.is-checked {
    border-color: #18181b;
    background-color: #f1f5f9;
  }

  .el-checkbox__label {
    font-size: 1rem;
    padding-left: 8px;
  }

  .el-radio-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .el-radio {
    margin: 0;
    padding: 14px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 10px;
    transition: all 0.2s ease;
  }

  .el-radio:hover {
    border-color: #18181b;
    background-color: #f8f9fa;
  }

  .el-radio.is-checked {
    border-color: #18181b;
    background-color: #f1f5f9;
  }

  .el-radio__label {
    font-size: 1rem;
    padding-left: 8px;
  }

  .el-button {
    width: 100%;
    height: 44px;
    font-size: 1rem;
    margin-top: 16px;
    border-radius: 10px;
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .preference-card {
    max-width: 800px;
  }

  .el-checkbox-group {
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
  }
}

@media (min-width: 1024px) {
  .preference-card {
    max-width: 1000px;
  }

  .el-checkbox-group {
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }

  .card-content {
    padding: 32px;
  }
}
</style>
