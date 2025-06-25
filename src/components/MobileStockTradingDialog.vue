<template>
    <div class="mobile-stock-dialog" v-if="modelValue" @click="handleClose">
        <div class="mobile-dialog-container" @click.stop>
            <!-- 头部信息 -->
            <div class="mobile-dialog-header">
                <div class="stock-info">
                    <div class="stock-main-info">
                        <h3 class="stock-name">{{ stock?.name || '股票名称' }}</h3>
                        <span class="stock-code">{{ stock?.code || '000000' }}</span>
                    </div>
                    <div class="stock-price-info">
                        <div class="current-price">¥{{ stock?.price || '0.00' }}</div>
                        <div :class="['price-change', (stock?.change >= 0) ? 'up' : 'down']">
                            {{ stock?.change >= 0 ? '+' : '' }}{{ stock?.change || '0.00' }}
                            ({{ stock?.changePercent >= 0 ? '+' : '' }}{{ stock?.changePercent || '0.00' }}%)
                        </div>
                    </div>
                </div>
                <button class="close-btn" @click="handleClose">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                    </svg>
                </button>
            </div>

            <!-- 主要内容区域 - 左右布局 -->
            <div class="mobile-dialog-content">
                <div class="trading-main-layout">
                    <!-- 左侧：交易操作区域 -->
                    <div class="left-trading-panel">
                        <!-- 交易类型切换 -->
                        <div class="trade-type-tabs">
                            <div :class="['tab-item', { 'active': tradeType === 'buy' }]"
                                @click="switchTradeType('buy')">
                                买入
                            </div>
                            <div :class="['tab-item', { 'active': tradeType === 'sell' }]"
                                @click="switchTradeType('sell')">
                                卖出
                            </div>
                            <div :class="['tab-item', { 'active': tradeType === 'cancel' }]"
                                @click="switchTradeType('cancel')">
                                撤单
                            </div>
                        </div>

                        <!-- 撤单模式：显示委托单列表 -->
                        <div v-if="tradeType === 'cancel'" class="cancel-orders-section">
                            <div v-if="currentStockPendingOrders.length === 0" class="no-orders">
                                <div class="no-orders-icon">📋</div>
                                <div class="no-orders-text">暂无待撤销的委托单</div>
                            </div>
                            <div v-else class="mobile-orders-list">
                                <div v-for="order in currentStockPendingOrders" :key="order.id"
                                    class="mobile-order-item">
                                    <div class="mobile-order-header">
                                        <span :class="['mobile-order-type', order.type]">{{ order.type === 'buy' ? '买入'
                                            : '卖出' }}</span>
                                        <span class="mobile-order-time">{{ formatOrderTime(order.createdAt) }}</span>
                                    </div>
                                    <div class="mobile-order-content">
                                        <div class="mobile-order-info">
                                            <div class="mobile-info-row">
                                                <span class="mobile-info-label">委托价格</span>
                                                <span class="mobile-info-value">¥{{ order.price.toFixed(2) }}</span>
                                            </div>
                                            <div class="mobile-info-row">
                                                <span class="mobile-info-label">委托数量</span>
                                                <span class="mobile-info-value">{{ order.quantity }}股</span>
                                            </div>
                                            <div class="mobile-info-row">
                                                <span class="mobile-info-label">委托金额</span>
                                                <span class="mobile-info-value">¥{{ (order.price *
                                                    order.quantity).toFixed(2) }}</span>
                                            </div>
                                        </div>
                                        <button class="mobile-cancel-btn" @click="cancelOrder(order.id)">
                                            撤单
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 买入/卖出模式：显示交易表单 -->
                        <div v-else>
                            <!-- 委托类型选择 -->
                            <div class="form-section">
                                <div class="order-type-selector">
                                    <div :class="['order-type-item', { 'active': tradingForm.orderType === 'limit' }]"
                                        @click="tradingForm.orderType = 'limit'">
                                        限价委托
                                    </div>
                                    <div :class="['order-type-item', { 'active': tradingForm.orderType === 'market' }]"
                                        @click="tradingForm.orderType = 'market'">
                                        市价委托
                                    </div>
                                </div>
                            </div>

                            <!-- 委托价格 -->
                            <div class="form-section" v-if="tradingForm.orderType === 'limit'">
                                <label class="form-label">委托价格</label>
                                <div class="price-input-group">
                                    <input v-model="tradingForm.price" type="number" step="0.01" class="price-input"
                                        placeholder="委托价格">
                                    <div class="price-controls">
                                        <button class="price-btn" @click="adjustPrice(0.01)">+</button>
                                        <button class="price-btn" @click="adjustPrice(-0.01)">-</button>
                                    </div>
                                </div>
                            </div>

                            <!-- 委托数量 -->
                            <div class="form-section">
                                <label class="form-label">委托数量</label>
                                <div class="quantity-input-group">
                                    <input v-model="tradingForm.quantity" type="number" step="100" min="100"
                                        class="quantity-input" placeholder="委托数量">
                                </div>
                                <!-- 快捷数量按钮 -->
                                <div class="quick-quantity-buttons">
                                    <button class="quick-btn" @click="setQuantityByPercent(100)">全仓</button>
                                    <button class="quick-btn" @click="setQuantityByPercent(50)">1/2</button>
                                    <button class="quick-btn" @click="setQuantityByPercent(33)">1/3</button>
                                    <button class="quick-btn" @click="setQuantityByPercent(25)">1/4</button>
                                </div>
                            </div>

                            <!-- 可买信息 -->
                            <div class="available-info">
                                <div class="info-row">
                                    <span class="label">{{ tradeType === 'sell' ? '可卖---' : '可买---' }}</span>
                                    <span class="value">{{ tradeType === 'sell' ? availableSellQuantity :
                                        availableBuyQuantity }}股</span>
                                </div>
                            </div>

                            <!-- 交易预览 -->
                            <div class="trade-summary">
                                <div class="summary-row">
                                    <span class="label">委托金额</span>
                                    <span class="value">{{ estimatedAmount.toFixed(2) }}</span>
                                </div>
                            </div>

                            <!-- 交易按钮 -->
                            <div class="action-section">
                                <button :class="['trade-action-btn', tradeType, { 'disabled': !canTrade }]"
                                    @click="confirmTrade" :disabled="!canTrade || tradingLoading">
                                    <div v-if="tradingLoading" class="loading-spinner"></div>
                                    <span v-else>{{ tradeType === 'sell' ? '委托卖出' : '委托买入' }}</span>
                                </button>
                            </div>

                            <!-- 账户信息 -->
                            <div class="account-info-section">
                                <div class="account-row">
                                    <span class="label">资金余额</span>
                                    <span class="value">{{ balance.toFixed(2) }}</span>
                                </div>
                                <div class="account-row" v-if="currentPosition && tradeType === 'sell'">
                                    <span class="label">持仓数量</span>
                                    <span class="value">{{ currentPosition.quantity }}</span>
                                </div>
                                <div class="account-row" v-if="currentPosition && tradeType === 'sell'">
                                    <span class="label">可卖数量</span>
                                    <span class="value">{{ currentPosition.quantity }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 右侧：五档行情 -->
                    <div class="right-market-panel">
                        <div class="market-depth">
                            <div class="depth-header">
                                <span>五档行情</span>
                                <span class="refresh-time">{{ getCurrentTime() }}</span>
                            </div>
                            <div class="depth-content">
                                <div class="depth-table">
                                    <div class="table-header">
                                        <span class="col-label">档位</span>
                                        <span class="col-price">价格</span>
                                        <span class="col-volume">数量</span>
                                    </div>

                                    <!-- 卖盘 -->
                                    <div class="sell-orders">
                                        <div v-for="(order, index) in sellOrders" :key="index" class="order-row sell"
                                            @click="setQuickPrice('sell', order.price)">
                                            <span class="order-label">卖{{ 5 - index }}</span>
                                            <span class="order-price">{{ order.price }}</span>
                                            <span class="order-volume">{{ order.volume }}</span>
                                        </div>
                                    </div>

                                    <!-- 当前价格 -->
                                    <div class="current-price-row" @click="setQuickPrice('current')">
                                        <span class="current-label">现价</span>
                                        <span :class="['current-value', stock?.change >= 0 ? 'up' : 'down']">
                                            {{ stock?.price || '0.00' }}
                                        </span>
                                        <span class="current-change">
                                            {{ stock?.changePercent || '0.00' }}
                                        </span>
                                    </div>

                                    <!-- 买盘 -->
                                    <div class="buy-orders">
                                        <div v-for="(order, index) in buyOrders" :key="index" class="order-row buy"
                                            @click="setQuickPrice('buy', order.price)">
                                            <span class="order-label">买{{ index + 1 }}</span>
                                            <span class="order-price">{{ order.price }}</span>
                                            <span class="order-volume">{{ order.volume }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { useUserStore } from '@/store/user';

// Props
const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    stock: {
        type: Object,
        default: null
    },
    tradeType: {
        type: String,
        default: 'buy',
        validator: (value) => ['buy', 'sell', 'cancel'].includes(value)
    }
});

