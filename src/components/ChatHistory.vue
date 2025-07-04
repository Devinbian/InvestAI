<template>
    <div class="chat-history-container" :class="{ 'collapsed': isCollapsed }">
        <!-- 历史记录面板 -->
        <div class="history-panel" v-show="!isCollapsed">
            <!-- 搜索框和操作按钮 -->
            <div class="search-container">
                <div class="search-wrapper">
                    <el-input v-model="searchKeyword" placeholder="搜索对话" size="small" clearable
                        class="focus-border-input" @focus="onSearchFocus" @blur="onSearchBlur">
                        <template #prefix>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2" />
                                <path d="m21 21-4.35-4.35" stroke="currentColor" stroke-width="2" />
                            </svg>
                        </template>
                    </el-input>
                </div>
                <div class="header-actions">
                    <el-button class="new-chat-btn" size="small" @click="createNewChat" title="新建聊天">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M12 5v14m-7-7h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" />
                        </svg>
                    </el-button>
                    <el-button class="close-btn" size="small" @click="closePanel" title="关闭面板">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" />
                        </svg>
                    </el-button>
                </div>
            </div>

            <!-- 分频线 -->
            <div class="section-divider">
                <span class="divider-text">对话历史</span>
            </div>

            <!-- 历史记录列表 - 双区域布局 -->
            <div class="history-list-container">
                <div class="history-list">
                    <!-- 今天 -->
                    <div v-if="todayChats.length > 0" class="history-group">
                        <div class="group-title">
                            <span class="title-icon">📅</span>
                            今天
                            <span class="count-badge">{{ todayChats.length }}</span>
                        </div>
                        <div v-for="chat in todayChats" :key="chat.id"
                            :class="['history-item', { 'active': chat.id === currentChatId }]">
                            <div class="chat-info" @click="handleChatItemClick(chat)"
                                @touchstart="handleChatItemTouchStart(chat, $event)"
                                @touchmove="handleChatItemTouchMove($event)" @touchend="handleChatItemTouchEnd($event)">
                                <div class="chat-title">{{ chat.title }}</div>
                                <div class="chat-time">{{ formatTime(chat.lastMessage) }}</div>
                            </div>
                            <div class="chat-actions" @click.stop>
                                <el-dropdown @command="(command) => handleChatAction(command, chat)" trigger="click">
                                    <span class="action-trigger">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                            <circle cx="12" cy="12" r="1" stroke="currentColor" stroke-width="2" />
                                            <circle cx="19" cy="12" r="1" stroke="currentColor" stroke-width="2" />
                                            <circle cx="5" cy="12" r="1" stroke="currentColor" stroke-width="2" />
                                        </svg>
                                    </span>
                                    <template #dropdown>
                                        <el-dropdown-menu>
                                            <el-dropdown-item command="rename">重命名</el-dropdown-item>
                                            <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                                        </el-dropdown-menu>
                                    </template>
                                </el-dropdown>
                            </div>
                        </div>
                    </div>

                    <!-- 昨天 -->
                    <div v-if="yesterdayChats.length > 0" class="history-group">
                        <div class="group-title">
                            <span class="title-icon">📋</span>
                            昨天
                            <span class="count-badge">{{ yesterdayChats.length }}</span>
                        </div>
                        <div v-for="chat in yesterdayChats" :key="chat.id"
                            :class="['history-item', { 'active': chat.id === currentChatId }]">
                            <div class="chat-info" @click="handleChatItemClick(chat)"
                                @touchstart="handleChatItemTouchStart(chat, $event)"
                                @touchmove="handleChatItemTouchMove($event)" @touchend="handleChatItemTouchEnd($event)">
                                <div class="chat-title">{{ chat.title }}</div>
                                <div class="chat-time">{{ formatTime(chat.lastMessage) }}</div>
                            </div>
                            <div class="chat-actions" @click.stop>
                                <el-dropdown @command="(command) => handleChatAction(command, chat)" trigger="click">
                                    <span class="action-trigger">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                            <circle cx="12" cy="12" r="1" stroke="currentColor" stroke-width="2" />
                                            <circle cx="19" cy="12" r="1" stroke="currentColor" stroke-width="2" />
                                            <circle cx="5" cy="12" r="1" stroke="currentColor" stroke-width="2" />
                                        </svg>
                                    </span>
                                    <template #dropdown>
                                        <el-dropdown-menu>
                                            <el-dropdown-item command="rename">重命名</el-dropdown-item>
                                            <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                                        </el-dropdown-menu>
                                    </template>
                                </el-dropdown>
                            </div>
                        </div>
                    </div>

                    <!-- 本周 -->
                    <div v-if="thisWeekChats.length > 0" class="history-group">
                        <div class="group-title">
                            <span class="title-icon">📊</span>
                            本周
                            <span class="count-badge">{{ thisWeekChats.length }}</span>
                        </div>
                        <div v-for="chat in thisWeekChats" :key="chat.id"
                            :class="['history-item', { 'active': chat.id === currentChatId }]">
                            <div class="chat-info" @click="handleChatItemClick(chat)"
                                @touchstart="handleChatItemTouchStart(chat, $event)"
                                @touchmove="handleChatItemTouchMove($event)" @touchend="handleChatItemTouchEnd($event)">
                                <div class="chat-title">{{ chat.title }}</div>
                                <div class="chat-time">{{ formatTime(chat.lastMessage) }}</div>
                            </div>
                            <div class="chat-actions" @click.stop>
                                <el-dropdown @command="(command) => handleChatAction(command, chat)" trigger="click">
                                    <span class="action-trigger">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                            <circle cx="12" cy="12" r="1" stroke="currentColor" stroke-width="2" />
                                            <circle cx="19" cy="12" r="1" stroke="currentColor" stroke-width="2" />
                                            <circle cx="5" cy="12" r="1" stroke="currentColor" stroke-width="2" />
                                        </svg>
                                    </span>
                                    <template #dropdown>
                                        <el-dropdown-menu>
                                            <el-dropdown-item command="rename">重命名</el-dropdown-item>
                                            <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                                        </el-dropdown-menu>
                                    </template>
                                </el-dropdown>
                            </div>
                        </div>
                    </div>

                    <!-- 更早 -->
                    <div v-if="olderChats.length > 0" class="history-group">
                        <div class="group-title">
                            <span class="title-icon">🗂️</span>
                            更早
                            <span class="count-badge">{{ olderChats.length }}</span>
                        </div>
                        <div v-for="chat in olderChats" :key="chat.id"
                            :class="['history-item', { 'active': chat.id === currentChatId }]">
                            <div class="chat-info" @click="handleChatItemClick(chat)"
                                @touchstart="handleChatItemTouchStart(chat, $event)"
                                @touchmove="handleChatItemTouchMove($event)" @touchend="handleChatItemTouchEnd($event)">
                                <div class="chat-title">{{ chat.title }}</div>
                                <div class="chat-time">{{ formatDate(chat.lastMessage) }}</div>
                            </div>
                            <div class="chat-actions" @click.stop>
                                <el-dropdown @command="(command) => handleChatAction(command, chat)" trigger="click">
                                    <span class="action-trigger">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                            <circle cx="12" cy="12" r="1" stroke="currentColor" stroke-width="2" />
                                            <circle cx="19" cy="12" r="1" stroke="currentColor" stroke-width="2" />
                                            <circle cx="5" cy="12" r="1" stroke="currentColor" stroke-width="2" />
                                        </svg>
                                    </span>
                                    <template #dropdown>
                                        <el-dropdown-menu>
                                            <el-dropdown-item command="rename">重命名</el-dropdown-item>
                                            <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                                        </el-dropdown-menu>
                                    </template>
                                </el-dropdown>
                            </div>
                        </div>
                    </div>

                    <!-- 空状态 -->
                    <div v-if="filteredChats.length === 0" class="empty-state">
                        <div class="empty-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                    stroke="#d1d5db" stroke-width="2" />
                            </svg>
                        </div>
                        <p class="empty-text">{{ searchKeyword ? '没有找到相关聊天记录' : '暂无聊天记录' }}</p>
                        <p class="empty-subtext">{{ searchKeyword ? '试试其他关键词' : '开始一个新的对话吧' }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- 重命名对话框 -->
        <el-dialog v-model="renameDialogVisible" title="重命名聊天" width="400px" append-to-body>
            <el-input v-model="renameTitle" placeholder="如：比亚迪投资分析 - 2024年1月" maxlength="50" show-word-limit />
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="renameDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="confirmRename">确定</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useTouchHandler } from '@/composables/useTouchHandler';
import { timerManager } from '@/utils/performanceOptimizer';

// 定义props和emits
const props = defineProps({
    currentChatId: String,
    chatHistory: Array,
    visible: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['toggle-history', 'load-chat', 'create-new-chat', 'rename-chat', 'delete-chat', 'close-panel']);

// 使用触摸处理 composable
const {
    handleTouchStart: touchStart,
    handleTouchMove: touchMove,
    handleTouchEnd: touchEnd,
    handleClick: clickHandler,
    isMobile
} = useTouchHandler();

// 响应式数据
const isCollapsed = computed(() => !props.visible);
const searchKeyword = ref('');
const renameDialogVisible = ref(false);
const renameTitle = ref('');
const renamingChat = ref(null);
const isSearchFocused = ref(false);

// 从localStorage获取聊天历史
const chatHistoryList = ref([]);

// 初始化聊天历史数据
const initializeChatHistory = () => {
    try {
        const stored = localStorage.getItem('chatHistoryList');
        chatHistoryList.value = stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.warn('Failed to parse chat history from localStorage:', error);
        chatHistoryList.value = [];
    }
};

// 立即初始化
initializeChatHistory();



// 搜索框焦点事件
const onSearchFocus = () => {
    isSearchFocused.value = true;
};

const onSearchBlur = () => {
    isSearchFocused.value = false;
};

// 计算属性 - 过滤后的聊天记录
const filteredChats = computed(() => {
    if (!searchKeyword.value) {
        return chatHistoryList.value || [];
    }
    return (chatHistoryList.value || []).filter(chat =>
        chat.title && chat.title.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
        chat.messages && chat.messages.some(msg => msg.content && msg.content.toLowerCase().includes(searchKeyword.value.toLowerCase()))
    );
});

// 按时间分组的聊天记录
const todayChats = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (filteredChats.value || []).filter(chat => {
        if (!chat.lastMessage) return false;
        const chatDate = new Date(chat.lastMessage);
        chatDate.setHours(0, 0, 0, 0);
        return chatDate.getTime() === today.getTime();
    });
});

