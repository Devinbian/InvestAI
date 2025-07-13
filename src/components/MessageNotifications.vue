<template>
    <div class="notifications-container">
        <!-- 头部 -->
        <div class="card-header">
            <div class="header-content">
                <h3 class="card-title">
                    <span class="title-icon">🔔</span>
                    消息推送
                </h3>
                <div class="message-stats">
                    <span class="unread-count">{{ unreadCount }}条未读</span>
                    <button class="mark-all-btn" @click="markAllAsRead" v-if="unreadCount > 0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" />
                        </svg>
                        全部已读
                    </button>
                </div>
            </div>
        </div>

        <!-- 消息分类选项卡 -->
        <div class="message-tabs">
            <div class="tab-list">
                <button v-for="category in messageCategories" :key="category.key"
                    :class="['tab-item', { active: activeTab === category.key }]" @click="switchTab(category.key)">
                    <span class="tab-icon" :class="category.iconClass">{{ category.icon }}</span>
                    <span class="tab-text">{{ category.name }}</span>
                    <span v-if="getUnreadCountByType(category.key) > 0" class="tab-badge">
                        {{ getUnreadCountByType(category.key) }}
                    </span>
                </button>
            </div>
        </div>

        <!-- 消息列表 -->
        <div class="notifications-list">
            <!-- 统计信息 -->
            <div class="message-stats" v-if="messageStats.total > 0">
                <div class="stats-item">
                    <span class="stats-label">总计:</span>
                    <span class="stats-value">{{ messageStats.total }}</span>
                </div>
                <div class="stats-item">
                    <span class="stats-label">未读:</span>
                    <span class="stats-value unread-count">{{ messageStats.unread }}</span>
                </div>
                <div class="stats-item">
                    <span class="stats-label">已加载:</span>
                    <span class="stats-value">{{ messageStats.loaded }}</span>
                </div>
            </div>

            <!-- 空状态 -->
            <div v-if="Object.keys(groupedNotifications).length === 0 && !isLoading" class="empty-state">
                <div class="empty-icon">📭</div>
                <div class="empty-text">暂无{{ getCurrentTabName() }}消息</div>
            </div>

            <!-- 按时间分组的消息项 -->
            <div v-else class="message-items">
                <div v-for="(messages, groupKey) in groupedNotifications" :key="groupKey" class="message-group">
                    <div class="group-header">
                        <span class="group-title">{{ groupKey }}</span>
                        <span class="group-count">({{ messages.length }}条)</span>
                    </div>

                    <div v-for="notification in messages" :key="notification.id" class="notification-item" :class="{
                        'unread': !notification.read,
                        'important': notification.priority === 'high',
                        'urgent': notification.priority === 'urgent'
                    }" @click="showMessageDetail(notification)">
                        <!-- 消息图标 -->
                        <div class="notification-icon">
                            <div class="icon-wrapper" :class="getIconClass(notification.type)">
                                {{ getIconComponent(notification.type) }}
                            </div>
                            <div v-if="notification.priority === 'urgent'" class="urgent-indicator">!</div>
                        </div>

                        <!-- 消息内容 -->
                        <div class="notification-content">
                            <div class="notification-header">
                                <div class="notification-title">{{ notification.title }}</div>
                                <div class="notification-time">{{ formatTime(notification.time) }}</div>
                            </div>
                            <div class="notification-message">{{ notification.message }}</div>

                            <!-- 消息标签 -->
                            <div v-if="notification.tags && notification.tags.length > 0" class="notification-tags">
                                <span v-for="tag in notification.tags.slice(0, 3)" :key="tag" class="tag"
                                    :class="getTagClass(notification.type)">
                                    {{ tag }}
                                </span>
                                <span v-if="notification.tags.length > 3" class="tag-more">
                                    +{{ notification.tags.length - 3 }}
                                </span>
                            </div>

                            <!-- 消息操作 -->
                            <div class="notification-actions" v-if="notification.actions">
                                <button v-for="action in notification.actions.slice(0, 2)" :key="action.key"
                                    class="action-btn" :class="action.type || 'default'"
                                    @click.stop="handleAction(action, notification)">
                                    {{ action.text }}
                                </button>
                            </div>
                        </div>

                        <!-- 未读指示器 -->
                        <div v-if="!notification.read" class="unread-indicator"></div>
                    </div>
                </div>

                <!-- 加载更多按钮 -->
                <div v-if="hasMore && !isLoading" class="load-more-container">
                    <button class="load-more-btn" @click="loadMore">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M12 5v14m7-7l-7 7-7-7" stroke="currentColor" stroke-width="2"
                                stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                        加载更多
                    </button>
                </div>

                <!-- 加载状态 -->
                <div v-if="isLoading" class="loading-container">
                    <div class="loading-spinner"></div>
                    <span class="loading-text">加载中...</span>
                </div>
            </div>
        </div>

        <!-- 底部操作 -->
        <div class="card-footer">
            <button class="footer-btn" @click="viewAllNotifications">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round" />
                </svg>
                查看全部消息
            </button>
            <button class="footer-btn" @click="openSettings">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" />
                    <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="currentColor" stroke-width="2" />
                </svg>
                推送设置
            </button>
        </div>
    </div>

    <!-- 消息详情弹窗 -->
    <div v-if="showDetailDialog" class="message-detail-overlay" @click="closeMessageDetail">
        <div class="message-detail-dialog" @click.stop>
            <div class="detail-header">
                <div class="detail-title">
                    <div class="detail-icon" :class="getIconClass(selectedMessage?.type)">
                        {{ getIconComponent(selectedMessage?.type) }}
                    </div>
                    <h3>{{ selectedMessage?.title }}</h3>
                </div>
                <button class="close-btn" @click="closeMessageDetail">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" />
                        <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" />
                    </svg>
                </button>
            </div>

            <div class="detail-content">
                <!-- 消息元信息 -->
                <div class="detail-meta">
                    <div class="meta-item">
                        <span class="meta-label">时间：</span>
                        <span class="meta-value">{{ formatDetailTime(selectedMessage?.time) }}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">类型：</span>
                        <span class="meta-value">{{ getMessageTypeName(selectedMessage?.type) }}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">优先级：</span>
                        <span class="meta-value priority" :class="selectedMessage?.priority">
                            {{ getPriorityName(selectedMessage?.priority) }}
                        </span>
                    </div>
                </div>

                <!-- 消息内容 -->
                <div class="detail-message">
                    <h4>消息内容</h4>
                    <div class="message-text">{{ selectedMessage?.message }}</div>
                </div>

                <!-- 详细信息 -->
                <div v-if="selectedMessage?.details" class="detail-info">
                    <h4>详细信息</h4>
                    <div class="info-content">
                        <div v-for="(value, key) in selectedMessage.details" :key="key" class="info-item">
                            <span class="info-key">{{ key }}：</span>
                            <span class="info-value">{{ value }}</span>
                        </div>
                    </div>
                </div>

                <!-- 相关链接 -->
                <div v-if="selectedMessage?.links && selectedMessage.links.length > 0" class="detail-links">
                    <h4>相关链接</h4>
                    <div class="links-list">
                        <a v-for="link in selectedMessage.links" :key="link.url" :href="link.url" target="_blank"
                            class="link-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"
                                    stroke="currentColor" stroke-width="2" />
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"
                                    stroke="currentColor" stroke-width="2" />
                            </svg>
                            {{ link.title }}
                        </a>
                    </div>
                </div>

                <!-- 标签 -->
                <div v-if="selectedMessage?.tags && selectedMessage.tags.length > 0" class="detail-tags">
                    <h4>相关标签</h4>
                    <div class="tags-list">
                        <span v-for="tag in selectedMessage.tags" :key="tag" class="detail-tag"
                            :class="getTagClass(selectedMessage.type)">
                            {{ tag }}
                        </span>
                    </div>
                </div>
            </div>

            <div class="detail-footer">
                <button class="detail-action-btn secondary" @click="closeMessageDetail">关闭</button>
                <button class="detail-action-btn primary" @click="sendToChat(selectedMessage)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor"
                            stroke-width="2" />
                    </svg>
                    发送到对话
                </button>
            </div>
        </div>
    </div>

    <!-- 全部消息弹窗 -->
    <div v-if="showAllMessagesDialog" class="all-messages-overlay" @click="closeAllMessages">
        <div class="all-messages-dialog" @click.stop>
            <div class="dialog-header">
                <h3>全部消息</h3>
                <button class="close-btn" @click="closeAllMessages">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" />
                        <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" />
                    </svg>
                </button>
            </div>

            <div class="dialog-content">
                <!-- 搜索和筛选 -->
                <div class="message-filters">
                    <div class="search-box">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="search-icon">
                            <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2" />
                            <path d="m21 21-4.35-4.35" stroke="currentColor" stroke-width="2" />
                        </svg>
                        <input type="text" placeholder="搜索消息..." v-model="searchKeyword" class="search-input" />
                    </div>
                    <div class="filter-options">
                        <select v-model="filterType" class="filter-select">
                            <option value="">全部类型</option>
                            <option value="market">实时行情</option>
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

                <!-- 消息统计 -->
                <div class="message-stats-detail">
                    <div class="stat-item">
                        <span class="stat-label">总消息数</span>
                        <span class="stat-value">{{ allFilteredMessages.length }}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">未读消息</span>
                        <span class="stat-value unread">{{allFilteredMessages.filter(m => !m.read).length}}</span>
                    </div>
                </div>

                <!-- 消息列表 -->
                <div class="all-messages-list">
                    <div v-if="allFilteredMessages.length === 0" class="empty-state">
                        <div class="empty-icon">🔍</div>
                        <div class="empty-text">没有找到匹配的消息</div>
                    </div>
                    <div v-else>
                        <div v-for="message in allFilteredMessages" :key="message.id" class="message-item-full" :class="{
                            'unread': !message.read,
                            'important': message.priority === 'high',
                            'urgent': message.priority === 'urgent'
                        }" @click="showMessageDetail(message)">
                            <div class="message-icon">
                                <div class="icon-wrapper" :class="getIconClass(message.type)">
                                    {{ getIconComponent(message.type) }}
                                </div>
                            </div>
                            <div class="message-content-full">
                                <div class="message-header-full">
                                    <div class="message-title-full">{{ message.title }}</div>
                                    <div class="message-meta">
                                        <span class="message-type">{{ getMessageTypeName(message.type) }}</span>
                                        <span class="message-priority" :class="message.priority">
                                            {{ getPriorityName(message.priority) }}
                                        </span>
                                        <span class="message-time-full">{{ formatTime(message.time) }}</span>
                                    </div>
                                </div>
                                <div class="message-text-preview">{{ message.message }}</div>
                                <div v-if="message.tags" class="message-tags-full">
                                    <span v-for="tag in message.tags.slice(0, 5)" :key="tag" class="tag-full"
                                        :class="getTagClass(message.type)">
                                        {{ tag }}
                                    </span>
                                </div>
                            </div>
                            <div v-if="!message.read" class="unread-indicator"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="dialog-footer">
                <button class="dialog-action-btn secondary" @click="closeAllMessages">关闭</button>
                <button class="dialog-action-btn primary" @click="markAllFilteredAsRead"
                    v-if="allFilteredMessages.some(m => !m.read)">
                    标记为已读
                </button>
            </div>
        </div>
    </div>

    <!-- 推送设置弹窗 -->
    <div v-if="showSettingsDialog" class="settings-overlay" @click="closeSettings">
        <div class="settings-dialog" @click.stop>
            <div class="dialog-header">
                <h3>推送设置</h3>
                <button class="close-btn" @click="closeSettings">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" />
                        <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" />
                    </svg>
                </button>
            </div>

            <div class="dialog-content">
                <!-- 推送开关设置 -->
                <div class="settings-section">
                    <h4>消息推送开关</h4>
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">交易记录推送</div>
                            <div class="setting-desc">买卖记录、委托状态、资金变动等</div>
                        </div>
                        <div class="setting-switch" :class="{ active: pushSettings.trade }"
                            @click="togglePushSetting('trade')">
                            <div class="switch-handle"></div>
                        </div>
                    </div>
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">风险提醒推送</div>
                            <div class="setting-desc">价格预警、风险评估、止损提醒等</div>
                        </div>
                        <div class="setting-switch" :class="{ active: pushSettings.alert }"
                            @click="togglePushSetting('alert')">
                            <div class="switch-handle"></div>
                        </div>
                    </div>
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">实时行情推送</div>
                            <div class="setting-desc">股价变动、板块异动、技术信号等</div>
                        </div>
                        <div class="setting-switch" :class="{ active: pushSettings.market }"
                            @click="togglePushSetting('market')">
                            <div class="switch-handle"></div>
                        </div>
                    </div>
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">财经资讯推送</div>
                            <div class="setting-desc">政策新闻、公司公告、宏观数据等</div>
                        </div>
                        <div class="setting-switch" :class="{ active: pushSettings.news }"
                            @click="togglePushSetting('news')">
                            <div class="switch-handle"></div>
                        </div>
                    </div>
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">系统通知推送</div>
                            <div class="setting-desc">系统更新、设置变更、功能通知等</div>
                        </div>
                        <div class="setting-switch" :class="{ active: pushSettings.system }"
                            @click="togglePushSetting('system')">
                            <div class="switch-handle"></div>
                        </div>
                    </div>
                </div>

                <!-- 推送时间设置 -->
                <div class="settings-section">
                    <h4>推送时间设置</h4>
                    <div class="time-setting">
                        <div class="time-item">
                            <label>开始时间</label>
                            <input type="time" v-model="pushSettings.startTime" class="time-input" />
                        </div>
                        <div class="time-item">
                            <label>结束时间</label>
                            <input type="time" v-model="pushSettings.endTime" class="time-input" />
                        </div>
                    </div>
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">免打扰模式</div>
                            <div class="setting-desc">在指定时间段内不接收推送通知</div>
                        </div>
                        <div class="setting-switch" :class="{ active: pushSettings.doNotDisturb }"
                            @click="togglePushSetting('doNotDisturb')">
                            <div class="switch-handle"></div>
                        </div>
                    </div>
                </div>

                <!-- 推送频率设置 -->
                <div class="settings-section">
                    <h4>推送频率设置</h4>
                    <div class="frequency-setting">
                        <div class="frequency-item">
                            <input type="radio" id="realtime" value="realtime" v-model="pushSettings.frequency" />
                            <label for="realtime">实时推送</label>
                        </div>
                        <div class="frequency-item">
                            <input type="radio" id="hourly" value="hourly" v-model="pushSettings.frequency" />
                            <label for="hourly">每小时汇总</label>
                        </div>
                        <div class="frequency-item">
                            <input type="radio" id="daily" value="daily" v-model="pushSettings.frequency" />
                            <label for="daily">每日汇总</label>
                        </div>
                    </div>
                </div>
            </div>

            <div class="dialog-footer">
                <button class="dialog-action-btn secondary" @click="resetSettings">重置</button>
                <button class="dialog-action-btn primary" @click="saveSettings">保存设置</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';

