<template>
    <div class="market-index-card">
        <div class="card-header">
            <div class="header-content">
                <div class="title-section">
                    <div class="title-icon">📈</div>
                    <h3 class="card-title">大盘指数</h3>
                </div>
                <div class="market-status">
                    <div class="status-indicator" :class="marketTrend"></div>
                    <div class="update-time">{{ updateTime }}</div>
                </div>
            </div>
        </div>

        <div class="index-list">
            <div v-for="(index, idx) in marketIndexes" :key="index.code" class="index-card"
                :class="{ 'positive': index.change > 0, 'negative': index.change < 0, 'neutral': index.change === 0 }"
                @click="analyzeIndex(index)" :style="{ '--delay': idx * 0.1 + 's' }">

                <!-- 背景装饰 -->
                <div class="card-background"></div>

                <!-- 趋势图标 -->
                <div class="trend-icon">
                    <div class="trend-arrow" :class="index.change > 0 ? 'up' : index.change < 0 ? 'down' : 'flat'">
                        <svg v-if="index.change > 0" width="14" height="14" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="12" y1="19" x2="12" y2="5"></line>
                            <polyline points="5,12 12,5 19,12"></polyline>
                        </svg>
                        <svg v-else-if="index.change < 0" width="14" height="14" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <polyline points="19,12 12,19 5,12"></polyline>
                        </svg>
                        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="3" stroke-linecap="round">
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                    </div>
                </div>

                <!-- 主要内容 -->
                <div class="index-content">
                    <div class="index-header">
                        <div class="index-info">
                            <div class="index-name">{{ index.name }}</div>
                            <div class="index-code">{{ index.code }}</div>
                        </div>
                        <div class="index-price-section">
                            <div class="index-price" :key="index.value">{{ index.value }}</div>
                        </div>
                    </div>

                    <!-- 涨跌信息 -->
                    <div class="change-section">
                        <div class="change-info">
                            <span class="change-value">{{ index.change > 0 ? '+' : '' }}{{ index.change }}</span>
                            <span class="change-percent">({{ index.rise > 0 ? '+' : '' }}{{ index.rise
                                }}%)</span>
                        </div>

                        <!-- 涨跌幅度进度条 -->
                        <div class="change-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" :style="{
                                    width: Math.min(Math.abs(index.rise) * 10, 100) + '%',
                                    backgroundColor: index.change > 0 ? '#ef4444' : index.change < 0 ? '#10b981' : '#6b7280'
                                }"></div>
                            </div>
                        </div>
                    </div>

                    <!-- 迷你趋势图 -->
                    <!-- <div class="mini-chart">
                        <svg width="100%" height="24" class="trend-line">
                            <path :d="generateTrendPath(index)"
                                :stroke="index.change > 0 ? '#ef4444' : index.change < 0 ? '#10b981' : '#6b7280'"
                                stroke-width="1.5" fill="none" />
                        </svg>
                    </div> -->
                </div>

                <!-- 悬停效果装饰 -->
                <div class="hover-overlay"></div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { getMarketIndices } from '@/api/api.js';
import { ref, onMounted, onUnmounted, computed } from 'vue';

// 定义emit
const emit = defineEmits(['send-to-chat']);

const updateTime = ref('');
const marketIndexes = ref([]);

// 计算整体市场趋势
const marketTrend = computed(() => {
    const positiveCount = marketIndexes.value.filter(index => index.change > 0).length;
    const totalCount = marketIndexes.value.length;

    if (positiveCount >= totalCount * 0.75) return 'bullish';
    if (positiveCount <= totalCount * 0.25) return 'bearish';
    return 'mixed';
});

let updateTimer = null;

// 生成趋势路径
const generateTrendPath = (index) => {
    const width = 80;
    const height = 20;
    const data = index.trendData || [];

    if (data.length < 2) return '';

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((value, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((value - min) / range) * height;
        return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
};

const updateData = () => {
    getMarketIndices().then((res) => {
        if (res.data.success) {
            marketIndexes.value = res.data.data;
        }
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
    background: transparent;
    border-radius: 0;
    border: none;
    overflow: visible;
    /* 改为visible，让内容可以自然流动 */
    min-height: calc(100vh - 200px);
    display: flex;
    flex-direction: column;
    margin: 0;
    position: relative;
    box-shadow: none;
}



.card-header {
    padding: 16px 20px;
    background: #fafafa;
    border-bottom: 1px solid #f0f0f0;
    position: relative;
    z-index: 2;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.title-section {
    display: flex;
    align-items: center;
    gap: 8px;
}

.title-icon {
    font-size: 1.2rem;
}

.card-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
}

.market-status {
    display: flex;
    align-items: center;
    gap: 8px;
}

.status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    animation: pulse 2s infinite;
}

.status-indicator.bullish {
    background: #10b981;
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
}

.status-indicator.bearish {
    background: #ef4444;
    box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
}

.status-indicator.mixed {
    background: #f59e0b;
    box-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
}

.update-time {
    font-size: 0.75rem;
    color: #6b7280;
    font-weight: 500;
}

.index-list {
    padding: 16px 12px 20px 12px;
    flex: 1;
    overflow-y: visible;
    min-height: 0;
    position: relative;
    z-index: 1;
}

.index-card {
    position: relative;
    margin-bottom: 12px;
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    animation: slideInUp 0.5s ease-out var(--delay);
    transform-origin: center;
}

.index-card:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.card-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.3);
}

.positive .card-background {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(255, 255, 255, 0.95) 100%);
    border-left: 3px solid #ef4444;
}

