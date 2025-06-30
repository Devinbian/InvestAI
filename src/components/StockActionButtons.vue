<template>
    <div class="stock-action-buttons" :class="[containerClass, { 'mobile': isMobile, [mode]: true }]">
        <!-- 移动端模式：显示主要按钮和下拉菜单 -->
        <template v-if="isMobile && shouldShowDropdown">
            <!-- 主要操作按钮（前2个） -->
            <template v-for="action in primaryActions" :key="action.key">
                <el-button :type="action.type || 'default'" :size="buttonSize" @click.stop="handleAction(action)"
                    :class="[action.class, 'stock-action-btn']" :loading="action.loading">
                    <component :is="getIconComponent(action)" />
                    {{ getMobileText(action) }}

                    <!-- 价格标签 -->
                    <div v-if="action.priceTag" class="price-tag-container">
                        <span class="price-tag original-price">{{ action.priceTag.original }}</span>
                        <span class="price-tag promo-price">{{ action.priceTag.promo }}</span>
                    </div>
                </el-button>
            </template>

            <!-- 更多操作下拉按钮 -->
            <div v-if="secondaryActions.length > 0" class="more-actions-dropdown" ref="moreButton">
                <button class="more-btn" @click.stop="toggleDropdown">
                    <span class="more-icon">⋯</span>
                </button>

                <!-- 使用Teleport将下拉菜单渲染到body，避免被父容器遮挡 -->
                <Teleport to="body">
                    <div v-if="showDropdown" class="dropdown-overlay" @click="showDropdown = false">
                        <div class="dropdown-menu" @click.stop :style="dropdownStyle">
                            <template v-for="action in secondaryActions" :key="action.key">
                                <div class="dropdown-item" @click="handleDropdownAction(action)">
                                    <component :is="getIconComponent(action)" />
                                    <span class="dropdown-text">{{ getMobileText(action) }}</span>
                                    <div v-if="action.priceTag" class="dropdown-price">{{ action.priceTag.promo }}</div>
                                </div>
                            </template>
                        </div>
                    </div>
                </Teleport>
            </div>
        </template>

        <!-- 非移动端或不需要下拉菜单时的原有逻辑 -->
        <template v-else>
            <template v-for="action in visibleActions" :key="action.key">
                <el-button :type="action.type || 'default'" :size="buttonSize" @click.stop="handleAction(action)"
                    :class="[action.class, 'stock-action-btn']" :loading="action.loading">
                    <component :is="getIconComponent(action)" />
                    {{ isMobile ? getMobileText(action) : action.text }}

                    <!-- 价格标签 -->
                    <div v-if="action.priceTag" class="price-tag-container">
                        <span class="price-tag original-price">{{ action.priceTag.original }}</span>
                        <span class="price-tag promo-price">{{ action.priceTag.promo }}</span>
                    </div>
                </el-button>
            </template>
        </template>
    </div>
</template>

<script setup>
import { computed, h, ref, onMounted, onUnmounted } from 'vue';
import { useUserStore } from '../store/user';

// Props
const props = defineProps({
    // 股票信息
    stock: {
        type: Object,
        required: true
    },

    // 操作按钮配置
    actions: {
        type: Array,
        default: () => []
    },

    // 按钮大小
    size: {
        type: String,
        default: 'small',
        validator: (value) => ['large', 'default', 'small'].includes(value)
    },

    // 是否为移动端
    isMobile: {
        type: Boolean,
        default: false
    },

    // 容器样式类
    containerClass: {
        type: String,
        default: ''
    },

    // 显示模式
    mode: {
        type: String,
        default: 'full', // full | compact | minimal
        validator: (value) => ['full', 'compact', 'minimal'].includes(value)
    },

    // 最大显示按钮数量（移动端优化）
    maxButtons: {
        type: Number,
        default: 4
    }
});

// Emits
const emit = defineEmits([
    'action-click',
    // 具体的操作事件
    'add-watchlist',
    'remove-watchlist',
    'buy-stock',
    'sell-stock',
    'paid-analysis',
    'ai-trading',
    'show-buy-dialog',
    'show-sell-dialog',
    'show-analysis-dialog',
    'show-ai-trading-dialog'
]);

