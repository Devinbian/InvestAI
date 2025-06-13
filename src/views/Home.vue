<template>
  <div class="home-container">
    <el-card class="welcome-card">
      <template #header>
        <div class="card-header">
          <h2>欢迎使用股票智能投资助手</h2>
          <div class="user-info" v-if="userStore.isLoggedIn">
            <el-dropdown @command="handleCommand">
              <span class="user-dropdown">
                {{ userStore.userInfo.nickname }}
                <el-icon>
                  <ArrowDown />
                </el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                  <el-dropdown-item command="settings">设置</el-dropdown-item>
                  <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
          <el-button v-else type="text" @click="goToLogin">登录</el-button>
        </div>
      </template>
      <div class="card-content">
        <p>请选择您的使用模式：</p>
        <div class="mode-selection">
          <el-button type="primary" @click="startQuickExperience">
            快速体验
          </el-button>
          <el-button type="success" @click="startPersonalizedSetup">
            个性化设置
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useUserStore } from '../store/user';
import { ArrowDown } from '@element-plus/icons-vue';
import { ElMessageBox } from 'element-plus';

const router = useRouter();
const userStore = useUserStore();

const startQuickExperience = () => {
  router.push('/main');
};

const startPersonalizedSetup = () => {
  if (!userStore.isLoggedIn) {
    ElMessageBox.confirm(
      '个性化设置需要登录账号，是否立即登录？',
      '提示',
      {
        confirmButtonText: '去登录',
        cancelButtonText: '取消',
        type: 'info'
      }
    ).then(() => {
      router.push('/login');
    }).catch(() => { });
    return;
  }
  router.push('/risk-assessment');
};

const goToLogin = () => {
  router.push('/login');
};

const handleCommand = (command) => {
  switch (command) {
    case 'profile':
      // TODO: 跳转到个人中心
      break;
    case 'settings':
      // TODO: 跳转到设置页面
      break;
    case 'logout':
      userStore.logout();
      router.push('/');
      break;
  }
};
</script>

<style scoped>
.home-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
}

.welcome-card {
  width: 100%;
  max-width: 600px;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  color: #1a237e;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-dropdown {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #1a237e;
}

.user-dropdown .el-icon {
  margin-left: 4px;
}

.card-content {
  text-align: center;
  padding: 20px 0;
}

.mode-selection {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 20px;
}

.mode-selection .el-button {
  padding: 12px 24px;
  font-size: 16px;
}
</style>
