<template>
    <div class="ai-card">
        <!-- 输入框区域 -->
        <div class="ai-input-row">
            <el-input v-model="inputMessage" class="ai-input" type="textarea" :autosize="{ minRows: 2, maxRows: 6 }"
                :placeholder="placeholder" @keyup.enter.ctrl="handleSendMessage" clearable maxlength="500"
                show-word-limit :input-style="{ userSelect: 'text', WebkitUserSelect: 'text' }" ref="inputRef" />
        </div>

        <!-- 按钮区域 -->
        <div class="ai-buttons-row" :class="buttonRowClass">
            <!-- 左侧按钮：历史记录按钮 -->
            <div class="left-buttons" v-if="showHistoryButton">
                <el-button class="ai-func-btn chat-history-btn" circle @click="$emit('toggle-chat-history')"
                    :title="'展开聊天记录'">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M8 9h8M8 13h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" />
                    </svg>
                </el-button>
            </div>

            <!-- 右侧按钮：功能按钮组 -->
            <div class="right-buttons">
                <div class="voice-btn-container">
                    <el-button class="ai-func-btn voice-btn" :class="{ 'recording': isRecording }" circle
                        @click="$emit('voice-click')" :title="isRecording ? `录音中 ${recordingDuration}s` : '点击开始语音输入'">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
                                :stroke="isRecording ? '#ff4757' : '#888'" stroke-width="2"
                                :fill="isRecording ? '#ff4757' : 'none'" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" :stroke="isRecording ? '#ff4757' : '#888'"
                                stroke-width="2" fill="none" />
                            <line x1="12" y1="19" x2="12" y2="23" :stroke="isRecording ? '#ff4757' : '#888'"
                                stroke-width="2" />
                            <line x1="8" y1="23" x2="16" y2="23" :stroke="isRecording ? '#ff4757' : '#888'"
                                stroke-width="2" />
                        </svg>
                    </el-button>
                    <!-- 录音计时显示 -->
                    <div v-if="isRecording" class="recording-timer">{{ recordingDuration }}s</div>
                </div>

                <el-button class="ai-send-btn" :class="{ 'generating': isGenerating }"
                    :type="isGenerating ? 'danger' : 'primary'" circle @mousedown="handleSendButtonMouseDown"
                    @touchstart="handleSendButtonTouchStart" @click="handleSendButtonClick"
                    :disabled="!isGenerating && !inputMessage.trim()" :title="isGenerating ? '停止生成' : '发送消息'">
                    <!-- 生成中显示停止图标 -->
                    <svg v-if="isGenerating" width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <rect x="6" y="6" width="12" height="12" fill="currentColor" rx="2" />
                    </svg>
                    <!-- 正常状态显示发送图标 -->
                    <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" />
                        <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                </el-button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'AIInputCard',
    props: {
        // 输入消息内容
        modelValue: {
            type: String,
            default: ''
        },
        // 输入框占位符
        placeholder: {
            type: String,
            default: '输入股票代码或名称，如：000001 或 平安银行'
        },
        // 是否显示历史记录按钮
        showHistoryButton: {
            type: Boolean,
            default: false
        },
        // 是否为聊天模式
        isChatMode: {
            type: Boolean,
            default: false
        },
        // 是否为移动端视图
        isMobileView: {
            type: Boolean,
            default: false
        },
        // 是否正在录音
        isRecording: {
            type: Boolean,
            default: false
        },
        // 录音时长
        recordingDuration: {
            type: Number,
            default: 0
        },
        // 是否正在生成
        isGenerating: {
            type: Boolean,
            default: false
        },

        // 是否已登录
        isLoggedIn: {
            type: Boolean,
            default: false
        },
        // 是否显示聊天历史
        showChatHistory: {
            type: Boolean,
            default: false
        }
    },
    emits: [
        'update:modelValue',
        'send-message',
        'toggle-chat-history',
        'voice-click',
        'stop-generation'
    ],
    computed: {
        inputMessage: {
            get() {
                return this.modelValue;
            },
            set(value) {
                this.$emit('update:modelValue', value);
            }
        },
        buttonRowClass() {
            const classes = [];

            // 有历史记录按钮时，都需要左右分离布局
            if (this.showHistoryButton) {
                if (this.isChatMode) {
                    classes.push('with-left-btn');
                } else {
                    classes.push('with-history');
                }
            }

            return classes;
        }
    },
    data() {
        return {
            sendButtonPressed: false,
            resetButtonStateTimer: null
        };
    },
    methods: {
        handleSendMessage() {
            this.$emit('send-message');
        },

        // 处理发送按钮的 mousedown 事件（PC端）
        handleSendButtonMouseDown(event) {
            if (!this.isMobileView) {
                event.preventDefault(); // 阻止输入框失去焦点
                this.sendButtonPressed = true;
                this.executeSendAction();
                this.scheduleButtonStateReset();
            }
        },

        // 处理发送按钮的 touchstart 事件（移动端）
        handleSendButtonTouchStart(event) {
            if (this.isMobileView) {
                event.preventDefault(); // 阻止输入框失去焦点
                event.stopPropagation(); // 阻止事件冒泡
                this.sendButtonPressed = true;
                this.executeSendAction();
                this.scheduleButtonStateReset();
            }
        },

        // 处理发送按钮的 click 事件（作为备用）
        handleSendButtonClick(event) {
            // 如果已经通过 mousedown/touchstart 处理过，则跳过
            if (this.sendButtonPressed) {
                this.sendButtonPressed = false;
                event.preventDefault();
                return;
            }

            // 备用处理逻辑
            this.executeSendAction();
        },

        // 执行发送操作的统一方法
        executeSendAction() {
            if (this.isGenerating) {
                this.$emit('stop-generation');
            } else if (this.inputMessage.trim()) {
                this.handleSendMessage();
            }
        },

        // 安排按钮状态重置
        scheduleButtonStateReset() {
            // 清除之前的定时器
            if (this.resetButtonStateTimer) {
                clearTimeout(this.resetButtonStateTimer);
            }

            // 设置新的定时器，200ms后重置按钮状态
            this.resetButtonStateTimer = setTimeout(() => {
                this.sendButtonPressed = false;
                this.resetButtonStateTimer = null;
            }, 200);
        },

        // 手动触发全选功能
        selectAll() {
            if (this.$refs.inputRef && this.$refs.inputRef.textarea) {
                this.$refs.inputRef.textarea.select();
            }
        },

        // 获取输入框焦点
        focus() {
            if (this.$refs.inputRef && this.$refs.inputRef.textarea) {
                this.$refs.inputRef.textarea.focus();
            }
        },

        // 获取输入框元素（供外部使用）
        getInputElement() {
            return this.$refs.inputRef?.textarea;
        }
    },

    // 组件销毁时清理定时器
    beforeUnmount() {
        if (this.resetButtonStateTimer) {
            clearTimeout(this.resetButtonStateTimer);
        }
    }
};
</script>

