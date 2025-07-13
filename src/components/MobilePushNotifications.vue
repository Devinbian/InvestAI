<template>
    <div class="mobile-push-container">
        <!-- 头部 -->
        <div class="push-header">
            <h3>消息推送</h3>
            <div class="header-actions">
                <button @click="markAllAsRead" class="action-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" />
                    </svg>
                    全部已读
                </button>
                <button @click="openSettings" class="action-btn settings-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" />
                        <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="currentColor" stroke-width="2" />
                    </svg>
                </button>
            </div>
        </div>

        <!-- 分类标签 -->
        <div class="notification-categories">
            <div class="category-scroll">
                <button v-for="category in categories" :key="category.id" @click="activeCategory = category.id"
                    :class="['category-btn', { active: activeCategory === category.id }]">
                    <span class="category-icon">{{ category.icon }}</span>
                    <span class="category-name">{{ category.name }}</span>
                    <span v-if="category.count > 0" class="category-count">{{ category.count }}</span>
                </button>
            </div>
        </div>

        <!-- 通知列表 -->
        <div class="notifications-container" ref="container" data-scrollable>
            <!-- 下拉刷新指示器 -->
            <div v-if="isRefreshing" class="refresh-indicator">
                <div class="refresh-spinner"></div>
                <span>正在刷新...</span>
            </div>

            <!-- 通知列表 -->
            <div class="notifications-list">
                <div v-for="notification in filteredNotifications" :key="notification.id" class="notification-card"
                    :class="{
                        'unread': !notification.read,
                        'new-message': notification.isNew,
                        'urgent': notification.priority === 'urgent'
                    }" @click="openNotification(notification)">

                    <div class="notification-content">
                        <div class="notification-header">
                            <div class="app-info">
                                <div class="app-icon" :class="notification.type">
                                    {{ getTypeIcon(notification.type) }}
                                </div>
                                <div class="meta">
                                    <span class="app-name">投资助手</span>
                                    <span class="time">{{ formatTime(notification.time) }}</span>
                                </div>
                            </div>
                            <div v-if="!notification.read" class="unread-dot"></div>
                        </div>

                        <div class="notification-body">
                            <h4 class="title">{{ notification.title }}</h4>
                            <p class="message">{{ notification.message }}</p>
                        </div>

                        <div class="actions">
                            <button v-for="action in notification.actions" :key="action.id"
                                @click.stop="handleAction(notification, action)"
                                :class="['action-button', action.type]">
                                {{ action.text }}
                            </button>
                            <button @click.stop="markAsRead(notification)" v-if="!notification.read"
                                class="action-button secondary">
                                标记已读
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 空状态 -->
                <div v-if="filteredNotifications.length === 0" class="empty-state">
                    <div class="empty-icon">📭</div>
                    <p class="empty-text">暂无消息</p>
                    <p class="empty-desc">开启推送通知，及时获取重要信息</p>
                </div>

                <!-- 加载更多 -->
                <div v-if="hasMore && filteredNotifications.length > 0" class="load-more">
                    <button @click="loadMore" :disabled="isLoading" class="load-more-btn">
                        <div v-if="isLoading" class="loading-spinner"></div>
                        <span>{{ isLoading ? '加载中...' : '加载更多' }}</span>
                    </button>
                </div>

                <!-- 已加载完毕提示 -->
                <div v-if="!hasMore && filteredNotifications.length > 0" class="load-complete">
                    <span class="complete-icon">✓</span>
                    <span class="complete-text">已显示全部消息</span>
                </div>
            </div>
        </div>

        <!-- 权限提示 -->
        <div v-if="showPermissionTip" class="permission-tip">
            <div class="tip-content">
                <span class="tip-icon">🔔</span>
                <span class="tip-text">开启推送通知获取实时消息</span>
                <button @click="requestPermission" class="tip-btn">开启</button>
                <button @click="showPermissionTip = false" class="tip-close">✕</button>
            </div>
        </div>

        <!-- Toast 提示 -->
        <div v-if="toast.show" class="toast" :class="toast.type">
            {{ toast.message }}
        </div>

        <!-- 消息详情弹窗 -->
        <Teleport to="body">
            <div v-if="showDetailDialog" class="detail-overlay" @click="closeDetail">
                <div class="detail-dialog" @click.stop>
                    <!-- 移动端拖拽指示器 -->
                    <div class="drag-indicator" @touchstart="handleDetailTouchStart" @touchmove="handleDetailTouchMove"
                        @touchend="handleDetailTouchEnd"></div>

                    <!-- 弹窗头部 -->
                    <div class="detail-header">
                        <div class="detail-app-info">
                            <div class="detail-app-icon" :class="selectedNotification?.type">
                                {{ getTypeIcon(selectedNotification?.type) }}
                            </div>
                            <div class="detail-meta">
                                <span class="detail-app-name">投资助手</span>
                                <span class="detail-time">{{ formatTime(selectedNotification?.time) }}</span>
                            </div>
                        </div>
                        <button @click="closeDetail" class="detail-close">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" />
                            </svg>
                        </button>
                    </div>

                    <!-- 详情内容 -->
                    <div class="detail-content" data-scrollable>
                        <div class="detail-priority" v-if="selectedNotification?.priority === 'urgent'">
                            <span class="priority-badge urgent">🔴 紧急</span>
                        </div>

                        <h3 class="detail-title">{{ selectedNotification?.title }}</h3>
                        <div class="detail-message">{{ selectedNotification?.message }}</div>

                        <!-- 详细信息 -->
                        <div v-if="selectedNotification?.details" class="detail-extra">
                            <h4 class="extra-title">详细信息</h4>
                            <div class="extra-content">{{ selectedNotification.details }}</div>
                        </div>

                        <!-- 相关数据 -->
                        <div v-if="selectedNotification?.data" class="detail-data">
                            <h4 class="data-title">相关数据</h4>
                            <div class="data-list">
                                <div v-for="(value, key) in selectedNotification.data" :key="key" class="data-item">
                                    <span class="data-label">{{ key }}:</span>
                                    <span class="data-value">{{ value }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 弹窗底部操作 -->
                    <div class="detail-footer">
                        <button v-for="action in selectedNotification?.actions" :key="action.id"
                            @click="handleDetailAction(selectedNotification, action)"
                            :class="['detail-action-button', action.type]">
                            {{ action.text }}
                        </button>
                        <button v-if="!selectedNotification?.read" @click="markAsReadAndClose"
                            class="detail-action-button secondary">
                            标记已读
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>

        <!-- 推送设置弹窗 -->
        <Teleport to="body">
            <div v-if="showSettingsDialog" class="settings-overlay" @click="closeSettings">
                <div class="settings-dialog" @click.stop>
                    <!-- 移动端拖拽指示器 -->
                    <div class="drag-indicator" @touchstart="handleTouchStart" @touchmove="handleTouchMove"
                        @touchend="handleTouchEnd"></div>

                    <!-- 弹窗头部 -->
                    <div class="settings-header">
                        <h3 class="settings-title">推送设置</h3>
                        <button @click="closeSettings" class="settings-close">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" />
                            </svg>
                        </button>
                    </div>

                    <!-- 设置内容 -->
                    <div class="settings-content" @scroll="handleContentScroll" data-scrollable>
                        <!-- 消息类型推送 -->
                        <div class="setting-section">
                            <h4 class="section-title">消息类型推送</h4>
                            <div class="setting-item" v-for="category in settingCategories" :key="category.id">
                                <div class="setting-info">
                                    <div class="setting-label">{{ category.name }}</div>
                                    <div class="setting-desc">{{ category.description }}</div>
                                </div>
                                <div class="setting-control">
                                    <label class="toggle-switch">
                                        <input type="checkbox" v-model="settings[category.id]">
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div class="settings-divider"></div>

                        <!-- 推送时间 -->
                        <div class="setting-section">
                            <h4 class="section-title">推送时间</h4>
                            <div class="time-range">
                                <div class="time-input">
                                    <label>开始时间</label>
                                    <input type="time" v-model="settings.startTime" class="time-picker">
                                </div>
                                <div class="time-input">
                                    <label>结束时间</label>
                                    <input type="time" v-model="settings.endTime" class="time-picker">
                                </div>
                            </div>

                            <div class="setting-item">
                                <div class="setting-info">
                                    <div class="setting-label">免打扰模式</div>
                                    <div class="setting-desc">指定时间段内不接收推送</div>
                                </div>
                                <div class="setting-control">
                                    <label class="toggle-switch">
                                        <input type="checkbox" v-model="settings.doNotDisturb">
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div class="settings-divider"></div>

                        <!-- 推送频率 -->
                        <div class="setting-section">
                            <h4 class="section-title">推送频率</h4>
                            <div class="frequency-options">
                                <label class="frequency-option">
                                    <input v-model="settings.frequency" type="radio" value="realtime"
                                        class="frequency-radio">
                                    <div class="frequency-content">
                                        <span class="frequency-label">实时推送</span>
                                        <span class="frequency-desc">消息产生时立即推送</span>
                                    </div>
                                </label>

                                <label class="frequency-option">
                                    <input v-model="settings.frequency" type="radio" value="hourly"
                                        class="frequency-radio">
                                    <div class="frequency-content">
                                        <span class="frequency-label">每小时汇总</span>
                                        <span class="frequency-desc">每小时汇总推送一次</span>
                                    </div>
                                </label>

                                <label class="frequency-option">
                                    <input v-model="settings.frequency" type="radio" value="daily"
                                        class="frequency-radio">
                                    <div class="frequency-content">
                                        <span class="frequency-label">每日汇总</span>
                                        <span class="frequency-desc">每天汇总推送一次</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- 滚动指示器 -->
                    <div v-if="showScrollIndicator" class="scroll-indicator" @click="scrollToMore">
                        <div class="scroll-hint">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                <path d="M7 13l3 3 3-3" stroke="currentColor" stroke-width="2" />
                            </svg>
                            <span>向下滚动查看更多</span>
                        </div>
                    </div>

                    <!-- 弹窗底部 -->
                    <div class="settings-footer">
                        <button @click="resetSettings" class="reset-btn">重置默认</button>
                        <button @click="saveSettings" class="save-btn">保存设置</button>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script>
export default {
    name: 'MobilePushNotifications',
    data() {
        return {
            activeCategory: 'all',
            isRefreshing: false,
            isLoading: false,
            hasMore: true,
            showPermissionTip: false,
            toast: {
                show: false,
                message: '',
                type: 'info'
            },

            // 设置弹窗状态
            showSettingsDialog: false,
            touchStartY: null,
            touchStartTime: null,
            showScrollIndicator: false,

            // 详情弹窗状态
            showDetailDialog: false,
            selectedNotification: null,
            detailTouchStartY: null,
            detailTouchStartTime: null,

            // 推送设置数据
            settings: {
                market: true,
                news: true,
                alert: true,
                system: true,
                trade: true,
                startTime: '09:00',
                endTime: '21:00',
                doNotDisturb: false,
                frequency: 'realtime'
            },

            // 设置分类配置
            settingCategories: [
                {
                    id: 'trade',
                    name: '交易记录',
                    description: '买卖记录、委托状态等'
                },
                {
                    id: 'alert',
                    name: '风险提醒',
                    description: '价格预警、风险评估等'
                },
                {
                    id: 'market',
                    name: '实时行情',
                    description: '股价变动、板块异动、技术信号等'
                },
                {
                    id: 'news',
                    name: '财经资讯',
                    description: '政策新闻、公司公告、宏观数据等'
                },
                {
                    id: 'system',
                    name: '系统通知',
                    description: '系统更新、功能通知等'
                }
            ],

            categories: [
                { id: 'all', name: '全部', icon: '📬', count: 0 },
                { id: 'trade', name: '交易', icon: '💰', count: 0 },
                { id: 'alert', name: '提醒', icon: '⚠️', count: 0 },
                { id: 'market', name: '行情', icon: '📈', count: 0 },
                { id: 'news', name: '资讯', icon: '📰', count: 0 },
                { id: 'system', name: '系统', icon: '⚙️', count: 0 }
            ],
            notifications: []
        };
    },
    computed: {
        filteredNotifications() {
            if (this.activeCategory === 'all') {
                return this.notifications;
            }
            return this.notifications.filter(n => n.type === this.activeCategory);
        },
        unreadCount() {
            return this.notifications.filter(n => !n.read).length;
        }
    },
    mounted() {
        this.generateNotifications();
        this.updateCategoryCounts();
        this.checkPermission();
        this.loadSettings();
    },
    methods: {
        // 生成模拟通知
        generateNotifications() {
            this.notifications = [
                {
                    id: 1,
                    type: 'market',
                    title: '股价提醒',
                    message: '您关注的贵州茅台(600519)上涨5.2%，当前价格¥1,850.00',
                    time: new Date(Date.now() - 5 * 60 * 1000),
                    read: false,
                    priority: 'urgent',
                    details: '贵州茅台今日开盘价¥1,758.00，最高价¥1,865.50，最低价¥1,745.20。成交量较昨日增长15.3%，主要受益于白酒板块整体上涨和机构资金流入。技术指标显示短期仍有上涨空间。',
                    data: {
                        '股票代码': '600519',
                        '当前价格': '¥1,850.00',
                        '涨跌幅': '+5.2%',
                        '涨跌额': '+¥91.50',
                        '成交量': '12.5万手',
                        '成交额': '23.1亿元',
                        '换手率': '0.79%',
                        '市盈率': '31.2倍'
                    },
                    actions: [
                        { id: 'view', text: '查看详情', type: 'primary' },
                        { id: 'trade', text: '立即交易', type: 'secondary' }
                    ]
                },
                {
                    id: 2,
                    type: 'news',
                    title: '财经快讯',
                    message: '央行宣布降准0.25个百分点，预计释放流动性约5000亿元',
                    time: new Date(Date.now() - 15 * 60 * 1000),
                    read: false,
                    priority: 'high',
                    details: '中国人民银行决定于2024年1月15日下调金融机构存款准备金率0.25个百分点（不含已执行5%存款准备金率的金融机构）。本次降准为全面降准，体现了稳健货币政策的灵活适度，有利于保持银行体系流动性合理充裕，促进货币信贷合理增长，支持高质量发展。',
                    data: {
                        '政策类型': '全面降准',
                        '降准幅度': '0.25个百分点',
                        '释放流动性': '约5000亿元',
                        '实施时间': '2024年1月15日',
                        '影响机构': '大部分金融机构',
                        '政策目标': '支持实体经济'
                    }
                },
                {
                    id: 3,
                    type: 'alert',
                    title: '风险提醒',
                    message: '您的投资组合今日亏损超过5%，建议及时关注市场变化',
                    time: new Date(Date.now() - 30 * 60 * 1000),
                    read: true,
                    priority: 'urgent',
                    details: '您的投资组合今日表现不佳，主要原因是科技股大幅下跌。建议关注市场情绪变化，考虑适当调整仓位配置。如果您是长期投资者，可以考虑逢低加仓优质标的。请根据自身风险承受能力做出投资决策。',
                    data: {
                        '总资产': '¥158,500.00',
                        '今日盈亏': '-¥8,350.00',
                        '盈亏比例': '-5.26%',
                        '持仓股票': '8只',
                        '最大亏损': '宁德时代 -12.3%',
                        '风险等级': '中高风险',
                        '建议操作': '关注止损'
                    },
                    actions: [
                        { id: 'adjust', text: '调整仓位', type: 'primary' },
                        { id: 'view', text: '查看详情', type: 'secondary' }
                    ]
                },
                {
                    id: 4,
                    type: 'trade',
                    title: '交易通知',
                    message: '您的买入订单已成功执行：平安银行 1000股 @ ¥12.50',
                    time: new Date(Date.now() - 60 * 60 * 1000),
                    read: true,
                    priority: 'medium'
                },
                {
                    id: 5,
                    type: 'system',
                    title: '系统通知',
                    message: '投资助手已更新至v2.1.0，新增智能推荐功能',
                    time: new Date(Date.now() - 2 * 60 * 60 * 1000),
                    read: false,
                    priority: 'low'
                }
            ];
        },

        // 更新分类计数
        updateCategoryCounts() {
            this.categories.forEach(category => {
                if (category.id === 'all') {
                    category.count = this.unreadCount;
                } else {
                    category.count = this.notifications.filter(n =>
                        n.type === category.id && !n.read
                    ).length;
                }
            });
        },

        // 打开通知
        openNotification(notification) {
            this.selectedNotification = notification;
            this.showDetailDialog = true;
            // 不立即标记为已读，让用户在详情页面决定
        },

        // 标记已读
        markAsRead(notification) {
            if (!notification.read) {
                notification.read = true;
                this.updateCategoryCounts();
                this.showToast('已标记为已读', 'success');
            }
        },

        // 处理操作
        handleAction(notification, action) {
            this.markAsRead(notification);
            this.$emit('action-click', { notification, action });
        },

        // 全部已读
        markAllAsRead() {
            const unreadNotifications = this.notifications.filter(n => !n.read);
            if (unreadNotifications.length === 0) {
                this.showToast('没有未读通知');
                return;
            }

            unreadNotifications.forEach(n => n.read = true);
            this.updateCategoryCounts();
            this.showToast(`已标记${unreadNotifications.length}条通知为已读`, 'success');
        },

        // 打开设置
        openSettings() {
            this.showSettingsDialog = true;
            // 延迟检查是否需要显示滚动指示器
            this.$nextTick(() => {
                this.checkScrollIndicator();
            });
        },

        // 关闭设置弹窗
        closeSettings() {
            this.showSettingsDialog = false;
            this.showScrollIndicator = false;
        },

        // 检查是否需要显示滚动指示器
        checkScrollIndicator() {
            const content = document.querySelector('.settings-content');
            if (content) {
                const hasScroll = content.scrollHeight > content.clientHeight;
                const isAtTop = content.scrollTop === 0;
                this.showScrollIndicator = hasScroll && isAtTop;
            }
        },

        // 处理内容滚动
        handleContentScroll(e) {
            const content = e.target;
            const hasScroll = content.scrollHeight > content.clientHeight;
            const isAtTop = content.scrollTop === 0;
            const isNearBottom = content.scrollTop >= content.scrollHeight - content.clientHeight - 10;

            // 只在顶部且有更多内容时显示指示器
            this.showScrollIndicator = hasScroll && isAtTop;

            // 如果滚动到底部，隐藏指示器
            if (isNearBottom) {
                this.showScrollIndicator = false;
            }
        },

        // 滚动到更多内容
        scrollToMore() {
            const content = document.querySelector('.settings-content');
            if (content) {
                content.scrollTo({
                    top: 200,
                    behavior: 'smooth'
                });
            }
        },

        // 恢复默认设置
        resetSettings() {
            this.settings = {
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
            this.showToast('设置已重置默认', 'success');
        },

        // 保存设置
        saveSettings() {
            localStorage.setItem('pushSettings', JSON.stringify(this.settings));
            this.showToast('设置已保存', 'success');
            this.closeSettings();
        },

        // 加载设置
        loadSettings() {
            const savedSettings = localStorage.getItem('pushSettings');
            if (savedSettings) {
                try {
                    this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
                } catch (error) {
                    console.error('加载设置失败:', error);
                }
            }
        },

        // 关闭详情弹窗
        closeDetail() {
            this.showDetailDialog = false;
            this.selectedNotification = null;
        },

        // 标记已读并关闭详情
        markAsReadAndClose() {
            if (this.selectedNotification && !this.selectedNotification.read) {
                this.markAsRead(this.selectedNotification);
            }
            this.closeDetail();
        },

        // 处理详情页面的操作按钮
        handleDetailAction(notification, action) {
            this.markAsRead(notification);
            this.$emit('action-click', { notification, action });
            this.closeDetail();
        },

        // 详情弹窗触摸处理 - 支持下拉关闭
        handleDetailTouchStart(e) {
            this.detailTouchStartY = e.touches[0].clientY;
            this.detailTouchStartTime = Date.now();
        },

        handleDetailTouchMove(e) {
            if (!this.detailTouchStartY) return;

            const currentY = e.touches[0].clientY;
            const deltaY = currentY - this.detailTouchStartY;

            // 只允许向下拖拽关闭弹窗
            if (deltaY > 0) {
                e.preventDefault();
                const dialog = document.querySelector('.detail-dialog');
                const translateY = Math.min(deltaY * 0.5, 100);
                dialog.style.transform = `translateY(${translateY}px)`;
                dialog.style.opacity = Math.max(1 - deltaY / 300, 0.5);
            }
        },

        handleDetailTouchEnd(e) {
            if (!this.detailTouchStartY) return;

            const currentY = e.changedTouches[0].clientY;
            const deltaY = currentY - this.detailTouchStartY;
            const deltaTime = Date.now() - this.detailTouchStartTime;
            const dialog = document.querySelector('.detail-dialog');

            // 重置样式
            if (dialog) {
                dialog.style.transform = '';
                dialog.style.opacity = '';
            }

            // 判断是否应该关闭弹窗
            const shouldClose = deltaY > 100 || (deltaY > 50 && deltaTime < 300);

            if (shouldClose) {
                this.closeDetail();
            }

            this.detailTouchStartY = null;
            this.detailTouchStartTime = null;
        },

        // 触摸处理 - 支持下拉关闭（仅在拖拽指示器上）
        handleTouchStart(e) {
            this.touchStartY = e.touches[0].clientY;
            this.touchStartTime = Date.now();
        },

        handleTouchMove(e) {
            if (!this.touchStartY) return;

            const currentY = e.touches[0].clientY;
            const deltaY = currentY - this.touchStartY;

            // 只允许向下拖拽关闭弹窗
            if (deltaY > 0) {
                e.preventDefault();
                const dialog = document.querySelector('.settings-dialog');
                const translateY = Math.min(deltaY * 0.5, 100);
                dialog.style.transform = `translateY(${translateY}px)`;
                dialog.style.opacity = Math.max(1 - deltaY / 300, 0.5);
            }
        },

        handleTouchEnd(e) {
            if (!this.touchStartY) return;

            const currentY = e.changedTouches[0].clientY;
            const deltaY = currentY - this.touchStartY;
            const deltaTime = Date.now() - this.touchStartTime;
            const dialog = document.querySelector('.settings-dialog');

            // 重置样式
            if (dialog) {
                dialog.style.transform = '';
                dialog.style.opacity = '';
            }

            // 判断是否应该关闭弹窗
            const shouldClose = deltaY > 100 || (deltaY > 50 && deltaTime < 300);

            if (shouldClose) {
                this.closeSettings();
            }

            this.touchStartY = null;
            this.touchStartTime = null;
        },

        // 加载更多
        async loadMore() {
            if (this.isLoading) return;
            this.isLoading = true;

            try {
                await new Promise(resolve => setTimeout(resolve, 800));
                const moreNotifications = this.generateMoreNotifications();

                if (moreNotifications.length > 0) {
                    moreNotifications.forEach(notification => {
                        notification.isNew = true;
                    });

                    this.notifications.push(...moreNotifications);
                    this.updateCategoryCounts();
                    this.showToast(`加载了${moreNotifications.length}条新消息`, 'success');

                    setTimeout(() => {
                        moreNotifications.forEach(notification => {
                            notification.isNew = false;
                        });
                    }, 1000);
                } else {
                    this.hasMore = false;
                    this.showToast('已显示全部通知');
                }
            } catch (error) {
                this.showToast('加载失败，请重试', 'error');
            } finally {
                this.isLoading = false;
            }
        },

        // 生成更多通知数据
        generateMoreNotifications() {
            if (this.notifications.length >= 15) {
                return [];
            }

            const types = ['market', 'news', 'alert', 'trade', 'system'];
            const priorities = ['urgent', 'high', 'medium', 'low'];
            const moreNotifications = [];
            const count = Math.floor(Math.random() * 3) + 3;

            for (let i = 0; i < count; i++) {
                const type = types[Math.floor(Math.random() * types.length)];
                const priority = priorities[Math.floor(Math.random() * priorities.length)];
                const isRead = Math.random() > 0.7;

                const notification = {
                    id: Date.now() + i,
                    type,
                    priority,
                    read: isRead,
                    title: this.getRandomTitle(type),
                    message: this.getRandomMessage(type),
                    time: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
                    actions: this.getRandomActions(type)
                };

                moreNotifications.push(notification);
            }

            return moreNotifications;
        },

        // 获取随机标题
        getRandomTitle(type) {
            const titles = {
                market: ['股价异动', '板块轮动', '资金流向', '技术突破', '量价分析'],
                news: ['政策解读', '财经要闻', '公司公告', '行业动态', '宏观数据'],
                alert: ['风险提醒', '价格预警', '止损提示', '波动警告', '资金预警'],
                trade: ['交易提醒', '委托状态', '成交回报', '资金变动', '持仓调整'],
                system: ['系统通知', '功能更新', '维护公告', '服务升级', '安全提醒']
            };
            const typeList = titles[type] || titles.system;
            return typeList[Math.floor(Math.random() * typeList.length)];
        },

        // 获取随机消息
        getRandomMessage(type) {
            const messages = {
                market: [
                    '科技板块强势拉升，建议关注龙头股机会',
                    '银行股集体上涨，资金面宽松预期增强',
                    '新能源板块调整，关注低位布局机会',
                    '医药股分化明显，精选个股是关键',
                    '消费板块企稳回升，关注业绩确定性'
                ],
                news: [
                    '央行降准释放长期资金，利好股市表现',
                    '新政策出台支持实体经济，相关板块受益',
                    '重要经济数据公布，超出市场预期',
                    '国际市场波动加剧，需关注风险传导',
                    '行业监管政策调整，影响相关公司估值'
                ],
                alert: [
                    '您的投资组合波动较大，建议适当调整',
                    '持仓股票接近止损位，请注意风险控制',
                    '账户资金使用率过高，建议合理配置',
                    '市场波动加剧，建议降低仓位',
                    '个股集中度过高，建议分散投资'
                ],
                trade: [
                    '您的买入订单已成功执行',
                    '卖出订单部分成交，剩余数量继续挂单',
                    '委托订单已撤销，资金已解冻',
                    '分红派息到账，请查收',
                    '新股申购结果公布，恭喜中签'
                ],
                system: [
                    '投资助手新增智能分析功能',
                    '系统将于今晚进行例行维护',
                    '新版本已发布，请及时更新',
                    '推送服务已优化，体验更流畅',
                    '数据接口升级完成，信息更及时'
                ]
            };
            const typeList = messages[type] || messages.system;
            return typeList[Math.floor(Math.random() * typeList.length)];
        },

        // 获取随机操作按钮
        getRandomActions(type) {
            const actions = {
                market: [
                    [
                        { id: 'view', text: '查看详情', type: 'primary' },
                        { id: 'trade', text: '立即交易', type: 'secondary' }
                    ]
                ],
                alert: [
                    [
                        { id: 'adjust', text: '查看详情', type: 'primary' }
                    ]
                ],
                trade: [
                    [
                        { id: 'view', text: '查看详情', type: 'primary' }
                    ]
                ]
            };
            const typeActions = actions[type];
            if (typeActions) {
                return typeActions[Math.floor(Math.random() * typeActions.length)];
            }
            return null;
        },

        // 检查权限
        checkPermission() {
            if ('Notification' in window && Notification.permission === 'default') {
                this.showPermissionTip = true;
            }
        },

        // 请求权限
        async requestPermission() {
            if ('Notification' in window) {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    this.showToast('通知权限已开启', 'success');
                } else {
                    this.showToast('通知权限被拒绝', 'error');
                }
            }
            this.showPermissionTip = false;
        },

        // 获取类型图标
        getTypeIcon(type) {
            const icons = {
                market: '📈',
                news: '📰',
                alert: '⚠️',
                trade: '💰',
                system: '⚙️'
            };
            return icons[type] || '📬';
        },

        // 格式化时间
        formatTime(time) {
            const now = new Date();
            const diff = now - time;
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(diff / 3600000);
            const days = Math.floor(diff / 86400000);

            if (minutes < 1) return '刚刚';
            if (minutes < 60) return `${minutes}分钟前`;
            if (hours < 24) return `${hours}小时前`;
            if (days < 7) return `${days}天前`;

            return time.toLocaleDateString();
        },

        // 显示Toast
        showToast(message, type = 'info') {
            this.toast = { show: true, message, type };
            setTimeout(() => {
                this.toast.show = false;
            }, 3000);
        }
    }
};
</script>

<style scoped>
/* 基础容器 */
.mobile-push-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: white;
    overflow: hidden;
}

