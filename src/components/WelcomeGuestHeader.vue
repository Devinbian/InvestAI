<template>
    <div class="welcome-guest-header">
        <div class="header-content">
            <div class="greeting-section">
                <div class="greeting-icon">🌟</div>
                <div class="greeting-text">
                    <h2 class="greeting-title">{{ getGreetingTitle() }}</h2>
                    <p class="greeting-subtitle">{{ getGreetingSubtitle() }}</p>
                </div>
            </div>
        </div>
        <div class="header-decoration">
            <div class="decoration-circle circle-1"></div>
            <div class="decoration-circle circle-2"></div>
        </div>
    </div>
</template>

<script setup>
import { onMounted, nextTick } from 'vue';

// 检测微信浏览器环境
const isWechatBrowser = () => {
    const ua = navigator.userAgent.toLowerCase();
    return ua.includes('micromessenger');
};

// 问候语功能
const getGreetingTitle = () => {
    const hour = new Date().getHours();
    const greeting = hour < 6 ? '夜深了' :
        hour < 9 ? '早上好' :
            hour < 12 ? '上午好' :
                hour < 14 ? '中午好' :
                    hour < 18 ? '下午好' :
                        hour < 22 ? '晚上好' : '夜深了';

    return `${greeting}，我是智投小助`;
};

const getGreetingSubtitle = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '深夜时分也在关注投资，很专业！';
    if (hour < 9) return '开始新的投资之旅吧';
    if (hour < 12) return '今天的市场如何？一起来分析';
    if (hour < 14) return '午间休息，回顾一下投资情况';
    if (hour < 18) return '下午时光，继续投资分析';
    if (hour < 22) return '晚间总结时间，看看今日收获';
    return '夜深了，适度休息也很重要哦';
};

// 组件挂载后处理微信环境适配
onMounted(() => {
    const isWechatEnv = isWechatBrowser();
    if (isWechatEnv) {
        document.body.classList.add('wechat-browser');

        // 微信环境下的样式调整通过CSS处理，避免动态设置导致的布局问题
        nextTick(() => {
            const welcomeSection = document.querySelector('.welcome-section');
            // 只调整快捷示例区域与问候语的间距，不调整问候语本身的margin
            if (welcomeSection) {
                welcomeSection.style.setProperty('margin-top', '20px', 'important');
            }
        });
    }
});
</script>

<style scoped>
/* 未登录用户的统一样式头部 */
.welcome-guest-header {
    position: relative;
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    border: 1px solid #3b82f6;
    border-radius: 16px;
    padding: 20px;
    color: #1e40af;
    overflow: hidden;
    margin-bottom: 24px;
    transition: all 0.3s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.welcome-guest-header .header-content {
    position: relative;
    z-index: 2;
    display: flex;
    justify-content: center;
    align-items: center;
}

.welcome-guest-header .greeting-section {
    display: flex;
    align-items: center;
    gap: 12px;
}

.welcome-guest-header .greeting-icon {
    font-size: 2rem;
    animation: gentle-bounce 3s ease-in-out infinite;
}

.welcome-guest-header .greeting-text {
    text-align: left;
}

.welcome-guest-header .greeting-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 4px 0;
    line-height: 1.3;
    color: inherit;
}

.welcome-guest-header .greeting-subtitle {
    font-size: 0.9rem;
    opacity: 0.8;
    margin: 0;
    line-height: 1.4;
    font-weight: 400;
    color: inherit;
}

.welcome-guest-header .header-decoration {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
    overflow: hidden;
}

.welcome-guest-header .decoration-circle {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    animation: float 8s ease-in-out infinite;
}

.welcome-guest-header .circle-1 {
    width: 80px;
    height: 80px;
    top: -40px;
    right: -40px;
    animation-delay: 0s;
}

.welcome-guest-header .circle-2 {
    width: 60px;
    height: 60px;
    bottom: -30px;
    left: -30px;
    animation-delay: 4s;
}

/* 动画定义 */
@keyframes gentle-bounce {

    0%,
    100% {
        transform: translateY(0px);
    }

    50% {
        transform: translateY(-3px);
    }
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
@media (max-width: 768px) {
    .welcome-guest-header {
        padding: 16px;
        border-radius: 12px;
        margin-bottom: 20px;
    }

    .welcome-guest-header .greeting-section {
        gap: 10px;
    }

    .welcome-guest-header .greeting-icon {
        font-size: 1.5rem;
    }

    .welcome-guest-header .greeting-title {
        font-size: 1.25rem;
    }

    .welcome-guest-header .greeting-subtitle {
        font-size: 0.8rem;
    }
}

/* 微信环境下的特殊样式 - 减少间距避免布局问题 */
@media (max-width: 768px) {

    /* 增加选择器特异性，确保样式生效 */
    :global(body.wechat-browser) :global(.welcome-guest-header) {
        margin-top: 0px !important;
        /* 不需要额外的顶部间距，主页内容已有padding-top */
        margin-bottom: 60px !important;
        /* 增加底部间距，使用更大的值确保生效 */
        padding: 16px 20px !important;
        /* 增加内边距，提供更好的视觉效果 */
    }

    /* 微信环境下进一步优化间距 */
    :global(body.wechat-browser) :global(.welcome-guest-header) :global(.greeting-title) {
        font-size: 1.2rem !important;
        /* 稍微增大标题字体 */
    }

    :global(body.wechat-browser) :global(.welcome-guest-header) :global(.greeting-subtitle) {
        font-size: 0.8rem !important;
        /* 稍微增大副标题字体 */
    }
}
</style>
