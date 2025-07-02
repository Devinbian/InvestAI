<template>
    <div class="message-push-center">
        <!-- 主要内容区域 -->
        <div class="push-container">
            <!-- 头部区域 -->
            <div class="push-header">
                <div class="header-left">
                    <div class="header-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" stroke-width="2"
                                stroke-linecap="round" stroke-linejoin="round" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" stroke-width="2"
                                stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                    </div>
                    <div class="header-title">
                        <h3>消息中心</h3>
                        <span class="subtitle">{{ totalUnread }}条未读消息</span>
                    </div>
                </div>
                <div class="header-actions">
                    <button class="action-btn" @click="markAllRead" v-if="totalUnread > 0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <polyline points="20,6 9,17 4,12" stroke="currentColor" stroke-width="2"
                                stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                        全部已读
                    </button>
                    <button class="action-btn settings-btn" @click="openSettings">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" />
                            <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="currentColor" stroke-width="2" />
                        </svg>
                    </button>
                </div>
            </div>

            <!-- 分类标签 -->
            <div class="category-tabs">
                <div class="tabs-wrapper" ref="tabsWrapper" @wheel="handleTabsScroll" @touchstart="handleTouchStart"
                    @touchmove="handleTouchMove" @touchend="handleTouchEnd" @scroll="handleTabsWrapperScroll">
                    <button v-for="category in categories" :key="category.key"
                        :class="['tab-button', { active: activeCategory === category.key }]"
                        @click="switchCategory(category.key)">
                        <span class="tab-icon">{{ category.icon }}</span>
                        <span class="tab-label">{{ category.name }}</span>
                        <span v-if="getUnreadCount(category.key) > 0" class="tab-badge">
                            {{ getUnreadCount(category.key) }}
                        </span>
                    </button>
                </div>
                <div class="scroll-indicator" v-show="showScrollIndicator">
                    <div class="scroll-hint">← 滑动查看更多 →</div>
                </div>
            </div>

            <!-- 消息列表 -->
            <div class="messages-container">
                <div v-if="isLoading" class="loading-state">
                    <div class="loading-content">
                        <div class="loading-spinner"></div>
                        <span>正在加载{{ getCurrentCategoryName() }}消息...</span>
                    </div>
                </div>

                <div v-else-if="filteredMessages.length === 0" class="empty-state">
                    <div class="empty-icon">📭</div>
                    <p class="empty-text">暂无{{ getCurrentCategoryName() }}消息</p>
                </div>

                <div v-else class="messages-list">
                    <div v-for="group in groupedMessages" :key="group.date" class="message-group">
                        <div class="group-header">
                            <span class="group-date">{{ group.date }}</span>
                            <span class="group-count">{{ group.messages.length }}条</span>
                        </div>

                        <div class="group-messages">
                            <div v-for="message in group.messages" :key="message.id" :class="['message-item', {
                                unread: !message.read,
                                urgent: message.priority === 'urgent',
                                important: message.priority === 'high'
                            }]" @click="openMessageDetail(message)">
                                <div class="message-icon">
                                    <div :class="['icon-circle', getIconClass(message.type)]">
                                        <span>{{ getTypeIcon(message.type) }}</span>
                                    </div>
                                    <div v-if="message.priority === 'urgent'" class="urgent-dot"></div>
                                </div>

                                <div class="message-content">
                                    <div class="message-header">
                                        <h4 class="message-title">{{ message.title }}</h4>
                                        <span class="message-time">{{ formatTime(message.time) }}</span>
                                    </div>
                                    <p class="message-preview">{{ message.message }}</p>

                                    <div v-if="message.tags?.length" class="message-tags">
                                        <span v-for="tag in message.tags.slice(0, 3)" :key="tag"
                                            :class="['message-tag', getTagClass(message.type)]">
                                            {{ tag }}
                                        </span>
                                        <span v-if="message.tags.length > 3" class="tag-more">
                                            +{{ message.tags.length - 3 }}
                                        </span>
                                    </div>
                                </div>

                                <div v-if="!message.read" class="unread-dot"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 加载更多 -->
                <div v-if="hasMore && !isLoading" class="load-more">
                    <button class="load-more-btn" @click="loadMoreMessages" :disabled="isLoadingMore">
                        <div v-if="isLoadingMore" class="loading-spinner-small"></div>
                        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M12 5v14m7-7l-7 7-7-7" stroke="currentColor" stroke-width="2"
                                stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                        {{ isLoadingMore ? '加载中...' : '加载更多' }}
                    </button>
                </div>

                <!-- 没有更多数据提示 -->
                <div v-if="!hasMore && displayMessages.length > 0" class="no-more-data">
                    <div class="no-more-line"></div>
                    <span class="no-more-text">已显示全部消息</span>
                    <div class="no-more-line"></div>
                </div>
            </div>

            <!-- 底部操作 -->
            <div class="push-footer">
                <button class="footer-action" @click="openAllMessages">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
                        <polyline points="12,6 12,12 16,14" stroke="currentColor" stroke-width="2" />
                    </svg>
                    查看历史
                </button>
                <button class="footer-action" @click="openSettings">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" />
                        <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="currentColor" stroke-width="2" />
                    </svg>
                    推送设置
                </button>
            </div>
        </div>

        <!-- 消息详情弹窗 -->
        <Teleport to="body">
            <div v-if="showDetailModal" class="modal-overlay detail-modal-overlay" @click="closeDetailModal">
                <div class="modal-container detail-modal" @click.stop>
                    <div class="modal-header">
                        <div class="modal-title-section">
                            <div :class="['title-icon', getIconClass(selectedMessage?.type)]">
                                <span>{{ getTypeIcon(selectedMessage?.type) }}</span>
                            </div>
                            <div class="title-content">
                                <h3>{{ selectedMessage?.title }}</h3>
                                <div class="title-meta">
                                    <span class="message-type">{{ getTypeName(selectedMessage?.type) }}</span>
                                    <span :class="['priority-badge', selectedMessage?.priority]">
                                        {{ getPriorityName(selectedMessage?.priority) }}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button class="close-button" @click="closeDetailModal">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" />
                                <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" />
                            </svg>
                        </button>
                    </div>

                    <div class="modal-body">
                        <div class="message-meta-info">
                            <div class="meta-item">
                                <span class="meta-label">发送时间</span>
                                <span class="meta-value">{{ formatDetailTime(selectedMessage?.time) }}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">消息类型</span>
                                <span class="meta-value">{{ getTypeName(selectedMessage?.type) }}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">重要程度</span>
                                <span :class="['meta-value', 'priority', selectedMessage?.priority]">
                                    {{ getPriorityName(selectedMessage?.priority) }}
                                </span>
                            </div>
                        </div>

                        <div class="message-detail-content">
                            <h4>消息内容</h4>
                            <div class="content-text">{{ selectedMessage?.message }}</div>
                        </div>

                        <div v-if="selectedMessage?.details" class="message-details">
                            <h4>详细信息</h4>
                            <div class="details-grid">
                                <div v-for="(value, key) in selectedMessage.details" :key="key" class="detail-item">
                                    <span class="detail-key">{{ key }}</span>
                                    <span class="detail-value">{{ value }}</span>
                                </div>
                            </div>
                        </div>

                        <div v-if="selectedMessage?.tags?.length" class="message-detail-tags">
                            <h4>相关标签</h4>
                            <div class="tags-list">
                                <span v-for="tag in selectedMessage.tags" :key="tag"
                                    :class="['detail-tag', getTagClass(selectedMessage.type)]">
                                    {{ tag }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button class="modal-btn secondary" @click="closeDetailModal">
                            关闭
                        </button>
                        <button class="modal-btn primary" @click="sendToChat(selectedMessage)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                                    stroke="currentColor" stroke-width="2" />
                            </svg>
                            发送到对话
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>

        <!-- 历史消息弹窗 -->
        <Teleport to="body">
            <div v-if="showHistoryModal" class="modal-overlay history-modal-overlay" @click="closeHistoryModal">
                <div class="modal-container history-modal" @click.stop>
                    <div class="modal-header">
                        <div class="modal-title-section">
                            <div class="title-icon history-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
                                    <polyline points="12,6 12,12 16,14" stroke="currentColor" stroke-width="2" />
                                </svg>
                            </div>
                            <div class="title-content">
                                <h3>历史消息</h3>
                                <p class="title-desc">查看所有消息记录</p>
                            </div>
                        </div>
                        <button class="close-button" @click="closeHistoryModal">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" />
                                <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" />
                            </svg>
                        </button>
                    </div>

                    <div class="modal-body">
                        <div class="history-filters">
                            <div class="search-box">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="search-icon">
                                    <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2" />
                                    <path d="m21 21-4.35-4.35" stroke="currentColor" stroke-width="2" />
                                </svg>
                                <input v-model="searchKeyword" type="text" placeholder="搜索消息..." class="search-input" />
                            </div>
                            <div class="filter-controls">
                                <select v-model="filterType" class="filter-select">
                                    <option value="">全部类型</option>
                                    <option value="market">市场动态</option>
                                    <option value="news">财经资讯</option>
                                    <option value="alert">风险提醒</option>
                                    <option value="system">系统通知</option>
                                    <option value="trade">交易记录</option>
                                </select>
                                <select v-model="filterPriority" class="filter-select">
                                    <option value="">全部优先级</option>
                                    <option value="urgent">紧急</option>
                                    <option value="high">高</option>
                                    <option value="medium">中</option>
                                    <option value="low">低</option>
                                </select>
                            </div>
                        </div>

                        <div class="history-stats">
                            <div class="stat-item">
                                <span class="stat-number">{{ filteredHistoryMessages.length }}</span>
                                <span class="stat-label">总消息</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number unread">{{filteredHistoryMessages.filter(m => !m.read).length
                                }}</span>
                                <span class="stat-label">未读</span>
                            </div>
                        </div>

                        <div class="history-messages">
                            <div v-if="filteredHistoryMessages.length === 0" class="empty-state">
                                <div class="empty-icon">🔍</div>
                                <p class="empty-text">没有找到匹配的消息</p>
                            </div>

                            <div v-else class="history-list">
                                <div v-for="message in filteredHistoryMessages" :key="message.id" :class="['history-item', {
                                    unread: !message.read,
                                    urgent: message.priority === 'urgent',
                                    important: message.priority === 'high'
                                }]" @click="openMessageDetail(message)">
                                    <div class="history-icon">
                                        <div :class="['icon-circle', getIconClass(message.type)]">
                                            <span>{{ getTypeIcon(message.type) }}</span>
                                        </div>
                                    </div>

                                    <div class="history-content">
                                        <div class="history-header">
                                            <h4 class="history-title">{{ message.title }}</h4>
                                            <div class="history-meta">
                                                <span class="history-type">{{ getTypeName(message.type) }}</span>
                                                <span :class="['history-priority', message.priority]">
                                                    {{ getPriorityName(message.priority) }}
                                                </span>
                                                <span class="history-time">{{ formatTime(message.time) }}</span>
                                            </div>
                                        </div>
                                        <p class="history-preview">{{ message.message }}</p>

                                        <div v-if="message.tags?.length" class="history-tags">
                                            <span v-for="tag in message.tags.slice(0, 5)" :key="tag"
                                                :class="['history-tag', getTagClass(message.type)]">
                                                {{ tag }}
                                            </span>
                                        </div>
                                    </div>

                                    <div v-if="!message.read" class="unread-dot"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button class="modal-btn secondary" @click="closeHistoryModal">
                            关闭
                        </button>
                        <button v-if="filteredHistoryMessages.some(m => !m.read)" class="modal-btn primary"
                            @click="markFilteredAsRead">
                            标记为已读
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>

        <!-- 设置弹窗 -->
        <Teleport to="body">
            <div v-if="showSettingsModal" class="modal-overlay settings-modal-overlay" @click="closeSettingsModal">
                <div class="modal-container settings-modal" @click.stop>
                    <div class="modal-header">
                        <div class="modal-title-section">
                            <div class="title-icon settings-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" />
                                    <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="currentColor" stroke-width="2" />
                                </svg>
                            </div>
                            <div class="title-content">
                                <h3>推送设置</h3>
                                <p class="title-desc">管理您的消息推送偏好</p>
                            </div>
                        </div>
                        <button class="close-button" @click="closeSettingsModal">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" />
                                <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" />
                            </svg>
                        </button>
                    </div>

                    <div class="modal-body">
                        <div class="settings-section">
                            <h4>消息类型推送</h4>
                            <div class="settings-grid">
                                <div class="setting-item">
                                    <div class="setting-info">
                                        <div class="setting-title">市场动态</div>
                                        <div class="setting-desc">股价变动、板块异动等</div>
                                    </div>
                                    <div :class="['toggle-switch', { active: settings.market }]"
                                        @click="toggleSetting('market')">
                                        <div class="toggle-handle"></div>
                                    </div>
                                </div>

                                <div class="setting-item">
                                    <div class="setting-info">
                                        <div class="setting-title">财经资讯</div>
                                        <div class="setting-desc">政策新闻、公司公告等</div>
                                    </div>
                                    <div :class="['toggle-switch', { active: settings.news }]"
                                        @click="toggleSetting('news')">
                                        <div class="toggle-handle"></div>
                                    </div>
                                </div>

                                <div class="setting-item">
                                    <div class="setting-info">
                                        <div class="setting-title">风险提醒</div>
                                        <div class="setting-desc">价格预警、风险评估等</div>
                                    </div>
                                    <div :class="['toggle-switch', { active: settings.alert }]"
                                        @click="toggleSetting('alert')">
                                        <div class="toggle-handle"></div>
                                    </div>
                                </div>

                                <div class="setting-item">
                                    <div class="setting-info">
                                        <div class="setting-title">系统通知</div>
                                        <div class="setting-desc">系统更新、功能通知等</div>
                                    </div>
                                    <div :class="['toggle-switch', { active: settings.system }]"
                                        @click="toggleSetting('system')">
                                        <div class="toggle-handle"></div>
                                    </div>
                                </div>

                                <div class="setting-item">
                                    <div class="setting-info">
                                        <div class="setting-title">交易记录</div>
                                        <div class="setting-desc">买卖记录、委托状态等</div>
                                    </div>
                                    <div :class="['toggle-switch', { active: settings.trade }]"
                                        @click="toggleSetting('trade')">
                                        <div class="toggle-handle"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="settings-section">
                            <h4>推送时间</h4>
                            <div class="time-settings">
                                <div class="time-range">
                                    <div class="time-input-group">
                                        <label>开始时间</label>
                                        <input v-model="settings.startTime" type="time" class="time-input">
                                    </div>
                                    <div class="time-input-group">
                                        <label>结束时间</label>
                                        <input v-model="settings.endTime" type="time" class="time-input">
                                    </div>
                                </div>

                                <div class="setting-item">
                                    <div class="setting-info">
                                        <div class="setting-title">免打扰模式</div>
                                        <div class="setting-desc">指定时间段内不接收推送</div>
                                    </div>
                                    <div :class="['toggle-switch', { active: settings.doNotDisturb }]"
                                        @click="toggleSetting('doNotDisturb')">
                                        <div class="toggle-handle"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="settings-section">
                            <h4>推送频率</h4>
                            <div class="frequency-options">
                                <label class="frequency-option">
                                    <input v-model="settings.frequency" type="radio" value="realtime"
                                        class="frequency-radio">
                                    <span class="frequency-label">实时推送</span>
                                    <span class="frequency-desc">消息产生时立即推送</span>
                                </label>

                                <label class="frequency-option">
                                    <input v-model="settings.frequency" type="radio" value="hourly"
                                        class="frequency-radio">
                                    <span class="frequency-label">每小时汇总</span>
                                    <span class="frequency-desc">每小时汇总推送一次</span>
                                </label>

                                <label class="frequency-option">
                                    <input v-model="settings.frequency" type="radio" value="daily"
                                        class="frequency-radio">
                                    <span class="frequency-label">每日汇总</span>
                                    <span class="frequency-desc">每天汇总推送一次</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button class="modal-btn secondary" @click="resetSettings">
                            重置默认
                        </button>
                        <button class="modal-btn primary" @click="saveSettings">
                            保存设置
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';