/* 头部样式 */
.push-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-bottom: 1px solid #f0f0f0;
    background: #ffffff;
}

.push-header h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #1a1a1a;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 6px;
}

.action-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 4px;
    color: #6c757d;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.action-btn:hover {
    background: #e9ecef;
    color: #495057;
}

.settings-btn {
    padding: 4px;
}

/* 分类标签 */
.notification-categories {
    padding: 8px 0;
    border-bottom: 1px solid #f0f0f0;
}

.category-scroll {
    display: flex;
    gap: 6px;
    padding: 0 12px;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
}

.category-scroll::-webkit-scrollbar {
    display: none;
}

.category-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 12px;
    color: #6c757d;
    font-size: 11px;
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.2s ease;
}

.category-btn.active {
    background: #007bff;
    border-color: #007bff;
    color: white;
}

.category-icon {
    font-size: 12px;
}

.category-count {
    background: rgba(255, 255, 255, 0.2);
    color: inherit;
    padding: 1px 4px;
    border-radius: 8px;
    font-size: 10px;
    font-weight: 600;
    min-width: 14px;
    text-align: center;
}

.category-btn:not(.active) .category-count {
    background: #dc3545;
    color: white;
}

/* 通知容器 */
.notifications-container {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
}

/* 下拉刷新 */
.refresh-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    color: #6c757d;
    font-size: 12px;
}

