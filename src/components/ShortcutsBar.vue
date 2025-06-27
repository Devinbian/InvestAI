<template>
    <div class="shortcuts-bar" v-if="showShortcuts">
        <!-- PC端快捷操作栏（初始模式） - 只在PC端显示 -->
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

        <!-- 移动端初始模式隐藏占位元素 - 确保组件始终被渲染 -->
        <div v-if="mode === 'initial' && isMobileView" style="display: none;" class="mobile-placeholder">
            <!-- 隐藏的占位元素，确保移动端组件能被正确渲染和引用 -->
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

        <!-- 移动端快捷操作栏（原生设计） -->
        <div class="mobile-shortcuts-overlay" v-if="showChatShortcuts && isMobileView" @click="toggleChatShortcuts">
            <div class="mobile-shortcuts-container" @click.stop>
                <!-- 顶部拖拽指示器 -->
                <div class="drag-indicator"></div>

                <!-- 标题区域 -->
                <div class="shortcuts-header">
                    <h3 class="shortcuts-title">快捷操作</h3>
                    <button class="close-btn-header" @click="toggleChatShortcuts">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2"
                                stroke-linecap="round" />
                        </svg>
                    </button>
                </div>

                <!-- 快捷操作网格 -->
                <div class="shortcuts-grid-mobile">
                    <div v-for="shortcut in activeShortcuts" :key="shortcut.id" class="shortcut-item-mobile"
                        @click="handleShortcutClick(shortcut)">
                        <div class="shortcut-icon">{{ shortcut.icon }}</div>
                        <div class="shortcut-text">{{ shortcut.shortTitle || shortcut.title }}</div>
                    </div>

                    <!-- 自定义按钮 -->
                    <div class="shortcut-item-mobile add-shortcut" @click="openCustomizeDialog">
                        <div class="shortcut-icon add-icon">+</div>
                        <div class="shortcut-text">自定义</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
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

// 监听activeShortcuts变化（用于调试）
watch(activeShortcuts, (newShortcuts, oldShortcuts) => {
    console.log('🔄 ShortcutsBar - activeShortcuts 数据变化');
    console.log('旧数据长度:', oldShortcuts?.length || 0);
    console.log('新数据长度:', newShortcuts?.length || 0);
    console.log('新数据内容:', newShortcuts);
}, { deep: true });

// 初始化快捷操作
const initializeShortcuts = () => {
    console.log('🔄 ShortcutsBar - 开始初始化快捷操作');
    const result = [];

    // 加载默认快捷操作状态
    const savedStates = localStorage.getItem('defaultShortcutStates');
    const states = savedStates ? JSON.parse(savedStates) : {};
    console.log('📊 ShortcutsBar - 默认快捷操作状态:', states);

    // 添加激活的默认快捷操作
    const activeDefaultShortcuts = defaultShortcuts.value.filter(s => {
        if (states.hasOwnProperty(s.id)) {
            s.isActive = states[s.id];
        }
        return s.isActive;
    });
    result.push(...activeDefaultShortcuts);
    console.log('✅ ShortcutsBar - 激活的默认快捷操作:', activeDefaultShortcuts.length, activeDefaultShortcuts);

    // 添加激活的自定义快捷操作
    const savedCustomShortcuts = localStorage.getItem('customShortcuts');
    if (savedCustomShortcuts) {
        const customShortcuts = JSON.parse(savedCustomShortcuts);
        console.log('💾 ShortcutsBar - 保存的自定义快捷操作:', customShortcuts);
        const activeCustomShortcuts = customShortcuts
            .filter(s => s.isActive)
            .map(shortcut => ({
                ...shortcut,
                action: 'custom'
            }));
        result.push(...activeCustomShortcuts);
        console.log('✅ ShortcutsBar - 激活的自定义快捷操作:', activeCustomShortcuts.length, activeCustomShortcuts);
    } else {
        console.log('📝 ShortcutsBar - 没有保存的自定义快捷操作');
    }

    console.log('🔍 ShortcutsBar - 更新前的activeShortcuts:', activeShortcuts.value.length);
    activeShortcuts.value = result;
    console.log('🎯 ShortcutsBar - 最终激活的快捷操作总数:', result.length);
    console.log('🎯 ShortcutsBar - 最终激活的快捷操作详情:', result);
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
    console.log('🔄 ShortcutsBar - 处理快捷操作更新事件');
    console.log('🔍 ShortcutsBar - 更新前的activeShortcuts数量:', activeShortcuts.value.length);

    // 强制清空数组，确保响应式更新
    activeShortcuts.value = [];

    // 使用nextTick确保DOM更新后再重新加载数据
    nextTick(() => {
        initializeShortcuts();

        console.log('🔍 ShortcutsBar - 更新后的activeShortcuts数量:', activeShortcuts.value.length);
        console.log('🔍 ShortcutsBar - 更新后的activeShortcuts详情:', activeShortcuts.value);

        emit('shortcuts-updated');
        console.log('✅ ShortcutsBar - 快捷操作更新完成');
    });
};

