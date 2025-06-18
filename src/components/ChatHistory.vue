<template>
    <div class="chat-history-container" :class="{ 'collapsed': isCollapsed }">
        <!-- 历史记录面板 -->
        <div class="history-panel" v-show="!isCollapsed">
            <!-- 头部 -->
            <div class="history-header">
                <div class="header-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    <span>聊天记录</span>
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

            <!-- 搜索框 -->
            <div class="search-container">
                <el-input v-model="searchKeyword" placeholder="搜索股票名称、关键词或日期..." size="small" clearable>
                    <template #prefix>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2" />
                            <path d="m21 21-4.35-4.35" stroke="currentColor" stroke-width="2" />
                        </svg>
                    </template>
                </el-input>
            </div>

            <!-- 历史记录列表 -->
            <div class="history-list">
                <!-- 今天 -->
                <div v-if="todayChats.length > 0" class="history-group">
                    <div class="group-title">今天</div>
                    <div v-for="chat in todayChats" :key="chat.id"
                        :class="['history-item', { 'active': chat.id === currentChatId }]">
                        <div class="chat-info" @click="loadChat(chat)" @touchstart="handleTouchStart(chat)">
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
                    <div class="group-title">昨天</div>
                    <div v-for="chat in yesterdayChats" :key="chat.id"
                        :class="['history-item', { 'active': chat.id === currentChatId }]">
                        <div class="chat-info" @click="loadChat(chat)" @touchstart="handleTouchStart(chat)">
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
                    <div class="group-title">本周</div>
                    <div v-for="chat in thisWeekChats" :key="chat.id"
                        :class="['history-item', { 'active': chat.id === currentChatId }]">
                        <div class="chat-info" @click="loadChat(chat)" @touchstart="handleTouchStart(chat)">
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
                    <div class="group-title">更早</div>
                    <div v-for="chat in olderChats" :key="chat.id"
                        :class="['history-item', { 'active': chat.id === currentChatId }]">
                        <div class="chat-info" @click="loadChat(chat)" @touchstart="handleTouchStart(chat)">
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
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#d1d5db"
                            stroke-width="2" />
                    </svg>
                    <p>{{ searchKeyword ? '没有找到相关聊天记录' : '暂无聊天记录' }}</p>
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
import { ref, computed, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

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

// 响应式数据
const isCollapsed = computed(() => !props.visible);
const searchKeyword = ref('');
const renameDialogVisible = ref(false);
const renameTitle = ref('');
const renamingChat = ref(null);

// 从localStorage获取聊天历史
const chatHistoryList = ref(JSON.parse(localStorage.getItem('chatHistoryList') || '[]'));

// 计算属性 - 过滤后的聊天记录
const filteredChats = computed(() => {
    if (!searchKeyword.value) {
        return chatHistoryList.value;
    }
    return chatHistoryList.value.filter(chat =>
        chat.title.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
        chat.messages.some(msg => msg.content && msg.content.toLowerCase().includes(searchKeyword.value.toLowerCase()))
    );
});

// 按时间分组的聊天记录
const todayChats = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return filteredChats.value.filter(chat => {
        const chatDate = new Date(chat.lastMessage);
        chatDate.setHours(0, 0, 0, 0);
        return chatDate.getTime() === today.getTime();
    });
});