// 定义emit
const emit = defineEmits(['send-to-chat']);

// 响应式数据
const activeTab = ref('all');
const showDetailDialog = ref(false);
const selectedMessage = ref(null);
const showAllMessagesDialog = ref(false);
const showSettingsDialog = ref(false);

// 搜索和筛选
const searchKeyword = ref('');
const filterType = ref('');
const filterPriority = ref('');

// 分页和加载状态
const currentPage = ref(1);
const pageSize = ref(15);
const isLoading = ref(false);
const hasMore = ref(true);
const totalMessages = ref(0);

// 推送设置
const pushSettings = ref({
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

// 消息分类
const messageCategories = ref([
    { key: 'all', name: '全部', icon: '📋', iconClass: 'all-icon' },
    { key: 'trade', name: '交易', icon: '💰', iconClass: 'trade-icon' },
    { key: 'alert', name: '提醒', icon: '⚠️', iconClass: 'alert-icon' },
    { key: 'market', name: '行情', icon: '📈', iconClass: 'market-icon' },
    { key: 'news', name: '资讯', icon: '📰', iconClass: 'news-icon' },
    { key: 'system', name: '系统', icon: '⚙️', iconClass: 'system-icon' }
]);

// 生成模拟消息数据的函数
const generateMockMessages = () => {
    const types = ['trade', 'alert', 'market', 'news', 'system'];
    const priorities = ['urgent', 'high', 'medium', 'low'];
    const messages = [];

    const baseMessages = [
        { type: 'market', title: '市场异动提醒', content: '芯片板块大幅上涨，建议关注相关龙头股票机会' },
        { type: 'news', title: '重要资讯', content: '央行宣布降准0.25个百分点，利好银行和地产板块' },
        { type: 'alert', title: '价格提醒', content: '您关注的平安银行跌幅超过5%，请注意风险控制' },
        { type: 'system', title: '系统通知', content: '您的投资偏好设置已更新，推荐算法将为您提供更精准的建议' },
        { type: 'trade', title: '交易执行', content: '您的买入订单已成功执行：茅台 100股 @ ¥1850.00' },
        { type: 'market', title: '板块异动', content: '新能源汽车板块午后拉升，比亚迪涨停' },
        { type: 'news', title: '政策解读', content: '工信部发布新能源汽车发展规划，行业迎来利好' },
        { type: 'alert', title: '止损提醒', content: '您设置的止损单已触发，股票已自动卖出' },
        { type: 'system', title: '功能更新', content: '智能投顾功能已升级，新增风险评估模块' },
        { type: 'trade', title: '分红到账', content: '您持有的工商银行分红已到账，金额￥128.50' }
    ];

    // 生成150条消息
    for (let i = 1; i <= 150; i++) {
        const baseMsg = baseMessages[i % baseMessages.length];
        const timeOffset = Math.random() * 30 * 24 * 60 * 60 * 1000; // 30天内随机时间

        messages.push({
            id: i,
            type: baseMsg.type,
            priority: priorities[Math.floor(Math.random() * priorities.length)],
            title: `${baseMsg.title} ${i}`,
            message: baseMsg.content,
            time: new Date(Date.now() - timeOffset),
            read: Math.random() > 0.3, // 70% 已读
            tags: generateTags(baseMsg.type),
            details: generateDetails(baseMsg.type),
            actions: generateActions(baseMsg.type)
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

const generateActions = (type) => {
    const actionsMap = {
        market: [{ key: 'analyze', text: '深度分析', type: 'primary' }],
        news: [{ key: 'impact', text: '影响分析', type: 'primary' }],
        alert: [{ key: 'risk', text: '风险评估', type: 'warning' }],
        system: [{ key: 'detail', text: '查看详情', type: 'secondary' }],
        trade: [{ key: 'detail', text: '交易详情', type: 'primary' }]
    };

    return actionsMap[type] || [];
};

// 所有消息数据
const allMessages = ref(generateMockMessages());
// 当前显示的消息（分页加载）
const notifications = ref([]);

// 初始化时设置总数
totalMessages.value = allMessages.value.length;

// 分页加载逻辑
const loadMessages = (reset = false) => {
    if (isLoading.value) return;

    isLoading.value = true;

    // 模拟网络延迟
    setTimeout(() => {
        const filteredMessages = getFilteredMessages();
        const startIndex = reset ? 0 : notifications.value.length;
        const endIndex = startIndex + pageSize.value;
        const newMessages = filteredMessages.slice(startIndex, endIndex);

        if (reset) {
            notifications.value = newMessages;
            currentPage.value = 1;
        } else {
            notifications.value.push(...newMessages);
            currentPage.value++;
        }

        hasMore.value = endIndex < filteredMessages.length;
        isLoading.value = false;
    }, 500);
};

// 获取过滤后的消息
const getFilteredMessages = () => {
    return allMessages.value.filter(notification => {
        const categoryMatch = activeTab.value === 'all' || notification.type === activeTab.value;
        return categoryMatch;
    });
};

// 滚动加载更多
const loadMore = () => {
    if (hasMore.value && !isLoading.value) {
        loadMessages();
    }
};

// 重置并加载
const resetAndLoad = () => {
    notifications.value = [];
    loadMessages(true);
};

// 计算属性
const unreadCount = computed(() => {
    return allMessages.value.filter(n => !n.read).length;
});

const filteredNotifications = computed(() => {
    if (activeTab.value === 'all') {
        return notifications.value;
    }
    return notifications.value.filter(n => n.type === activeTab.value);
});

// 按时间分组的消息
const groupedNotifications = computed(() => {
    const groups = {};
    const now = new Date();

    filteredNotifications.value.forEach(notification => {
        const messageTime = new Date(notification.time);
        let groupKey;

        const diffDays = Math.floor((now - messageTime) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            groupKey = '今天';
        } else if (diffDays === 1) {
            groupKey = '昨天';
        } else if (diffDays <= 7) {
            groupKey = `${diffDays}天前`;
        } else if (diffDays <= 30) {
            groupKey = `${Math.floor(diffDays / 7)}周前`;
        } else {
            groupKey = `${Math.floor(diffDays / 30)}个月前`;
        }

        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }
        groups[groupKey].push(notification);
    });

    return groups;
});

// 统计信息
const messageStats = computed(() => {
    return {
        total: allMessages.value.length,
        unread: allMessages.value.filter(n => !n.read).length,
        loaded: notifications.value.length,
        hasMore: hasMore.value
    };
});

// 全部消息的搜索和筛选
const allFilteredMessages = computed(() => {
    let filtered = allMessages.value;

    // 搜索关键词筛选
    if (searchKeyword.value) {
        const keyword = searchKeyword.value.toLowerCase();
        filtered = filtered.filter(msg =>
            msg.title.toLowerCase().includes(keyword) ||
            msg.message.toLowerCase().includes(keyword) ||
            (msg.tags && msg.tags.some(tag => tag.toLowerCase().includes(keyword)))
        );
    }

    // 类型筛选
    if (filterType.value) {
        filtered = filtered.filter(msg => msg.type === filterType.value);
    }

    // 优先级筛选
    if (filterPriority.value) {
        filtered = filtered.filter(msg => msg.priority === filterPriority.value);
    }

    // 按时间倒序排列
    return filtered.sort((a, b) => new Date(b.time) - new Date(a.time));
});

// 方法
const switchTab = (tabKey) => {
    activeTab.value = tabKey;
    resetAndLoad(); // 切换标签时重新加载消息
};

const getCurrentTabName = () => {
    const category = messageCategories.value.find(c => c.key === activeTab.value);
    return category ? category.name : '全部';
};

const getUnreadCountByType = (type) => {
    if (type === 'all') {
        return unreadCount.value;
    }
    return allMessages.value.filter(n => n.type === type && !n.read).length;
};

const getIconClass = (type) => {
    const classMap = {
        'news': 'news-icon',
        'alert': 'alert-icon',
        'market': 'market-icon',
        'system': 'system-icon',
        'trade': 'trade-icon'
    };
    return classMap[type] || 'default-icon';
};

const getIconComponent = (type) => {
    // 返回对应的图标内容
    const iconContent = {
        'news': '📰',
        'alert': '⚠️',
        'market': '📈',
        'system': '⚙️',
        'trade': '💰',
        'all': '📋'
    };
    return iconContent[type] || '📄';
};

const getTagClass = (type) => {
    const classMap = {
        'news': 'news-tag',
        'alert': 'alert-tag',
        'market': 'market-tag',
        'system': 'system-tag',
        'trade': 'trade-tag'
    };
    return classMap[type] || 'default-tag';
};

const getMessageTypeName = (type) => {
    const typeMap = {
        'news': '财经资讯',
        'alert': '风险提醒',
        'market': '实时行情',
        'system': '系统通知',
        'trade': '交易记录'
    };
    return typeMap[type] || '其他';
};

const getPriorityName = (priority) => {
    const priorityMap = {
        'urgent': '紧急',
        'high': '高',
        'medium': '中',
        'low': '低'
    };
    return priorityMap[priority] || '普通';
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

const showMessageDetail = (notification) => {
    selectedMessage.value = notification;
    showDetailDialog.value = true;

    // 标记为已读
    if (!notification.read) {
        notification.read = true;
    }
};

const closeMessageDetail = () => {
    showDetailDialog.value = false;
    selectedMessage.value = null;
};

const sendToChat = (notification) => {
    emit('send-to-chat', {
        type: 'message',
        content: notification.message,
        title: notification.title,
        details: notification.details
    });
    closeMessageDetail();
    ElMessage.success('消息已发送到对话框');
};

const handleAction = (action, notification) => {
    console.log('执行操作:', action, notification);

    switch (action.key) {
        case 'analyze':
            ElMessage.info('正在进行深度分析...');
            break;
        case 'follow':
            ElMessage.success('已添加关注');
            break;
        case 'impact':
            ElMessage.info('正在分析政策影响...');
            break;
        case 'risk':
            ElMessage.warning('正在评估风险...');
            break;
        case 'detail':
            showMessageDetail(notification);
            break;
        default:
            ElMessage.info('功能开发中...');
    }
};

const markAllAsRead = () => {
    notifications.value.forEach(n => {
        n.read = true;
    });
    ElMessage.success('所有消息已标记为已读');
};

// 全部消息弹窗相关方法
const viewAllNotifications = () => {
    showAllMessagesDialog.value = true;
    // 重置搜索和筛选
    searchKeyword.value = '';
    filterType.value = '';
    filterPriority.value = '';
};

const closeAllMessages = () => {
    showAllMessagesDialog.value = false;
};

const markAllFilteredAsRead = () => {
    allFilteredMessages.value.forEach(msg => {
        if (!msg.read) {
            msg.read = true;
        }
    });
    ElMessage.success(`已标记 ${allFilteredMessages.value.filter(m => !m.read).length} 条消息为已读`);
};

// 推送设置弹窗相关方法
const openSettings = () => {
    showSettingsDialog.value = true;
};

const closeSettings = () => {
    showSettingsDialog.value = false;
};

const togglePushSetting = (key) => {
    pushSettings.value[key] = !pushSettings.value[key];
};

const saveSettings = () => {
    // 这里可以调用API保存设置到后端
    console.log('保存推送设置:', pushSettings.value);
    ElMessage.success('推送设置已保存');
    showSettingsDialog.value = false;
};

const resetSettings = () => {
    pushSettings.value = {
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
    ElMessage.info('设置已重置为默认值');
};

// 组件初始化
onMounted(() => {
    loadMessages(true); // 初始加载第一页数据
});
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
    margin: 8px 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.card-header {
    padding: 16px 20px 12px 20px;
    border-bottom: 1px solid #f5f5f5;
    flex-shrink: 0;
    background: #fafafa;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.card-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #18181b;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
}

.title-icon {
    font-size: 1.2rem;
}

.message-stats {
    display: flex;
    align-items: center;
    gap: 12px;
}

.unread-count {
    font-size: 0.75rem;
    color: #9ca3af;
    background: #f3f4f6;
    padding: 2px 8px;
    border-radius: 10px;
    font-weight: 500;
}

.mark-all-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.75rem;
    color: #6b7280;
    background: none;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 4px 8px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.mark-all-btn:hover {
    background: #f9fafb;
    border-color: #9ca3af;
    color: #374151;
}

/* 统计信息样式 */
.message-stats {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 20px;
    background: #f8fafc;
    border-bottom: 1px solid #f0f0f0;
    font-size: 0.85rem;
}

.stats-item {
    display: flex;
    align-items: center;
    gap: 4px;
}

.stats-label {
    color: #6b7280;
    font-weight: 500;
}

.stats-value {
    color: #374151;
    font-weight: 600;
}

.stats-value.unread-count {
    color: #ef4444;
    background: #fef2f2;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.8rem;
}

/* 消息分组样式 */
.message-group {
    margin-bottom: 16px;
}

.group-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 20px 4px 20px;
    margin-bottom: 8px;
    position: sticky;
    top: 0;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    z-index: 2;
}

.group-title {
    font-size: 0.85rem;
    font-weight: 600;
    color: #374151;
}

.group-count {
    font-size: 0.75rem;
    color: #6b7280;
    background: #f3f4f6;
    padding: 2px 6px;
    border-radius: 4px;
}

/* 加载更多按钮样式 */
.load-more-container {
    display: flex;
    justify-content: center;
    padding: 16px 20px;
    border-top: 1px solid #f0f0f0;
}

.load-more-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    color: #374151;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s ease;
}

.load-more-btn:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
    transform: translateY(-1px);
}

/* 加载状态样式 */
.loading-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 16px 20px;
    color: #6b7280;
}

.loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid #f3f4f6;
    border-top: 2px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

.loading-text {
    font-size: 0.85rem;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

/* 消息分类选项卡 */
.message-tabs {
    background: #fff;
    border-bottom: 1px solid #f0f0f0;
    padding: 0 16px 8px 16px;
    flex-shrink: 0;
}

.tab-list {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    scrollbar-width: thin;
    scrollbar-color: #d1d5db #f9fafb;
    padding-bottom: 4px;
}

.tab-list::-webkit-scrollbar {
    height: 4px;
}

.tab-list::-webkit-scrollbar-track {
    background: #f9fafb;
    border-radius: 2px;
}

.tab-list::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 2px;
}

.tab-list::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
}

.tab-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border: none;
    background: none;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s ease;
    white-space: nowrap;
    font-size: 0.85rem;
    color: #6b7280;
    position: relative;
    min-width: fit-content;
}

.tab-item:hover {
    background: #f9fafb;
    color: #374151;
}

.tab-item.active {
    background: #eff6ff;
    color: #1d4ed8;
    font-weight: 500;
}

.tab-icon {
    font-size: 1rem;
}

.tab-text {
    font-size: 0.85rem;
}

.tab-badge {
    background: #ef4444;
    color: white;
    font-size: 0.7rem;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 10px;
    min-width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
}

.notifications-list {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    padding: 8px 0;
}

.list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 20px 12px 20px;
    border-bottom: 1px solid #f0f0f0;
    margin-bottom: 8px;
}

