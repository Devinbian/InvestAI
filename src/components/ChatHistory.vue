<template>
    <div class="chat-history-container" :class="{ 'collapsed': isCollapsed }">
        <!-- 历史记录面板 -->
        <div class="history-panel" v-show="!isCollapsed">
            <!-- 头部 -->
            <div class="history-header">
                <div class="header-title">
                    <div class="greeting-section">
                        <div class="greeting-text">
                            <h3>{{ getGreeting() }}</h3>
                            <p>{{ getGreetingSubtext() }}</p>
                        </div>
                    </div>
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

            <!-- 搜索框 - 聚焦边框特效 -->
            <div class="search-container">
                <div class="search-wrapper">
                    <el-input v-model="searchKeyword" placeholder="搜索股票名称、关键词或日期..." size="small" clearable
                        class="focus-border-input" @focus="onSearchFocus" @blur="onSearchBlur">
                        <template #prefix>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2" />
                                <path d="m21 21-4.35-4.35" stroke="currentColor" stroke-width="2" />
                            </svg>
                        </template>
                    </el-input>
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
                            <div class="chat-info" @click="handleClick(chat)"
                                @touchstart="handleTouchStart(chat, $event)" @touchmove="handleTouchMove($event)"
                                @touchend="handleTouchEnd($event)">
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
                            <div class="chat-info" @click="handleClick(chat)"
                                @touchstart="handleTouchStart(chat, $event)" @touchmove="handleTouchMove($event)"
                                @touchend="handleTouchEnd($event)">
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
                            <div class="chat-info" @click="handleClick(chat)"
                                @touchstart="handleTouchStart(chat, $event)" @touchmove="handleTouchMove($event)"
                                @touchend="handleTouchEnd($event)">
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
                            <div class="chat-info" @click="handleClick(chat)"
                                @touchstart="handleTouchStart(chat, $event)" @touchmove="handleTouchMove($event)"
                                @touchend="handleTouchEnd($event)">
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
const isSearchFocused = ref(false);

// 从localStorage获取聊天历史
const chatHistoryList = ref(JSON.parse(localStorage.getItem('chatHistoryList') || '[]'));

// 触摸事件状态管理
const touchState = ref({
    startX: 0,
    startY: 0,
    startTime: 0,
    isDragging: false,
    currentChat: null
});

// 问候语功能
const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '夜深了';
    if (hour < 9) return '早上好';
    if (hour < 12) return '上午好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    if (hour < 22) return '晚上好';
    return '夜深了';
};

const getGreetingSubtext = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '休息时间也在关注投资，真棒！';
    if (hour < 9) return '开始新的投资之旅吧';
    if (hour < 12) return '今天的市场如何？';
    if (hour < 14) return '午间休息，回顾一下？';
    if (hour < 18) return '下午时光，分析一下';
    if (hour < 22) return '晚间总结时间';
    return '深夜思考投资，很专业！';
};

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

const loadChat = (chat, forceLoad = false) => {
    // 先触发加载聊天事件
    emit('load-chat', chat);

    // 移动端需要判断是否为真正的点击操作
    if (window.innerWidth <= 768) {
        // 如果是强制加载或者不是拖拽状态，则关闭面板
        if (forceLoad || !touchState.value.isDragging) {
            // 立即关闭面板，不需要延迟
            emit('close-panel');
            console.log('移动端点击历史记录，触发关闭面板');
        }
    }
};

// 处理移动端触摸开始事件
const handleTouchStart = (chat, event) => {
    if (window.innerWidth <= 768) {
        const touch = event.touches[0];
        touchState.value = {
            startX: touch.clientX,
            startY: touch.clientY,
            startTime: Date.now(),
            isDragging: false,
            currentChat: chat
        };
    }
};

// 处理移动端触摸移动事件
const handleTouchMove = (event) => {
    if (window.innerWidth <= 768 && touchState.value.currentChat) {
        const touch = event.touches[0];
        const deltaX = Math.abs(touch.clientX - touchState.value.startX);
        const deltaY = Math.abs(touch.clientY - touchState.value.startY);

        // 如果移动距离超过阈值，则认为是拖拽操作
        if (deltaX > 10 || deltaY > 10) {
            touchState.value.isDragging = true;
        }
    }
};

// 处理移动端触摸结束事件
const handleTouchEnd = (event) => {
    if (window.innerWidth <= 768 && touchState.value.currentChat) {
        const currentTime = Date.now();
        const timeDiff = currentTime - touchState.value.startTime;

        // 如果是短时间的触摸且没有拖拽，则认为是点击
        if (timeDiff < 300 && !touchState.value.isDragging) {
            loadChat(touchState.value.currentChat, true);
        }

        // 重置触摸状态
        touchState.value = {
            startX: 0,
            startY: 0,
            startTime: 0,
            isDragging: false,
            currentChat: null
        };
    }
};

// 处理鼠标点击事件（PC端）
const handleClick = (chat) => {
    if (window.innerWidth > 768) {
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
    chatHistoryList.value = JSON.parse(localStorage.getItem('chatHistoryList') || '[]');
};

// 定期检查localStorage变化
setInterval(updateChatHistoryList, 1000);
</script>

<style scoped>
.chat-history-container {
    width: 320px;
    height: calc(100vh - 56px);
    background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
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
    padding: 20px 16px;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    box-sizing: border-box;
}

.greeting-section {
    display: flex;
    align-items: center;
}

.greeting-text h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
    line-height: 1.3;
}

.greeting-text p {
    margin: 2px 0 0 0;
    font-size: 12px;
    color: #6b7280;
    line-height: 1.3;
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
    padding: 16px;
    flex-shrink: 0;
}

.search-wrapper {
    position: relative;
    background: #f8fafc;
    border-radius: 14px;
    padding: 2px;
}

.focus-border-input :deep(.el-input__wrapper) {
    border-radius: 12px;
    border: 2px solid #e5e7eb;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    transition: all 0.3s ease;
    background: #f8fafc !important;
}

.focus-border-input:focus-within :deep(.el-input__wrapper) {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1), 0 4px 12px rgba(59, 130, 246, 0.15);
    transform: translateY(-1px);
}

.focus-border-input :deep(.el-input__inner) {
    color: #1f2937;
    font-weight: 500;
}

.focus-border-input :deep(.el-input__inner::placeholder) {
    color: #9ca3af !important;
    font-size: 14px !important;
    font-weight: 400 !important;
}

.section-divider {
    margin: 0 16px;
    padding: 0 0 8px 0;
    border-bottom: 2px solid #f3f4f6;
    position: relative;
}

.divider-text {
    font-size: 13px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.history-list-container {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
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
    font-size: 13px;
    color: #4b5563;
    font-weight: 600;
    padding: 12px 12px 8px;
    display: flex;
    align-items: center;
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

.empty-icon {
    margin-bottom: 16px;
    opacity: 0.6;
}

.empty-text {
    font-size: 16px;
    font-weight: 500;
    color: #4b5563;
    margin: 0 0 8px 0;
}

.empty-subtext {
    font-size: 14px;
    color: #9ca3af;
    margin: 0;
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
        touch-action: pan-y;
        /* 允许垂直滑动，但限制其他手势 */
        min-height: 44px;
        /* 增加触摸目标的最小高度 */
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    .history-item {
        -webkit-tap-highlight-color: transparent;
        min-height: 56px;
        /* 确保足够的点击区域 */
    }

    .history-list {
        /* 改善滚动体验 */
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
    }
}
</style>
