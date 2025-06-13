<template>
    <div class="main-modern">
        <!-- 顶部导航栏 -->
        <header class="modern-navbar">
            <div class="navbar-left">
                <img src="../assets/logo.svg" class="modern-logo" alt="logo" />
            </div>
            <div class="navbar-right">
                <template v-if="userStore.isLoggedIn">
                    <el-dropdown @command="handleCommand">
                        <span class="modern-user">
                            {{ userStore.userInfo.nickname }}
                            <el-icon>
                                <ArrowDown />
                            </el-icon>
                        </span>
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                                <el-dropdown-item command="settings">偏好设置</el-dropdown-item>
                                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                </template>
                <template v-else>
                    <el-button class="modern-btn" @click="showLoginDialog">登录</el-button>
                    <el-button class="modern-btn" type="primary" @click="showLoginDialog">注册</el-button>
                </template>
            </div>
        </header>

        <!-- 主体内容 -->
        <main class="modern-content" :class="{ 'chatting': chatHistory.length > 0 || inputMessage.trim() }">
            <!-- 初始状态：标题、描述和输入区域作为一个整体 -->
            <div class="center-container" v-if="!(chatHistory.length > 0 || inputMessage.trim())">
                <div class="welcome-section">
                    <div class="modern-title">我能帮你做什么？</div>
                    <div class="modern-desc">请输入您的投资问题或需求，智能助手将为您提供专业建议</div>
                </div>

                <div class="ai-card">
                    <div class="ai-input-row">
                        <el-input v-model="inputMessage" class="ai-input" type="textarea"
                            :autosize="{ minRows: 2, maxRows: 6 }" placeholder="如：帮我分析一下科技行业的龙头股..."
                            @keyup.enter.ctrl="sendMessage" clearable maxlength="500" show-word-limit />
                        <div class="ai-buttons">
                            <el-button class="ai-func-btn" circle @click="onVoiceClick">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke="#888"
                                        stroke-width="2" fill="none" />
                                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="#888" stroke-width="2" fill="none" />
                                    <line x1="12" y1="19" x2="12" y2="23" stroke="#888" stroke-width="2" />
                                    <line x1="8" y1="23" x2="16" y2="23" stroke="#888" stroke-width="2" />
                                </svg>
                            </el-button>
                            <el-dropdown trigger="click">
                                <el-button class="ai-func-btn" circle>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="3" stroke="#888" stroke-width="2" />
                                        <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="#888" stroke-width="2" />
                                    </svg>
                                </el-button>
                                <template #dropdown>
                                    <el-dropdown-menu>
                                        <el-dropdown-item>智能选股</el-dropdown-item>
                                        <el-dropdown-item>行业分析</el-dropdown-item>
                                        <el-dropdown-item>投资计划</el-dropdown-item>
                                        <el-dropdown-item>风险评估</el-dropdown-item>
                                    </el-dropdown-menu>
                                </template>
                            </el-dropdown>
                            <el-button class="ai-send-btn" type="primary" circle @click="sendMessage"
                                :disabled="!inputMessage.trim()">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <line x1="22" y1="2" x2="11" y2="13" stroke="white" stroke-width="2" />
                                    <polygon points="22,2 15,22 11,13 2,9 22,2" stroke="white" stroke-width="2"
                                        fill="white" />
                                </svg>
                            </el-button>
                        </div>
                    </div>
                </div>

                <div class="ai-suggestions">
                    <el-button class="ai-suggestion-btn" @click="inputMessage = '帮我推荐几只低风险的科技股'">推荐低风险科技股</el-button>
                    <el-button class="ai-suggestion-btn" @click="inputMessage = '分析一下当前热门行业'">分析热门行业</el-button>
                    <el-button class="ai-suggestion-btn" @click="inputMessage = '帮我制定投资计划'">制定投资计划</el-button>
                </div>
            </div>

            <!-- 聊天历史区域 -->
            <div class="chat-history-area" v-if="chatHistory.length" ref="chatHistoryRef">
                <div v-for="(message, idx) in chatHistory" :key="idx" :class="['chat-message', message.role]">
                    <div class="chat-message-content">{{ message.content }}</div>
                </div>
            </div>
        </main>

        <!-- 底部输入区域（仅在聊天状态显示） -->
        <div class="input-area" v-if="chatHistory.length > 0 || inputMessage.trim()">
            <!-- 新聊天按钮 -->
            <div class="new-chat-section" v-if="chatHistory.length > 0">
                <el-button class="new-chat-btn" @click="createNewChat">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M12 5v14m-7-7h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" />
                    </svg>
                    新建聊天
                </el-button>
            </div>

            <div class="ai-card">
                <div class="ai-input-row">
                    <el-input v-model="inputMessage" class="ai-input" type="textarea"
                        :autosize="{ minRows: 2, maxRows: 6 }" placeholder="如：帮我分析一下科技行业的龙头股..."
                        @keyup.enter.ctrl="sendMessage" clearable maxlength="500" show-word-limit />
                    <div class="ai-buttons">
                        <el-button class="ai-func-btn" circle @click="onVoiceClick">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke="#888"
                                    stroke-width="2" fill="none" />
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="#888" stroke-width="2" fill="none" />
                                <line x1="12" y1="19" x2="12" y2="23" stroke="#888" stroke-width="2" />
                                <line x1="8" y1="23" x2="16" y2="23" stroke="#888" stroke-width="2" />
                            </svg>
                        </el-button>
                        <el-dropdown trigger="click">
                            <el-button class="ai-func-btn" circle>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="3" stroke="#888" stroke-width="2" />
                                    <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="#888" stroke-width="2" />
                                </svg>
                            </el-button>
                            <template #dropdown>
                                <el-dropdown-menu>
                                    <el-dropdown-item>智能选股</el-dropdown-item>
                                    <el-dropdown-item>行业分析</el-dropdown-item>
                                    <el-dropdown-item>投资计划</el-dropdown-item>
                                    <el-dropdown-item>风险评估</el-dropdown-item>
                                </el-dropdown-menu>
                            </template>
                        </el-dropdown>
                        <el-button class="ai-send-btn" type="primary" circle @click="sendMessage"
                            :disabled="!inputMessage.trim()">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <line x1="22" y1="2" x2="11" y2="13" stroke="white" stroke-width="2" />
                                <polygon points="22,2 15,22 11,13 2,9 22,2" stroke="white" stroke-width="2"
                                    fill="white" />
                            </svg>
                        </el-button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 登录对话框 -->
        <el-dialog v-model="loginDialogVisible" title="登录" width="400px" :show-close="false"
            :close-on-click-modal="false">
            <el-form :model="loginForm" :rules="loginRules" ref="loginFormRef">
                <el-form-item prop="username">
                    <el-input v-model="loginForm.username" placeholder="用户名" :prefix-icon="User" />
                </el-form-item>
                <el-form-item prop="password">
                    <el-input v-model="loginForm.password" type="password" placeholder="密码" :prefix-icon="Lock"
                        show-password />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="loginDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="handleLogin">登录</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, watch } from 'vue';