// 监听props变化，重新初始化快捷操作
watch(() => props.isLoggedIn, () => {
    initializeShortcuts();
}, { immediate: false });

// 监听移动端快捷操作弹窗显示状态，每次显示时重新加载数据
watch(() => props.showChatShortcuts, (newVal, oldVal) => {
    if (newVal && props.isMobileView && !oldVal) {
        console.log('📱 ShortcutsBar - 移动端快捷操作弹窗打开，重新初始化数据');
        initializeShortcuts();
    }
}, { immediate: false });

// 组件挂载时初始化
onMounted(() => {
    console.log('🔧 ShortcutsBar - 组件已挂载', {
        mode: props.mode,
        showShortcuts: props.showShortcuts,
        isMobileView: props.isMobileView,
        isLoggedIn: props.isLoggedIn
    });
    initializeShortcuts();
});

// 监听组件创建
console.log('🔧 ShortcutsBar - 组件正在创建', {
    timestamp: Date.now()
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

/* 移动端快捷操作样式 - 原生设计 */
.mobile-shortcuts-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 2000;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 0;
    animation: fadeIn 0.2s ease-out;
}

.mobile-shortcuts-container {
    width: 100%;
    background: #f8f9fa;
    border-radius: 16px 16px 0 0;
    padding: 0 0 env(safe-area-inset-bottom, 20px) 0;
    max-height: 60vh;
    overflow: hidden;
    animation: slideUp 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    box-shadow: 0 -2px 20px rgba(0, 0, 0, 0.1);
}

@keyframes slideUp {
    from {
        transform: translateY(100%);
    }

    to {
        transform: translateY(0);
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

/* 拖拽指示器 */
.drag-indicator {
    width: 36px;
    height: 4px;
    background: #d1d5db;
    border-radius: 2px;
    margin: 8px auto 0;
}

/* 标题区域 */
.shortcuts-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px 12px;
    border-bottom: 1px solid #e5e7eb;
    background: white;
}

.shortcuts-title {
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
}

.close-btn-header {
    width: 32px;
    height: 32px;
    border: none;
    background: #f3f4f6;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #6b7280;
}

.close-btn-header:hover {
    background: #e5e7eb;
    color: #374151;
}

.close-btn-header:active {
    transform: scale(0.95);
    background: #d1d5db;
}

/* 快捷操作网格 */
.shortcuts-grid-mobile {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0;
    padding: 20px 16px 16px;
    background: white;
}

.shortcut-item-mobile {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px 8px;
    cursor: pointer;
    border-radius: 12px;
    transition: all 0.2s ease;
    min-height: 80px;
    justify-content: center;
}

.shortcut-item-mobile:active {
    transform: scale(0.95);
    background: #f3f4f6;
}

.shortcut-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: #f8faff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    margin-bottom: 8px;
    transition: all 0.2s ease;
}

.shortcut-text {
    font-size: 12px;
    color: #374151;
    text-align: center;
    font-weight: 500;
    line-height: 1.2;
}

/* 自定义按钮特殊样式 */
.add-shortcut .shortcut-icon {
    background: #f0f9ff;
    color: #3b82f6;
    border: 1px dashed #93c5fd;
}

.add-shortcut .shortcut-icon.add-icon {
    font-size: 18px;
    font-weight: 300;
}

.add-shortcut .shortcut-text {
    color: #3b82f6;
}

/* 触摸反馈 */
@media (hover: none) and (pointer: coarse) {
    .shortcut-item-mobile:hover {
        background: transparent;
    }

    .shortcut-item-mobile:active {
        background: #f3f4f6;
    }
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
    .ai-suggestion-btn {
        min-width: auto;
        flex: 1;
    }

    /* 超小屏幕优化移动端弹窗 */
    .shortcuts-grid-mobile {
        grid-template-columns: repeat(3, 1fr);
        padding: 16px 12px 12px;
    }

    .shortcut-item-mobile {
        padding: 12px 6px;
        min-height: 72px;
    }

    .shortcut-icon {
        width: 40px;
        height: 40px;
        font-size: 18px;
        margin-bottom: 6px;
    }

    .shortcut-text {
        font-size: 11px;
    }

    .shortcuts-header {
        padding: 12px 16px 8px;
    }

    .shortcuts-title {
        font-size: 15px;
    }

    .close-btn-header {
        width: 28px;
        height: 28px;
    }

    .close-btn-header svg {
        width: 16px;
        height: 16px;
    }
}
</style>