.list-title {
    font-size: 0.9rem;
    font-weight: 600;
    color: #374151;
}

.list-count {
    font-size: 0.75rem;
    color: #9ca3af;
    background: #f3f4f6;
    padding: 2px 8px;
    border-radius: 10px;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
}

.empty-icon {
    font-size: 3rem;
    margin-bottom: 12px;
    opacity: 0.6;
}

.empty-text {
    font-size: 0.9rem;
    color: #9ca3af;
}

.message-items {
    padding: 0 8px;
}

.notification-item {
    display: flex;
    align-items: flex-start;
    padding: 12px 16px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    margin-bottom: 8px;
    border: 1px solid #f0f0f0;
    background: #fff;
}

.notification-item:hover {
    background: #f9fafb;
    border-color: #e5e7eb;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.notification-item.unread {
    background: #fefffe;
    border-color: #dbeafe;
    box-shadow: 0 1px 3px rgba(59, 130, 246, 0.1);
}

.notification-item.important {
    border-left: 3px solid #f59e0b;
}

.notification-item.urgent {
    border-left: 3px solid #ef4444;
    background: #fef2f2;
}

.notification-icon {
    margin-right: 12px;
    margin-top: 2px;
    position: relative;
}

.icon-wrapper {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.urgent-indicator {
    position: absolute;
    top: -2px;
    right: -2px;
    width: 16px;
    height: 16px;
    background: #ef4444;
    color: white;
    border-radius: 50%;
    font-size: 0.7rem;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid white;
    animation: pulse 2s infinite;
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

.trade-icon {
    background: #fef3c7;
    color: #d97706;
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
    margin-bottom: 8px;
}

.tag {
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 0.7rem;
    font-weight: 500;
    border: 1px solid transparent;
}

.tag-more {
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 0.7rem;
    font-weight: 500;
    background: #f3f4f6;
    color: #6b7280;
}

.news-tag {
    background: #eff6ff;
    color: #1d4ed8;
    border-color: #dbeafe;
}

.alert-tag {
    background: #fef2f2;
    color: #dc2626;
    border-color: #fecaca;
}

.market-tag {
    background: #ecfdf5;
    color: #059669;
    border-color: #bbf7d0;
}

.system-tag {
    background: #f9fafb;
    color: #6b7280;
    border-color: #e5e7eb;
}

.trade-tag {
    background: #fef3c7;
    color: #d97706;
    border-color: #fde68a;
}

.notification-actions {
    display: flex;
    gap: 6px;
    margin-top: 8px;
}

.action-btn {
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 500;
    border: 1px solid;
    cursor: pointer;
    transition: all 0.2s ease;
}

.action-btn.primary {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
}

.action-btn.primary:hover {
    background: #2563eb;
    border-color: #2563eb;
}

.action-btn.secondary {
    background: #f9fafb;
    color: #374151;
    border-color: #d1d5db;
}

.action-btn.secondary:hover {
    background: #f3f4f6;
    border-color: #9ca3af;
}

.action-btn.warning {
    background: #fef3c7;
    color: #d97706;
    border-color: #fde68a;
}

.action-btn.warning:hover {
    background: #fde68a;
    border-color: #f59e0b;
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
    padding: 12px 16px;
    border-top: 1px solid #f5f5f5;
    flex-shrink: 0;
    display: flex;
    gap: 8px;
    background: #fafafa;
}

.footer-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 12px;
    font-size: 0.8rem;
    color: #6b7280;
    background: #fff;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.footer-btn:hover {
    background: #f9fafb;
    border-color: #9ca3af;
    color: #374151;
}

/* 消息详情弹窗 */
.message-detail-overlay {
    position: fixed !important;
    top: 56px !important;
    right: 0 !important;
    width: 520px !important;
    height: calc(100vh - 56px) !important;
    background: rgba(0, 0, 0, 0.4) !important;
    display: flex !important;
    align-items: flex-start !important;
    justify-content: center !important;
    z-index: 1000 !important;
    padding: 20px !important;
    padding-top: 20px !important;
}

.message-detail-dialog {
    background: white !important;
    border-radius: 12px !important;
    width: 100% !important;
    max-width: 480px !important;
    max-height: calc(100vh - 120px) !important;
    display: flex !important;
    flex-direction: column !important;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
    border: 1px solid #e5e7eb !important;
}

.detail-header {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    padding: 20px !important;
    border-bottom: 1px solid #e5e7eb !important;
    background: #f9fafb !important;
    flex-shrink: 0 !important;
}

.detail-title {
    display: flex;
    align-items: center;
    gap: 12px;
}

.detail-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.detail-title h3 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: #111827;
}