.negative .card-background {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(255, 255, 255, 0.95) 100%);
    border-left: 3px solid #10b981;
}

.neutral .card-background {
    background: linear-gradient(135deg, rgba(107, 114, 128, 0.1) 0%, rgba(255, 255, 255, 0.95) 100%);
    border-left: 3px solid #6b7280;
}

.trend-icon {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 3;
}

.trend-arrow {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: bold;
    color: white;
    animation: bounce 2s infinite;
    transition: all 0.3s ease;
}

.trend-arrow.up {
    background: #ef4444;
    color: white;
    box-shadow: 0 1px 3px rgba(239, 68, 68, 0.2);
}

.trend-arrow.down {
    background: #10b981;
    color: white;
    box-shadow: 0 1px 3px rgba(16, 185, 129, 0.2);
}

.trend-arrow.flat {
    background: #6b7280;
    color: white;
    box-shadow: 0 1px 3px rgba(107, 114, 128, 0.2);
}

.index-content {
    position: relative;
    z-index: 2;
    padding: 16px 40px 16px 16px;
}

.index-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
}

.index-info {
    flex: 1;
}

.index-name {
    font-size: 0.95rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 4px;
    line-height: 1.2;
}

.index-code {
    font-size: 0.75rem;
    color: #6b7280;
    font-family: 'Courier New', monospace;
    background: rgba(107, 114, 128, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
    display: inline-block;
}

.index-price-section {
    text-align: right;
}

.index-price {
    font-size: 1.1rem;
    font-weight: 700;
    color: #1f2937;
    font-family: 'Courier New', monospace;
    animation: numberChange 0.5s ease-out;
}

.change-section {
    margin-bottom: 12px;
}

.change-info {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
}

.change-value {
    font-weight: 600;
    font-size: 0.85rem;
    font-family: 'Courier New', monospace;
}

.change-percent {
    font-size: 0.8rem;
    opacity: 0.8;
    font-family: 'Courier New', monospace;
}

.positive .change-value,
.positive .change-percent {
    color: #ef4444;
}

.negative .change-value,
.negative .change-percent {
    color: #10b981;
}

.neutral .change-value,
.neutral .change-percent {
    color: #6b7280;
}

.change-progress {
    width: 100%;
}

.progress-bar {
    width: 100%;
    height: 3px;
    background: rgba(107, 114, 128, 0.2);
    border-radius: 2px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.5s ease-out;
    animation: progressGrow 1s ease-out;
}

.mini-chart {
    height: 24px;
    opacity: 0.7;
    transition: opacity 0.3s ease;
}

.index-card:hover .mini-chart {
    opacity: 1;
}

.trend-line {
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

.hover-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
    z-index: 4;
}

.index-card:hover .hover-overlay {
    opacity: 1;
}

/* 动画定义 */
@keyframes slideInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.5;
    }
}

@keyframes bounce {

    0%,
    20%,
    50%,
    80%,
    100% {
        transform: translateY(0);
    }

    40% {
        transform: translateY(-2px);
    }

    60% {
        transform: translateY(-1px);
    }
}

@keyframes numberChange {
    0% {
        transform: scale(1.1);
        color: #f59e0b;
    }

    100% {
        transform: scale(1);
    }
}

@keyframes progressGrow {
    from {
        width: 0;
    }
}