// Emits
const emit = defineEmits(['update:modelValue', 'trade-completed', 'watchlist-changed']);

// Store
const userStore = useUserStore();

// 响应式数据
const tradingLoading = ref(false);
const tradeType = ref(props.tradeType);

// 交易表单
const tradingForm = reactive({
    orderType: 'limit',
    price: '',
    quantity: 100
});

// 模拟五档行情数据
const sellOrders = computed(() => {
    if (!props.stock) return [];
    const basePrice = parseFloat(props.stock.price);
    return [
        { price: (basePrice + 0.15).toFixed(2), volume: Math.floor(Math.random() * 500 + 200) + '手' },
        { price: (basePrice + 0.10).toFixed(2), volume: Math.floor(Math.random() * 500 + 200) + '手' },
        { price: (basePrice + 0.05).toFixed(2), volume: Math.floor(Math.random() * 500 + 200) + '手' },
        { price: (basePrice + 0.02).toFixed(2), volume: Math.floor(Math.random() * 500 + 200) + '手' },
        { price: (basePrice + 0.01).toFixed(2), volume: Math.floor(Math.random() * 500 + 200) + '手' }
    ];
});

const buyOrders = computed(() => {
    if (!props.stock) return [];
    const basePrice = parseFloat(props.stock.price);
    return [
        { price: (basePrice - 0.01).toFixed(2), volume: Math.floor(Math.random() * 500 + 200) + '手' },
        { price: (basePrice - 0.02).toFixed(2), volume: Math.floor(Math.random() * 500 + 200) + '手' },
        { price: (basePrice - 0.05).toFixed(2), volume: Math.floor(Math.random() * 500 + 200) + '手' },
        { price: (basePrice - 0.10).toFixed(2), volume: Math.floor(Math.random() * 500 + 200) + '手' },
        { price: (basePrice - 0.15).toFixed(2), volume: Math.floor(Math.random() * 500 + 200) + '手' }
    ];
});