// 定义事件
const emit = defineEmits(['send-to-chat']);

// 响应式数据
const activeCategory = ref('all');
const isLoading = ref(false);
const isLoadingMore = ref(false);
const hasMore = ref(true);
const currentPage = ref(1);
const pageSize = ref(15);
const showScrollIndicator = ref(false);

// DOM引用
const tabsWrapper = ref(null);

// 触摸滚动相关
const touchStartX = ref(0);
const scrollStartX = ref(0);

// 弹窗状态
const showDetailModal = ref(false);
const showHistoryModal = ref(false);
const showSettingsModal = ref(false);
const selectedMessage = ref(null);

// 搜索和筛选
const searchKeyword = ref('');
const filterType = ref('');
const filterPriority = ref('');

// 分类配置
const categories = ref([
    { key: 'all', name: '全部', icon: '📋' },
    { key: 'market', name: '市场', icon: '📈' },
    { key: 'news', name: '资讯', icon: '📰' },
    { key: 'alert', name: '提醒', icon: '⚠️' },
    { key: 'system', name: '系统', icon: '⚙️' },
    { key: 'trade', name: '交易', icon: '💰' }
]);

// 设置
const settings = ref({
    market: true,
    news: true,
    alert: true,
    system: true,
    trade: true,
    startTime: '09:00',
    endTime: '21:00',
    doNotDisturb: false,
    frequency: 'realtime'
});