/* 移动端响应式样式 */
@media (max-width: 768px) {
    .market-index-card {
        min-height: auto !important;
        margin: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        background: transparent !important;
        border: none !important;
    }

    .card-header {
        padding: 12px 16px !important;
    }

    .title-section {
        gap: 6px !important;
    }

    .title-icon {
        font-size: 1rem !important;
    }

    .card-title {
        font-size: 1rem !important;
    }

    .update-time {
        font-size: 0.7rem !important;
    }

    .index-list {
        padding: 12px 8px 16px 8px !important;
    }

    .index-card {
        margin-bottom: 8px !important;
        border-radius: 10px !important;
    }

    .index-content {
        padding: 12px 32px 12px 12px !important;
    }

    .index-header {
        margin-bottom: 8px !important;
    }

    .index-name {
        font-size: 0.85rem !important;
        margin-bottom: 2px !important;
    }

    .index-code {
        font-size: 0.7rem !important;
        padding: 1px 4px !important;
    }

    .index-price {
        font-size: 1rem !important;
    }

    .change-info {
        gap: 4px !important;
        margin-bottom: 6px !important;
    }

    .change-value {
        font-size: 0.8rem !important;
    }

    .change-percent {
        font-size: 0.75rem !important;
    }

    .change-section {
        margin-bottom: 8px !important;
    }

    .trend-icon {
        top: 8px !important;
        right: 8px !important;
    }

    .trend-arrow {
        width: 18px !important;
        height: 18px !important;
        font-size: 9px !important;
        opacity: 0.85 !important;
        animation: none !important;
    }

    .trend-arrow.up {
        background: #ef4444 !important;
        color: white !important;
        box-shadow: 0 1px 2px rgba(239, 68, 68, 0.25) !important;
    }

    .trend-arrow.down {
        background: #10b981 !important;
        color: white !important;
        box-shadow: 0 1px 2px rgba(16, 185, 129, 0.25) !important;
    }

    .trend-arrow.flat {
        background: #6b7280 !important;
        color: white !important;
        box-shadow: 0 1px 2px rgba(107, 114, 128, 0.25) !important;
    }

    .trend-arrow svg {
        width: 12px !important;
        height: 12px !important;
        stroke-width: 2.5 !important;
    }

    .mini-chart {
        height: 20px !important;
    }
}

/* 移动端侧边栏专用样式 */
@media (max-width: 768px) {
    .sidebar-container .market-index-card {
        background: transparent !important;
        box-shadow: none !important;
        margin: 0 !important;
        border-radius: 0 !important;
        /* 移除min-height限制，让内容自然流动 */
        min-height: auto !important;
    }

    /* 移动端侧边栏中移除index-list的滚动条，使用tab-panel的统一滚动 */
    .sidebar-container .index-list {
        overflow-y: visible !important;
        max-height: none !important;
        height: auto !important;
        flex: none !important;
    }



    .sidebar-container .card-header {
        background: #f8fafc !important;
        border-radius: 8px !important;
        margin: 0 8px 12px 8px !important;
        border: 1px solid #e2e8f0 !important;
    }

    .sidebar-container .card-title {
        color: #374151 !important;
    }

    .sidebar-container .update-time {
        color: #6b7280 !important;
    }

    .sidebar-container .index-list {
        padding: 0 6px 12px 6px !important;
    }

    .sidebar-container .index-card {
        margin-bottom: 6px !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
    }

    .sidebar-container .index-card:hover {
        transform: translateY(-1px) scale(1.01) !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12) !important;
    }

    .sidebar-container .index-content {
        padding: 10px 28px 10px 10px !important;
    }

    .sidebar-container .index-name {
        font-size: 0.8rem !important;
    }

    .sidebar-container .index-code {
        font-size: 0.65rem !important;
    }

    .sidebar-container .index-price {
        font-size: 0.9rem !important;
    }

    .sidebar-container .change-value {
        font-size: 0.75rem !important;
    }

    .sidebar-container .change-percent {
        font-size: 0.7rem !important;
    }

    .sidebar-container .trend-arrow {
        width: 16px !important;
        height: 16px !important;
        font-size: 8px !important;
        opacity: 0.75 !important;
        animation: none !important;
    }

    .sidebar-container .trend-arrow.up {
        background: #ef4444 !important;
        color: white !important;
        box-shadow: 0 1px 2px rgba(239, 68, 68, 0.2) !important;
    }

    .sidebar-container .trend-arrow.down {
        background: #10b981 !important;
        color: white !important;
        box-shadow: 0 1px 2px rgba(16, 185, 129, 0.2) !important;
    }

    .sidebar-container .trend-arrow.flat {
        background: #6b7280 !important;
        color: white !important;
        box-shadow: 0 1px 2px rgba(107, 114, 128, 0.2) !important;
    }

    .sidebar-container .trend-arrow svg {
        width: 10px !important;
        height: 10px !important;
        stroke-width: 2.2 !important;
    }
}
</style>
