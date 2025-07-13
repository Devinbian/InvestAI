<template>
    <header class="modern-navbar">
        <div class="navbar-left" @click="handleGoHome">
            <img src="/logo.png" class="modern-logo" alt="InvestAI Logo" />
            <span class="app-title">智投小助</span>
        </div>
        <div class="navbar-right">
            <template v-if="userStore.isLoggedIn">
                <!-- PC端使用下拉菜单 -->
                <el-dropdown @command="handleCommand" class="pc-user-menu">
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
                            <el-dropdown-item command="records">记录中心</el-dropdown-item>
                            <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>

                <!-- 移动端使用头像按钮 -->
                <div class="mobile-user-avatar" @click="showMobileUserMenu">
                    {{ userStore.userInfo?.nickname?.charAt(0)?.toUpperCase() || 'U' }}
                </div>
            </template>
            <template v-else>
                <el-button class="modern-btn" @click="handleLogin(false)">登录</el-button>
                <el-button class="modern-btn" @click="handleLogin(true)">注册</el-button>
            </template>
        </div>
    </header>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useUserStore } from '../store/user';
import { ArrowDown } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// 定义事件
const emit = defineEmits([
    'show-login',
    'show-profile',
    'show-preferences',
    'show-records',
    'show-mobile-menu',
    'go-home'
]);

// 使用store和router
const userStore = useUserStore();
const router = useRouter();

// 处理登录按钮点击
const handleLogin = (isRegister) => {
    emit('show-login', isRegister);
};

// 处理用户菜单命令
const handleCommand = async (command) => {
    console.log('Menu command clicked:', command);
    switch (command) {
        case 'profile':
            emit('show-profile');
            break;
        case 'settings':
            emit('show-preferences');
            break;
        case 'records':
            emit('show-records');
            break;
        case 'logout':
            try {
                // 显示确认对话框
                await ElMessageBox.confirm(
                    '确定要退出登录吗？退出后将清除所有本地数据。',
                    '退出登录',
                    {
                        confirmButtonText: '确定退出',
                        cancelButtonText: '取消',
                        type: 'warning',
                        center: true
                    }
                );

                // 用户确认退出，执行退出操作
                // 如果用户未完成引导流程，保留引导状态
                const shouldClearOnboarding = userStore.onboardingStatus.completed;
                userStore.logout(shouldClearOnboarding);

                // 显示退出成功提示
                ElMessage.success('已成功退出登录');

                // 跳转到主页面（初始状态）
                await router.push('/');

                // 延迟刷新页面，确保完全重置状态
                setTimeout(() => {
                    window.location.reload();
                }, 500);

            } catch (error) {
                // 用户取消退出，不执行任何操作
                console.log('用户取消退出登录');
            }
            break;
    }
};

// 显示移动端用户菜单
const showMobileUserMenu = () => {
    emit('show-mobile-menu');
};

// 处理logo和标题点击，返回主页
const handleGoHome = async () => {
    try {
        // 如果当前已经在主页，发射事件让父组件处理状态重置
        if (router.currentRoute.value.name === 'Main') {
            emit('go-home');
            return;
        }

        // 导航到主页并发射事件
        await router.push('/');
        emit('go-home');
        
        // 可选：显示返回主页的提示
        // ElMessage.success('已返回主页');
        
    } catch (error) {
        console.error('导航到主页失败:', error);
    }
};
</script>

<style lang="scss" scoped>
@import '../styles/mixins/responsive';

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
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    box-sizing: border-box;
    overflow: hidden;

    // 移动端样式调整
    @include mobile-and-tablet {
        padding: 0 16px;
    }
}

.navbar-left {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: opacity 0.2s ease;
    
    &:hover {
        opacity: 0.8;
    }
    
    &:active {
        opacity: 0.6;
    }
}

.modern-logo {
    width: 36px;
    height: 36px;
    object-fit: contain;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.9);
    padding: 2px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    
    .navbar-left:hover & {
        transform: scale(1.05);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }
}

.app-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #18181b;
    letter-spacing: 0.5px;
    transition: color 0.2s ease;
    
    .navbar-left:hover & {
        color: #3b82f6;
    }
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

    &:hover {
        background: #f5f7fa;
    }
}

.modern-user {
    display: flex;
    align-items: center;
    font-weight: 500;
    cursor: pointer;
    outline: none !important;
    border: none !important;

    &:focus {
        outline: none !important;
        border: none !important;
        box-shadow: none !important;
    }
}

/* 移除Element Plus dropdown的focus样式 */
:deep(.el-dropdown) {
    outline: none !important;

    &:focus {
        outline: none !important;
        border: none !important;
        box-shadow: none !important;
    }

    .modern-user:focus {
        outline: none !important;
        border: none !important;
        box-shadow: none !important;
    }
}

/* PC端显示下拉菜单，隐藏移动端头像 */
.pc-user-menu {
    display: flex;

    // 移动端隐藏PC端菜单 - 使用768px断点保持一致性
    @media (max-width: 768px) {
        display: none !important;
    }
}

.mobile-user-avatar {
    display: none;

    // 移动端显示头像按钮 - 使用768px断点保持一致性
    @media (max-width: 768px) {
        display: flex !important;
        width: 32px !important;
        height: 32px !important;
        border-radius: 50% !important;
        background: #18181b !important;
        color: white !important;
        align-items: center !important;
        justify-content: center !important;
        font-weight: 600 !important;
        font-size: 0.8rem !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
        user-select: none !important;
        -webkit-tap-highlight-color: transparent !important;
        touch-action: manipulation !important;

        &:active {
            transform: scale(0.95) !important;
            background: #374151 !important;
        }

        &:hover {
            background: #374151 !important;
        }
    }

    // 触摸设备优化
    @include touch-device {
        &:hover {
            background: #18181b !important;
        }
    }
}
</style>