// 计算属性
const balance = computed(() => userStore.balance);

const currentPosition = computed(() => {
    if (!props.stock) return null;
    return userStore.getPosition(props.stock.code);
});

const availableBuyQuantity = computed(() => {
    if (!props.stock) return 0;
    const price = tradingForm.orderType === 'market'
        ? parseFloat(props.stock.price)
        : parseFloat(tradingForm.price) || parseFloat(props.stock.price);

    const availableFunds = userStore.balance;
    return Math.floor(availableFunds / price / 100) * 100;
});

const availableSellQuantity = computed(() => {
    if (!props.stock) return 0;
    const position = userStore.getPosition(props.stock.code);
    return position ? position.quantity : 0;
});

const estimatedAmount = computed(() => {
    if (!props.stock || !tradingForm.quantity) return 0;
    const price = tradingForm.orderType === 'market'
        ? parseFloat(props.stock.price)
        : parseFloat(tradingForm.price) || parseFloat(props.stock.price);
    return tradingForm.quantity * price;
});

const canTrade = computed(() => {
    if (!props.stock || !tradingForm.quantity || tradingForm.quantity < 100) return false;

    if (tradeType.value === 'sell') {
        return availableSellQuantity.value >= tradingForm.quantity;
    }

    const totalCost = estimatedAmount.value * 1.0003; // 包含手续费
    return totalCost <= userStore.balance && tradingForm.quantity >= 100;
});