.refresh-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid #e9ecef;
    border-top: 2px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

/* 通知列表 */
.notifications-list {
    padding: 0 8px;
}

.notification-card {
    background: white;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    margin-bottom: 8px;
    transition: all 0.2s ease;
    cursor: pointer;
}

.notification-card:hover {
    border-color: #007bff;
    box-shadow: 0 2px 8px rgba(0, 123, 255, 0.1);
}

.notification-card.unread {
    border-left: 3px solid #007bff;
    background: #f8f9ff;
}

.notification-card.urgent {
    border-left-color: #dc3545;
}

.notification-card.new-message {
    animation: slideInFade 0.5s ease;
    background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
}

.notification-content {
    padding: 10px 12px;
}

.notification-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
}

.app-info {
    display: flex;
    align-items: center;
    gap: 8px;
}

.app-icon {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
}

.app-icon.market {
    background: #e3f2fd;
}

.app-icon.news {
    background: #fff3e0;
}

.app-icon.alert {
    background: #ffebee;
}

.app-icon.trade {
    background: #e8f5e8;
}

.app-icon.system {
    background: #f3e5f5;
}

.meta {
    display: flex;
    flex-direction: column;
    gap: 1px;
}

.app-name {
    font-size: 11px;
    font-weight: 500;
    color: #6c757d;
}

