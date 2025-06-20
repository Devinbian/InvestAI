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
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useUserConfigStore } from '../store/userConfig';

const router = useRouter();
const userConfig = useUserConfigStore();
const form = reactive({
  experience: '',
  goal: '',
  maxLoss: ''
});

const submitAssessment = () => {
  userConfig.setRiskProfile({ ...form });
  router.push('/industry-preference');
};
</script>

<style scoped>
.risk-assessment-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 16px;
}

.assessment-card {
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
  .risk-assessment-container {
    padding: 8px;
    min-height: 100vh;
  }

  .assessment-card {
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

  .el-button {
    width: 100%;
    height: 44px;
    font-size: 1rem;
    margin-top: 16px;
    border-radius: 10px;
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .assessment-card {
    max-width: 800px;
  }

  .el-form-item__label {
    width: 160px !important;
  }
}

@media (min-width: 1024px) {
  .assessment-card {
    max-width: 1000px;
  }

  .card-content {
    padding: 32px;
  }

  .el-form-item__label {
    width: 180px !important;
  }
}
</style>