// 生成模拟数据
const generateMockMessages = () => {
    const types = ['market', 'news', 'alert', 'system', 'trade'];
    const priorities = ['urgent', 'high', 'medium', 'low'];
    const messages = [];

    const templates = [
        { type: 'market', title: '市场异动提醒', content: '芯片板块大幅上涨，建议关注相关龙头股票机会' },
        { type: 'news', title: '重要资讯', content: '央行宣布降准0.25个百分点，利好银行和地产板块' },
        { type: 'alert', title: '价格提醒', content: '您关注的平安银行跌幅超过5%，请注意风险控制' },
        { type: 'system', title: '系统通知', content: '您的投资偏好设置已更新，推荐算法将为您提供更精准的建议' },
        { type: 'trade', title: '交易执行', content: '您的买入订单已成功执行：茅台 100股 @ ¥1850.00' }
    ];

    for (let i = 1; i <= 100; i++) {
        const template = templates[i % templates.length];
        const timeOffset = Math.random() * 30 * 24 * 60 * 60 * 1000;

        messages.push({
            id: i,
            type: template.type,
            priority: priorities[Math.floor(Math.random() * priorities.length)],
            title: `${template.title} ${i}`,
            message: template.content,
            time: new Date(Date.now() - timeOffset),
            read: Math.random() > 0.3,
            tags: generateTags(template.type),
            details: generateDetails(template.type)
        });
    }

    return messages.sort((a, b) => new Date(b.time) - new Date(a.time));
};

