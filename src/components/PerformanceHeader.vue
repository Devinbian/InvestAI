<template>
    <div class="performance-header" :class="[performanceClass, { 'mobile': isMobile }]">
        <div class="header-content">
            <!-- 情感化问候 -->
            <div class="greeting-section">
                <div class="greeting-icon">{{ greetingData.icon }}</div>
                <div class="greeting-text">
                    <h2 class="greeting-title">{{ greetingData.title }}</h2>
                    <p class="greeting-subtitle">{{ greetingData.subtitle }}</p>
                </div>
            </div>

            <!-- 收益概览 -->
            <div class="performance-overview">
                <div class="performance-item">
                    <div class="performance-label">今日收益</div>
                    <div class="performance-value" :class="todayProfitClass">
                        {{ formatProfit(performanceData.todayProfit) }}
                    </div>
                </div>
                <div class="performance-item">
                    <div class="performance-label">总收益</div>
                    <div class="performance-value" :class="totalProfitClass">
                        {{ formatProfit(performanceData.totalProfit) }}
                    </div>
                </div>
                <div class="performance-item">
                    <div class="performance-label">收益率</div>
                    <div class="performance-value" :class="totalProfitClass">
                        {{ formatPercent(performanceData.totalProfitRate) }}
                    </div>
                </div>
            </div>
        </div>

        <!-- 背景装饰 -->
        <div class="header-decoration">
            <div class="decoration-circle circle-1"></div>
            <div class="decoration-circle circle-2"></div>
            <div class="decoration-circle circle-3"></div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';

// Props
const props = defineProps({
    performanceData: {
        type: Object,
        default: () => ({
            todayProfit: 0,
            totalProfit: 0,
            totalProfitRate: 0,
            portfolioValue: 0
        })
    }
});

// 检测移动端
const isMobile = computed(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768;
});

// 计算属性：根据收益状态确定情感化内容
const greetingData = computed(() => {
    const { totalProfit } = props.performanceData;
    const hour = new Date().getHours();

    // 时间问候
    let timeGreeting = '早上好';
    if (hour >= 12 && hour < 18) timeGreeting = '下午好';
    else if (hour >= 18) timeGreeting = '晚上好';

    // 根据收益状态确定情感化内容
    if (totalProfit > 1000) {
        return {
            icon: '🎉',
            title: `${timeGreeting}，投资达人！`,
            subtitle: '您的投资表现非常出色，继续保持这个节奏！'
        };
    } else if (totalProfit > 0) {
        return {
            icon: '😊',
            title: `${timeGreeting}，稳健投资者！`,
            subtitle: '投资收益稳步增长，您的策略很不错！'
        };
    } else if (totalProfit > -500) {
        return {
            icon: '💪',
            title: `${timeGreeting}，坚持就是胜利！`,
            subtitle: '市场有起伏很正常，让我们一起寻找机会！'
        };
    } else {
        return {
            icon: '🌟',
            title: `${timeGreeting}，机会总在等待！`,
            subtitle: '每一次调整都是新的开始，让我们重新出发！'
        };
    }
});

// 收益状态类名
const performanceClass = computed(() => {
    const { totalProfit } = props.performanceData;
    if (totalProfit > 0) return 'performance-positive';
    if (totalProfit < -500) return 'performance-negative';
    return 'performance-neutral';
});

const todayProfitClass = computed(() => {
    const profit = props.performanceData.todayProfit;
    return profit > 0 ? 'profit' : profit < 0 ? 'loss' : 'neutral';
});

const totalProfitClass = computed(() => {
    const profit = props.performanceData.totalProfit;
    return profit > 0 ? 'profit' : profit < 0 ? 'loss' : 'neutral';
});

// 格式化方法
const formatProfit = (value) => {
    if (value === 0) return '¥0.00';
    const prefix = value > 0 ? '+' : '';
    return `${prefix}¥${Math.abs(value).toFixed(2)}`;
};