.close-btn {
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s ease;
}

.close-btn:hover {
    background: #f3f4f6;
    color: #374151;
}

.detail-content {
    flex: 1 !important;
    overflow-y: auto !important;
    padding: 20px !important;
    max-height: calc(100vh - 200px) !important;
}

.detail-meta {
    margin-bottom: 20px;
    padding: 16px;
    background: #f9fafb;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
}

.meta-item {
    display: flex;
    margin-bottom: 8px;
}

.meta-item:last-child {
    margin-bottom: 0;
}

.meta-label {
    font-weight: 500;
    color: #6b7280;
    min-width: 60px;
}

.meta-value {
    color: #374151;
}

.meta-value.priority {
    font-weight: 500;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 0.8rem;
}

.meta-value.priority.urgent {
    background: #fef2f2;
    color: #dc2626;
}

.meta-value.priority.high {
    background: #fef3c7;
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

.detail-message h4,
.detail-info h4,
.detail-links h4,
.detail-tags h4 {
    margin: 0 0 12px 0;
    font-size: 0.95rem;
    font-weight: 600;
    color: #374151;
}

.message-text {
    font-size: 0.9rem;
    line-height: 1.6;
    color: #4b5563;
    background: #f9fafb;
    padding: 12px;
    border-radius: 6px;
    border-left: 3px solid #3b82f6;
}

.detail-info {
    margin-top: 20px;
}

.info-content {
    background: #f9fafb;
    padding: 12px;
    border-radius: 6px;
    border: 1px solid #f0f0f0;
}

.info-item {
    display: flex;
    margin-bottom: 8px;
}

.info-item:last-child {
    margin-bottom: 0;
}

.info-key {
    font-weight: 500;
    color: #6b7280;
    min-width: 80px;
}

.info-value {
    color: #374151;
}

.detail-links {
    margin-top: 20px;
}

.links-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.link-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    text-decoration: none;
    color: #3b82f6;
    font-size: 0.85rem;
    transition: all 0.2s ease;
}