import { useUserStore } from '../store/user';
import { User, Lock, ArrowDown } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { mockApi } from '../api/mock';

const userStore = useUserStore();
const inputMessage = ref('');
const chatHistory = ref([]);
const chatHistoryRef = ref(null);

// 登录相关
const loginDialogVisible = ref(false);
const loginFormRef = ref(null);
const loginForm = reactive({
    username: '',
    password: ''
});
const loginRules = {
    username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
    ]
};

const showLoginDialog = () => {
    loginDialogVisible.value = true;
};

const handleLogin = async () => {
    if (!loginFormRef.value) return;
    await loginFormRef.value.validate((valid) => {
        if (valid) {
            const token = 'mock-token-' + Date.now();
            const userInfo = {
                username: loginForm.username,
                nickname: '测试用户'
            };
            userStore.setToken(token);
            userStore.setUserInfo(userInfo);
            ElMessage.success('登录成功');
            loginDialogVisible.value = false;
        }
    });
};

const handleCommand = (command) => {
    switch (command) {
        case 'profile':
            break;
        case 'settings':
            break;
        case 'logout':
            userStore.logout();
            break;
    }
};

const sendMessage = async () => {
    if (!inputMessage.value.trim()) return;
    const message = inputMessage.value;
    inputMessage.value = '';
    const res = await mockApi.sendMessage(message);
    chatHistory.value.push(
        { role: 'user', content: message },
        res.data
    );
    await nextTick();
    scrollToBottom();
};

const scrollToBottom = () => {
    if (chatHistoryRef.value) {
        chatHistoryRef.value.scrollTop = chatHistoryRef.value.scrollHeight;
    }
};

const createNewChat = () => {
    chatHistory.value = [];
    inputMessage.value = '';
    ElMessage.success('已创建新聊天');
};

watch(chatHistory, () => {
    nextTick(() => {
        scrollToBottom();
    });
}, { deep: true });

const onVoiceClick = () => {
    ElMessage.info('语音输入功能开发中...');
};

onMounted(() => {
    scrollToBottom();
});
</script>

<style scoped>
.main-modern {
    min-height: 100vh;
    background: #fafbfc;
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
    overflow-y: hidden;
}

.modern-navbar {
    width: 100%;
    max-width: 100vw;
    height: 56px;
    background: #fff;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 32px;
    position: sticky;
    top: 0;
    z-index: 10;
    box-sizing: border-box;
    overflow: hidden;
}

.navbar-left {
    display: flex;
    align-items: center;
}

.modern-logo {
    width: 36px;
    height: 36px;
}