// Store
const userStore = useUserStore();

// 下拉菜单状态
const showDropdown = ref(false);
const moreButton = ref(null);

// 计算属性
const buttonSize = computed(() => {
    if (props.isMobile) {
        return props.mode === 'minimal' ? 'small' : 'default';
    }
    return props.size;
});

const isInWatchlist = computed(() => {
    return userStore.isInWatchlist(props.stock.code);
});

// 根据模式和设备过滤可见的操作按钮
const visibleActions = computed(() => {
    let actions = [...props.actions];

    // 根据自选股状态过滤按钮
    actions = actions.filter(action => {
        if (action.key === 'addWatchlist') {
            return !isInWatchlist.value;
        }
        if (action.key === 'removeWatchlist') {
            return isInWatchlist.value;
        }
        return true;
    });

    // 根据模式过滤按钮
    if (props.mode === 'minimal') {
        // 最小模式只显示核心操作
        const coreActions = ['addWatchlist', 'removeWatchlist', 'buy', 'sell'];
        actions = actions.filter(action => coreActions.includes(action.key));
    } else if (props.mode === 'compact') {
        // 紧凑模式优先显示常用操作 - 量化分析和AI委托交易排在最前面
        const priorityActions = ['analysis', 'paidAnalysis', 'aiTrading', 'quantAnalysis', 'addWatchlist', 'removeWatchlist', 'buy', 'sell'];
        actions = actions.sort((a, b) => {
            const aIndex = priorityActions.indexOf(a.key);
            const bIndex = priorityActions.indexOf(b.key);
            return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
        });
    }

    // 移动端不限制按钮数量，让所有按钮都进入visibleActions
    // 在primaryActions和secondaryActions中再做分割

    console.log('📋 visibleActions 计算结果:', {
        stockCode: props.stock?.code || 'unknown',
        originalActions: props.actions.map(a => a.key),
        filteredActions: actions.map(a => a.key),
        isInWatchlist: isInWatchlist.value,
        isMobile: props.isMobile,
        maxButtons: props.maxButtons
    });

    return actions;
});

// 移动端是否需要显示下拉菜单
const shouldShowDropdown = computed(() => {
    // 移动端超过2个按钮时启用下拉菜单
    const result = props.isMobile && visibleActions.value.length > 2;
    console.log('🔍 StockActionButtons shouldShowDropdown:', {
        stockCode: props.stock?.code || 'unknown',
        isMobile: props.isMobile,
        visibleActionsLength: visibleActions.value.length,
        shouldShowDropdown: result,
        visibleActions: visibleActions.value.map(a => a.key),
        mode: props.mode,
        maxButtons: props.maxButtons,
        allActions: props.actions.map(a => a.key)
    });
    return result;
});

// 移动端主要操作（前2个）
const primaryActions = computed(() => {
    if (!props.isMobile || !shouldShowDropdown.value) return visibleActions.value;

    // 优先显示分析和AI交易按钮
    const priorityKeys = ['analysis', 'paidAnalysis', 'aiTrading', 'quantAnalysis'];
    const actions = [...visibleActions.value];
    const primary = [];

    // 先添加优先级按钮
    priorityKeys.forEach(key => {
        const index = actions.findIndex(action => action.key === key);
        if (index !== -1 && primary.length < 2) {
            primary.push(actions.splice(index, 1)[0]);
        }
    });

    // 如果还没满2个，补充其他按钮
    while (primary.length < 2 && actions.length > 0) {
        primary.push(actions.shift());
    }

    console.log('📱 Primary actions:', primary.map(a => a.key));
    return primary;
});

