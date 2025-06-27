<template>
    <div class="shortcuts-bar" v-if="showShortcuts">
        <!-- PC端快捷操作栏（初始模式） -->
        <div class="ai-suggestions" v-if="mode === 'initial' && !isMobileView">
            <div class="suggestion-row">
                <el-button v-for="shortcut in activeShortcuts" :key="shortcut.id" class="ai-suggestion-btn"
                    @click="handleShortcutClick(shortcut)">
                    <span class="btn-icon">{{ shortcut.icon }}</span>
                    {{ shortcut.title }}
                </el-button>
                <!-- 自定义按钮 - 低调样式 -->
                <button class="customize-btn-inline" @click="openCustomizeDialog" title="自定义快捷操作">
                    <span class="customize-icon">⚙️</span>
                </button>
            </div>
        </div>

        <!-- PC端快捷操作栏（聊天模式下显示在输入框上方） -->
        <div class="chat-shortcuts pc-shortcuts" v-if="mode === 'chat' && showChatShortcuts && !isMobileView">
            <div class="shortcuts-grid">
                <el-button v-for="shortcut in activeShortcuts" :key="shortcut.id" class="chat-shortcut-btn"
                    @click="handleShortcutClick(shortcut)">
                    <span class="btn-icon">{{ shortcut.icon }}</span>
                    <span class="btn-text">{{ shortcut.shortTitle || shortcut.title }}</span>
                </el-button>
                <el-button class="chat-shortcut-btn customize-btn-chat" @click="openCustomizeDialog">
                    <span class="btn-icon">⚙️</span>
                    <span class="btn-text">设置</span>
                </el-button>
                <el-button class="chat-shortcut-btn close-btn" @click="toggleChatShortcuts">
                    <span class="btn-icon">✕</span>
                    <span class="btn-text">收起</span>
                </el-button>
            </div>
        </div>

        <!-- 移动端快捷操作栏（独立显示） -->
        <div class="mobile-shortcuts-overlay" v-if="showChatShortcuts && isMobileView" @click="toggleChatShortcuts">
            <div class="mobile-shortcuts-container" @click.stop>
                <!-- 快捷操作按钮 -->
                <div class="shortcuts-main-grid">
                    <el-button v-for="shortcut in activeShortcuts" :key="shortcut.id" class="shortcut-btn-mobile"
                        @click="handleShortcutClick(shortcut)">
                        {{ shortcut.shortTitle || shortcut.title }}
                    </el-button>
                </div>

                <!-- 底部操作按钮 -->
                <div class="shortcuts-bottom-actions">
                    <el-button class="action-btn add-btn" @click="openCustomizeDialog">
                        <span class="add-icon">+</span>
                        添加
                    </el-button>
                    <el-button class="action-btn close-btn" @click="toggleChatShortcuts">
                        收起
                    </el-button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';

// Props定义
const props = defineProps({
    // 显示模式：'initial' | 'chat'
    mode: {
        type: String,
        default: 'initial',
        validator: (value) => ['initial', 'chat'].includes(value)
    },
    // 是否显示快捷操作栏
    showShortcuts: {
        type: Boolean,
        default: true
    },
    // 是否显示聊天快捷操作（仅在chat模式下有效）
    showChatShortcuts: {
        type: Boolean,
        default: false
    },
    // 是否为移动端视图
    isMobileView: {
        type: Boolean,
        default: false
    },
    // 是否已登录
    isLoggedIn: {
        type: Boolean,
        default: false
    }
});

// Emits定义
const emit = defineEmits([
    'shortcut-click',
    'customize-dialog-open',
    'toggle-chat-shortcuts',
    'shortcuts-updated'
]);

// 默认快捷操作配置
const defaultShortcuts = ref([
    {
        id: 'smart_review',
        icon: '📊',
        title: '智能复盘',
        shortTitle: '复盘',
        description: '智能分析市场表现和投资策略',
        action: 'smart_review',
        isDefault: true,
        isActive: true
    },
    {
        id: 'watchlist',
        icon: '⭐',
        title: '自选股',
        shortTitle: '自选',
        description: '查看和管理我的自选股票',
        action: 'watchlist',
        isDefault: true,
        isActive: true
    },
    {
        id: 'smart_recommendation',
        icon: '📈',
        title: '智能荐股',
        shortTitle: '荐股',
        description: '基于AI算法推荐优质股票',
        action: 'smart_recommendation',
        isDefault: true,
        isActive: true
    },
    {
        id: 'news_update',
        icon: '📄',
        title: '资讯推送',
        shortTitle: '资讯',
        description: '获取最新市场资讯和重要公告',
        action: 'news_update',
        isDefault: true,
        isActive: true
    },
    {
        id: 'asset_analysis',
        icon: '💼',
        title: '我的资产',
        shortTitle: '资产',
        description: '查看投资组合和账户分析',
        action: 'asset_analysis',
        isDefault: true,
        isActive: true
    }
]);

// 当前激活的快捷操作
const activeShortcuts = ref([]);

// 初始化快捷操作
const initializeShortcuts = () => {
    const result = [];

    // 加载默认快捷操作状态
    const savedStates = localStorage.getItem('defaultShortcutStates');
    const states = savedStates ? JSON.parse(savedStates) : {};

    // 添加激活的默认快捷操作
    const activeDefaultShortcuts = defaultShortcuts.value.filter(s => {
        if (states.hasOwnProperty(s.id)) {
            s.isActive = states[s.id];
        }
        return s.isActive;
    });
    result.push(...activeDefaultShortcuts);

    // 添加激活的自定义快捷操作
    const savedCustomShortcuts = localStorage.getItem('customShortcuts');
    if (savedCustomShortcuts) {
        const customShortcuts = JSON.parse(savedCustomShortcuts);
        const activeCustomShortcuts = customShortcuts
            .filter(s => s.isActive)
            .map(shortcut => ({
                ...shortcut,
                action: 'custom'
            }));
        result.push(...activeCustomShortcuts);
    }

    activeShortcuts.value = result;
};