.link-item:hover {
    background: #eff6ff;
    border-color: #3b82f6;
}

.detail-tags {
    margin-top: 20px;
}

.tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.detail-tag {
    padding: 4px 8px;
    border-radius: 10px;
    font-size: 0.75rem;
    font-weight: 500;
    border: 1px solid transparent;
}

.detail-footer {
    display: flex !important;
    gap: 12px !important;
    padding: 20px !important;
    border-top: 1px solid #e5e7eb !important;
    background: #f9fafb !important;
    flex-shrink: 0 !important;
}

.detail-action-btn {
    flex: 1;
    padding: 10px 16px;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 500;
    border: 1px solid;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
}

.detail-action-btn.secondary {
    background: #f9fafb;
    color: #374151;
    border-color: #d1d5db;
}

.detail-action-btn.secondary:hover {
    background: #f3f4f6;
    border-color: #9ca3af;
}

.detail-action-btn.primary {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
}

.detail-action-btn.primary:hover {
    background: #2563eb;
    border-color: #2563eb;
}

/* 全部消息弹窗样式 */
.all-messages-overlay,
.settings-overlay {
    position: fixed !important;
    top: 56px !important;
    /* 顶部导航栏高度 */
    right: 0 !important;
    width: 520px !important;
    /* 侧边栏宽度 */
    height: calc(100vh - 56px) !important;
    /* 减去顶部导航栏高度 */
    background: rgba(0, 0, 0, 0.6) !important;
    display: block !important;
    z-index: 1000 !important;
    padding: 20px !important;
    backdrop-filter: blur(2px) !important;
}

.all-messages-dialog,
.settings-dialog {
    background: white !important;
    border-radius: 12px !important;
    max-width: 100% !important;
    width: 100% !important;
    max-height: calc(100vh - 116px) !important;
    overflow: hidden !important;
    display: flex !important;
    flex-direction: column !important;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
    border: 1px solid #e5e7eb !important;
    position: relative !important;
    transform: scale(1) !important;
    transition: transform 0.2s ease !important;
    margin: 0 !important;
}

/* PC端侧边栏收起时隐藏弹窗 */
@media (min-width: 769px) {

    .sidebar-container.collapsed~.message-detail-overlay,
    .sidebar-container.collapsed~.all-messages-overlay,
    .sidebar-container.collapsed~.settings-overlay {
        display: none !important;
    }
}

.dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
    border-bottom: 1px solid #f0f0f0;
    background: #fafafa;
}

.dialog-header h3 {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 600;
    color: #18181b;
}

.dialog-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    max-height: calc(100vh - 200px);
}

.dialog-footer {
    display: flex;
    gap: 12px;
    padding: 20px;
    border-top: 1px solid #f0f0f0;
    background: #fafafa;
    justify-content: flex-end;
}

.dialog-action-btn {
    padding: 10px 20px;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 500;
    border: 1px solid;
    cursor: pointer;
    transition: all 0.2s ease;
}

.dialog-action-btn.secondary {
    background: #f9fafb;
    color: #374151;
    border-color: #d1d5db;
}

.dialog-action-btn.secondary:hover {
    background: #f3f4f6;
    border-color: #9ca3af;
}

.dialog-action-btn.primary {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
}

.dialog-action-btn.primary:hover {
    background: #2563eb;
    border-color: #2563eb;
}