const yesterdayChats = computed(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    return (filteredChats.value || []).filter(chat => {
        if (!chat.lastMessage) return false;
        const chatDate = new Date(chat.lastMessage);
        chatDate.setHours(0, 0, 0, 0);
        return chatDate.getTime() === yesterday.getTime();
    });
});

const thisWeekChats = computed(() => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);

    return (filteredChats.value || []).filter(chat => {
        if (!chat.lastMessage) return false;
        const chatDate = new Date(chat.lastMessage);
        return chatDate >= weekStart && chatDate <= yesterday;
    });
});

const olderChats = computed(() => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);

    return (filteredChats.value || []).filter(chat => {
        if (!chat.lastMessage) return false;
        const chatDate = new Date(chat.lastMessage);
        return chatDate < weekStart;
    });
});

// 方法
const createNewChat = () => {
    emit('create-new-chat');
};

const closePanel = () => {
    emit('close-panel');
};

const loadChat = (chat, forceLoad = false) => {
    // 先触发加载聊天事件
    emit('load-chat', chat);

    // 移动端需要判断是否为真正的点击操作
    if (isMobile()) {
        // 如果是强制加载，则关闭面板
        if (forceLoad) {
            // 立即关闭面板，不需要延迟
            emit('close-panel');
            console.log('移动端点击历史记录，触发关闭面板');
        }
    }
};

