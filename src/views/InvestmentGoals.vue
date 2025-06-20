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
            <el-input-number v-model="form.investmentAmount" :min="1000" :max="1000000" :step="1000" />
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
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useUserConfigStore } from '../store/userConfig';

const router = useRouter();
const userConfig = useUserConfigStore();
const form = reactive({
  expectedReturn: '',
  investmentAmount: 10000,
  strategy: ''
});

const submitGoals = () => {
  userConfig.setInvestmentGoals({ ...form });
  router.push('/main');
};
</script>

<style scoped>
.investment-goals-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 16px;
}

.goals-card {
  width: 100%;
  max-width: 1000px;
}

.card-header {
  text-align: center;
}

.card-content {
  padding: 24px;
}

.el-button[type="primary"] {
  background-color: #18181b !important;
  border-color: #18181b !important;
}

.el-button[type="primary"]:hover {
  background-color: #000000 !important;
  border-color: #000000 !important;
}

.el-radio.is-checked .el-radio__input .el-radio__inner {
  background-color: #18181b !important;
  border-color: #18181b !important;
}

.el-radio:hover .el-radio__input .el-radio__inner {
  border-color: #18181b !important;
}

/* 移动端响应式优化 - 充分利用屏幕空间 */
@media (max-width: 767px) {
  .investment-goals-container {
    padding: 8px;
    min-height: 100vh;
  }

  .goals-card {
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
    width: 100% !important;
    text-align: left;
  }

  .el-form-item__content {
    margin-left: 0 !important;
  }

  .el-radio-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }

  .el-radio {
    margin: 0;
    padding: 14px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 10px;
    transition: all 0.2s ease;
    width: 100%;
    display: flex;
    align-items: center;
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
    flex: 1;
  }

  .el-input-number {
    width: 100%;
  }

  .el-input-number .el-input__inner {
    height: 44px;
    font-size: 1rem;
    text-align: left;
  }

  .el-select {
    width: 100%;
  }

  .el-select .el-input__inner {
    height: 44px;
    font-size: 1rem;
  }

  .el-button {
    width: 100%;
    height: 44px;
    font-size: 1rem;
    margin-top: 16px;
    border-radius: 10px;
  }

  /* 表单项特殊样式 */
  .el-form-item:has(.el-input-number) .el-form-item__content {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .el-input-number__decrease,
  .el-input-number__increase {
    width: 36px;
    height: 36px;
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .goals-card {
    max-width: 800px;
  }

  .el-form-item__label {
    width: 140px !important;
  }
}

@media (min-width: 1024px) {
  .goals-card {
    max-width: 1000px;
  }

  .card-content {
    padding: 32px;
  }

  .el-form-item__label {
    width: 160px !important;
  }
}
</style>
