<template>
    <div class="market-index-card">
        <div class="card-header">
            <h3 class="card-title">大盘指数</h3>
            <div class="update-time">{{ updateTime }}</div>
        </div>

        <div class="index-list">
            <div v-for="index in marketIndexes" :key="index.code" class="index-item"
                :class="{ 'positive': index.change > 0, 'negative': index.change < 0 }" @click="analyzeIndex(index)">
                <div class="index-info">
                    <div class="index-name">{{ index.name }}</div>
                    <div class="index-code">{{ index.code }}</div>
                </div>
                <div class="index-data">
                    <div class="index-price">{{ index.price }}</div>
                    <div class="index-change">
                        <span class="change-value">{{ index.change > 0 ? '+' : '' }}{{ index.change }}</span>
                        <span class="change-percent">({{ index.changePercent > 0 ? '+' : '' }}{{ index.changePercent
                            }}%)</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

// 定义emit
const emit = defineEmits(['send-to-chat']);

const updateTime = ref('');
const marketIndexes = ref([
    {
        code: 'SH000001',
        name: '上证指数',
        price: '3245.68',
        change: 12.45,
        changePercent: 0.38
    },
    {
        code: 'SZ399001',
        name: '深证成指',
        price: '10856.32',
        change: -23.67,
        changePercent: -0.22
    },
    {
        code: 'SZ399006',
        name: '创业板指',
        price: '2134.89',
        change: 8.92,
        changePercent: 0.42
    },
    {
        code: 'SH000300',
        name: '沪深300',
        price: '3876.54',
        change: 15.23,
        changePercent: 0.39
    }
]);

let updateTimer = null;

const updateData = () => {
    // 模拟数据更新
    marketIndexes.value.forEach(index => {
        const randomChange = (Math.random() - 0.5) * 20;
        const randomPercent = (Math.random() - 0.5) * 2;

        index.change = parseFloat(randomChange.toFixed(2));
        index.changePercent = parseFloat(randomPercent.toFixed(2));

        // 根据涨跌更新价格
        const basePrice = parseFloat(index.price);
        const newPrice = basePrice + randomChange;
        index.price = newPrice.toFixed(2);
    });

    updateTime.value = new Date().toLocaleTimeString('zh-CN', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};

// 分析指数
const analyzeIndex = (index) => {
    emit('send-to-chat', {
        type: 'market',
        content: index,
        title: `${index.name}指数分析`
    });
};

onMounted(() => {
    updateData();
    // 每30秒更新一次数据
    updateTimer = setInterval(updateData, 30000);
});

onUnmounted(() => {
    if (updateTimer) {
        clearInterval(updateTimer);
    }
});
</script>

<style scoped>
.market-index-card {
    background: #fff;
    border-radius: 12px;
    border: 1px solid #f0f0f0;
    overflow: hidden;
    min-height: calc(100vh - 200px);
    display: flex;
    flex-direction: column;
    margin: 4px;
}

.card-header {
    padding: 12px 16px 8px 16px;
    border-bottom: 1px solid #f5f5f5;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.card-title {
    font-size: 1rem;
    font-weight: 600;
    color: #18181b;
    margin: 0;
}

.update-time {
    font-size: 0.75rem;
    color: #9ca3af;
}

.index-list {
    padding: 8px 0 20px 0;
    flex: 1;
    overflow-y: auto;
    min-height: 0;
}

.index-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 16px;
    transition: background-color 0.2s;
    cursor: pointer;
}

.index-item:hover {
    background: #f9fafb;
}

.index-info {
    flex: 1;
}

.index-name {
    font-size: 0.9rem;
    font-weight: 500;
    color: #18181b;
    margin-bottom: 2px;
}

.index-code {
    font-size: 0.75rem;
    color: #9ca3af;
}

.index-data {
    text-align: right;
}

.index-price {
    font-size: 0.95rem;
    font-weight: 600;
    color: #18181b;
    margin-bottom: 2px;
}

.index-change {
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    gap: 4px;
}

.positive .change-value,
.positive .change-percent {
    color: #ef4444;
}

.negative .change-value,
.negative .change-percent {
    color: #10b981;
}

.change-value {
    font-weight: 500;
}

.change-percent {
    opacity: 0.8;
}

/* 移动端响应式样式 */
@media (max-width: 768px) {

    /* 移动端容器优化 */
    .market-index-card {
        min-height: auto !important;
        margin: 0 !important;
        border-radius: 8px !important;
        overflow: visible !important;
    }

    /* 移动端头部优化 */
    .card-header {
        padding: 12px 16px 8px 16px !important;
        border-radius: 8px 8px 0 0 !important;
    }

    .card-title {
        font-size: 1rem !important;
    }

    .update-time {
        font-size: 0.7rem !important;
    }

    /* 移动端列表优化 */
    .index-list {
        padding: 8px 0 12px 0 !important;
        overflow: visible !important;
        flex: none !important;
    }

    .index-item {
        padding: 8px 12px !important;
        border-radius: 6px !important;
        margin: 0 8px 6px 8px !important;
        background: #f8fafc !important;
        border: 1px solid #e2e8f0 !important;
    }

    .index-item:hover {
        background: #f1f5f9 !important;
        transform: translateY(-1px) !important;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
    }

    .index-name {
        font-size: 0.85rem !important;
        margin-bottom: 1px !important;
    }

    .index-code {
        font-size: 0.7rem !important;
    }

    .index-price {
        font-size: 0.9rem !important;
        margin-bottom: 1px !important;
    }

    .index-change {
        font-size: 0.75rem !important;
        gap: 3px !important;
    }
}

/* 移动端侧边栏专用样式 */
@media (max-width: 768px) {

    /* 在移动端侧边栏中进一步优化 */
    .sidebar-container .market-index-card {
        border: none !important;
        background: transparent !important;
        box-shadow: none !important;
        margin: 0 !important;
    }

    .sidebar-container .card-header {
        display: none !important;
    }

    .sidebar-container .index-list {
        padding: 0 6px 12px 6px !important;
    }

    .sidebar-container .index-item {
        margin: 0 0 6px 0 !important;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
    }
}
</style>
