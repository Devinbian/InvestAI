<template>
    <div class="notifications-container">
        <div class="card-header">
            <h3 class="card-title">消息推送</h3>
            <div class="message-stats">
                <span class="unread-count">{{ unreadCount }}条未读</span>
            </div>
        </div>

        <div class="notifications-list">
            <div v-for="notification in notifications" :key="notification.id" class="notification-item"
                :class="{ 'unread': !notification.read, 'important': notification.priority === 'high' }"
                @click="markAsRead(notification)">
                <div class="notification-icon">
                    <div class="icon-wrapper" :class="getIconClass(notification.type)">
                        <svg v-if="notification.type === 'news'" width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2z"
                                stroke="currentColor" stroke-width="2" fill="none" />
                            <path d="M6 12h8" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                            <path d="M6 16h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                        </svg>
                        <svg v-else-if="notification.type === 'alert'" width="16" height="16" viewBox="0 0 24 24"
                            fill="none">
                            <path
                                d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                                stroke="currentColor" stroke-width="2" fill="none" />
                            <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" stroke-width="2" />
                            <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" stroke-width="2" />
                        </svg>
                        <svg v-else-if="notification.type === 'market'" width="16" height="16" viewBox="0 0 24 24"
                            fill="none">
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" stroke="currentColor" stroke-width="2"
                                fill="none" />
                            <polyline points="17 6 23 6 23 12" stroke="currentColor" stroke-width="2" fill="none" />
                        </svg>
                        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" />
                            <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="currentColor" stroke-width="2" />
                        </svg>
                    </div>
                </div>

                <div class="notification-content">
                    <div class="notification-header">
                        <div class="notification-title">{{ notification.title }}</div>
                        <div class="notification-time">{{ formatTime(notification.time) }}</div>
                    </div>
                    <div class="notification-message">{{ notification.message }}</div>
                    <div v-if="notification.tags" class="notification-tags">
                        <span v-for="tag in notification.tags" :key="tag" class="tag"
                            :class="getTagClass(notification.type)">
                            {{ tag }}
                        </span>
                    </div>
                </div>

                <div v-if="!notification.read" class="unread-indicator"></div>
            </div>
        </div>

        <div class="card-footer">
            <el-button size="small" text @click="viewAllNotifications">
                查看全部消息
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round" />
                </svg>
            </el-button>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';

// 定义emit
const emit = defineEmits(['send-to-chat']);

const notifications = ref([
    {
        id: 1,
        type: 'market',
        priority: 'high',
        title: '市场异动提醒',
        message: '芯片板块大幅上涨，建议关注相关龙头股票机会',
        time: new Date(Date.now() - 5 * 60 * 1000),
        read: false,
        tags: ['芯片股', '异动']
    },
    {
        id: 2,
        type: 'news',
        priority: 'medium',
        title: '重要资讯',
        message: '央行宣布降准0.25个百分点，利好银行和地产板块',
        time: new Date(Date.now() - 30 * 60 * 1000),
        read: false,
        tags: ['货币政策', '银行', '地产']
    },
    {
        id: 3,
        type: 'alert',
        priority: 'high',
        title: '风险提醒',
        message: '您关注的平安银行跌幅超过5%，请注意风险控制',
        time: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: true,
        tags: ['风险提醒']
    },
    {
        id: 4,
        type: 'system',
        priority: 'low',
        title: '系统通知',
        message: '您的投资偏好设置已更新，推荐算法将为您提供更精准的建议',
        time: new Date(Date.now() - 4 * 60 * 60 * 1000),
        read: true,
        tags: ['系统更新']
    },
    {
        id: 5,
        type: 'market',
        priority: 'medium',
        title: '盘后分析',
        message: '今日A股三大指数收涨，成交量较昨日放大15%',
        time: new Date(Date.now() - 6 * 60 * 60 * 1000),
        read: true,
        tags: ['盘后分析']
    }
]);

const unreadCount = computed(() => {
    return notifications.value.filter(n => !n.read).length;
});

const getIconClass = (type) => {
    const classMap = {
        'news': 'news-icon',
        'alert': 'alert-icon',
        'market': 'market-icon',
        'system': 'system-icon'
    };
    return classMap[type] || 'default-icon';
};

const getTagClass = (type) => {
    const classMap = {
        'news': 'news-tag',
        'alert': 'alert-tag',
        'market': 'market-tag',
        'system': 'system-tag'
    };
    return classMap[type] || 'default-tag';
};

const formatTime = (time) => {
    const now = new Date();
    const diff = now - time;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;

    return time.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric'
    });
};

const markAsRead = (notification) => {
    if (!notification.read) {
        notification.read = true;
    }

    // 发送到聊天框进行分析
    emit('send-to-chat', {
        type: 'message',
        content: notification.message,
        title: notification.title
    });
};

const markAllAsRead = () => {
    notifications.value.forEach(n => {
        n.read = true;
    });
    ElMessage.success('所有消息已标记为已读');
};

const viewAllNotifications = () => {
    ElMessage.info('跳转到完整消息列表');
    // 这里可以跳转到完整的消息页面
};
</script>

<style scoped>
.notifications-container {
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
    padding: 16px 20px 12px 20px;
    border-bottom: 1px solid #f5f5f5;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
}

.card-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #18181b;
    margin: 0;
}

.message-stats {
    display: flex;
    align-items: center;
}

.unread-count {
    font-size: 0.75rem;
    color: #9ca3af;
    margin-left: 8px;
}

.notifications-list {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
}

.notification-item {
    display: flex;
    align-items: flex-start;
    padding: 12px 20px;
    border-bottom: 1px solid #f8f9fa;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
}

.notification-item:hover {
    background: #f9fafb;
}

.notification-item:last-child {
    border-bottom: none;
}

.notification-item.unread {
    background: #fefefe;
}

.notification-item.important {
    border-left: 3px solid #ef4444;
}

.notification-icon {
    margin-right: 12px;
    margin-top: 2px;
}

.icon-wrapper {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.news-icon {
    background: #dbeafe;
    color: #1e40af;
}

.alert-icon {
    background: #fef2f2;
    color: #dc2626;
}

.market-icon {
    background: #d1fae5;
    color: #059669;
}

.system-icon {
    background: #f3f4f6;
    color: #6b7280;
}

.notification-content {
    flex: 1;
    min-width: 0;
}

.notification-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 4px;
}

.notification-title {
    font-size: 0.9rem;
    font-weight: 600;
    color: #18181b;
    line-height: 1.3;
}

.notification-time {
    font-size: 0.75rem;
    color: #9ca3af;
    white-space: nowrap;
    margin-left: 8px;
}

.notification-message {
    font-size: 0.85rem;
    color: #374151;
    line-height: 1.4;
    margin-bottom: 8px;
}

.notification-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

.tag {
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 0.7rem;
    font-weight: 500;
}

.news-tag {
    background: #eff6ff;
    color: #1d4ed8;
}

.alert-tag {
    background: #fef2f2;
    color: #dc2626;
}

.market-tag {
    background: #ecfdf5;
    color: #059669;
}

.system-tag {
    background: #f9fafb;
    color: #6b7280;
}

.unread-indicator {
    width: 8px;
    height: 8px;
    background: #3b82f6;
    border-radius: 50%;
    position: absolute;
    top: 16px;
    right: 16px;
}

.card-footer {
    padding: 12px 20px;
    border-top: 1px solid #f5f5f5;
    text-align: center;
    flex-shrink: 0;
}

:deep(.el-button) {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.85rem;
}
</style>