// 当前股票的待撤销委托单
const currentStockPendingOrders = computed(() => {
    if (!props.stock) return [];
    return userStore.getPendingOrdersByStock(props.stock.code);
});

// 方法
const handleClose = () => {
    emit('update:modelValue', false);
};

const switchTradeType = (type) => {
    tradeType.value = type;
    // 重置表单
    if (type !== 'cancel') {
        tradingForm.quantity = 100;
        if (props.stock) {
            tradingForm.price = props.stock.price;
        }
    }
};

const cancelOrder = async (orderId) => {
    try {
        // 查找委托单信息
        const order = currentStockPendingOrders.value.find(o => o.id === orderId);
        if (!order) {
            alert('委托单不存在');
            return;
        }

        // 原生确认对话框
        const confirmMessage = `确定要撤销这笔委托吗？\n\n${order.type === 'buy' ? '买入' : '卖出'} ${order.stockName}\n委托价格：¥${order.price.toFixed(2)}\n委托数量：${order.quantity}股`;

        if (!confirm(confirmMessage)) {
            return;
        }

        const success = userStore.cancelPendingOrder(orderId);
        if (success) {
            alert('委托单已撤销');
        } else {
            alert('撤单失败，该委托单可能已经成交');
        }
    } catch (error) {
        console.error('撤单失败:', error);
        alert('撤单失败，请重试');
    }
};