<style scoped lang="scss">
@import "@/styles/mixins/_index.scss";

.ai-card {
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.04);
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    position: relative;
    z-index: 2;
}

.ai-input-row {
    background: #f8f9fa;
    border-radius: 12px;
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 72px !important;
    contain: layout !important;
    will-change: auto !important;
}

.ai-buttons-row {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-top: 8px;
    width: 100%;
}

/* 有历史记录按钮时，左右分离布局 */
.ai-buttons-row.with-history,
.ai-buttons-row.with-left-btn {
    justify-content: space-between !important;
}

/* 左侧按钮组 */
.left-buttons {
    display: flex;
    align-items: center;
    gap: 8px;
}

/* 右侧按钮组 */
.right-buttons {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
}

.ai-input {
    flex: 1;
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
    font-size: 0.95rem;
    resize: none;
    line-height: 1.5;
}

.ai-input :deep(.el-textarea__inner) {
    font-size: 0.95rem !important;
    line-height: 1.5 !important;
    color: #374151 !important;
    /* 确保原生操作功能正常 */
    user-select: text !important;
    -webkit-user-select: text !important;
    -moz-user-select: text !important;
    -ms-user-select: text !important;
    /* 确保右键菜单可用 */
    -webkit-touch-callout: default !important;
    /* 防止文本选择时布局变动 */
    min-height: 48px !important;
    max-height: 180px !important;
    overflow-y: auto !important;
    /* 确保选择状态时容器尺寸稳定 */
    box-sizing: border-box !important;
    /* 防止选择工具栏影响布局 */
    position: relative !important;
    z-index: 1 !important;
}

