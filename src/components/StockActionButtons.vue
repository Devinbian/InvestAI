<template>
    <div class="stock-action-buttons" :class="[containerClass, { 'mobile': isMobile, [mode]: true }]">
        <template v-for="action in visibleActions" :key="action.key">
            <!-- 自选股相关按钮 -->
            <el-button v-if="action.key === 'addWatchlist' && !isInWatchlist" :type="action.type || 'primary'"
                :size="buttonSize" @click.stop="handleAction(action)" :class="[action.class, 'stock-action-btn']"
                :loading="action.loading">
                <component :is="getIconComponent(action)" />
                {{ isMobile ? getMobileText(action) : action.text }}
            </el-button>

            <el-button v-else-if="action.key === 'removeWatchlist' && isInWatchlist" :type="action.type || 'success'"
                :size="buttonSize" @click.stop="handleAction(action)" :class="[action.class, 'stock-action-btn']"
                :loading="action.loading">
                <component :is="getIconComponent(action)" />
                {{ isMobile ? getMobileText(action) : action.text }}
            </el-button>

            <!-- 其他操作按钮 -->
            <el-button v-else-if="!['addWatchlist', 'removeWatchlist'].includes(action.key)"
                :type="action.type || 'default'" :size="buttonSize" @click.stop="handleAction(action)"
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
    </div>
</template>

<script setup>
import { computed, h } from 'vue';
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

    // 移动端限制按钮数量
    if (props.isMobile && props.maxButtons > 0) {
        actions = actions.slice(0, props.maxButtons);
    }

    // 根据模式过滤按钮
    if (props.mode === 'minimal') {
        // 最小模式只显示核心操作
        const coreActions = ['addWatchlist', 'removeWatchlist', 'buy', 'sell'];
        actions = actions.filter(action => coreActions.includes(action.key));
    } else if (props.mode === 'compact') {
        // 紧凑模式优先显示常用操作
        const priorityActions = ['addWatchlist', 'removeWatchlist', 'buy', 'sell', 'analysis', 'aiTrading'];
        actions = actions.sort((a, b) => {
            const aIndex = priorityActions.indexOf(a.key);
            const bIndex = priorityActions.indexOf(b.key);
            return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
        });
    }

    return actions;
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
    flex-wrap: wrap;
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
</style>