.time {
    font-size: 10px;
    color: #adb5bd;
}

.unread-dot {
    width: 6px;
    height: 6px;
    background: #007bff;
    border-radius: 50%;
}

.notification-body {
    margin-bottom: 8px;
}

.title {
    font-size: 13px;
    font-weight: 600;
    color: #212529;
    margin: 0 0 4px 0;
}

.message {
    font-size: 12px;
    color: #6c757d;
    margin: 0;
    line-height: 1.4;
}

.actions {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
}

.action-button {
    padding: 3px 8px;
    border: 1px solid #e9ecef;
    border-radius: 4px;
    background: white;
    color: #6c757d;
    font-size: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.action-button.primary {
    background: #007bff;
    border-color: #007bff;
    color: white;
}

.action-button.secondary {
    background: #6c757d;
    border-color: #6c757d;
    color: white;
}

.action-button:hover {
    opacity: 0.8;
}

/* 空状态 */
.empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #6c757d;
}

.empty-icon {
    font-size: 48px;
    margin-bottom: 12px;
}

.empty-text {
    font-size: 14px;
    font-weight: 500;
    margin: 0 0 4px 0;
}

.empty-desc {
    font-size: 12px;
    margin: 0;
    opacity: 0.7;
}

/* 加载更多 */
.load-more {
    padding: 16px;
    text-align: center;
}