.ai-input :deep(.el-textarea__inner::placeholder) {
    color: #c1c7cd !important;
    font-size: 0.85rem !important;
    font-weight: 400 !important;
    opacity: 0.8 !important;
}

.ai-buttons {
    display: flex;
    align-items: center;
    gap: 8px;
    align-self: flex-end;
}

/* 移动端ai-buttons布局调整 - 支持左对齐的聊天历史按钮 */
@include mobile-tablet {

    /* 当有聊天历史按钮时的特殊布局 */
    .ai-buttons.with-chat-history {
        justify-content: space-between;
        width: 100%;
    }

    /* 聊天历史按钮左对齐 */
    .ai-buttons .chat-history-btn {
        margin-right: auto;
    }

    /* 移动端聊天模式按钮布局优化 */
    .ai-buttons.with-chat-history {
        justify-content: space-between;
        width: 100%;
        align-items: center;
    }

    /* 右侧按钮组容器 */
    .ai-buttons.with-chat-history .right-buttons {
        display: flex;
        gap: 8px;
        align-items: center;
    }
}

/* 聊天历史按钮样式 */
.chat-history-btn {
    background: #f0f0f0 !important;
    border: none !important;
    color: #6b7280 !important;
}

.chat-history-btn:hover {
    background: #e0e0e0 !important;
    color: #374151 !important;
}

/* 输入区域左侧按钮样式 */
.input-left-btn {
    margin-right: 12px;
    flex-shrink: 0;
}

/* 当ai-buttons-row包含左侧按钮时，调整布局 */
.ai-buttons-row.with-left-btn {
    justify-content: space-between;
}

.ai-buttons-row.with-left-btn .ai-buttons {
    flex: 1;
    justify-content: flex-end;
}

.ai-func-btn {
    border-radius: 50%;
    width: 36px;
    height: 36px;
    min-width: 36px;
    min-height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    box-shadow: none;
    background: #f0f0f0;
    border: none;
    color: #6b7280;
    transition: background 0.2s;
}

.ai-func-btn:hover {
    background: #e0e0e0;
}

/* 语音按钮录音状态样式 */
.voice-btn.recording {
    background: #ffe5e5 !important;
    border: 2px solid #ff4757 !important;
    animation: voice-recording 1.5s infinite;
}

.voice-btn.recording:hover {
    background: #ffdddd !important;
}

@keyframes voice-recording {

    0%,
    100% {
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(255, 71, 87, 0.4);
    }

    50% {
        transform: scale(1.05);
        box-shadow: 0 0 0 6px rgba(255, 71, 87, 0);
    }
}

/* 语音按钮容器 */
.voice-btn-container {
    position: relative;
    display: flex;
    align-items: center;
}

/* 录音计时器 */
.recording-timer {
    position: absolute;
    top: -25px;
    left: 50%;
    transform: translateX(-50%);
    background: #ff4757;
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
    white-space: nowrap;
    z-index: 10;
}

.recording-timer::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-top: 4px solid #ff4757;
}

.ai-send-btn {
    width: 36px;
    height: 36px;
    min-width: 36px;
    min-height: 36px;
    background: #3b82f6 !important;
    border: none !important;
}

.ai-send-btn:hover {
    background: #2563eb !important;
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3) !important;
}

/* 发送按钮禁用状态 */
.ai-send-btn:disabled {
    background: #e5e7eb !important;
    color: #9ca3af !important;
    transform: none !important;
    box-shadow: none !important;
    cursor: not-allowed !important;
    opacity: 0.6 !important;
}

.ai-send-btn:disabled:hover {
    background: #e5e7eb !important;
    transform: none !important;
    box-shadow: none !important;
}

.ai-send-btn svg {
    width: 16px;
    height: 16px;
    color: white;
}

