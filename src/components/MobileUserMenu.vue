<template>
    <!-- 移动端用户菜单弹窗 -->
    <div class="mobile-user-menu-overlay" v-if="visible" @click="handleClose">
        <div class="mobile-user-menu-container" @click.stop>
            <!-- 用户信息头部 -->
            <div class="mobile-menu-header">
                <div class="mobile-menu-avatar">
                    {{ userInfo?.nickname?.charAt(0)?.toUpperCase() || 'U' }}
                </div>
                <div class="mobile-menu-user-info">
                    <h3>{{ userInfo?.nickname || '未设置昵称' }}</h3>
                    <p>{{ userInfo?.email || '未绑定邮箱' }}</p>
                </div>
            </div>

            <!-- 菜单项 -->
            <div class="mobile-menu-items">
                <div class="mobile-menu-item" @click="handleCommand('profile')">
                    <div class="menu-item-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor"
                                stroke-width="2" />
                            <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" />
                        </svg>
                    </div>
                    <span>个人中心</span>
                    <div class="menu-item-arrow">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" />
                        </svg>
                    </div>
                </div>

                <div class="mobile-menu-item" @click="handleCommand('settings')">
                    <div class="menu-item-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" stroke="currentColor" stroke-width="2" />
                            <path
                                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.04A1.65 1.65 0 0 0 21 9h.09a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09A1.65 1.65 0 0 0 19.4 15z"
                                stroke="currentColor" stroke-width="2" />
                        </svg>
                    </div>
                    <span>偏好设置</span>
                    <div class="menu-item-arrow">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" />
                        </svg>
                    </div>
                </div>

                <div class="mobile-menu-item" @click="handleCommand('records')">
                    <div class="menu-item-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor"
                                stroke-width="2" />
                            <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2" />
                            <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="2" />
                            <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="2" />
                            <polyline points="10,9 9,9 8,9" stroke="currentColor" stroke-width="2" />
                        </svg>
                    </div>
                    <span>记录中心</span>
                    <div class="menu-item-arrow">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" />
                        </svg>
                    </div>
                </div>

                <div class="mobile-menu-divider"></div>

                <div class="mobile-menu-item logout-item" @click="handleCommand('logout')">
                    <div class="menu-item-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" stroke-width="2" />
                            <polyline points="16,17 21,12 16,7" stroke="currentColor" stroke-width="2" />
                            <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" stroke-width="2" />
                        </svg>
                    </div>
                    <span>退出登录</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

// 定义 Props
const props = defineProps({
    // 是否显示菜单
    visible: {
        type: Boolean,
        default: false
    },
    // 用户信息
    userInfo: {
        type: Object,
        default: () => ({})
    }
});

// 定义事件
const emit = defineEmits([
    'close',
    'command'
]);

// 处理关闭菜单
const handleClose = () => {
    emit('close');
};

// 处理菜单命令
const handleCommand = async (command) => {
    // 先关闭菜单
    handleClose();

    // 稍作延迟，让关闭动画完成
    setTimeout(() => {
        emit('command', command);
    }, 200);
};
</script>

<style scoped>
/* 移动端用户菜单弹窗设计 */
.mobile-user-menu-overlay {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    background: rgba(0, 0, 0, 0.4) !important;
    z-index: 10101 !important;
    /* 用户菜单使用更高的z-index */
    display: flex !important;
    align-items: flex-end !important;
    justify-content: center !important;
    animation: fadeIn 0.2s ease-out !important;
}

.mobile-user-menu-container {
    width: 100% !important;
    max-width: 400px !important;
    background: #ffffff !important;
    border-radius: 16px 16px 0 0 !important;
    padding: 0 !important;
    margin: 0 8px 0 8px !important;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15) !important;
    animation: slideUpModal 0.3s ease-out !important;
    overflow: hidden !important;
}

/* 用户信息头部 */
.mobile-menu-header {
    padding: 20px 20px 16px 20px !important;
    background: linear-gradient(135deg, #18181b 0%, #374151 100%) !important;
    display: flex !important;
    align-items: center !important;
    gap: 12px !important;
}

.mobile-menu-avatar {
    width: 48px !important;
    height: 48px !important;
    border-radius: 50% !important;
    background: rgba(255, 255, 255, 0.2) !important;
    color: white !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-weight: 600 !important;
    font-size: 1.2rem !important;
    border: 2px solid rgba(255, 255, 255, 0.3) !important;
}

.mobile-menu-user-info {
    flex: 1 !important;
    min-width: 0 !important;
}

.mobile-menu-user-info h3 {
    color: white !important;
    font-size: 1.1rem !important;
    font-weight: 600 !important;
    margin: 0 0 4px 0 !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
}

.mobile-menu-user-info p {
    color: rgba(255, 255, 255, 0.8) !important;
    font-size: 0.85rem !important;
    margin: 0 !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
}

/* 菜单项 */
.mobile-menu-items {
    padding: 8px 0 20px 0 !important;
}

.mobile-menu-item {
    display: flex !important;
    align-items: center !important;
    padding: 16px 20px !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    border-bottom: 1px solid #f1f5f9 !important;
    user-select: none !important;
    -webkit-tap-highlight-color: transparent !important;
    touch-action: manipulation !important;
}

.mobile-menu-item:hover,
.mobile-menu-item:active {
    background: #f8fafc !important;
}

.mobile-menu-item:last-child {
    border-bottom: none !important;
}

.menu-item-icon {
    width: 20px !important;
    height: 20px !important;
    margin-right: 16px !important;
    color: #6b7280 !important;
    flex-shrink: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
}

.mobile-menu-item span {
    flex: 1 !important;
    font-size: 0.95rem !important;
    font-weight: 500 !important;
    color: #18181b !important;
}

.menu-item-arrow {
    width: 16px !important;
    height: 16px !important;
    color: #9ca3af !important;
    flex-shrink: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
}

/* 分割线 */
.mobile-menu-divider {
    height: 8px !important;
    background: #f8fafc !important;
    border-top: 1px solid #f1f5f9 !important;
    border-bottom: 1px solid #f1f5f9 !important;
    margin: 8px 0 !important;
}

/* 退出登录项特殊样式 */
.logout-item {
    border-bottom: none !important;
}

.logout-item .menu-item-icon {
    color: #ef4444 !important;
}

.logout-item span {
    color: #ef4444 !important;
}

.logout-item:hover,
.logout-item:active {
    background: #fef2f2 !important;
}

/* 动画效果 */
@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

@keyframes slideUpModal {
    from {
        opacity: 0;
        transform: translateY(100%);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