.load-more-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 16px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    color: #6b7280;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 100%;
}

.load-more-btn:hover:not(:disabled) {
    background: #f3f4f6;
}

.load-more-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.loading-spinner {
    width: 12px;
    height: 12px;
    border: 1px solid #e5e7eb;
    border-top: 1px solid #6b7280;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

/* 加载完毕提示 */
.load-complete {
    padding: 16px;
    text-align: center;
    color: #9ca3af;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
}

.complete-icon {
    color: #10b981;
    font-weight: bold;
}

/* 权限提示 */
.permission-tip {
    position: fixed;
    top: 16px;
    left: 16px;
    right: 16px;
    z-index: 1000;
}

.tip-content {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: #fef3c7;
    border: 1px solid #fbbf24;
    border-radius: 8px;
    color: #92400e;
    font-size: 12px;
}

.tip-icon {
    font-size: 16px;
    flex-shrink: 0;
}

.tip-text {
    flex: 1;
}

.tip-btn {
    padding: 4px 8px;
    background: #f59e0b;
    color: #ffffff;
    border: none;
    border-radius: 4px;
    font-size: 11px;
    cursor: pointer;
}

.tip-close {
    background: none;
    border: none;
    color: #92400e;
    cursor: pointer;
    font-size: 14px;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Toast提示 */
.toast {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: #ffffff;
    padding: 8px 16px;
    border-radius: 16px;
    font-size: 12px;
    z-index: 1001;
    animation: slideUp 0.3s ease;
}

.toast.success {
    background: rgba(34, 197, 94, 0.9);
}

.toast.error {
    background: rgba(239, 68, 68, 0.9);
}

.toast.info {
    background: rgba(59, 130, 246, 0.9);
}

/* 设置弹窗样式 */
.settings-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 20px;
    animation: fade-in 0.3s ease;
}

.settings-dialog {
    background: white;
    border-radius: 12px;
    width: 100%;
    max-width: 380px;
    max-height: 75vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: slide-up 0.3s ease;
}

/* 拖拽指示器 */
.drag-indicator {
    display: none;
}

/* 移动端全屏模式 */
@media (max-width: 768px) {
    .settings-overlay {
        padding: 0;
        align-items: flex-end;
    }

    .settings-dialog {
        max-width: 100%;
        max-height: 90vh;
        border-radius: 16px 16px 0 0;
        animation: slide-up-mobile 0.3s ease;
        position: relative;
    }

    .drag-indicator {
        display: block;
        width: 40px;
        height: 4px;
        background: #d1d5db;
        border-radius: 2px;
        margin: 8px auto;
        flex-shrink: 0;
        cursor: pointer;
        position: relative;
        /* 使用伪元素增加触摸区域而不影响视觉 */
    }

    .drag-indicator::before {
        content: '';
        position: absolute;
        top: -8px;
        left: -8px;
        right: -8px;
        bottom: -8px;
        /* 增加触摸区域但不影响视觉显示 */
    }

    .settings-content {
        /* 确保内容区域可以滚动 */
        max-height: calc(90vh - 120px) !important;
        /* 减去头部和底部的高度 */
        overflow-y: scroll !important;
        /* 强制显示滚动条 */
        -webkit-overflow-scrolling: touch !important;
        /* iOS平滑滚动 */
    }

    .settings-header {
        flex-shrink: 0;
        /* 防止头部被压缩 */
    }

    .settings-footer {
        flex-shrink: 0;
        /* 防止底部被压缩 */
    }
}

.settings-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid #f0f0f0;
    background: #f8f9fa;
}