const formatOrderTime = (timeString) => {
    const date = new Date(timeString);
    return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const adjustPrice = (delta) => {
    const currentPrice = parseFloat(tradingForm.price) || 0;
    const newPrice = Math.max(0, currentPrice + delta);
    tradingForm.price = newPrice.toFixed(2);
};

const setQuickPrice = (type, price = null) => {
    if (!props.stock) return;

    if (price) {
        tradingForm.price = price;
        return;
    }

    const basePrice = parseFloat(props.stock.price);
    switch (type) {
        case 'current':
            tradingForm.price = basePrice.toFixed(2);
            break;
    }
};

const setQuantityByPercent = (percent) => {
    if (!props.stock) return;

    if (tradeType.value === 'sell') {
        const position = userStore.getPosition(props.stock.code);
        const targetQuantity = Math.floor((position?.quantity || 0) * percent / 100 / 100) * 100;
        tradingForm.quantity = Math.max(100, targetQuantity);
    } else {
        const price = tradingForm.orderType === 'market'
            ? parseFloat(props.stock.price)
            : parseFloat(tradingForm.price) || parseFloat(props.stock.price);

        const availableFunds = userStore.balance * percent / 100;
        const targetQuantity = Math.floor(availableFunds / price / 100) * 100;
        tradingForm.quantity = Math.max(100, targetQuantity);
    }
};

const getCurrentTime = () => {
    return new Date().toLocaleTimeString('zh-CN', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};

const confirmTrade = async () => {
    if (!canTrade.value) return;

    // 原生确认对话框
    const confirmMessage = tradeType.value === 'buy'
        ? `确认买入 ${props.stock.name}\n数量: ${tradingForm.quantity}股\n价格: ¥${tradingForm.orderType === 'market' ? props.stock.price : tradingForm.price}\n金额: ¥${estimatedAmount.value.toFixed(2)}`
        : `确认卖出 ${props.stock.name}\n数量: ${tradingForm.quantity}股\n价格: ¥${tradingForm.orderType === 'market' ? props.stock.price : tradingForm.price}\n金额: ¥${estimatedAmount.value.toFixed(2)}`;

    if (!confirm(confirmMessage)) {
        return;
    }

    tradingLoading.value = true;

    try {
        // 模拟交易延迟
        await new Promise(resolve => setTimeout(resolve, 1500));

        const tradePrice = tradingForm.orderType === 'market' ? parseFloat(props.stock.price) : parseFloat(tradingForm.price);

        const tradeData = {
            stock: props.stock,
            type: tradeType.value,
            orderType: tradingForm.orderType,
            price: tradePrice,
            quantity: tradingForm.quantity,
            amount: estimatedAmount.value,
            timestamp: new Date().toISOString()
        };

        // 创建委托单记录
        const orderData = {
            stockCode: props.stock.code,
            stockName: props.stock.name,
            type: tradeType.value,
            orderType: tradingForm.orderType,
            price: tradePrice,
            quantity: tradingForm.quantity,
        };

        const createdOrder = userStore.addPendingOrder(orderData);

        if (tradeType.value === 'buy') {
            // 买入逻辑
            const buyResult = userStore.buyStock(props.stock, tradingForm.quantity, tradePrice);
            if (buyResult.success) {
                alert(`买入委托已提交！\n委托编号：${createdOrder.id.slice(-8)}\n${props.stock.name} ${tradingForm.quantity}股`);
            } else {
                alert(buyResult.message);
                return;
            }
        } else {
            // 卖出逻辑
            const sellResult = userStore.sellStock(props.stock.code, tradingForm.quantity, tradePrice);
            if (sellResult.success) {
                alert(`卖出成功！\n${props.stock.name} ${tradingForm.quantity}股`);
            } else {
                alert('持仓数量不足');
                return;
            }
        }

        emit('trade-completed', tradeData);
        handleClose();

    } catch (error) {
        console.error('交易失败:', error);
        alert('交易失败，请重试');
    } finally {
        tradingLoading.value = false;
    }
};

// 监听股票变化，初始化交易表单
watch(() => props.stock, (newStock) => {
    if (newStock) {
        tradingForm.price = newStock.price;
        tradingForm.quantity = 100;
    }
}, { immediate: true });

// 监听交易类型变化
watch(() => props.tradeType, (newType) => {
    tradeType.value = newType;
}, { immediate: true });
</script>

<style scoped>
.mobile-stock-dialog {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10100;
    /* 提高z-index确保在移动端侧边栏上方显示 */
    animation: fadeIn 0.3s ease-out;
}

.mobile-dialog-container {
    background: #fff;
    border-radius: 16px 16px 0 0;
    width: 100vw;
    height: 90vh;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    position: fixed;
    bottom: 0;
    left: 0;
    animation: slideUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.mobile-dialog-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
}

.stock-info {
    flex: 1;
}

.stock-main-info {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 4px;
}

.stock-name {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
}

.stock-code {
    font-size: 14px;
    opacity: 0.9;
    background: rgba(255, 255, 255, 0.2);
    padding: 2px 8px;
    border-radius: 12px;
}

.stock-price-info {
    display: flex;
    align-items: center;
    gap: 12px;
}

.current-price {
    font-size: 20px;
    font-weight: 700;
}

.price-change {
    font-size: 14px;
    font-weight: 500;
}

.price-change.up {
    color: #4ade80;
}

.price-change.down {
    color: #f87171;
}

.close-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    width: 36px;
    height: 36px;
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
}

.close-btn:active {
    transform: scale(0.95);
    background: rgba(255, 255, 255, 0.3);
}

.trade-type-tabs {
    display: flex;
    margin-bottom: 12px;
    border-bottom: 1px solid #e5e7eb;
}

.tab-item {
    flex: 1;
    padding: 8px 12px;
    text-align: center;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    color: #64748b;
    border-bottom: 2px solid transparent;
    background: transparent;
}

.tab-item.active {
    color: #3b82f6;
    border-bottom-color: #3b82f6;
}

.tab-item:active {
    transform: scale(0.98);
}

.mobile-dialog-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.trading-main-layout {
    display: flex;
    height: 100%;
    overflow: hidden;
}

/* 左侧交易面板 */
.left-trading-panel {
    width: 50%;
    padding: 12px;
    border-right: 1px solid #e5e7eb;
    overflow-y: auto;
    background: #fafafa;
}

.form-section {
    margin-bottom: 12px;
}

.form-label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 6px;
}