const yesterdayChats = computed(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    return filteredChats.value.filter(chat => {
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

    return filteredChats.value.filter(chat => {
        const chatDate = new Date(chat.lastMessage);
        return chatDate >= weekStart && chatDate <= yesterday;
    });
});

const olderChats = computed(() => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);

    return filteredChats.value.filter(chat => {
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

const loadChat = (chat) => {
    // 先触发加载聊天事件
    emit('load-chat', chat);

    // 移动端点击后立即触发关闭面板事件
    if (window.innerWidth <= 768) {
        // 立即关闭面板，不需要延迟
        emit('close-panel');
        console.log('移动端点击历史记录，触发关闭面板');
    }
};

// 处理移动端触摸事件
const handleTouchStart = (chat) => {
    // 在移动端，直接触发 loadChat
    if (window.innerWidth <= 768) {
        loadChat(chat);
    }
};

// 处理触摸结束事件（备用方法）
const handleTouchEnd = (chat) => {
    // 在移动端，直接触发 loadChat
    if (window.innerWidth <= 768) {
        loadChat(chat);
    }
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
    chatHistoryList.value = JSON.parse(localStorage.getItem('chatHistoryList') || '[]');
};

// 定期检查localStorage变化
setInterval(updateChatHistoryList, 1000);
</script>

<style scoped>
.chat-history-container {
    width: 320px;
    height: calc(100vh - 56px);
    background: #ffffff;
    border-right: 1px solid #e5e7eb;
    position: fixed;
    top: 56px;
    left: 0;
    z-index: 50;
    overflow: hidden;
    box-shadow: 4px 0 20px rgba(0, 0, 0, 0.08);
    transition: width 0.3s ease;
}

.chat-history-container.collapsed {
    width: 0;
}

.history-panel {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.history-header {
    padding: 12px 16px;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    height: 56px;
    box-sizing: border-box;
}

.header-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
}

.header-title svg {
    color: #3b82f6;
}

.header-actions {
    display: flex;
    gap: 8px;
}

.new-chat-btn,
.close-btn {
    padding: 6px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    background: transparent;
    color: #6b7280;
    transition: all 0.2s ease;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.new-chat-btn:hover,
.close-btn:hover {
    background: #f8fafc;
    color: #374151;
    border-color: #d1d5db;
}

.close-btn:hover {
    background: #fef2f2;
    color: #dc2626;
    border-color: #fecaca;
}

.search-container {
    padding: 10px 10px 0 16px;
    flex-shrink: 0;
}

.search-container :deep(.el-input__wrapper) {
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.search-container :deep(.el-input__inner::placeholder) {
    color: #c1c7cd !important;
    font-size: 0.8rem !important;
    font-weight: 400 !important;
    opacity: 0.75 !important;
}

.history-list {
    flex: 1;
    overflow-y: auto;
    padding: 0 8px;
}

.history-list::-webkit-scrollbar {
    width: 4px;
}

.history-list::-webkit-scrollbar-track {
    background: transparent;
}

.history-list::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 2px;
}

.history-list::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
}

.history-group {
    margin-bottom: 16px;
}

.group-title {
    font-size: 12px;
    color: #6b7280;
    font-weight: 500;
    padding: 8px 12px 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.history-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    margin: 2px 0;
    border-radius: 8px;
    transition: all 0.2s ease;
    position: relative;
}

.history-item:hover {
    background: rgba(59, 130, 246, 0.05);
}

.history-item.active {
    background: rgba(59, 130, 246, 0.1);
    border-left: 3px solid #3b82f6;
}

.chat-info {
    flex: 1;
    min-width: 0;
    cursor: pointer;
    padding: 0;
    border-radius: 6px;
    transition: all 0.2s ease;
}

.history-item:not(:hover) .chat-info:hover {
    background: rgba(59, 130, 246, 0.08);
}

.chat-title {
    font-size: 14px;
    color: #1f2937;
    font-weight: 500;
    margin-bottom: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.chat-time {
    font-size: 12px;
    color: #6b7280;
}

.chat-actions {
    opacity: 0;
    transition: opacity 0.2s ease;
    margin-left: 8px;
}

.history-item:hover .chat-actions {
    opacity: 1;
}

.action-trigger {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    cursor: pointer;
    color: #6b7280;
    transition: all 0.2s ease;
}

.action-trigger:hover {
    background: rgba(0, 0, 0, 0.05);
    color: #374151;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
    color: #6b7280;
}

.empty-state p {
    margin-top: 16px;
    font-size: 14px;
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
@media (max-width: 768px) {
    .chat-history-container {
        width: 280px;
    }

    .chat-history-container.collapsed {
        width: 0;
    }

    /* 移动端触摸优化 */
    .chat-info {
        -webkit-tap-highlight-color: rgba(59, 130, 246, 0.2);
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        touch-action: manipulation;
    }

    .history-item {
        -webkit-tap-highlight-color: transparent;
    }
}
</style>