.settings-title {
    font-size: 16px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0;
}

.settings-close {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s ease;
}

.settings-close:hover {
    background: #e9ecef;
    color: #333;
}

.settings-content {
    flex: 1;
    overflow-y: auto;
    padding: 0;
    -webkit-overflow-scrolling: touch;
    /* iOS平滑滚动 */
    overscroll-behavior: contain;
    /* 防止滚动穿透 */
}

.setting-section {
    padding: 0 16px;
}

.section-title {
    font-size: 13px;
    font-weight: 600;
    color: #666;
    margin: 12px 0 8px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.setting-item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid #f5f5f5;
}

.setting-item:last-child {
    border-bottom: none;
}

.setting-info {
    flex: 1;
    margin-right: 12px;
}

.setting-label {
    font-size: 14px;
    font-weight: 500;
    color: #1a1a1a;
    margin: 0 0 2px 0;
}

.setting-desc {
    font-size: 12px;
    color: #666;
    margin: 0;
    line-height: 1.4;
}

.setting-control {
    flex-shrink: 0;
}

.toggle-switch {
    position: relative;
    display: inline-block;
    width: 48px;
    height: 28px;
}

.toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #ccc;
    border-radius: 28px;
    transition: 0.3s;
}

.toggle-slider:before {
    position: absolute;
    content: "";
    height: 22px;
    width: 22px;
    left: 3px;
    bottom: 3px;
    background: white;
    border-radius: 50%;
    transition: 0.3s;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

input:checked+.toggle-slider {
    background: #007bff;
}

input:checked+.toggle-slider:before {
    transform: translateX(20px);
}

input:disabled+.toggle-slider {
    opacity: 0.5;
    cursor: not-allowed;
}

.settings-divider {
    height: 1px;
    background: #f0f0f0;
    margin: 0 16px;
}

.time-range {
    display: flex;
    gap: 12px;
    padding: 8px 16px 0;
}

.time-input {
    flex: 1;
}

.time-input label {
    display: block;
    font-size: 12px;
    color: #666;
    margin-bottom: 4px;
}

.time-picker {
    width: 100%;
    padding: 6px 10px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 13px;
    background: white;
}

.time-picker:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.frequency-options {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 0 16px;
}

.frequency-option {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    background: #f8fafc;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    cursor: pointer;
    transition: all 0.2s ease;
}

.frequency-option:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
}

