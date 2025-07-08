<template>
    <div class="mobile-chat-shortcuts" v-if="showShortcuts && isMobileView">
        <!-- 快捷操作栏 -->
        <div class="shortcuts-container">
            <div class="shortcuts-scroll-wrapper">
                <div class="shortcuts-list" ref="shortcutsListRef">
                    <!-- 快捷操作按钮 -->
                    <button v-for="shortcut in activeShortcuts" :key="shortcut.id" class="shortcut-btn"
                        @click="handleShortcutClick(shortcut)" :title="shortcut.description">
                        <span class="shortcut-icon">{{ shortcut.icon }}</span>
                        <span class="shortcut-text">{{ shortcut.title }}</span>
                    </button>

                    <!-- 自定义按钮 -->
                    <button class="shortcut-btn customize-btn" @click="openCustomizeDialog" title="自定义快捷操作">
                        <span class="shortcut-icon">⚙️</span>
                        <span class="shortcut-text">自定义</span>
                    </button>
                </div>
            </div>


        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';

// Props定义
const props = defineProps({
    // 是否显示快捷操作栏
    showShortcuts: {
        type: Boolean,
        default: true
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
    'customize-dialog-open'
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

// 滚动相关状态
const shortcutsListRef = ref(null);

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
    console.log('🔄 MobileChatShortcuts - 初始化快捷操作');
    activeShortcuts.value = ShortcutsManager.loadActiveShortcuts(defaultShortcuts.value);
    console.log('✅ MobileChatShortcuts - 快捷操作初始化完成，总数:', activeShortcuts.value.length);
};



// 快捷操作点击处理
const handleShortcutClick = (shortcut) => {
    console.log('🚀 MobileChatShortcuts - 点击快捷操作:', shortcut);
    emit('shortcut-click', shortcut);
};

// 打开自定义对话框
const openCustomizeDialog = () => {
    emit('customize-dialog-open');
};

// 处理快捷操作更新
const handleShortcutsUpdated = () => {
    console.log('🔄 MobileChatShortcuts - 处理快捷操作更新事件');
    // 强制清空数组，确保响应式更新
    activeShortcuts.value = [];

    // 使用nextTick确保DOM更新后再重新加载数据
    nextTick(() => {
        initializeShortcuts();
        console.log('✅ MobileChatShortcuts - 快捷操作更新完成');
    });
};

// 组件挂载时初始化
onMounted(() => {
    console.log('🔧 MobileChatShortcuts - 组件已挂载', {
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
/* 引入PC端快捷操作样式 */
@import '@/styles/components/shortcuts.scss';

.mobile-chat-shortcuts {
    width: 100%;
    background: transparent;
}

.shortcuts-container {
    position: relative;
    padding: 0;
}

.shortcuts-scroll-wrapper {
    overflow: hidden;
    position: relative;
}

.shortcuts-list {
    display: flex;
    gap: 8px;
    padding: 0;
    overflow-x: auto;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    /* Firefox */
    -ms-overflow-style: none;
    /* IE and Edge */
    flex: 1;
}

.shortcuts-list::-webkit-scrollbar {
    display: none;
    /* Chrome, Safari, Opera */
}

/* 移动端快捷操作按钮 - 与新建聊天按钮保持一致 */
.shortcut-btn {
    /* 与新建聊天按钮样式保持一致 */
    border-radius: 12px;
    background: #f5f7fa;
    color: #18181b;
    font-weight: 500;
    border: 1px solid #e0e0e0;
    box-shadow: none;
    padding: 4px 12px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.8rem;
    height: 28px;
    white-space: nowrap;
    flex-shrink: 0;
    min-width: auto;

    /* 移动端特定调整 - 左右布局 */
    flex-direction: row;
    justify-content: center;
    text-align: left;
}

/* 与新建聊天按钮的悬停效果保持一致 */
.shortcut-btn:hover {
    background: #e6e8eb;
    border-color: #d0d0d0;
}

.shortcut-btn:active {
    background: #e6e8eb;
    border-color: #d0d0d0;
}

.shortcut-icon {
    font-size: 14px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.shortcut-text {
    font-size: 0.8rem;
    line-height: 1.2;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
}

/* 自定义按钮样式 - 与其他按钮保持一致 */
.customize-btn {
    /* 与其他按钮使用相同的样式 */
}

.customize-btn:hover {
    background: #e6e8eb;
    border-color: #d0d0d0;
}

.customize-btn:active {
    background: #e6e8eb;
    border-color: #d0d0d0;
}



/* 超小屏幕适配 */
@media (max-width: 375px) {
    .shortcuts-list {
        padding: 0;
        gap: 6px;
    }

    .shortcut-btn {
        height: 26px;
        padding: 3px 8px;
        gap: 3px;
        font-size: 0.7rem;
    }

    .shortcut-icon {
        font-size: 12px;
    }

    .shortcut-text {
        font-size: 0.7rem;
    }
}

/* 大屏手机适配 */
@media (min-width: 414px) {
    .shortcuts-list {
        padding: 0;
        gap: 10px;
    }

    .shortcut-btn {
        height: 30px;
        padding: 5px 12px;
        gap: 5px;
        font-size: 0.85rem;
    }

    .shortcut-icon {
        font-size: 16px;
    }

    .shortcut-text {
        font-size: 0.85rem;
    }
}
</style>
