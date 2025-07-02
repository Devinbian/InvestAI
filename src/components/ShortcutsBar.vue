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
            <div class="shortcuts-grid" :style="{
                display: 'grid !important',
                gridTemplateColumns: 'repeat(5, 1fr) !important',
                gap: '6px !important',
                width: '100% !important',
                maxWidth: 'none !important',
                margin: '0 !important',
                padding: '0 !important',
                boxSizing: 'border-box !important'
            }">
                <el-button v-for="shortcut in activeShortcuts" :key="shortcut.id" class="chat-shortcut-btn"
                    @click="handleShortcutClick(shortcut)" :style="{
                        width: '100%',
                        height: '40px',
                        minWidth: '0',
                        maxWidth: 'none',
                        margin: '0',
                        padding: '4px 2px',
                        boxSizing: 'border-box',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '1px',
                        fontSize: '12px'
                    }">
                    <span class="btn-icon" :style="{ fontSize: '14px', lineHeight: '1' }">{{ shortcut.icon }}</span>
                    <span class="btn-text" :style="{ fontSize: '10px', lineHeight: '1.2', fontWeight: '500' }">{{
                        shortcut.shortTitle || shortcut.title }}</span>
                </el-button>
                <el-button class="chat-shortcut-btn customize-btn-chat" @click="openCustomizeDialog" :style="{
                    width: '100%',
                    height: '40px',
                    minWidth: '0',
                    maxWidth: 'none',
                    margin: '0',
                    padding: '6px 8px',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1px',
                    fontSize: '12px'
                }">
                    <span class="btn-icon" :style="{ fontSize: '14px', lineHeight: '1' }">⚙️</span>
                    <span class="btn-text" :style="{ fontSize: '10px', lineHeight: '1.2', fontWeight: '500' }">设置</span>
                </el-button>
                <el-button class="chat-shortcut-btn close-btn" @click="toggleChatShortcuts" :style="{
                    width: '100%',
                    height: '40px',
                    minWidth: '0',
                    maxWidth: 'none',
                    margin: '0',
                    padding: '6px 8px',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1px',
                    fontSize: '12px'
                }">
                    <span class="btn-icon" :style="{ fontSize: '14px', lineHeight: '1' }">✕</span>
                    <span class="btn-text" :style="{ fontSize: '10px', lineHeight: '1.2', fontWeight: '500' }">收起</span>
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

// 快捷操作数据管理类
class ShortcutsManager {
    static getDefaultStates() {
        const saved = localStorage.getItem('defaultShortcutStates');
        return saved ? JSON.parse(saved) : {};
    }

    static getCustomShortcuts() {
        const saved = localStorage.getItem('customShortcuts');
        return saved ? JSON.parse(saved) : [];
    }

    static loadActiveShortcuts(defaultShortcuts) {
        const result = [];
        const states = this.getDefaultStates();

        // 添加激活的默认快捷操作
        const activeDefaults = defaultShortcuts.filter(s => {
            if (states.hasOwnProperty(s.id)) {
                s.isActive = states[s.id];
            }
            return s.isActive;
        });
        result.push(...activeDefaults);

        // 添加激活的自定义快捷操作
        const customShortcuts = this.getCustomShortcuts();
        const activeCustoms = customShortcuts
            .filter(s => s.isActive)
            .map(shortcut => ({ ...shortcut, action: 'custom' }));
        result.push(...activeCustoms);

        return result;
    }
}

// 初始化快捷操作
const initializeShortcuts = () => {
    console.log('🔄 ShortcutsBar - 初始化快捷操作');
    activeShortcuts.value = ShortcutsManager.loadActiveShortcuts(defaultShortcuts.value);
    console.log('✅ ShortcutsBar - 快捷操作初始化完成，总数:', activeShortcuts.value.length);
};

// 快捷操作点击处理
const handleShortcutClick = (shortcut) => {
    console.log('🚀 ShortcutsBar - 点击快捷操作:', shortcut);
    emit('shortcut-click', shortcut);
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
    // 强制清空数组，确保响应式更新
    activeShortcuts.value = [];

    // 使用nextTick确保DOM更新后再重新加载数据
    nextTick(() => {
        initializeShortcuts();
        emit('shortcuts-updated');
        console.log('✅ ShortcutsBar - 快捷操作更新完成');
    });
};

// 监听props变化，重新初始化快捷操作
watch(() => props.isLoggedIn, initializeShortcuts, { immediate: false });

// 监听移动端快捷操作弹窗显示状态
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

// 暴露方法给父组件
defineExpose({
    initializeShortcuts,
    handleShortcutsUpdated
});
</script>

<style scoped>
/* 引入共享的快捷操作样式 */
@import '@/styles/components/shortcuts.scss';

/* 移动端隐藏占位元素 */
.mobile-placeholder {
    display: none;
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