.order-type-selector {
    display: flex;
    background: #f1f5f9;
    border-radius: 8px;
    padding: 2px;
    gap: 2px;
}

.order-type-item {
    flex: 1;
    padding: 8px 12px;
    text-align: center;
    font-size: 13px;
    font-weight: 500;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    color: #64748b;
}

.order-type-item.active {
    background: white;
    color: #3b82f6;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.price-input-group,
.quantity-input-group {
    display: flex;
    align-items: center;
    background: white;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    overflow: hidden;
}

.price-input,
.quantity-input {
    flex: 1;
    padding: 8px 10px;
    border: none;
    font-size: 14px;
    outline: none;
}

.price-controls {
    display: flex;
    flex-direction: column;
    border-left: 1px solid #d1d5db;
}

.price-btn {
    background: #f8fafc;
    border: none;
    padding: 4px 8px;
    font-size: 12px;
    font-weight: 600;
    color: #3b82f6;
    cursor: pointer;
    transition: all 0.2s;
}

.price-btn:first-child {
    border-bottom: 1px solid #d1d5db;
}

.price-btn:active {
    background: #e2e8f0;
    transform: scale(0.95);
}

.quick-quantity-buttons {
    display: flex;
    gap: 4px;
    margin-top: 6px;
}

.quick-btn {
    flex: 1;
    padding: 6px 4px;
    background: white;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 500;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s;
}

.quick-btn:active {
    transform: scale(0.95);
    background: #f3f4f6;
}

.available-info,
.trade-summary,
.account-info-section {
    background: white;
    border-radius: 6px;
    padding: 8px;
    margin-bottom: 8px;
    border: 1px solid #e5e7eb;
}

.info-row,
.summary-row,
.account-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;
    margin-bottom: 3px;
}

.info-row:last-child,
.summary-row:last-child,
.account-row:last-child {
    margin-bottom: 0;
}

.label {
    color: #6b7280;
    font-weight: 500;
}

.value {
    color: #111827;
    font-weight: 600;
}

/* 移动端撤单样式 */
.cancel-orders-section {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.no-orders {
    text-align: center;
    padding: 40px 20px;
    color: #9ca3af;
}

.no-orders-icon {
    font-size: 36px;
    margin-bottom: 8px;
    opacity: 0.6;
}

.no-orders-text {
    font-size: 12px;
}

.mobile-orders-list {
    flex: 1;
    overflow-y: auto;
    padding: 4px 0;
}

.mobile-order-item {
    background: white;
    border-radius: 8px;
    margin-bottom: 8px;
    border: 1px solid #e5e7eb;
    overflow: hidden;
}

.mobile-order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 10px;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
}

.mobile-order-type {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 8px;
    color: white;
}

.mobile-order-type.buy {
    background: #ef4444;
}