/* 禁用状态下的SVG图标 */
.ai-send-btn:disabled svg {
    color: #9ca3af !important;
}

/* 生成状态样式 */
.ai-send-btn.generating {
    background: #ef4444 !important;
    animation: pulse-generating 1.5s ease-in-out infinite;
}

.ai-send-btn.generating:hover {
    background: #dc2626 !important;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3) !important;
}

@keyframes pulse-generating {

    0%,
    100% {
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
    }

    50% {
        transform: scale(1.05);
        box-shadow: 0 0 0 6px rgba(239, 68, 68, 0);
    }
}

/* 移动端样式适配 */
@include mobile {
    .ai-card {
        /* 移动端基础样式 - 确保完全占满屏幕宽度 */
        width: 100% !important;
        max-width: none !important;
        box-sizing: border-box !important;

        /* 主页模式样式 - 贴底显示时的内部样式 */
        margin: 0 !important;
        padding: 8px 0 calc(8px + env(safe-area-inset-bottom, 0)) 0 !important;

        /* 当输入框获得焦点时，减少底部间距（键盘弹出时） */
        &:focus-within {
            padding: 4px 0 4px 0 !important;
        }

        border-radius: 0 !important;
        background: #fff !important;
        box-shadow: 0 -1px 3px 0 rgba(0, 0, 0, 0.05) !important;
        border-top: 1px solid #e5e7eb !important;

        /* 防止键盘弹起时布局变动 */
        transform: translateZ(0) !important;
        backface-visibility: hidden !important;
        /* 确保固定定位稳定 */
        will-change: auto !important;
    }

    /* 聊天模式下的AI卡片样式 */
    :global(.modern-content.chatting) .ai-card {
        margin: 0 !important;
        padding: 10px 12px !important;
        border-radius: 12px !important;
        background: #fff !important;
        box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.04) !important;
    }

    .ai-input-row {
        padding: 10px 16px !important;
        width: 95% !important;
        box-sizing: border-box !important;
        margin: 0 10px !important;

        /* 移动端防止布局抖动 */
        min-height: 64px !important;
        /* 确保内容不会溢出 */
        overflow: hidden !important;
    }

    .ai-buttons-row {
        padding: 6px 16px !important;
        width: 100% !important;
        box-sizing: border-box !important;
        display: flex !important;
        align-items: center !important;
        justify-content: flex-end !important;
        margin: 0 !important;
    }

    /* 移动端有历史记录按钮时，强制左右分离布局 */
    .ai-buttons-row.with-history,
    .ai-buttons-row.with-left-btn {
        justify-content: space-between !important;
    }



    /* 移动端左侧按钮组 */
    .left-buttons {
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        flex-shrink: 0 !important;
    }

    /* 移动端右侧按钮组 */
    .right-buttons {
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        flex-shrink: 0 !important;
    }

    /* 移动端按钮尺寸优化 */
    .ai-func-btn {
        width: 32px;
        height: 32px;
        min-width: 32px;
        min-height: 32px;
        flex-shrink: 0 !important;
    }

    .ai-func-btn svg {
        width: 16px;
        height: 16px;
    }

    /* 发送按钮确保可见 */
    .ai-send-btn {
        width: 32px !important;
        height: 32px !important;
        min-width: 32px !important;
        min-height: 32px !important;
        flex-shrink: 0 !important;
    }

    .ai-send-btn svg {
        width: 14px !important;
        height: 14px !important;
    }

    /* 微信环境下特殊样式 */
    :global(body.wechat-browser) .ai-card {
        /* 微信环境下的内部样式 */
        width: 100vw !important;
        max-width: 100vw !important;
        margin: 0 !important;
        padding: 8px 0 calc(8px + env(safe-area-inset-bottom, 0)) 0 !important;
        border-radius: 0 !important;
        background: #fff !important;
        box-shadow: none !important;
        border-top: none !important;
        /* 微信环境下防止触发底部工具栏 */
        position: fixed !important;
        bottom: 0 !important;
        left: 0 !important;
        right: 0 !important;
        z-index: 999 !important;
        /* 强制贴底显示，防止工具栏出现 */
        transform: translateZ(0) !important;
        -webkit-transform: translateZ(0) !important;
        /* 触发硬件加速 */
        -webkit-backface-visibility: hidden !important;
        backface-visibility: hidden !important;
        /* 添加过渡效果 */
        transition: padding 0.3s ease !important;
    }

    /* 微信环境下键盘弹起时的特殊处理 */
    :global(body.wechat-browser.keyboard-open) .ai-card {
        padding: 4px 0 4px 0 !important;
        /* 键盘弹起时确保输入框紧贴键盘顶部 */
        bottom: 0 !important;
        position: fixed !important;
    }

    :global(body.wechat-browser) .ai-input-row {
        padding: 0 12px !important;
        width: 100% !important;
        box-sizing: border-box !important;
    }

    :global(body.wechat-browser) .ai-buttons-row {
        padding: 6px 12px !important;
        width: 100% !important;
        box-sizing: border-box !important;
    }

    /* 微信环境下聊天模式样式 */
    :global(body.wechat-browser .modern-content.chatting) .ai-card {
        margin: 0 !important;
        padding: 10px 0 !important;
        border-radius: 12px !important;
        background: #fff !important;
        box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.04) !important;
        width: 100% !important;
        max-width: 100% !important;
    }

    .ai-input :deep(.el-textarea__inner) {
        /* 移动端文本选择优化 */
        -webkit-user-select: text !important;
        user-select: text !important;
        /* 防止选择时的视觉跳动 */
        outline: none !important;
        /* 确保选择高亮不影响布局 */
        background-attachment: local !important;
    }

    /* 防止文本选择工具栏影响布局 */
    .ai-input :deep(.el-textarea__inner)::selection {
        background-color: rgba(59, 130, 246, 0.3) !important;
    }

    .ai-input :deep(.el-textarea__inner)::-moz-selection {
        background-color: rgba(59, 130, 246, 0.3) !important;
    }
}