// 移动端次要操作（放入下拉菜单）
const secondaryActions = computed(() => {
    if (!props.isMobile || !shouldShowDropdown.value) {
        console.log('📋 Secondary actions: 无 (isMobile:', props.isMobile, ', shouldShowDropdown:', shouldShowDropdown.value, ')');
        return [];
    }

    // 获取不在主要操作中的所有按钮
    const primaryKeys = primaryActions.value.map(a => a.key);
    const secondary = visibleActions.value.filter(action => !primaryKeys.includes(action.key));

    console.log('📋 Secondary actions:', secondary.map(a => a.key));
    return secondary;
});

// 下拉菜单定位样式
const dropdownStyle = computed(() => {
    if (!moreButton.value || !showDropdown.value) return {};

    const rect = moreButton.value.getBoundingClientRect();
    return {
        position: 'fixed',
        top: `${rect.bottom + 4}px`,
        left: `${rect.right - 140}px`, // 140px是下拉菜单的最小宽度
        zIndex: 20000 // 使用更高的z-index确保显示在最上层
    };
});

// 方法
const handleAction = (action) => {
    console.log('🚀 StockActionButtons - 执行操作:', action.key, props.stock);

    // 发送通用的action-click事件
    emit('action-click', {
        action: action.key,
        stock: props.stock,
        actionConfig: action
    });

    // 发送具体的操作事件
    const eventMap = {
        'addWatchlist': 'add-watchlist',
        'removeWatchlist': 'remove-watchlist',
        'buy': 'buy-stock',
        'sell': 'sell-stock',
        'analysis': 'paid-analysis',
        'paidAnalysis': 'paid-analysis',
        'aiTrading': 'ai-trading',
        'quantAnalysis': 'ai-trading'
    };

    const eventName = eventMap[action.key];
    if (eventName) {
        emit(eventName, props.stock);
    }

    // 发送对话框显示事件
    const dialogEventMap = {
        'buy': 'show-buy-dialog',
        'sell': 'show-sell-dialog',
        'analysis': 'show-analysis-dialog',
        'paidAnalysis': 'show-analysis-dialog',
        'aiTrading': 'show-ai-trading-dialog',
        'quantAnalysis': 'show-ai-trading-dialog'
    };

    const dialogEventName = dialogEventMap[action.key];
    if (dialogEventName) {
        emit(dialogEventName, props.stock);
    }
};

// 下拉菜单操作处理
const handleDropdownAction = (action) => {
    closeDropdown();
    handleAction(action);
};

// 切换下拉菜单
const toggleDropdown = () => {
    showDropdown.value = !showDropdown.value;
};

// 关闭下拉菜单
const closeDropdown = () => {
    showDropdown.value = false;
};

// 点击外部关闭下拉菜单
const handleClickOutside = (e) => {
    if (!e.target.closest('.more-actions-dropdown') && !e.target.closest('.dropdown-menu')) {
        closeDropdown();
    }
};

// 生命周期
onMounted(() => {
    document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});

// 获取移动端显示文本
const getMobileText = (action) => {
    const mobileTextMap = {
        'addWatchlist': '加自选',
        'removeWatchlist': '移除',
        'buy': '买入',
        'sell': '卖出',
        'analysis': '分析',
        'paidAnalysis': '分析',
        'aiTrading': 'AI交易',
        'quantAnalysis': 'AI交易',
        'addPosition': '加仓'
    };

    // 优先使用配置中的移动端文本
    if (action.mobileText) {
        return action.mobileText;
    }

    // 使用映射表中的文本
    if (mobileTextMap[action.key]) {
        return mobileTextMap[action.key];
    }

    // 如果原文本过长，进行截断
    if (action.text && action.text.length > 4) {
        return action.text.substring(0, 4);
    }

    return action.text || '操作';
};

// 获取图标组件
const getIconComponent = (action) => {
    if (!action.icon) return null;

    // 如果是SVG路径，创建SVG组件
    if (action.icon.includes('M')) {
        return h('svg', {
            width: '14',
            height: '14',
            viewBox: '0 0 24 24',
            fill: 'none'
        }, [
            h('path', {
                d: action.icon,
                stroke: 'currentColor',
                'stroke-width': '2',
                fill: action.iconFill || 'none'
            })
        ]);
    }

    // 如果是emoji或文本图标，创建span组件
    return h('span', { class: 'icon-text' }, action.icon);
};
</script>