.frequency-option:has(.frequency-radio:checked) {
    background: #eff6ff;
    border-color: #3b82f6;
}

.frequency-radio {
    margin: 0;
    accent-color: #3b82f6;
}

.frequency-content {
    flex: 1;
}

.frequency-label {
    font-size: 14px;
    font-weight: 500;
    color: #1a1a1a;
    margin-bottom: 2px;
    display: block;
}

.frequency-desc {
    font-size: 12px;
    color: #64748b;
    display: block;
}

.scroll-indicator {
    position: absolute;
    bottom: 60px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    pointer-events: auto;
    cursor: pointer;
}

.scroll-hint {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border-radius: 16px;
    font-size: 11px;
    animation: bounce 2s infinite;
}

.settings-footer {
    display: flex;
    gap: 10px;
    padding: 12px 16px;
    border-top: 1px solid #f0f0f0;
    background: #f8f9fa;
}

.reset-btn,
.save-btn {
    flex: 1;
    padding: 8px 14px;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.reset-btn {
    background: #f8f9fa;
    color: #666;
    border: 1px solid #ddd;
}

.reset-btn:hover {
    background: #e9ecef;
    color: #333;
}

.save-btn {
    background: #007bff;
    color: white;
}

.save-btn:hover {
    background: #0056b3;
}

/* 动画 */
@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateX(-50%) translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
    }
}

