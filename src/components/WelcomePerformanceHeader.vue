<template>
    <div class="welcome-performance-header" :class="[performanceClass, { 'mobile': isMobile }]">
        <div class="header-content">
            <!-- 情感化问候 -->
            <div class="greeting-section">
                <div class="greeting-icon">{{ greetingData.icon }}</div>
                <div class="greeting-text">
                    <h2 class="greeting-title">{{ greetingData.title }}</h2>
                    <p class="greeting-subtitle">{{ greetingData.subtitle }}</p>
                </div>
            </div>

            <!-- 收益概览 - 仅在有数据时显示 -->
            <div v-if="hasPerformanceData" class="performance-overview">
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

        <!-- 背景装饰 - 更轻量化 -->
        <div class="header-decoration">
            <div class="decoration-circle circle-1"></div>
            <div class="decoration-circle circle-2"></div>
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
    },
    userName: {
        type: String,
        default: ''
    }
});

// 检测移动端
const isMobile = computed(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768;
});

// 是否有性能数据
const hasPerformanceData = computed(() => {
    return props.performanceData.totalProfit !== 0 || props.performanceData.portfolioValue > 0;
});

// 计算属性：根据收益状态确定情感化内容
const greetingData = computed(() => {
    const { totalProfit } = props.performanceData;
    const hour = new Date().getHours();

    // 时间问候
    let timeGreeting = '早上好';
    if (hour >= 12 && hour < 18) timeGreeting = '下午好';
    else if (hour >= 18) timeGreeting = '晚上好';

    // 用户名处理
    const userGreeting = props.userName ? `${timeGreeting}，${props.userName}` : `${timeGreeting}`;

    // 如果没有投资数据，显示通用欢迎语
    if (!hasPerformanceData.value) {
        return {
            icon: '🌟',
            title: userGreeting,
            subtitle: '开始您的智能投资之旅，让AI为您分析市场机会'
        };
    }

    // 根据收益状态确定情感化内容
    if (totalProfit > 1000) {
        return {
            icon: '🎉',
            title: `${userGreeting}，投资达人！`,
            subtitle: '您的投资表现非常出色，继续保持这个节奏！'
        };
    } else if (totalProfit > 0) {
        return {
            icon: '😊',
            title: `${userGreeting}，稳健投资者！`,
            subtitle: '投资收益稳步增长，您的策略很不错！'
        };
    } else if (totalProfit > -500) {
        return {
            icon: '💪',
            title: `${userGreeting}，坚持就是胜利！`,
            subtitle: '市场有起伏很正常，让我们一起寻找机会！'
        };
    } else {
        return {
            icon: '🌟',
            title: `${userGreeting}，机会总在等待！`,
            subtitle: '每一次调整都是新的开始，让我们重新出发！'
        };
    }
});

// 收益状态类名
const performanceClass = computed(() => {
    if (!hasPerformanceData.value) return 'performance-welcome';

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
.welcome-performance-header {
    position: relative;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 20px;
    color: #1f2937;
    overflow: hidden;
    margin-bottom: 24px;
    transition: all 0.3s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.welcome-performance-header.performance-positive {
    background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
    border-color: #10b981;
    color: #065f46;
}

.welcome-performance-header.performance-negative {
    background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
    border-color: #ef4444;
    color: #7f1d1d;
}

.welcome-performance-header.performance-neutral {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border-color: #f59e0b;
    color: #78350f;
}

.welcome-performance-header.performance-welcome {
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    border-color: #3b82f6;
    color: #1e40af;
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
    gap: 12px;
    flex: 1;
}

.greeting-icon {
    font-size: 2rem;
    animation: gentle-bounce 3s ease-in-out infinite;
}

@keyframes gentle-bounce {

    0%,
    100% {
        transform: translateY(0px);
    }

    50% {
        transform: translateY(-3px);
    }
}

.greeting-text {
    flex: 1;
}

.greeting-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 4px 0;
    line-height: 1.3;
}

.greeting-subtitle {
    font-size: 0.9rem;
    opacity: 0.8;
    margin: 0;
    line-height: 1.4;
    font-weight: 400;
}

.performance-overview {
    display: flex;
    gap: 16px;
    align-items: center;
}

.performance-item {
    text-align: center;
    min-width: 70px;
}

.performance-label {
    font-size: 0.75rem;
    opacity: 0.7;
    margin-bottom: 2px;
    font-weight: 500;
}

.performance-value {
    font-size: 1rem;
    font-weight: 600;
}

.performance-value.profit {
    color: #059669;
}

.performance-value.loss {
    color: #dc2626;
}

.performance-value.neutral {
    color: #6b7280;
}

/* 背景装饰 - 更轻量化 */
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
    background: rgba(255, 255, 255, 0.3);
    animation: float 8s ease-in-out infinite;
}

.circle-1 {
    width: 80px;
    height: 80px;
    top: -40px;
    right: -40px;
    animation-delay: 0s;
}

.circle-2 {
    width: 60px;
    height: 60px;
    bottom: -30px;
    left: -30px;
    animation-delay: 4s;
}

@keyframes float {

    0%,
    100% {
        transform: translateY(0px) rotate(0deg);
        opacity: 0.3;
    }

    50% {
        transform: translateY(-10px) rotate(180deg);
        opacity: 0.5;
    }
}

/* 移动端适配 */
.welcome-performance-header.mobile {
    padding: 16px;
    border-radius: 12px;
    margin-bottom: 16px;
}

/* 微信浏览器环境下的间距调整 */
@media (max-width: 768px) {
    body.wechat-browser .welcome-performance-header {
        margin-top: 0px !important;
        /* 不需要额外的顶部间距，主页内容已有padding-top */
        margin-bottom: 4px !important;
        /* 进一步减少微信端底部间距 */
    }

    /* 非微信浏览器环境下适当增加底部间距 */
    body:not(.wechat-browser) .welcome-performance-header {
        margin-bottom: 60px !important;
    }
}

.welcome-performance-header.mobile .header-content {
    flex-direction: column;
    gap: 12px;
}

.welcome-performance-header.mobile .greeting-section {
    gap: 10px;
}

.welcome-performance-header.mobile .greeting-icon {
    font-size: 1.5rem;
}

.welcome-performance-header.mobile .greeting-title {
    font-size: 1.25rem;
}

.welcome-performance-header.mobile .greeting-subtitle {
    font-size: 0.8rem;
}

.welcome-performance-header.mobile .performance-overview {
    justify-content: space-around;
    width: 100%;
    gap: 12px;
}

.welcome-performance-header.mobile .performance-item {
    min-width: 60px;
}

.welcome-performance-header.mobile .performance-label {
    font-size: 0.7rem;
}

.welcome-performance-header.mobile .performance-value {
    font-size: 0.9rem;
}

/* 超小屏幕适配 */
@media (max-width: 480px) {
    .welcome-performance-header.mobile {
        padding: 12px;
    }

    .welcome-performance-header.mobile .greeting-icon {
        font-size: 1.25rem;
    }

    .welcome-performance-header.mobile .greeting-title {
        font-size: 1.1rem;
    }

    .welcome-performance-header.mobile .greeting-subtitle {
        font-size: 0.75rem;
    }

    .welcome-performance-header.mobile .performance-overview {
        gap: 8px;
    }

    .welcome-performance-header.mobile .performance-item {
        min-width: 50px;
    }

    .welcome-performance-header.mobile .performance-value {
        font-size: 0.8rem;
    }
}
</style>