<style scoped>
.stock-action-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: nowrap;
    align-items: center;
}

.stock-action-buttons.mobile {
    gap: 6px;
}

.stock-action-buttons.compact {
    gap: 6px;
}

.stock-action-buttons.minimal {
    gap: 4px;
}

.stock-action-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    transition: all 0.2s ease;
    position: relative;
}

.stock-action-btn:hover {
    transform: translateY(-1px);
}

.stock-action-btn .icon-text {
    font-size: 14px;
    line-height: 1;
}

/* 价格标签样式 */
.price-tag-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
    margin-left: 6px;
}

.price-tag {
    font-size: 0.625rem;
    padding: 1px 4px;
    border-radius: 3px;
    line-height: 1.2;
    font-weight: 600;
    letter-spacing: 0.01em;
}

.price-tag.original-price {
    background: rgba(156, 163, 175, 0.15);
    color: #9ca3af;
    text-decoration: line-through;
}

.price-tag.promo-price {
    background: #f59e0b;
    color: white;
    font-weight: 600;
}

/* 移动端优化 */
@media (max-width: 768px) {
    .stock-action-buttons {
        gap: 4px;
    }

    .stock-action-btn {
        gap: 3px;
        font-size: 12px;
    }

    .price-tag-container {
        margin-left: 4px;
    }

    .price-tag {
        font-size: 0.5rem;
        padding: 0.5px 3px;
    }
}

/* 按钮样式主题 */
.stock-action-btn.add-watchlist-btn {
    background: rgba(34, 197, 94, 0.1) !important;
    color: #16a34a !important;
    border: 1px solid rgba(34, 197, 94, 0.3) !important;
}

.stock-action-btn.add-watchlist-btn:hover {
    background: rgba(34, 197, 94, 0.15) !important;
    border-color: rgba(34, 197, 94, 0.4) !important;
}

.stock-action-btn.remove-watchlist-btn {
    background: rgba(34, 197, 94, 0.1) !important;
    color: #16a34a !important;
    border: 1px solid rgba(34, 197, 94, 0.3) !important;
}

.stock-action-btn.remove-watchlist-btn:hover {
    background: rgba(34, 197, 94, 0.15) !important;
    border-color: rgba(34, 197, 94, 0.4) !important;
}

.stock-action-btn.paid-analysis-btn {
    background: rgba(139, 92, 246, 0.1) !important;
    color: #7c3aed !important;
    border: 1px solid rgba(139, 92, 246, 0.3) !important;
}

.stock-action-btn.paid-analysis-btn:hover {
    background: rgba(139, 92, 246, 0.15) !important;
    color: #6d28d9 !important;
    border-color: rgba(139, 92, 246, 0.4) !important;
}

.stock-action-btn.quant-analysis-btn {
    background: rgba(59, 130, 246, 0.1) !important;
    color: #2563eb !important;
    border: 1px solid rgba(59, 130, 246, 0.3) !important;
}

.stock-action-btn.quant-analysis-btn:hover {
    background: rgba(59, 130, 246, 0.15) !important;
    color: #1d4ed8 !important;
    border-color: rgba(59, 130, 246, 0.4) !important;
}

.stock-action-btn.buy-stock-btn {
    background: rgba(34, 197, 94, 0.1) !important;
    color: #16a34a !important;
    border: 1px solid rgba(34, 197, 94, 0.3) !important;
}

.stock-action-btn.buy-stock-btn:hover {
    background: rgba(34, 197, 94, 0.15) !important;
    border-color: rgba(34, 197, 94, 0.4) !important;
}

.stock-action-btn.buy-stock-btn-secondary {
    background: rgba(59, 130, 246, 0.1) !important;
    color: #2563eb !important;
    border: 1px solid rgba(59, 130, 246, 0.3) !important;
}