/* 超小屏幕优化 */
@include mobile-sm {
    .ai-card {
        /* 超小屏幕内部样式 */
        padding: 6px 0 calc(env(safe-area-inset-bottom) + 6px) 0 !important;

        /* 超小屏幕键盘弹出时的处理 */
        &:focus-within {
            padding: 3px 0 3px 0 !important;
        }

        width: 100% !important;
        max-width: 100% !important;
        border-radius: 0 !important;
    }

    /* 超小屏幕聊天模式样式 */
    :global(.modern-content.chatting) .ai-card {
        padding: 8px 10px !important;
    }

    .ai-input-row {
        padding: 8px 12px !important;
        width: 95% !important;
        box-sizing: border-box !important;
        margin: 0 5px !important;
    }

    .ai-buttons-row {
        padding: 6px 12px !important;
        width: 100% !important;
        box-sizing: border-box !important;
        margin: 0 !important;
    }

    .ai-func-btn {
        width: 30px;
        height: 30px;
        min-width: 30px;
        min-height: 30px;
        flex-shrink: 0 !important;
    }

    .ai-func-btn svg {
        width: 14px;
        height: 14px;
    }

    .ai-send-btn {
        width: 30px !important;
        height: 30px !important;
        min-width: 30px !important;
        min-height: 30px !important;
        flex-shrink: 0 !important;
    }

    .ai-send-btn svg {
        width: 12px !important;
        height: 12px !important;
    }

    /* 微信环境下超小屏幕特殊处理 */
    :global(body.wechat-browser) .ai-card {
        width: 100vw !important;
        max-width: 100vw !important;
        padding: 6px 0 calc(env(safe-area-inset-bottom) + 6px) 0 !important;
    }

    /* 微信环境下超小屏幕键盘弹起时的处理 */
    :global(body.wechat-browser.keyboard-open) .ai-card {
        padding: 3px 0 3px 0 !important;
    }

    :global(body.wechat-browser .modern-content.chatting) .ai-card {
        padding: 6px 0 !important;
    }

    :global(body.wechat-browser) .ai-input-row {
        padding: 6px 10px !important;
    }

    :global(body.wechat-browser) .ai-buttons-row {
        padding: 4px 10px !important;
    }
}
</style>
