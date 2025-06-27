<template>
    <div class="copyright-footer" v-show="!isChatMode && (!isMobileView || !isWechatEnv)">
        <div class="copyright-content">
            <p>&copy; 2024 上海九方云智能科技有限公司 版权所有</p>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';

// Props
const props = defineProps({
    isChatMode: {
        type: Boolean,
        default: false
    },
    isMobileView: {
        type: Boolean,
        default: false
    },
    isWechatEnv: {
        type: Boolean,
        default: false
    }
});

// 计算显示状态
const shouldShow = computed(() => {
    return !props.isChatMode && (!props.isMobileView || !props.isWechatEnv);
});
</script>

<style scoped>
/* 版权信息基础样式 */
.copyright-footer {
    text-align: center;
    margin-top: 32px;
    padding: 16px 0;
    background: transparent;
    width: 100%;
}

.copyright-content {
    max-width: 900px;
    margin: 0 auto;
    padding: 0 20px;
}

.copyright-content p {
    font-size: 0.875rem;
    color: #9ca3af;
    margin: 0;
    line-height: 1.4;
    font-weight: 400;
}

/* 移动端适配 (768px及以下) */
@media (max-width: 768px) {

    /* Footer优化 */
    .copyright-footer {
        margin-top: 0;
        padding: 8px 0;
    }

    .copyright-content p {
        font-size: 10px;
        color: #9ca3af;
    }
}

/* 超小屏幕优化 (480px及以下) */
@media (max-width: 480px) {

    /* Footer进一步缩小 */
    .copyright-footer {
        margin-top: 16px;
        padding: 6px 0;
    }

    .copyright-content p {
        font-size: 9px;
        color: #a1a1aa;
    }
}

/* 响应式布局优化 */
@media (max-width: 320px) {
    .copyright-footer {
        margin-top: 12px;
        padding: 4px 0;
    }

    .copyright-content {
        padding: 0 16px;
    }

    .copyright-content p {
        font-size: 8px;
        color: #a1a1aa;
    }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
    .copyright-content p {
        color: #6b7280;
    }
}

/* 高分辨率屏幕优化 */
@media (min-resolution: 2dppx) {
    .copyright-content p {
        font-weight: 300;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
    }
}
</style>
