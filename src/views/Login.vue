<template>
    <div class="login-container">
        <div class="login-content">
            <div class="login-left">
                <div class="brand">
                    <img src="/logo.png" alt="InvestAI Logo" class="logo" />
                    <h1>股票智能投资助手</h1>
                    <p class="slogan">AI驱动的智能投资决策平台</p>
                </div>
                <div class="features">
                    <div class="feature-item">
                        <el-icon>
                            <DataAnalysis />
                        </el-icon>
                        <span>智能分析</span>
                    </div>
                    <div class="feature-item">
                        <el-icon>
                            <TrendCharts />
                        </el-icon>
                        <span>实时行情</span>
                    </div>
                    <div class="feature-item">
                        <el-icon>
                            <Connection />
                        </el-icon>
                        <span>个性化推荐</span>
                    </div>
                </div>
            </div>
            <div class="login-right">
                <div class="login-form">
                    <h2>欢迎回来</h2>
                    <p class="subtitle">请登录您的账号</p>
                    <el-form :model="form" :rules="rules" ref="loginForm">
                        <el-form-item prop="username">
                            <el-input v-model="form.username" placeholder="用户名" :prefix-icon="User" />
                        </el-form-item>
                        <el-form-item prop="password">
                            <el-input v-model="form.password" type="password" placeholder="密码" :prefix-icon="Lock"
                                show-password />
                        </el-form-item>
                        <div class="remember-forgot">
                            <el-checkbox v-model="form.remember">记住我</el-checkbox>
                            <el-link type="primary">忘记密码？</el-link>
                        </div>
                        <el-button type="primary" class="login-button" @click="handleLogin">
                            登录
                        </el-button>
                        <div class="register-link">
                            还没有账号？ <el-link type="primary">立即注册</el-link>
                        </div>
                    </el-form>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { User, Lock, DataAnalysis, TrendCharts, Connection } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useUserStore } from '../store/user';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const loginForm = ref(null);

const form = reactive({
    username: '',
    password: '',
    remember: false
});

const rules = {
    username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
    ]
};

const handleLogin = async () => {
    if (!loginForm.value) return;

    await loginForm.value.validate((valid) => {
        if (valid) {
            // 模拟登录成功
            const token = 'mock-token-' + Date.now();
            const userInfo = {
                username: form.username,
                nickname: '测试用户'
            };

            userStore.setToken(token);
            userStore.setUserInfo(userInfo);

            ElMessage.success('登录成功');

            // 如果有重定向地址，则跳转到该地址
            const redirect = route.query.redirect || '/';
            router.push(redirect);
        }
    });
};
</script>

<style scoped>
.login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #1a237e 0%, #0d47a1 100%);
    padding: 20px;
}

.login-content {
    display: flex;
    background: white;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
    width: 1000px;
    max-width: 100%;
    min-height: 600px;
}

.login-left {
    flex: 1;
    padding: 40px;
    background: linear-gradient(135deg, #1a237e 0%, #0d47a1 100%);
    color: white;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.brand {
    text-align: center;
}

.logo {
    width: 80px;
    height: 80px;
    margin-bottom: 20px;
    object-fit: contain;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.95);
    padding: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.slogan {
    opacity: 0.8;
    margin-top: 10px;
}

.features {
    margin-top: 40px;
}

.feature-item {
    display: flex;
    align-items: center;
    margin: 20px 0;
    font-size: 16px;
}

.feature-item .el-icon {
    margin-right: 10px;
    font-size: 24px;
}

.login-right {
    flex: 1;
    padding: 40px;
    display: flex;
    align-items: center;
}

.login-form {
    width: 100%;
    max-width: 360px;
    margin: 0 auto;
}

.login-form h2 {
    margin-bottom: 10px;
    color: #1a237e;
}

.subtitle {
    color: #666;
    margin-bottom: 30px;
}

.remember-forgot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.login-button {
    width: 100%;
    padding: 12px;
    font-size: 16px;
    margin-bottom: 20px;
}

.register-link {
    text-align: center;
    color: #666;
}

/* 平板端适配 (768px - 1024px) */
@media (max-width: 1024px) {
    .login-content {
        width: 90%;
        max-width: 800px;
    }

    .login-left,
    .login-right {
        padding: 30px;
    }

    .logo {
        width: 60px;
        height: 60px;
    }

    .brand h1 {
        font-size: 20px;
    }

    .features {
        margin-top: 30px;
    }

    .feature-item {
        margin: 15px 0;
        font-size: 14px;
    }

    .feature-item .el-icon {
        font-size: 20px;
    }
}

/* 手机端适配 (小于768px) */
@media (max-width: 768px) {
    .login-container {
        padding: 10px;
        align-items: flex-start;
        padding-top: 15px;
    }

    .login-content {
        flex-direction: column;
        width: 100%;
        max-width: 400px;
        border-radius: 15px;
        min-height: auto;
    }

    .login-left {
        padding: 20px 20px 15px 20px;
        min-height: auto;
    }

    .brand {
        margin-bottom: 0;
    }

    .brand h1 {
        font-size: 18px;
        margin-bottom: 4px;
    }

    .slogan {
        font-size: 14px;
        margin-top: 4px;
    }

    .logo {
        width: 45px;
        height: 45px;
        margin-bottom: 12px;
    }

    .features {
        display: none;
        /* 在手机端隐藏功能列表以节省空间 */
    }

    .login-right {
        padding: 16px 20px 20px 20px;
    }

    .login-form {
        max-width: 100%;
    }

    .login-form h2 {
        font-size: 20px;
        text-align: center;
        margin-bottom: 8px;
    }

    .subtitle {
        text-align: center;
        font-size: 14px;
        margin-bottom: 20px;
    }

    .remember-forgot {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
        margin-bottom: 20px;
    }

    .login-button {
        padding: 14px;
        font-size: 16px;
        border-radius: 8px;
        margin-bottom: 16px;
    }

    .register-link {
        font-size: 14px;
    }
}

/* 超小屏幕适配 (小于480px) */
@media (max-width: 480px) {
    .login-container {
        padding: 5px;
    }

    .login-content {
        border-radius: 10px;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
    }

    .login-left {
        padding: 20px 15px 15px 15px;
    }

    .login-right {
        padding: 15px;
    }

    .brand h1 {
        font-size: 16px;
    }

    .slogan {
        font-size: 12px;
    }

    .logo {
        width: 40px;
        height: 40px;
        margin-bottom: 10px;
    }

    .login-form h2 {
        font-size: 18px;
    }

    .subtitle {
        font-size: 13px;
    }
}

/* 横屏手机适配 */
@media (max-height: 600px) and (max-width: 768px) {
    .login-container {
        align-items: center;
        padding: 10px;
    }

    .login-content {
        flex-direction: row;
        max-width: 90%;
        width: auto;
    }

    .login-left {
        flex: 0.8;
        padding: 20px;
    }

    .brand h1 {
        font-size: 16px;
    }

    .slogan {
        font-size: 12px;
    }

    .logo {
        width: 40px;
        height: 40px;
        margin-bottom: 10px;
    }

    .features {
        display: none;
    }

    .login-right {
        flex: 1.2;
        padding: 20px;
    }

    .login-form h2 {
        font-size: 18px;
        margin-bottom: 8px;
    }

    .subtitle {
        font-size: 13px;
        margin-bottom: 20px;
    }
}
</style>