.stock-action-btn.buy-stock-btn-secondary:hover {
    background: rgba(59, 130, 246, 0.15) !important;
    border-color: rgba(59, 130, 246, 0.4) !important;
}

.stock-action-btn.sell-stock-btn {
    background: rgba(239, 68, 68, 0.1) !important;
    color: #dc2626 !important;
    border: 1px solid rgba(239, 68, 68, 0.3) !important;
}

.stock-action-btn.sell-stock-btn:hover {
    background: rgba(239, 68, 68, 0.15) !important;
    border-color: rgba(239, 68, 68, 0.4) !important;
}

/* 焦点样式 */
.stock-action-btn:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

/* 移动端下拉菜单样式 */
.more-actions-dropdown {
    position: relative;
    display: inline-block;
}

.more-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 16px;
    color: #64748b;
    flex-shrink: 0;
    min-width: 32px;
}

.more-btn:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
    transform: translateY(-1px);
}

.more-btn:active {
    transform: translateY(0);
}

.more-icon {
    transform: rotate(90deg);
    font-weight: bold;
    line-height: 1;
    font-size: 18px;
}

/* 下拉菜单覆盖层 */
.dropdown-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 19999;
    background: transparent;
}

.dropdown-menu {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    min-width: 140px;
    animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-8px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.dropdown-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    cursor: pointer;
    transition: background-color 0.15s ease;
    border-bottom: 1px solid #f1f5f9;
    position: relative;
}

.dropdown-item:last-child {
    border-bottom: none;
}

.dropdown-item:hover {
    background: #f8fafc;
}

.dropdown-item:active {
    background: #f1f5f9;
}

.dropdown-text {
    flex: 1;
    font-size: 13px;
    font-weight: 500;
    color: #374151;
}

.dropdown-price {
    font-size: 11px;
    font-weight: 600;
    color: #f59e0b;
    background: rgba(245, 158, 11, 0.1);
    padding: 2px 4px;
    border-radius: 3px;
}

.dropdown-item svg {
    width: 14px;
    height: 14px;
    color: #64748b;
    flex-shrink: 0;
}

.dropdown-item .icon-text {
    font-size: 14px;
    color: #64748b;
    flex-shrink: 0;
}

/* 移动端优化 */
@media (max-width: 768px) {
    .dropdown-menu {
        min-width: 120px;
    }

    .dropdown-item {
        padding: 10px 12px;
    }

    .dropdown-text {
        font-size: 12px;
    }

    .dropdown-item svg {
        width: 12px;
        height: 12px;
    }

    .dropdown-item .icon-text {
        font-size: 12px;
    }
}

/* PC端操作按钮一行显示优化 */
@media (min-width: 769px) {
    .stock-action-buttons {
        flex-wrap: nowrap;
        overflow-x: auto;
        overflow-y: hidden;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        -ms-overflow-style: none;
        padding-bottom: 2px;
        max-width: 100%;
        /* 确保滚动行为 */
        scroll-behavior: smooth;
    }

    .stock-action-buttons::-webkit-scrollbar {
        display: none;
    }

    .stock-action-btn {
        flex-shrink: 0;
        white-space: nowrap;
        min-width: fit-content;
    }

    /* 侧边栏内的按钮特殊处理 - PC端允许换行显示所有按钮 */
    .sidebar-container .stock-action-buttons,
    .recommendations-container .stock-action-buttons,
    .watchlist-container .stock-action-buttons,
    .portfolio-view .stock-action-buttons {
        flex-wrap: wrap;
        overflow: visible;
        max-width: 100%;
        margin: 0;
        gap: 4px;
        /* 移除滚动相关样式 */
        scrollbar-width: auto;
        scrollbar-color: auto;
    }

    .sidebar-container .stock-action-btn,
    .recommendations-container .stock-action-btn,
    .watchlist-container .stock-action-btn,
    .portfolio-view .stock-action-btn {
        font-size: 0.65rem;
        padding: 0 4px;
        height: 26px;
        min-width: 50px;
        /* 允许按钮自适应宽度 */
        flex: 0 1 auto;
    }
}
</style>