// 快捷操作点击处理
const handleShortcutClick = (shortcut) => {
    console.log('🚀 ShortcutsBar - 点击快捷操作:', shortcut);

    try {
        // 发送事件给父组件处理
        emit('shortcut-click', shortcut);
    } catch (error) {
        console.error('ShortcutsBar - 执行快捷操作失败:', error);
        ElMessage.error('执行快捷操作时发生错误');
    }
};

// 打开自定义对话框
const openCustomizeDialog = () => {
    emit('customize-dialog-open');
};

// 切换聊天快捷操作显示状态
const toggleChatShortcuts = () => {
    emit('toggle-chat-shortcuts');
};

// 处理快捷操作更新
const handleShortcutsUpdated = () => {
    initializeShortcuts();
    emit('shortcuts-updated');
};

// 监听props变化，重新初始化快捷操作
watch(() => props.isLoggedIn, () => {
    initializeShortcuts();
}, { immediate: false });

// 组件挂载时初始化
onMounted(() => {
    initializeShortcuts();
});

// 暴露方法给父组件
defineExpose({
    initializeShortcuts,
    handleShortcutsUpdated
});
</script>

<style scoped>
/* 快捷操作栏基础样式 */
.shortcuts-bar {
    width: 100%;
}

/* PC端初始模式快捷操作样式 */
.ai-suggestions {
    margin-top: 24px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.suggestion-row {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
    justify-content: center;
}

.ai-suggestion-btn {
    height: 44px;
    padding: 0 20px;
    border-radius: 22px;
    border: 1px solid #e5e7eb;
    background: white;
    color: #374151;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.ai-suggestion-btn:hover {
    border-color: #3b82f6;
    color: #3b82f6;
    background: #f8faff;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.ai-suggestion-btn .btn-icon {
    font-size: 16px;
}

/* 自定义按钮样式 */
.customize-btn-inline {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 1px solid #e5e7eb;
    background: white;
    color: #9ca3af;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.customize-btn-inline:hover {
    border-color: #6b7280;
    color: #374151;
    background: #f9fafb;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.customize-icon {
    font-size: 16px;
}

/* PC端聊天模式快捷操作样式 */
.chat-shortcuts.pc-shortcuts {
    margin-bottom: 16px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    border: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.shortcuts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 12px;
    max-width: 100%;
}

.chat-shortcut-btn {
    height: 48px;
    padding: 0 16px;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    background: white;
    color: #374151;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    cursor: pointer;
    min-width: 120px;
}

.chat-shortcut-btn:hover {
    border-color: #3b82f6;
    color: #3b82f6;
    background: #f8faff;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}

.chat-shortcut-btn .btn-icon {
    font-size: 16px;
}

.chat-shortcut-btn .btn-text {
    font-size: 12px;
    font-weight: 500;
}

/* 特殊按钮样式 */
.customize-btn-chat {
    border-color: #d1d5db;
    color: #6b7280;
}

.customize-btn-chat:hover {
    border-color: #9ca3af;
    color: #374151;
    background: #f9fafb;
}

.close-btn {
    border-color: #f87171;
    color: #dc2626;
}

.close-btn:hover {
    border-color: #dc2626;
    background: #fef2f2;
}

/* 移动端快捷操作样式 */
.mobile-shortcuts-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    z-index: 2000;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 0;
}

.mobile-shortcuts-container {
    width: 100%;
    background: white;
    border-radius: 20px 20px 0 0;
    padding: 24px 20px 32px;
    max-height: 70vh;
    overflow-y: auto;
    animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
    from {
        transform: translateY(100%);
        opacity: 0;
    }

    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.shortcuts-main-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 24px;
}

.shortcut-btn-mobile {
    height: 56px;
    padding: 0 16px;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    background: white;
    color: #374151;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.shortcut-btn-mobile:hover {
    border-color: #3b82f6;
    color: #3b82f6;
    background: #f8faff;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}

.shortcuts-bottom-actions {
    display: flex;
    gap: 12px;
    padding-top: 16px;
    border-top: 1px solid #f3f4f6;
}

.action-btn {
    flex: 1;
    height: 48px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
}

.add-btn {
    border: 1px solid #3b82f6;
    background: #3b82f6;
    color: white;
}

.add-btn:hover {
    background: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.close-btn {
    border: 1px solid #e5e7eb;
    background: white;
    color: #6b7280;
}

.close-btn:hover {
    border-color: #9ca3af;
    color: #374151;
    background: #f9fafb;
}

.add-icon {
    font-size: 16px;
    font-weight: bold;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .ai-suggestions {
        margin-top: 16px;
        padding: 0 16px;
    }

    .suggestion-row {
        gap: 8px;
    }

    .ai-suggestion-btn {
        height: 40px;
        padding: 0 16px;
        font-size: 13px;
        border-radius: 20px;
    }

    .customize-btn-inline {
        width: 40px;
        height: 40px;
    }
}

@media (max-width: 480px) {
    .shortcuts-main-grid {
        grid-template-columns: 1fr;
    }

    .ai-suggestion-btn {
        min-width: auto;
        flex: 1;
    }
}
</style>