/* 搜索和筛选样式 */
.message-filters {
    margin-bottom: 20px;
    padding: 16px;
    background: #f9fafb;
    border-radius: 8px;
    border: 1px solid #f0f0f0;
}

.search-box {
    position: relative;
    margin-bottom: 12px;
}

.search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #6b7280;
}

.search-input {
    width: 100%;
    padding: 10px 12px 10px 40px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.9rem;
    background: white;
    transition: border-color 0.2s ease;
}

.search-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.filter-options {
    display: flex;
    gap: 12px;
}

.filter-select {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.9rem;
    background: white;
    cursor: pointer;
}

.filter-select:focus {
    outline: none;
    border-color: #3b82f6;
}

/* 消息统计样式 */
.message-stats-detail {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
    padding: 12px 16px;
    background: #f0f9ff;
    border-radius: 6px;
    border: 1px solid #bae6fd;
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.stat-label {
    font-size: 0.8rem;
    color: #6b7280;
    margin-bottom: 4px;
}

.stat-value {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1f2937;
}

.stat-value.unread {
    color: #dc2626;
}

/* 全部消息列表样式 */
.all-messages-list {
    max-height: 400px;
    overflow-y: auto;
}

.message-item-full {
    display: flex;
    align-items: flex-start;
    padding: 16px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    margin-bottom: 12px;
    border: 1px solid #f0f0f0;
    background: #fff;
}

.message-item-full:hover {
    background: #f9fafb;
    border-color: #e5e7eb;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.message-item-full.unread {
    background: #fefffe;
    border-color: #dbeafe;
    box-shadow: 0 1px 3px rgba(59, 130, 246, 0.1);
}

.message-item-full.important {
    border-left: 3px solid #f59e0b;
}

.message-item-full.urgent {
    border-left: 3px solid #ef4444;
    background: #fef2f2;
}

.message-icon {
    margin-right: 16px;
    margin-top: 2px;
}

.message-content-full {
    flex: 1;
    min-width: 0;
}

.message-header-full {
    margin-bottom: 8px;
}

.message-title-full {
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 6px;
}

.message-meta {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
}

.message-type {
    font-size: 0.75rem;
    color: #6b7280;
    background: #f3f4f6;
    padding: 2px 6px;
    border-radius: 4px;
}

.message-priority {
    font-size: 0.75rem;
    font-weight: 500;
    padding: 2px 6px;
    border-radius: 4px;
}

.message-priority.urgent {
    background: #fef2f2;
    color: #dc2626;
}

.message-priority.high {
    background: #fef3c7;
    color: #d97706;
}

.message-priority.medium {
    background: #eff6ff;
    color: #1d4ed8;
}

.message-priority.low {
    background: #f3f4f6;
    color: #6b7280;
}

.message-time-full {
    font-size: 0.75rem;
    color: #9ca3af;
}

.message-text-preview {
    font-size: 0.9rem;
    color: #4b5563;
    line-height: 1.4;
    margin-bottom: 8px;
}

.message-tags-full {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

.tag-full {
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 0.7rem;
    font-weight: 500;
    border: 1px solid transparent;
}

/* 推送设置样式 */
.settings-section {
    margin-bottom: 24px;
}

.settings-section h4 {
    margin: 0 0 16px 0;
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
    padding-bottom: 8px;
    border-bottom: 1px solid #f0f0f0;
}

.setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid #f9fafb;
}

.setting-item:last-child {
    border-bottom: none;
}

.setting-info {
    flex: 1;
}

.setting-title {
    font-size: 0.9rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 4px;
}

.setting-desc {
    font-size: 0.8rem;
    color: #6b7280;
}

.setting-switch {
    width: 44px;
    height: 24px;
    background: #d1d5db;
    border-radius: 12px;
    position: relative;
    cursor: pointer;
    transition: all 0.3s ease;
}

.setting-switch.active {
    background: #3b82f6;
}

.switch-handle {
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    position: absolute;
    top: 2px;
    left: 2px;
    transition: all 0.3s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.setting-switch.active .switch-handle {
    transform: translateX(20px);
}

.time-setting {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
}

.time-item {
    flex: 1;
}

.time-item label {
    display: block;
    font-size: 0.8rem;
    color: #6b7280;
    margin-bottom: 4px;
}

.time-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.9rem;
    background: white;
}

.time-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.frequency-setting {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.frequency-item {
    display: flex;
    align-items: center;
    gap: 8px;
}

.frequency-item input[type="radio"] {
    margin: 0;
}

.frequency-item label {
    font-size: 0.9rem;
    color: #374151;
    cursor: pointer;
}

/* 动画效果 */
@keyframes pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.5;
    }
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.notification-item {
    animation: slideIn 0.3s ease-out;
}

/* 移动端响应式样式 */
@media (max-width: 768px) {
    .notifications-container {
        margin: 4px 8px !important;
        border-radius: 8px !important;
        min-height: calc(100vh - 160px) !important;
    }

    /* 移动端弹窗优化 */
    .message-detail-overlay,
    .all-messages-overlay,
    .settings-overlay {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 9999 !important;
        /* 确保在移动端侧边栏之上 */
        align-items: center !important;
        /* 移动端居中显示 */
        padding: 20px !important;
        overflow-y: auto !important;
        /* 允许弹窗区域滚动 */
        -webkit-overflow-scrolling: touch !important;
        background: rgba(0, 0, 0, 0.7) !important;
        /* 移动端稍微深一点的背景 */
    }

    .message-detail-dialog,
    .all-messages-dialog,
    .settings-dialog {
        max-width: 100% !important;
        width: calc(100% - 40px) !important;
        max-height: calc(100% - 40px) !important;
        min-height: auto !important;
        border-radius: 12px !important;
        margin: 0 auto !important;
        position: relative !important;
        transform: none !important;
        /* 移除transform，避免定位问题 */
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
    }

    /* 移动端弹窗内容优化 */
    .dialog-content {
        max-height: calc(80vh - 120px) !important;
        /* 限制内容区域高度，确保按钮可见 */
        overflow-y: auto !important;
        -webkit-overflow-scrolling: touch !important;
    }

    /* 移动端弹窗头部优化 */
    .detail-header,
    .dialog-header {
        padding: 16px !important;
        position: sticky !important;
        top: 0 !important;
        background: #fafafa !important;
        z-index: 1 !important;
        border-bottom: 1px solid #f0f0f0 !important;
    }

    /* 移动端弹窗底部优化 */
    .detail-footer,
    .dialog-footer {
        padding: 16px !important;
        gap: 8px !important;
        position: sticky !important;
        bottom: 0 !important;
        background: #fafafa !important;
        z-index: 1 !important;
        border-top: 1px solid #f0f0f0 !important;
    }

    /* 移动端关闭按钮优化 */
    .close-btn {
        padding: 8px !important;
        border-radius: 50% !important;
        background: rgba(255, 255, 255, 0.9) !important;
        border: 1px solid #e5e7eb !important;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
    }

    .close-btn:hover {
        background: rgba(255, 255, 255, 1) !important;
        border-color: #d1d5db !important;
    }

    /* 移动端弹窗动画优化 */
    .message-detail-overlay,
    .all-messages-overlay,
    .settings-overlay {
        animation: fadeIn 0.3s ease-out !important;
    }

    .message-detail-dialog,
    .all-messages-dialog,
    .settings-dialog {
        animation: slideInUp 0.3s ease-out !important;
    }

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
            transform: translateY(20px);
        }

        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    /* 移动端弹窗在侧边栏内部显示，不需要特殊处理层级 */

    /* 移动端弹窗内容区域滚动优化 */
    .detail-content {
        padding: 16px !important;
        overflow-y: auto !important;
        -webkit-overflow-scrolling: touch !important;
        overscroll-behavior: contain !important;
    }

    /* 移动端消息列表优化 */
    .all-messages-list {
        max-height: none !important;
        /* 移除高度限制，让内容自然流动 */
    }

    /* 移动端设置弹窗内容优化 */
    .settings-section {
        margin-bottom: 20px !important;
    }

    .settings-section:last-child {
        margin-bottom: 0 !important;
    }

    /* 移动端头部优化 */
    .card-header {
        padding: 12px 16px 8px 16px !important;
        border-radius: 8px 8px 0 0 !important;
    }

    .header-content {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 8px !important;
    }

    .card-title {
        font-size: 1rem !important;
    }

    .title-icon {
        font-size: 1rem !important;
    }

    .message-stats {
        gap: 8px !important;
    }

    .unread-count {
        font-size: 0.7rem !important;
        padding: 1px 6px !important;
    }

    .mark-all-btn {
        font-size: 0.7rem !important;
        padding: 2px 6px !important;
    }

    /* 移动端统计信息优化 */
    .message-stats {
        padding: 8px 16px !important;
        gap: 12px !important;
        font-size: 0.8rem !important;
    }

    .stats-label {
        font-size: 0.75rem !important;
    }

    .stats-value {
        font-size: 0.8rem !important;
    }

    .stats-value.unread-count {
        font-size: 0.75rem !important;
        padding: 1px 4px !important;
    }

    /* 移动端分组样式优化 */
    .group-header {
        padding: 6px 16px 4px 16px !important;
        margin-bottom: 6px !important;
    }

    .group-title {
        font-size: 0.8rem !important;
    }

    .group-count {
        font-size: 0.7rem !important;
        padding: 1px 4px !important;
    }

    /* 移动端加载更多优化 */
    .load-more-container {
        padding: 12px 16px !important;
    }

    .load-more-btn {
        padding: 6px 12px !important;
        font-size: 0.8rem !important;
    }

    /* 移动端加载状态优化 */
    .loading-container {
        padding: 12px 16px !important;
    }

    .loading-spinner {
        width: 14px !important;
        height: 14px !important;
    }

    .loading-text {
        font-size: 0.8rem !important;
    }

    /* 移动端选项卡优化 */
    .message-tabs {
        padding: 0 12px !important;
    }

    .tab-list {
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
        padding-bottom: 0 !important;
    }

    .tab-list::-webkit-scrollbar {
        display: none !important;
    }

    .tab-item {
        padding: 6px 8px !important;
        font-size: 0.8rem !important;
    }

    .tab-icon {
        font-size: 0.9rem !important;
    }

    .tab-text {
        font-size: 0.8rem !important;
    }

    .tab-badge {
        font-size: 0.65rem !important;
        padding: 1px 4px !important;
        min-width: 14px !important;
        height: 14px !important;
    }

    /* 移动端消息列表优化 */
    .notifications-list {
        overflow: visible !important;
        flex: none !important;
        padding: 6px 0 !important;
    }

    .list-header {
        padding: 6px 16px 8px 16px !important;
        margin-bottom: 6px !important;
    }

    .list-title {
        font-size: 0.85rem !important;
    }

    .list-count {
        font-size: 0.7rem !important;
        padding: 1px 6px !important;
    }

    .message-items {
        padding: 0 6px !important;
    }

    .notification-item {
        padding: 10px 12px !important;
        border-radius: 6px !important;
        margin-bottom: 6px !important;
        background: #f8fafc !important;
        border: 1px solid #e2e8f0 !important;
    }

    .notification-item:hover {
        background: #f1f5f9 !important;
        transform: translateY(-1px) !important;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
    }

    .notification-item.unread {
        background: #f0f9ff !important;
        border-color: #bae6fd !important;
    }

    .notification-item.important {
        border-left: 2px solid #f59e0b !important;
    }

    .notification-item.urgent {
        border-left: 2px solid #ef4444 !important;
        background: #fef2f2 !important;
    }

    .notification-icon {
        margin-right: 8px !important;
    }

    .icon-wrapper {
        width: 30px !important;
        height: 30px !important;
        font-size: 1rem !important;
    }

    .urgent-indicator {
        width: 14px !important;
        height: 14px !important;
        font-size: 0.65rem !important;
    }

    .notification-title {
        font-size: 0.85rem !important;
    }

    .notification-time {
        font-size: 0.7rem !important;
    }

    .notification-message {
        font-size: 0.8rem !important;
        margin-bottom: 6px !important;
    }

    .notification-tags {
        margin-bottom: 6px !important;
    }

    .tag {
        font-size: 0.65rem !important;
        padding: 1px 4px !important;
    }

    .tag-more {
        font-size: 0.65rem !important;
        padding: 1px 4px !important;
    }

    .notification-actions {
        gap: 4px !important;
        margin-top: 6px !important;
    }

    .action-btn {
        padding: 3px 6px !important;
        font-size: 0.7rem !important;
    }

    .unread-indicator {
        width: 6px !important;
        height: 6px !important;
        top: 12px !important;
        right: 12px !important;
    }

    /* 移动端底部优化 */
    .card-footer {
        padding: 8px 12px !important;
        gap: 6px !important;
    }

    .footer-btn {
        padding: 6px 8px !important;
        font-size: 0.75rem !important;
        gap: 4px !important;
    }

    /* 移动端弹窗优化 */
    .message-detail-overlay {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        padding: 16px !important;
        z-index: 9999 !important;
        background: rgba(0, 0, 0, 0.5) !important;
    }

    .message-detail-dialog {
        max-width: 100% !important;
        max-height: 95vh !important;
        border-radius: 12px !important;
    }

    .detail-header {
        padding: 16px !important;
    }

    .detail-icon {
        width: 36px !important;
        height: 36px !important;
        font-size: 1.1rem !important;
    }

    .detail-title h3 {
        font-size: 1rem !important;
    }

    .detail-content {
        padding: 16px !important;
    }

    .detail-meta {
        padding: 12px !important;
        margin-bottom: 16px !important;
    }

    .meta-label {
        min-width: 50px !important;
        font-size: 0.8rem !important;
    }

    .meta-value {
        font-size: 0.8rem !important;
    }

    .detail-message h4,
    .detail-info h4,
    .detail-links h4,
    .detail-tags h4 {
        font-size: 0.9rem !important;
        margin-bottom: 8px !important;
    }

    .message-text {
        font-size: 0.85rem !important;
        padding: 10px !important;
    }

    .info-content {
        padding: 10px !important;
    }

    .info-key {
        min-width: 70px !important;
        font-size: 0.8rem !important;
    }

    .info-value {
        font-size: 0.8rem !important;
    }

    .link-item {
        padding: 6px 10px !important;
        font-size: 0.8rem !important;
    }

    .detail-tag {
        padding: 3px 6px !important;
        font-size: 0.7rem !important;
    }

    .detail-footer {
        padding: 16px !important;
    }

    .detail-action-btn {
        padding: 8px 12px !important;
        font-size: 0.85rem !important;
    }

    /* 移动端弹窗优化 */
    .all-messages-overlay,
    .settings-overlay {
        padding: 10px !important;
    }

    .all-messages-dialog,
    .settings-dialog {
        max-width: 100% !important;
        max-height: 95vh !important;
        border-radius: 8px !important;
    }

    .dialog-header {
        padding: 16px !important;
    }

    .dialog-header h3 {
        font-size: 1.1rem !important;
    }

    .dialog-content {
        padding: 16px !important;
    }

    .message-filters {
        padding: 12px !important;
        margin-bottom: 16px !important;
    }

    .search-input {
        padding: 8px 10px 8px 36px !important;
        font-size: 0.85rem !important;
    }

    .filter-options {
        flex-direction: column !important;
        gap: 8px !important;
    }

    .filter-select {
        padding: 6px 10px !important;
        font-size: 0.85rem !important;
    }

    .message-stats-detail {
        padding: 10px 12px !important;
        margin-bottom: 16px !important;
    }

    .stat-label {
        font-size: 0.75rem !important;
    }

    .stat-value {
        font-size: 1rem !important;
    }

    .all-messages-list {
        max-height: 300px !important;
    }

    .message-item-full {
        padding: 12px !important;
        margin-bottom: 8px !important;
    }

    .message-icon {
        margin-right: 12px !important;
    }

    .message-title-full {
        font-size: 0.9rem !important;
        margin-bottom: 4px !important;
    }

    .message-meta {
        gap: 8px !important;
    }

    .message-type,
    .message-priority,
    .message-time-full {
        font-size: 0.7rem !important;
    }

    .message-text-preview {
        font-size: 0.85rem !important;
        margin-bottom: 6px !important;
    }

    .tag-full {
        font-size: 0.65rem !important;
        padding: 1px 4px !important;
    }

    .settings-section {
        margin-bottom: 20px !important;
    }

    .settings-section h4 {
        font-size: 0.95rem !important;
        margin-bottom: 12px !important;
    }

    .setting-item {
        padding: 10px 0 !important;
    }

    .setting-title {
        font-size: 0.85rem !important;
    }

    .setting-desc {
        font-size: 0.75rem !important;
    }

    .setting-switch {
        width: 40px !important;
        height: 22px !important;
    }

    .switch-handle {
        width: 18px !important;
        height: 18px !important;
    }

    .setting-switch.active .switch-handle {
        transform: translateX(18px) !important;
    }

    .time-setting {
        flex-direction: column !important;
        gap: 12px !important;
    }

    .time-item label {
        font-size: 0.75rem !important;
    }

    .time-input {
        padding: 6px 10px !important;
        font-size: 0.85rem !important;
    }

    .frequency-item {
        gap: 6px !important;
    }

    .frequency-item label {
        font-size: 0.85rem !important;
    }

    .dialog-footer {
        padding: 16px !important;
        gap: 8px !important;
    }

    .dialog-action-btn {
        padding: 8px 16px !important;
        font-size: 0.85rem !important;
    }
}