.mobile-order-type.sell {
    background: #10b981;
}

.mobile-order-time {
    font-size: 10px;
    color: #6b7280;
}

.mobile-order-content {
    padding: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
}

.mobile-order-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.mobile-info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.mobile-info-label {
    font-size: 10px;
    color: #6b7280;
    font-weight: 500;
}

.mobile-info-value {
    font-size: 11px;
    color: #111827;
    font-weight: 600;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
}

.mobile-cancel-btn {
    background: #fee2e2;
    color: #dc2626;
    border: 1px solid #fecaca;
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
}

.mobile-cancel-btn:active {
    transform: scale(0.95);
    background: #fecaca;
}

.action-section {
    margin: 10px 0;
}

.trade-action-btn {
    width: 100%;
    padding: 10px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
}

.trade-action-btn.buy {
    background: #dc2626;
    color: white;
}

.trade-action-btn.sell {
    background: #16a34a;
    color: white;
}

.trade-action-btn:active:not(.disabled) {
    transform: scale(0.98);
}

.trade-action-btn.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* 右侧行情面板 */
.right-market-panel {
    width: 50%;
    background: white;
    overflow-y: auto;
}

.market-depth {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.depth-header {
    padding: 8px 12px;
    background: #f8fafc;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    font-weight: 600;
    color: #374151;
}

.refresh-time {
    font-size: 10px;
    color: #6b7280;
    font-weight: 400;
}

.depth-content {
    flex: 1;
    overflow-y: auto;
}

.depth-table {
    width: 100%;
}

.table-header {
    display: flex;
    padding: 8px 12px;
    background: #f1f5f9;
    border-bottom: 1px solid #e5e7eb;
    font-size: 10px;
    font-weight: 600;
    color: #6b7280;
    min-height: 30px;
    align-items: center;
}

.col-label {
    width: 25%;
}

.col-price {
    width: 45%;
    text-align: center;
}

.col-volume {
    width: 30%;
    text-align: right;
}

.order-row {
    display: flex;
    padding: 6px 12px;
    font-size: 10px;
    cursor: pointer;
    transition: all 0.2s;
    border-bottom: 1px solid #f3f4f6;
    min-height: 28px;
    align-items: center;
}

.order-row:hover {
    background: #f8fafc;
}

.order-row:active {
    background: #e2e8f0;
}

.order-label {
    width: 25%;
    font-weight: 500;
}

.order-price {
    width: 45%;
    text-align: center;
    font-weight: 600;
}

.order-volume {
    width: 30%;
    text-align: right;
    color: #6b7280;
}

.order-row.sell .order-price {
    color: #16a34a;
}

.order-row.buy .order-price {
    color: #dc2626;
}

.current-price-row {
    display: flex;
    padding: 8px 12px;
    background: #fef3c7;
    border: 1px solid #fbbf24;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    min-height: 32px;
    align-items: center;
}

.current-price-row:active {
    background: #fde68a;
}

.current-label {
    width: 25%;
    color: #92400e;
}

.current-value {
    width: 45%;
    text-align: center;
}

.current-value.up {
    color: #dc2626;
}

.current-value.down {
    color: #16a34a;
}

.current-change {
    width: 30%;
    text-align: right;
    color: #6b7280;
}

.loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 1s ease-in-out infinite;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

@keyframes slideUp {
    from {
        transform: translateY(100%);
    }

    to {
        transform: translateY(0);
    }
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* 确保在所有屏幕尺寸下都保持左右布局 */
.trading-main-layout {
    display: flex;
    height: 100%;
    overflow: hidden;
    flex-direction: row !important;
    /* 强制左右布局 */
}

.left-trading-panel {
    width: 65% !important;
    min-width: 65% !important;
    max-width: 65% !important;
}

.right-market-panel {
    width: 35% !important;
    min-width: 35% !important;
    max-width: 35% !important;
}
</style>