const generateTags = (type) => {
    const tagMap = {
        market: ['市场动态', '板块异动', '涨停', '跌停'],
        news: ['政策', '财经', '公告', '利好'],
        alert: ['风险提醒', '价格预警', '止损'],
        system: ['系统更新', '功能升级', '维护'],
        trade: ['交易记录', '成交', '分红', '资金']
    };
    const tags = tagMap[type] || ['其他'];
    return tags.slice(0, Math.floor(Math.random() * 3) + 1);
};

const generateDetails = (type) => {
    const detailsMap = {
        market: { '涨幅': '+' + (Math.random() * 10).toFixed(2) + '%', '成交量': '放大' + Math.floor(Math.random() * 200) + '%' },
        news: { '影响程度': '重大', '相关板块': '银行、地产' },
        alert: { '触发价格': '¥' + (Math.random() * 100).toFixed(2), '风险等级': '中等' },
        system: { '更新版本': 'v2.1.0', '影响范围': '全部用户' },
        trade: { '成交价格': '¥' + (Math.random() * 500 + 10).toFixed(2), '手续费': '¥' + (Math.random() * 10).toFixed(2) }
    };
    return detailsMap[type] || {};
};

// 所有消息数据
const allMessages = ref(generateMockMessages());
const displayMessages = ref([]);

// 计算属性
const totalUnread = computed(() => {
    return allMessages.value.filter(m => !m.read).length;
});

const filteredMessages = computed(() => {
    let filtered = displayMessages.value;
    if (activeCategory.value !== 'all') {
        filtered = filtered.filter(m => m.type === activeCategory.value);
    }
    return filtered;
});

const groupedMessages = computed(() => {
    const groups = [];
    const groupMap = new Map();

    filteredMessages.value.forEach(message => {
        const date = formatGroupDate(message.time);
        if (!groupMap.has(date)) {
            groupMap.set(date, { date, messages: [] });
            groups.push(groupMap.get(date));
        }
        groupMap.get(date).messages.push(message);
    });

    return groups;
});

const filteredHistoryMessages = computed(() => {
    let filtered = allMessages.value;

    if (searchKeyword.value) {
        const keyword = searchKeyword.value.toLowerCase();
        filtered = filtered.filter(m =>
            m.title.toLowerCase().includes(keyword) ||
            m.message.toLowerCase().includes(keyword) ||
            (m.tags && m.tags.some(tag => tag.toLowerCase().includes(keyword)))
        );
    }

    if (filterType.value) {
        filtered = filtered.filter(m => m.type === filterType.value);
    }

    if (filterPriority.value) {
        filtered = filtered.filter(m => m.priority === filterPriority.value);
    }

    return filtered;
});

// 方法
const switchCategory = (category) => {
    if (activeCategory.value === category) return;

    activeCategory.value = category;
    // 切换分类时使用普通加载状态
    loadMessages(true);
};

const getCurrentCategoryName = () => {
    const category = categories.value.find(c => c.key === activeCategory.value);
    return category ? category.name : '全部';
};

const getUnreadCount = (categoryKey) => {
    if (categoryKey === 'all') {
        return totalUnread.value;
    }
    return allMessages.value.filter(m => m.type === categoryKey && !m.read).length;
};

const loadMessages = (reset = false) => {
    if (reset) {
        if (isLoading.value) return;
        isLoading.value = true;
    } else {
        if (isLoadingMore.value) return;
        isLoadingMore.value = true;
    }

    // 模拟网络请求延迟
    setTimeout(() => {
        let sourceMessages = allMessages.value;
        if (activeCategory.value !== 'all') {
            sourceMessages = sourceMessages.filter(m => m.type === activeCategory.value);
        }

        if (reset) {
            // 重置时只加载第一页
            displayMessages.value = sourceMessages.slice(0, pageSize.value);
            currentPage.value = 1;
            isLoading.value = false;
        } else {
            // 追加加载下一页
            const startIndex = currentPage.value * pageSize.value;
            const endIndex = startIndex + pageSize.value;
            const newMessages = sourceMessages.slice(startIndex, endIndex);

            // 使用追加方式，避免整个列表重新渲染
            displayMessages.value = [...displayMessages.value, ...newMessages];
            currentPage.value++;
            isLoadingMore.value = false;
        }

        // 检查是否还有更多数据
        hasMore.value = displayMessages.value.length < sourceMessages.length;
    }, reset ? 300 : 500); // 切换分类时加载快一些，追加时稍慢一些模拟真实网络
};

const loadMoreMessages = () => {
    if (!isLoadingMore.value && hasMore.value) {
        loadMessages();
    }
};