const formatPercent = (value) => {
    if (value === 0) return '0.00%';
    const prefix = value > 0 ? '+' : '';
    return `${prefix}${value.toFixed(2)}%`;
};
</script>

<style scoped>
.performance-header {
    position: relative;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 16px;
    padding: 24px;
    color: white;
    overflow: hidden;
    margin-bottom: 20px;
    transition: all 0.3s ease;
}

.performance-header.performance-positive {
    background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.performance-header.performance-negative {
    background: linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%);
}

.performance-header.performance-neutral {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.header-content {
    position: relative;
    z-index: 2;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
}

.greeting-section {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
}

.greeting-icon {
    font-size: 2.5rem;
    animation: bounce 2s infinite;
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
        transform: translateY(-10px);
    }

    60% {
        transform: translateY(-5px);
    }
}

.greeting-text {
    flex: 1;
}

.greeting-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 8px 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.greeting-subtitle {
    font-size: 0.95rem;
    opacity: 0.9;
    margin: 0;
    line-height: 1.4;
}

.performance-overview {
    display: flex;
    gap: 20px;
    align-items: center;
}

.performance-item {
    text-align: center;
    min-width: 80px;
}

.performance-label {
    font-size: 0.8rem;
    opacity: 0.8;
    margin-bottom: 4px;
}

.performance-value {
    font-size: 1.1rem;
    font-weight: 600;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.performance-value.profit {
    color: #4ade80;
    text-shadow: 0 0 8px rgba(74, 222, 128, 0.3);
}

.performance-value.loss {
    color: #f87171;
    text-shadow: 0 0 8px rgba(248, 113, 113, 0.3);
}

.performance-value.neutral {
    color: #e5e7eb;
}

/* 背景装饰 */
.header-decoration {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
    overflow: hidden;
}

.decoration-circle {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    animation: float 6s ease-in-out infinite;
}

.circle-1 {
    width: 120px;
    height: 120px;
    top: -60px;
    right: -60px;
    animation-delay: 0s;
}

.circle-2 {
    width: 80px;
    height: 80px;
    bottom: -40px;
    left: -40px;
    animation-delay: 2s;
}

.circle-3 {
    width: 60px;
    height: 60px;
    top: 50%;
    right: 20%;
    animation-delay: 4s;
}

@keyframes float {

    0%,
    100% {
        transform: translateY(0px) rotate(0deg);
        opacity: 0.1;
    }

    50% {
        transform: translateY(-20px) rotate(180deg);
        opacity: 0.2;
    }
}

/* 移动端适配 */
.performance-header.mobile {
    padding: 20px 16px;
    border-radius: 12px;
    margin-bottom: 16px;
}

.performance-header.mobile .header-content {
    flex-direction: column;
    gap: 16px;
}

.performance-header.mobile .greeting-section {
    gap: 12px;
}

.performance-header.mobile .greeting-icon {
    font-size: 2rem;
}

.performance-header.mobile .greeting-title {
    font-size: 1.25rem;
}

.performance-header.mobile .greeting-subtitle {
    font-size: 0.875rem;
}

.performance-header.mobile .performance-overview {
    justify-content: space-around;
    width: 100%;
    gap: 16px;
}

.performance-header.mobile .performance-item {
    min-width: 70px;
}

.performance-header.mobile .performance-label {
    font-size: 0.75rem;
}

.performance-header.mobile .performance-value {
    font-size: 1rem;
}

/* 超小屏幕适配 */
@media (max-width: 480px) {
    .performance-header.mobile {
        padding: 16px 12px;
    }

    .performance-header.mobile .greeting-icon {
        font-size: 1.5rem;
    }

    .performance-header.mobile .greeting-title {
        font-size: 1.1rem;
    }

    .performance-header.mobile .greeting-subtitle {
        font-size: 0.8rem;
    }

    .performance-header.mobile .performance-overview {
        gap: 12px;
    }

    .performance-header.mobile .performance-item {
        min-width: 60px;
    }

    .performance-header.mobile .performance-value {
        font-size: 0.9rem;
    }
}
</style>