// 处理聊天项点击（使用 composable 的触摸处理）
const handleChatItemTouchStart = (chat, event) => {
    touchStart(chat, event);
};

const handleChatItemTouchMove = (event) => {
    touchMove(event);
};

const handleChatItemTouchEnd = (event) => {
    touchEnd(event, (chat) => {
        // 点击回调：加载聊天并关闭面板
        loadChat(chat, true);
    });
};

// 处理鼠标点击事件（PC端）
const handleChatItemClick = (chat) => {
    clickHandler(chat, (chat) => {
        loadChat(chat);
    });
};

const handleChatAction = (command, chat) => {
    switch (command) {
        case 'rename':
            renamingChat.value = chat;
            renameTitle.value = chat.title;
            renameDialogVisible.value = true;
            break;
        case 'delete':
            ElMessageBox.confirm(
                '确定要删除这个聊天记录吗？删除后无法恢复。',
                '确认删除',
                {
                    confirmButtonText: '删除',
                    cancelButtonText: '取消',
                    type: 'warning',
                    customClass: 'high-z-index-dialog',
                    appendTo: 'body',
                }
            ).then(() => {
                emit('delete-chat', chat.id);
                ElMessage.success('聊天记录已删除');
            });
            break;
    }
};

const confirmRename = () => {
    if (!renameTitle.value.trim()) {
        ElMessage.warning('请输入聊天标题');
        return;
    }

    emit('rename-chat', renamingChat.value.id, renameTitle.value.trim());
    renameDialogVisible.value = false;
    renamingChat.value = null;
    renameTitle.value = '';
    ElMessage.success('重命名成功');
};

// 时间格式化
const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
};

const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric'
    });
};

// 监听聊天历史变化，更新本地数据
watch(() => chatHistoryList.value, () => {
    // 可以在这里添加其他逻辑
}, { deep: true });

// 监听localStorage变化，同步数据
const updateChatHistoryList = () => {
    try {
        const stored = localStorage.getItem('chatHistoryList');
        chatHistoryList.value = stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.warn('Failed to update chat history from localStorage:', error);
        chatHistoryList.value = [];
    }
};

// 定期检查localStorage变化 - 优化版本
onMounted(() => {
    // 使用定时器管理器，并降低检查频率
    timerManager.create('chat-history-sync', updateChatHistoryList, 5000, true);
});

