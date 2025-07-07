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

@media (max-width: 480px) {
    .ai-suggestion-btn {
        min-width: auto;
        flex: 1;
    }
}
</style>