/* 移动端侧边栏专用样式 */
@media (max-width: 768px) {

    /* 在移动端侧边栏中进一步优化 */
    .sidebar-container .notifications-container {
        border: none !important;
        background: transparent !important;
        box-shadow: none !important;
        margin: 0 !important;
        border-radius: 0 !important;
    }

    .sidebar-container .card-header {
        background: #f8fafc !important;
        border-radius: 8px !important;
        margin: 0 6px 8px 6px !important;
        border: 1px solid #e2e8f0 !important;
        padding: 10px 12px 6px 12px !important;
    }

    .sidebar-container .header-content {
        flex-direction: row !important;
        align-items: center !important;
        gap: 12px !important;
    }

    .sidebar-container .card-title {
        font-size: 0.9rem !important;
        color: #374151 !important;
    }

    .sidebar-container .title-icon {
        font-size: 0.9rem !important;
    }

    .sidebar-container .message-stats {
        gap: 6px !important;
    }

    .sidebar-container .unread-count {
        font-size: 0.65rem !important;
        padding: 1px 4px !important;
        background: #dbeafe !important;
        color: #1d4ed8 !important;
    }

    .sidebar-container .mark-all-btn {
        font-size: 0.65rem !important;
        padding: 1px 4px !important;
        border-color: #e2e8f0 !important;
    }

    /* 侧边栏统计信息优化 */
    .sidebar-container .message-stats {
        padding: 6px 12px !important;
        gap: 8px !important;
        font-size: 0.75rem !important;
        background: #f8fafc !important;
        border-radius: 6px !important;
        margin: 0 6px 6px 6px !important;
        border: 1px solid #e2e8f0 !important;
    }

    .sidebar-container .stats-label {
        font-size: 0.7rem !important;
    }

    .sidebar-container .stats-value {
        font-size: 0.75rem !important;
    }

    .sidebar-container .stats-value.unread-count {
        font-size: 0.7rem !important;
        padding: 1px 3px !important;
    }

    /* 侧边栏分组样式优化 */
    .sidebar-container .group-header {
        padding: 4px 8px 2px 8px !important;
        margin-bottom: 4px !important;
    }

    .sidebar-container .group-title {
        font-size: 0.75rem !important;
    }

    .sidebar-container .group-count {
        font-size: 0.65rem !important;
        padding: 1px 3px !important;
    }

    /* 侧边栏加载更多优化 */
    .sidebar-container .load-more-container {
        padding: 8px 8px !important;
    }

    .sidebar-container .load-more-btn {
        padding: 4px 8px !important;
        font-size: 0.7rem !important;
    }

    /* 侧边栏加载状态优化 */
    .sidebar-container .loading-container {
        padding: 8px 8px !important;
    }

    .sidebar-container .loading-spinner {
        width: 12px !important;
        height: 12px !important;
    }

    .sidebar-container .loading-text {
        font-size: 0.7rem !important;
    }

    .sidebar-container .message-tabs {
        padding: 0 4px !important;
        background: transparent !important;
        border-bottom: none !important;
        margin-bottom: 4px !important;
    }

    .sidebar-container .tab-list {
        gap: 4px !important;
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
        padding-bottom: 0 !important;
    }

    .sidebar-container .tab-list::-webkit-scrollbar {
        display: none !important;
    }

    .sidebar-container .tab-item {
        padding: 4px 6px !important;
        font-size: 0.7rem !important;
        border-radius: 6px !important;
        background: #f8fafc !important;
        border: 1px solid #e2e8f0 !important;
    }

    .sidebar-container .tab-item.active {
        background: #dbeafe !important;
        color: #1d4ed8 !important;
        border-color: #bae6fd !important;
    }

    .sidebar-container .tab-icon {
        font-size: 0.8rem !important;
    }

    .sidebar-container .tab-text {
        font-size: 0.7rem !important;
    }

    .sidebar-container .tab-badge {
        font-size: 0.6rem !important;
        padding: 1px 3px !important;
        min-width: 12px !important;
        height: 12px !important;
    }

    .sidebar-container .notifications-list {
        padding: 0 !important;
    }

    .sidebar-container .list-header {
        padding: 4px 8px 6px 8px !important;
        margin-bottom: 4px !important;
        background: #f8fafc !important;
        border-radius: 6px !important;
        margin: 0 4px 6px 4px !important;
        border: 1px solid #e2e8f0 !important;
    }

    .sidebar-container .list-title {
        font-size: 0.8rem !important;
        color: #374151 !important;
    }

    .sidebar-container .list-count {
        font-size: 0.65rem !important;
        padding: 1px 4px !important;
    }

    .sidebar-container .message-items {
        padding: 0 4px !important;
    }

    .sidebar-container .notification-item {
        margin-bottom: 4px !important;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
        padding: 8px 10px !important;
    }

    .sidebar-container .notification-item:hover {
        transform: translateY(-0.5px) !important;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08) !important;
    }

    .sidebar-container .icon-wrapper {
        width: 26px !important;
        height: 26px !important;
        font-size: 0.9rem !important;
    }

    .sidebar-container .urgent-indicator {
        width: 12px !important;
        height: 12px !important;
        font-size: 0.6rem !important;
    }

    .sidebar-container .notification-title {
        font-size: 0.8rem !important;
    }

    .sidebar-container .notification-time {
        font-size: 0.65rem !important;
    }

    .sidebar-container .notification-message {
        font-size: 0.75rem !important;
        margin-bottom: 4px !important;
    }

    .sidebar-container .tag {
        font-size: 0.6rem !important;
        padding: 1px 3px !important;
    }

    .sidebar-container .tag-more {
        font-size: 0.6rem !important;
        padding: 1px 3px !important;
    }

    .sidebar-container .action-btn {
        padding: 2px 4px !important;
        font-size: 0.65rem !important;
    }

    .sidebar-container .unread-indicator {
        width: 5px !important;
        height: 5px !important;
        top: 10px !important;
        right: 10px !important;
    }

    .sidebar-container .card-footer {
        padding: 6px 4px !important;
        margin-top: 6px !important;
        background: #f8fafc !important;
        border-radius: 6px !important;
        border: 1px solid #e2e8f0 !important;
        gap: 4px !important;
    }

    .sidebar-container .footer-btn {
        padding: 4px 6px !important;
        font-size: 0.7rem !important;
        gap: 3px !important;
    }

    .sidebar-container .empty-state {
        padding: 20px 10px !important;
    }

    .sidebar-container .empty-icon {
        font-size: 2rem !important;
        margin-bottom: 8px !important;
    }

    .sidebar-container .empty-text {
        font-size: 0.8rem !important;
    }
}
</style>