const formatGroupDate = (date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffDays = Math.floor((now - messageDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays <= 7) return `${diffDays}天前`;
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)}周前`;
    return `${Math.floor(diffDays / 30)}个月前`;
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

    return time.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
};

const formatDetailTime = (time) => {
    if (!time) return '';
    return time.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};

const getIconClass = (type) => {
    const classMap = {
        market: 'market-icon',
        news: 'news-icon',
        alert: 'alert-icon',
        system: 'system-icon',
        trade: 'trade-icon'
    };
    return classMap[type] || 'default-icon';
};

const getTypeIcon = (type) => {
    const iconMap = {
        market: '📈',
        news: '📰',
        alert: '⚠️',
        system: '⚙️',
        trade: '💰'
    };
    return iconMap[type] || '📄';
};

const getTagClass = (type) => {
    const classMap = {
        market: 'market-tag',
        news: 'news-tag',
        alert: 'alert-tag',
        system: 'system-tag',
        trade: 'trade-tag'
    };
    return classMap[type] || 'default-tag';
};

const getTypeName = (type) => {
    const typeMap = {
        market: '市场动态',
        news: '财经资讯',
        alert: '风险提醒',
        system: '系统通知',
        trade: '交易记录'
    };
    return typeMap[type] || '其他';
};

const getPriorityName = (priority) => {
    const priorityMap = {
        urgent: '紧急',
        high: '高',
        medium: '中',
        low: '低'
    };
    return priorityMap[priority] || '普通';
};

// 弹窗操作
const openMessageDetail = (message) => {
    selectedMessage.value = message;
    showDetailModal.value = true;

    if (!message.read) {
        message.read = true;
    }
};

const closeDetailModal = () => {
    showDetailModal.value = false;
    selectedMessage.value = null;
};

const openAllMessages = () => {
    showHistoryModal.value = true;
    searchKeyword.value = '';
    filterType.value = '';
    filterPriority.value = '';
};

const closeHistoryModal = () => {
    showHistoryModal.value = false;
};

const openSettings = () => {
    showSettingsModal.value = true;
};

const closeSettingsModal = () => {
    showSettingsModal.value = false;
};

const sendToChat = (message) => {
    emit('send-to-chat', {
        type: 'message',
        content: message.message,
        title: message.title,
        details: message.details
    });
    closeDetailModal();
    ElMessage.success('消息已发送到对话框');
};

const markAllRead = () => {
    displayMessages.value.forEach(m => { m.read = true; });
    ElMessage.success('所有消息已标记为已读');
};

const markFilteredAsRead = () => {
    filteredHistoryMessages.value.forEach(m => { m.read = true; });
    ElMessage.success('已标记为已读');
};

const toggleSetting = (key) => {
    settings.value[key] = !settings.value[key];
};

const saveSettings = () => {
    ElMessage.success('设置已保存');
    closeSettingsModal();
};

const resetSettings = () => {
    settings.value = {
        market: true,
        news: true,
        alert: true,
        system: true,
        trade: true,
        startTime: '09:00',
        endTime: '21:00',
        doNotDisturb: false,
        frequency: 'realtime'
    };
    ElMessage.info('设置已重置');
};

// 标签滚动处理
const handleTabsScroll = (event) => {
    if (tabsWrapper.value) {
        event.preventDefault();
        tabsWrapper.value.scrollLeft += event.deltaY;
    }
};

const checkScrollIndicator = () => {
    if (tabsWrapper.value) {
        const { scrollWidth, clientWidth } = tabsWrapper.value;
        showScrollIndicator.value = scrollWidth > clientWidth;
    }
};

// 触摸事件处理
const handleTouchStart = (event) => {
    if (tabsWrapper.value) {
        touchStartX.value = event.touches[0].clientX;
        scrollStartX.value = tabsWrapper.value.scrollLeft;
    }
};

const handleTouchMove = (event) => {
    if (tabsWrapper.value && touchStartX.value !== 0) {
        event.preventDefault();
        const touchX = event.touches[0].clientX;
        const deltaX = touchStartX.value - touchX;
        tabsWrapper.value.scrollLeft = scrollStartX.value + deltaX;
    }
};

const handleTouchEnd = () => {
    touchStartX.value = 0;
    scrollStartX.value = 0;
};

// 滚动事件处理（隐藏滚动指示器）
const handleTabsWrapperScroll = () => {
    // 用户开始滚动后，延迟隐藏滚动指示器
    setTimeout(() => {
        showScrollIndicator.value = false;
    }, 2000);
};

// 初始化
onMounted(() => {
    loadMessages(true);

    // 检查是否需要显示滚动指示器
    setTimeout(() => {
        checkScrollIndicator();
    }, 100);

    // 监听窗口大小变化
    window.addEventListener('resize', checkScrollIndicator);
});

// 清理事件监听器
onUnmounted(() => {
    window.removeEventListener('resize', checkScrollIndicator);
});
</script>

<style scoped>
/* 基础容器样式 */
.message-push-center {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #ffffff;
}

.push-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: white;
    overflow: hidden;
}

/* 头部样式 */
.push-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: #f8fafc;
    color: #1f2937;
    border-bottom: 1px solid #e2e8f0;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.header-icon {
    width: 32px;
    height: 32px;
    background: #3b82f6;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.header-icon svg {
    color: white;
    width: 16px;
    height: 16px;
}

.header-title h3 {
    margin: 0 0 2px 0;
    font-size: 1rem;
    font-weight: 600;
}

.subtitle {
    font-size: 0.75rem;
    color: #64748b;
    font-weight: 500;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.action-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    color: #64748b;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.action-btn:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
    color: #374151;
}

.action-btn svg {
    width: 14px;
    height: 14px;
}

.settings-btn {
    padding: 6px;
    border-radius: 6px;
}

/* 分类标签样式 */
.category-tabs {
    padding: 8px 16px 12px 16px;
    background: white;
    border-bottom: 1px solid #e2e8f0;
    position: relative;
}

.tabs-wrapper {
    display: flex;
    gap: 4px;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 transparent;
    padding-bottom: 4px;
    scroll-behavior: smooth;
}

.tabs-wrapper::-webkit-scrollbar {
    height: 4px;
}

.tabs-wrapper::-webkit-scrollbar-track {
    background: transparent;
}

.tabs-wrapper::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 2px;
}

.tabs-wrapper::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

.tab-button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    color: #64748b;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    flex-shrink: 0;
    min-width: fit-content;
}

.tab-button:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
    color: #374151;
}

.tab-button.active {
    background: #3b82f6;
    border-color: #3b82f6;
    color: white;
}

.tab-icon {
    font-size: 0.875rem;
}

.tab-badge {
    background: #ef4444;
    color: white;
    font-size: 0.625rem;
    font-weight: 600;
    padding: 1px 6px;
    border-radius: 8px;
    min-width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.tab-button.active .tab-badge {
    background: rgba(255, 255, 255, 0.3);
    color: white;
}

.scroll-indicator {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    pointer-events: none;
    z-index: 1;
}

.scroll-hint {
    font-size: 0.625rem;
    color: #94a3b8;
    background: rgba(255, 255, 255, 0.9);
    padding: 2px 8px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    animation: fadeInOut 3s ease-in-out infinite;
}

@keyframes fadeInOut {

    0%,
    100% {
        opacity: 0.6;
    }

    50% {
        opacity: 1;
    }
}

/* 消息容器样式 */
.messages-container {
    flex: 1;
    overflow-y: auto;
    padding: 12px 16px;
    background: white;
}

.loading-state {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    color: #64748b;
}

.loading-content {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 24px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
}

.loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #e2e8f0;
    border-top: 2px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

.loading-spinner-small {
    width: 14px;
    height: 14px;
    border: 2px solid #e2e8f0;
    border-top: 2px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
}

.empty-icon {
    font-size: 4rem;
    margin-bottom: 16px;
    opacity: 0.6;
}

.empty-text {
    font-size: 1rem;
    color: #64748b;
    margin: 0;
}

/* 消息组样式 */
.message-group {
    margin-bottom: 16px;
}

.group-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 12px;
    margin-bottom: 8px;
    background: #f8fafc;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    position: sticky;
    top: 0;
    z-index: 2;
}

.group-date {
    font-size: 0.75rem;
    font-weight: 600;
    color: #374151;
}

.group-count {
    font-size: 0.625rem;
    color: #64748b;
    background: #f1f5f9;
    padding: 2px 6px;
    border-radius: 8px;
}

/* 消息项样式 */
.group-messages {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.message-item {
    display: flex;
    align-items: flex-start;
    padding: 10px 12px;
    background: #fafbfc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.message-item:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
}

.message-item.unread {
    background: #eff6ff;
    border-color: #bfdbfe;
    border-left: 3px solid #3b82f6;
}

.message-item.urgent {
    background: #fef2f2;
    border-color: #fecaca;
    border-left: 3px solid #ef4444;
}

.message-item.important {
    background: #fffbeb;
    border-color: #fed7aa;
    border-left: 3px solid #f59e0b;
}

.message-icon {
    margin-right: 12px;
    position: relative;
}

.icon-circle {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.market-icon {
    background: #10b981;
    color: white;
}

.news-icon {
    background: #3b82f6;
    color: white;
}

.alert-icon {
    background: #ef4444;
    color: white;
}

.system-icon {
    background: #6b7280;
    color: white;
}

.trade-icon {
    background: #f59e0b;
    color: white;
}

.urgent-dot {
    position: absolute;
    top: -2px;
    right: -2px;
    width: 12px;
    height: 12px;
    background: #ef4444;
    border: 2px solid white;
    border-radius: 50%;
}

.message-content {
    flex: 1;
    min-width: 0;
}

.message-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 6px;
}

.message-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
    line-height: 1.3;
}

.message-time {
    font-size: 0.625rem;
    color: #64748b;
    white-space: nowrap;
    margin-left: 8px;
    font-weight: 500;
}

.message-preview {
    font-size: 0.75rem;
    color: #4b5563;
    line-height: 1.4;
    margin: 0 0 8px 0;
}

.message-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.message-tag {
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.625rem;
    font-weight: 500;
    border: 1px solid;
}

.market-tag {
    background: #ecfdf5;
    color: #059669;
    border-color: #a7f3d0;
}

.news-tag {
    background: #eff6ff;
    color: #1d4ed8;
    border-color: #bfdbfe;
}

.alert-tag {
    background: #fef2f2;
    color: #dc2626;
    border-color: #fecaca;
}

.system-tag {
    background: #f9fafb;
    color: #4b5563;
    border-color: #d1d5db;
}

.trade-tag {
    background: #fffbeb;
    color: #d97706;
    border-color: #fed7aa;
}

.tag-more {
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.625rem;
    font-weight: 500;
    background: #f1f5f9;
    color: #64748b;
    border: 1px solid #cbd5e1;
}

.unread-dot {
    position: absolute;
    top: 10px;
    right: 12px;
    width: 6px;
    height: 6px;
    background: #3b82f6;
    border-radius: 50%;
}

/* 加载更多样式 */
.load-more {
    display: flex;
    justify-content: center;
    padding: 12px;
}

.load-more-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    color: #64748b;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.load-more-btn svg {
    width: 14px;
    height: 14px;
}

.load-more-btn:hover {
    background: #f8fafc;
    border-color: #3b82f6;
    color: #3b82f6;
}

.load-more-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.load-more-btn:disabled:hover {
    background: white;
    border-color: #e2e8f0;
    color: #64748b;
}

/* 没有更多数据提示 */
.no-more-data {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px 12px;
    gap: 12px;
}

.no-more-line {
    flex: 1;
    height: 1px;
    background: linear-gradient(to right, transparent, #e2e8f0, transparent);
}

.no-more-text {
    font-size: 0.75rem;
    color: #94a3b8;
    white-space: nowrap;
    padding: 0 8px;
}

/* 底部样式 */
.push-footer {
    display: flex;
    gap: 8px;
    padding: 12px 16px;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
}

.footer-action {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 12px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    color: #64748b;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.footer-action svg {
    width: 14px;
    height: 14px;
}

.footer-action:hover {
    background: #f8fafc;
    border-color: #3b82f6;
    color: #3b82f6;
}

/* 动画效果 */
@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

@keyframes pulse {

    0%,
    100% {
        opacity: 1;
        transform: scale(1);
    }

    50% {
        opacity: 0.8;
        transform: scale(1.05);
    }
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.message-item {
    animation: fadeInUp 0.4s ease-out;
}

/* 新加载的消息项动画延迟 */
.message-item:nth-child(n+16) {
    animation-delay: calc((var(--item-index, 0) - 15) * 0.05s);
}

/* 弹窗基础样式 */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 20px;
    animation: fadeIn 0.3s ease-out;
}

.modal-container {
    background: white;
    border-radius: 20px;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
    max-width: 90vw;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
    animation: slideInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
}

/* 弹窗头部样式 */
.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24px 28px;
    background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
    border-bottom: 1px solid #e2e8f0;
    position: relative;
}

.modal-header::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 28px;
    right: 28px;
    height: 1px;
    background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
}

.modal-title-section {
    display: flex;
    align-items: center;
    gap: 16px;
}

.title-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    position: relative;
    overflow: hidden;
}

.title-icon::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transform: rotate(45deg);
    animation: shimmer 3s infinite;
}

.history-icon {
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    color: white;
}

.settings-icon {
    background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
    color: white;
}

.title-content h3 {
    margin: 0 0 4px 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: #1f2937;
}

.title-desc {
    margin: 0;
    font-size: 0.875rem;
    color: #64748b;
}

.title-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 4px;
}

.message-type {
    font-size: 0.75rem;
    color: #64748b;
    background: #f1f5f9;
    padding: 4px 8px;
    border-radius: 6px;
    font-weight: 500;
}

.priority-badge {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 4px 8px;
    border-radius: 6px;
}

.priority-badge.urgent {
    background: #fef2f2;
    color: #dc2626;
}

.priority-badge.high {
    background: #fffbeb;
    color: #d97706;
}

.priority-badge.medium {
    background: #eff6ff;
    color: #1d4ed8;
}

.priority-badge.low {
    background: #f3f4f6;
    color: #6b7280;
}

.close-button {
    width: 40px;
    height: 40px;
    border: none;
    background: #f1f5f9;
    border-radius: 10px;
    color: #64748b;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
}

.close-button:hover {
    background: #e2e8f0;
    color: #374151;
    transform: rotate(90deg);
}

/* 弹窗主体样式 */
.modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 28px;
    background: #fafbfc;
}

/* 消息详情弹窗样式 */
.detail-modal {
    width: 600px;
}

.message-meta-info {
    background: white;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.meta-item {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
}

.meta-item:last-child {
    margin-bottom: 0;
}

.meta-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #64748b;
    min-width: 80px;
}

.meta-value {
    font-size: 0.875rem;
    color: #1f2937;
    font-weight: 500;
}

.meta-value.priority {
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
}

.meta-value.priority.urgent {
    background: #fef2f2;
    color: #dc2626;
}

.meta-value.priority.high {
    background: #fffbeb;
    color: #d97706;
}

.meta-value.priority.medium {
    background: #eff6ff;
    color: #1d4ed8;
}

.meta-value.priority.low {
    background: #f3f4f6;
    color: #6b7280;
}

.message-detail-content,
.message-details,
.message-detail-tags {
    background: white;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.message-detail-content h4,
.message-details h4,
.message-detail-tags h4 {
    margin: 0 0 16px 0;
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
    display: flex;
    align-items: center;
    gap: 8px;
}

.message-detail-content h4::before {
    content: '💬';
    font-size: 1.2rem;
}

.message-details h4::before {
    content: '📋';
    font-size: 1.2rem;
}

.message-detail-tags h4::before {
    content: '🏷️';
    font-size: 1.2rem;
}

.content-text {
    font-size: 0.9375rem;
    line-height: 1.6;
    color: #374151;
    background: #f8fafc;
    padding: 16px;
    border-radius: 8px;
    border-left: 4px solid #3b82f6;
}

.details-grid {
    display: grid;
    gap: 12px;
}

.detail-item {
    display: flex;
    align-items: center;
    padding: 12px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
}

.detail-key {
    font-size: 0.875rem;
    font-weight: 500;
    color: #64748b;
    min-width: 100px;
}

.detail-value {
    font-size: 0.875rem;
    color: #1f2937;
    font-weight: 500;
}

.tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.detail-tag {
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 500;
    border: 1px solid;
}

/* 历史消息弹窗样式 */
.history-modal {
    width: 800px;
}

.history-filters {
    background: white;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.search-box {
    position: relative;
    margin-bottom: 16px;
}

.search-icon {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: #64748b;
}

.search-input {
    width: 100%;
    padding: 12px 16px 12px 48px;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    font-size: 0.9375rem;
    background: #fafbfc;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.search-input:focus {
    outline: none;
    border-color: #3b82f6;
    background: white;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.filter-controls {
    display: flex;
    gap: 12px;
}

.filter-select {
    flex: 1;
    padding: 10px 16px;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    font-size: 0.875rem;
    background: white;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.filter-select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.history-stats {
    display: flex;
    gap: 24px;
    margin-bottom: 20px;
    padding: 20px;
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    border-radius: 12px;
    border: 1px solid #bfdbfe;
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
}

.stat-number {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 4px;
}

.stat-number.unread {
    color: #dc2626;
}

.stat-label {
    font-size: 0.875rem;
    color: #64748b;
    font-weight: 500;
}

.history-messages {
    background: white;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    max-height: 400px;
    overflow-y: auto;
}

.history-list {
    padding: 8px;
}

.history-item {
    display: flex;
    align-items: flex-start;
    padding: 16px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    margin-bottom: 8px;
    border: 1px solid transparent;
}

.history-item:hover {
    background: #f8fafc;
    border-color: #e2e8f0;
    transform: translateX(4px);
}

.history-item.unread {
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    border-color: #bfdbfe;
}

.history-item.urgent {
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    border-color: #fca5a5;
    border-left: 4px solid #ef4444;
}

.history-item.important {
    background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
    border-color: #fcd34d;
    border-left: 4px solid #f59e0b;
}

.history-icon {
    margin-right: 16px;
}

.history-content {
    flex: 1;
    min-width: 0;
}

.history-header {
    margin-bottom: 8px;
}

.history-title {
    font-size: 0.9375rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 6px 0;
}

.history-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
}

.history-type,
.history-priority,
.history-time {
    font-size: 0.75rem;
    font-weight: 500;
    padding: 3px 8px;
    border-radius: 6px;
}

.history-type {
    background: #f1f5f9;
    color: #64748b;
}

.history-priority.urgent {
    background: #fef2f2;
    color: #dc2626;
}

.history-priority.high {
    background: #fffbeb;
    color: #d97706;
}

.history-priority.medium {
    background: #eff6ff;
    color: #1d4ed8;
}

.history-priority.low {
    background: #f3f4f6;
    color: #6b7280;
}

.history-time {
    background: #f3f4f6;
    color: #6b7280;
}

.history-preview {
    font-size: 0.875rem;
    color: #4b5563;
    line-height: 1.5;
    margin: 8px 0;
}

.history-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.history-tag {
    padding: 3px 6px;
    border-radius: 6px;
    font-size: 0.7rem;
    font-weight: 500;
    border: 1px solid;
}

/* 设置弹窗样式 */
.settings-modal {
    width: 700px;
}

.settings-section {
    background: white;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 20px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.settings-section h4 {
    margin: 0 0 20px 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
    padding-bottom: 12px;
    border-bottom: 2px solid #f1f5f9;
    display: flex;
    align-items: center;
    gap: 8px;
}

.settings-section:nth-child(1) h4::before {
    content: '🔔';
    font-size: 1.25rem;
}

.settings-section:nth-child(2) h4::before {
    content: '⏰';
    font-size: 1.25rem;
}

.settings-section:nth-child(3) h4::before {
    content: '📊';
    font-size: 1.25rem;
}

.settings-grid {
    display: grid;
    gap: 16px;
}

.setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.setting-item:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
}

.setting-info {
    flex: 1;
}

.setting-title {
    font-size: 0.9375rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 4px;
}

.setting-desc {
    font-size: 0.8125rem;
    color: #64748b;
}

.toggle-switch {
    width: 48px;
    height: 28px;
    background: #cbd5e1;
    border-radius: 14px;
    position: relative;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toggle-switch.active {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.toggle-handle {
    width: 24px;
    height: 24px;
    background: white;
    border-radius: 50%;
    position: absolute;
    top: 2px;
    left: 2px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.toggle-switch.active .toggle-handle {
    transform: translateX(20px);
}

.time-settings {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.time-range {
    display: flex;
    gap: 16px;
}

.time-input-group {
    flex: 1;
}

.time-input-group label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 8px;
}

.time-input {
    width: 100%;
    padding: 10px 16px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 0.9375rem;
    background: white;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.time-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.frequency-options {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.frequency-option {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
    background: #f8fafc;
    border-radius: 8px;
    border: 2px solid #e2e8f0;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.frequency-option:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
}

.frequency-option:has(.frequency-radio:checked) {
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.frequency-radio {
    margin: 0;
    accent-color: #3b82f6;
}

.frequency-label {
    font-size: 0.9375rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 4px;
    display: block;
}

.frequency-desc {
    font-size: 0.8125rem;
    color: #64748b;
    display: block;
}

/* 弹窗底部样式 */
.modal-footer {
    display: flex;
    gap: 12px;
    padding: 24px 28px;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    justify-content: flex-end;
}

.modal-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    border-radius: 12px;
    font-size: 0.9375rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 2px solid;
}

.modal-btn.secondary {
    background: white;
    color: #64748b;
    border-color: #e2e8f0;
}

.modal-btn.secondary:hover {
    background: #f8fafc;
    color: #374151;
    border-color: #cbd5e1;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.modal-btn.primary {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.modal-btn.primary:hover {
    background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
    border-color: #2563eb;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
}

/* 弹窗动画 */
@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

@keyframes slideInUp {
    from {
        opacity: 0;
        transform: translateY(60px) scale(0.95);
    }

    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

@keyframes shimmer {
    0% {
        transform: rotate(45deg) translateX(-200%);
    }

    50% {
        transform: rotate(45deg) translateX(200%);
    }

    100% {
        transform: rotate(45deg) translateX(200%);
    }
}

/* 移动端响应式样式 */
@media (max-width: 768px) {
    .push-container {
        margin: 8px;
        border-radius: 12px;
    }

    .push-header {
        padding: 16px 20px;
    }

    .header-left {
        gap: 12px;
    }

    .header-icon {
        width: 40px;
        height: 40px;
    }

    .header-title h3 {
        font-size: 1.125rem;
    }

    .subtitle {
        font-size: 0.8125rem;
    }

    .header-actions {
        gap: 8px;
    }

    .action-btn {
        padding: 6px 0;
        font-size: 0.8125rem;
    }

    .category-tabs {
        padding: 12px 16px 6px 16px;
    }

    .tab-button {
        padding: 8px 12px;
        font-size: 0.8125rem;
    }

    .tab-icon {
        font-size: 0.875rem;
    }

    .messages-container {
        padding: 12px 16px;
    }

    .group-header {
        padding: 6px 12px;
    }

    .group-date {
        font-size: 0.8125rem;
    }

    .group-count {
        font-size: 0.7rem;
    }

    .message-item {
        padding: 12px;
    }

    .icon-circle {
        width: 36px;
        height: 36px;
        font-size: 1.125rem;
    }

    .message-title {
        font-size: 0.9375rem;
    }

    .message-time {
        font-size: 0.7rem;
    }

    .message-preview {
        font-size: 0.8125rem;
    }

    .message-tag {
        font-size: 0.7rem;
        padding: 3px 6px;
    }

    .push-footer {
        padding: 12px 16px;
        gap: 8px;
    }

    .footer-action {
        padding: 10px 12px;
        font-size: 0.8125rem;
    }

    /* 移动端弹窗优化 */
    .modal-overlay {
        padding: 12px;
    }

    .modal-container {
        max-width: 100%;
        max-height: 95vh;
        border-radius: 16px;
    }

    .detail-modal,
    .history-modal,
    .settings-modal {
        width: 100%;
    }

    .modal-header {
        padding: 20px 24px;
    }

    .title-icon {
        width: 40px;
        height: 40px;
    }

    .title-content h3 {
        font-size: 1.125rem;
    }

    .modal-body {
        padding: 20px 24px;
    }

    .modal-footer {
        padding: 20px 24px;
        flex-direction: column;
    }

    .modal-btn {
        justify-content: center;
    }

    .time-range {
        flex-direction: column;
    }

    .filter-controls {
        flex-direction: column;
    }

    .history-stats {
        flex-direction: column;
        gap: 16px;
    }
}
</style>