@keyframes slideInFade {
    0% {
        opacity: 0;
        transform: translateY(-10px) scale(0.98);
    }

    50% {
        opacity: 0.8;
        transform: translateY(-2px) scale(1.01);
    }

    100% {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

@keyframes fade-in {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

@keyframes slide-up {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes slide-up-mobile {
    from {
        opacity: 0;
        transform: translateY(100%);
    }

    to {
        opacity: 1;
        transform: translateY(0);
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
        transform: translateY(-4px);
    }

    60% {
        transform: translateY(-2px);
    }
}

/* 移动端优化 */
@media (max-width: 768px) {
    .notification-card {
        margin: 0 8px 6px 8px;
    }

    .push-header {
        padding: 10px 12px;
    }

    .category-scroll {
        padding: 0 12px;
    }

    .notification-content {
        padding: 10px 12px;
    }

    .settings-overlay {
        padding: 8px;
    }

    .settings-dialog {
        max-height: 85vh;
        max-width: 100%;
    }

    .settings-header {
        padding: 10px 12px;
    }

    .settings-title {
        font-size: 15px;
    }

    .setting-item {
        padding: 10px 12px;
    }

    .settings-footer {
        padding: 10px 12px;
    }

    .time-range {
        padding: 6px 12px 0;
        flex-direction: column;
        gap: 8px;
    }

    .frequency-options {
        padding: 0 12px;
    }

    .setting-section {
        padding: 0 12px;
    }

    .settings-divider {
        margin: 0 12px;
    }
}

/* 消息详情弹窗样式 */
.detail-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 9999;
    display: flex;
    align-items: flex-end;
    animation: fadeIn 0.3s ease;
}

.detail-dialog {
    width: 100%;
    max-height: 90vh;
    background: white;
    border-radius: 16px 16px 0 0;
    animation: slideUpDetail 0.3s ease;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.detail-header {
    padding: 16px 20px 12px;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
}

.detail-app-info {
    display: flex;
    align-items: center;
    gap: 12px;
}

.detail-app-icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 600;
    color: white;
}

.detail-app-icon.market {
    background: linear-gradient(45deg, #10b981, #059669);
}

.detail-app-icon.news {
    background: linear-gradient(45deg, #3b82f6, #1d4ed8);
}

.detail-app-icon.alert {
    background: linear-gradient(45deg, #f59e0b, #d97706);
}

.detail-app-icon.trade {
    background: linear-gradient(45deg, #8b5cf6, #7c3aed);
}

.detail-app-icon.system {
    background: linear-gradient(45deg, #6b7280, #4b5563);
}

.detail-meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.detail-app-name {
    font-size: 14px;
    font-weight: 600;
    color: #111827;
}

.detail-time {
    font-size: 12px;
    color: #6b7280;
}

.detail-close {
    width: 32px;
    height: 32px;
    border: none;
    background: #f3f4f6;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #6b7280;
    transition: all 0.2s ease;
}

.detail-close:hover {
    background: #e5e7eb;
    color: #374151;
}

.detail-content {
    flex: 1;
    padding: 16px 20px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
}

.detail-priority {
    margin-bottom: 12px;
}

.priority-badge.urgent {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: #fef2f2;
    color: #dc2626;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
}

.detail-title {
    font-size: 18px;
    font-weight: 600;
    color: #111827;
    margin: 0 0 8px 0;
    line-height: 1.4;
}

.detail-message {
    font-size: 14px;
    color: #374151;
    line-height: 1.5;
    margin-bottom: 16px;
}

.detail-extra {
    margin-bottom: 16px;
}

.extra-title {
    font-size: 14px;
    font-weight: 600;
    color: #111827;
    margin: 0 0 8px 0;
}

.extra-content {
    font-size: 13px;
    color: #4b5563;
    line-height: 1.5;
    background: #f9fafb;
    padding: 12px;
    border-radius: 8px;
    border-left: 3px solid #3b82f6;
}

.detail-data {
    margin-bottom: 16px;
}

.data-title {
    font-size: 14px;
    font-weight: 600;
    color: #111827;
    margin: 0 0 8px 0;
}

.data-list {
    background: #f9fafb;
    border-radius: 8px;
    padding: 12px;
}

.data-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
    border-bottom: 1px solid #e5e7eb;
}

.data-item:last-child {
    border-bottom: none;
}

.data-label {
    font-size: 13px;
    color: #6b7280;
    font-weight: 500;
}

.data-value {
    font-size: 13px;
    color: #111827;
    font-weight: 600;
}

.detail-footer {
    padding: 16px 20px;
    border-top: 1px solid #f0f0f0;
    display: flex;
    gap: 12px;
    flex-shrink: 0;
}

.detail-action-button {
    flex: 1;
    padding: 12px 16px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
}

.detail-action-button.primary {
    background: #3b82f6;
    color: white;
}

.detail-action-button.primary:hover {
    background: #2563eb;
}

.detail-action-button.secondary {
    background: #f3f4f6;
    color: #374151;
}

.detail-action-button.secondary:hover {
    background: #e5e7eb;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

@keyframes slideUpDetail {
    from {
        transform: translateY(100%);
    }

    to {
        transform: translateY(0);
    }
}
</style>