.navbar-right {
    display: flex;
    align-items: center;
    gap: 12px;
}

.modern-btn {
    border-radius: 20px;
    font-weight: 500;
    background: #fff;
    border: 1px solid #e0e0e0;
    box-shadow: none;
    padding: 6px 20px;
    transition: background 0.2s;
}

.modern-btn:hover {
    background: #f5f7fa;
}

.modern-user {
    display: flex;
    align-items: center;
    font-weight: 500;
    cursor: pointer;
}

.modern-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0 32px;
    max-width: 800px;
    margin: 0 auto;
    width: 100vw;
    box-sizing: border-box;
    transition: justify-content 0.3s;
    overflow-y: auto;
    min-height: 0;
}

.modern-content.chatting {
    justify-content: flex-start;
    padding-top: 32px;
    padding-bottom: 200px;
}

.center-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 700px;
}

.welcome-section {
    text-align: center;
    margin-bottom: 40px;
}

.modern-title {
    font-size: 2.8rem;
    font-weight: 800;
    color: #18181b;
    margin-bottom: 12px;
    letter-spacing: -1px;
}

.modern-desc {
    font-size: 1.1rem;
    color: #888;
    margin-bottom: 32px;
}

.chat-history-area {
    width: 100%;
    max-width: 700px;
    margin: 0 auto;
    padding: 20px 0;
}

.chat-message {
    display: flex;
    margin-bottom: 20px;
}

.chat-message.user .chat-message-content {
    background: #007bff;
    color: white;
    border-radius: 18px 18px 4px 18px;
    padding: 12px 18px;
    margin-left: auto;
    max-width: 70%;
    font-size: 1rem;
    line-height: 1.4;
}

.chat-message.assistant .chat-message-content {
    background: #f1f3f4;
    color: #18181b;
    border-radius: 18px 18px 18px 4px;
    padding: 12px 18px;
    margin-right: auto;
    max-width: 70%;
    font-size: 1rem;
    line-height: 1.4;
}

.input-area {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: #fff;
    border-top: 1px solid #f0f0f0;
    padding: 20px 32px 32px 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 5;
    transition: all 0.3s;
}

.new-chat-section {
    width: 100%;
    max-width: 700px;
    margin-bottom: 16px;
    display: flex;
    justify-content: center;
}

.new-chat-btn {
    border-radius: 20px;
    background: #f5f7fa;
    color: #18181b;
    font-weight: 500;
    border: 1px solid #e0e0e0;
    box-shadow: none;
    padding: 8px 20px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.95rem;
}

.new-chat-btn:hover {
    background: #e6e8eb;
    border-color: #d0d0d0;
}

.ai-card {
    width: 100%;
    max-width: 700px;
    margin: 0 auto;
    background: #fff;
    border-radius: 24px;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.08);
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    position: relative;
    z-index: 2;
}

.ai-input-row {
    display: flex;
    align-items: flex-end;
    background: #f8f9fa;
    border-radius: 20px;
    box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.04);
    padding: 16px 20px;
    gap: 12px;
}

.ai-input {
    flex: 1;
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
    font-size: 1.1rem;
    resize: none;
}

.ai-buttons {
    display: flex;
    align-items: flex-end;
    gap: 8px;
}

.ai-func-btn {
    border-radius: 50%;
    width: 44px;
    height: 44px;
    min-width: 44px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    box-shadow: none;
    background: #f0f0f0;
    border: none;
    color: #888;
    transition: background 0.2s;
}

.ai-func-btn:hover {
    background: #e0e0e0;
}

.ai-send-btn {
    border-radius: 50%;
    width: 44px;
    height: 44px;
    min-width: 44px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    box-shadow: none;
}

.ai-send-btn svg {
    display: block;
}

.ai-suggestions {
    display: flex;
    gap: 12px;
    margin-top: 16px;
    flex-wrap: wrap;
    justify-content: center;
}

.ai-suggestion-btn {
    border-radius: 20px;
    background: #f5f7fa;
    color: #18181b;
    font-weight: 500;
    border: none;
    box-shadow: none;
    padding: 8px 20px;
    transition: background 0.2s;
    font-size: 0.95rem;
}

.ai-suggestion-btn:hover {
    background: #e6e8eb;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

html,
body {
    width: 100vw;
    min-height: 100vh;
    overflow-x: hidden !important;
}

:deep(.el-textarea__inner) {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    font-size: 1.1rem !important;
    resize: none !important;
    padding: 0 !important;
}

:deep(.el-input__wrapper) {
    box-shadow: none !important;
    border: none !important;
    background: transparent !important;
    padding: 0 !important;
}

:deep(.el-input__inner) {
    background: transparent !important;
    font-size: 1.1rem;
}

:deep(.el-dialog) {
    border-radius: 18px;
}

:deep(.el-form-item__content) {
    align-items: center;
}
</style>