onUnmounted(() => {
    // 清理定时器
    timerManager.clear('chat-history-sync');
});
</script>

<style scoped lang="scss">
@import '@/styles/mixins/index';

.chat-history-container {
    @include fixed-panel(56px, 0, 320px, calc(100vh - 56px), 50);
    @include gradient-background(#ffffff, #f8fafc, 145deg);
    @include card-shadow(4px 0 20px rgba(0, 0, 0, 0.08));
    border-right: 1px solid #e5e7eb;
    transform: translateX(-100%);
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    will-change: transform;
}

.chat-history-container:not(.collapsed) {
    transform: translateX(0);
}

.chat-history-container.collapsed {
    transform: translateX(-100%);
}

.history-panel {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    contain: layout style;
}

.header-actions {
    @include flex-center-vertical;
    margin-left: auto;
    flex-shrink: 0;
    gap: 0;
}

.new-chat-btn,
.close-btn {
    @include icon-button(28px, 12px, 24px, 10px, 22px, 9px);
    @include button-group-spacing(2px);
}

.close-btn {
    @include danger-button-hover;
}

/* 移动端优化已在 mixins 中处理 */
.search-container {
    @include flex-center-vertical;
    padding: 16px;
    flex-shrink: 0;
    gap: 12px;
}

.search-wrapper {
    position: relative;
    background: #f8fafc;
    border-radius: 14px;
    padding: 2px;
    flex: 1;
}

.focus-border-input {
    @include focus-input;
}

.section-divider {
    @include section-divider;
}

.divider-text {
    @include gradient-text(#6b7280, #9ca3af, 135deg);
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.8px;
}

.history-list-container {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.history-list {
    @include thin-scrollbar;
    flex: 1;
    overflow-y: auto;
    padding: 0 8px;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
    contain: layout;
}

.history-group {
    margin-bottom: 16px;
}

.group-title {
    @include flex-center-vertical;
    font-size: 13px;
    color: #4b5563;
    font-weight: 600;
    padding: 12px 12px 8px;
    gap: 8px;
    text-transform: none;
    letter-spacing: 0.3px;
}

.title-icon {
    font-size: 16px;
}

.count-badge {
    background: #f3f4f6;
    color: #6b7280;
    font-size: 11px;
    font-weight: 500;
    padding: 2px 6px;
    border-radius: 10px;
    margin-left: auto;
    border: 1px solid #e5e7eb;
}

.history-item {
    @include flex-between;
    padding: 12px;
    margin: 2px 0;
    border-radius: 8px;
    position: relative;
    transition: background-color 0.15s ease;
    cursor: pointer;
    contain: layout;
}

.history-item:hover {
    background: rgba(59, 130, 246, 0.05);
}

.history-item.active {
    @include active-state;
}

.chat-info {
    flex: 1;
    min-width: 0;
    cursor: pointer;
    padding: 0;
    border-radius: 6px;
}

.history-item:not(:hover) .chat-info:hover {
    background: rgba(59, 130, 246, 0.08);
}

.chat-title {
    @include text-ellipsis;
    font-size: 14px;
    color: #1f2937;
    font-weight: 500;
    margin-bottom: 2px;
}

.chat-time {
    font-size: 12px;
    color: #6b7280;
}

.chat-actions {
    transition: opacity 0.15s ease;
    opacity: 0;
    margin-left: 8px;
}

.history-item:hover .chat-actions {
    opacity: 1;
}

.action-trigger {
    @include flex-center;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    cursor: pointer;
    color: #6b7280;
    transition: background-color 0.15s ease, color 0.15s ease;
}

.action-trigger:hover {
    background: rgba(0, 0, 0, 0.05);
    color: #374151;
}

.empty-state {
    @include empty-state;
}

/* 对话框样式 */
:deep(.el-dialog__header) {
    padding: 20px 20px 10px;
    border-bottom: 1px solid #f0f0f0;
}

:deep(.el-dialog__body) {
    padding: 20px;
}

:deep(.el-dialog__footer) {
    padding: 10px 20px 20px;
    border-top: 1px solid #f0f0f0;
}

/* 响应式设计 */
.chat-history-container {
    @include mobile-responsive(280px);
}

.history-panel {
    @media (max-width: 768px) {
        @include dynamic-viewport-height;
        @include safe-area-bottom(0px);
    }
}

.history-list-container {
    @media (max-width: 768px) {
        @include safe-area-bottom(20px);
    }
}

.history-list {
    @media (max-width: 768px) {
        @include mobile-scroll-optimization;
        @include safe-area-bottom(0px);
    }
}

.chat-info {
    @media (max-width: 768px) {
        @include mobile-clickable-area(56px);
        display: flex;
        flex-direction: column;
        justify-content: center;
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
    }
}

.history-item {
    @media (max-width: 768px) {
        @include mobile-clickable-area(56px);
    }
}
</style>
