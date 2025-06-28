<template>
    <div class="ai-card">
        <!-- 输入框区域 -->
        <div class="ai-input-row">
            <el-input v-model="inputMessage" class="ai-input" type="textarea" :autosize="{ minRows: 2, maxRows: 6 }"
                :placeholder="placeholder" @keyup.enter.ctrl="handleSendMessage" clearable maxlength="500"
                show-word-limit />
        </div>

        <!-- 按钮区域 -->
        <div class="ai-buttons-row" :class="buttonRowClass">
            <!-- 历史记录按钮 - 左侧独立显示（非聊天模式） -->
            <el-button v-if="showHistoryButton && !isChatMode" class="ai-func-btn chat-history-btn history-left-btn"
                circle @click="$emit('toggle-chat-history')" :title="'展开聊天记录'">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor"
                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M8 9h8M8 13h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round" />
                </svg>
            </el-button>

            <!-- PC端聊天历史按钮 - 在输入区域左侧（聊天模式） -->
            <el-button v-if="showHistoryButton && isChatMode && !isMobileView"
                class="ai-func-btn chat-history-btn input-left-btn" circle @click="$emit('toggle-chat-history')"
                :title="'展开聊天记录'">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor"
                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M8 9h8M8 13h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round" />
                </svg>
            </el-button>

            <!-- 右侧功能按钮组 -->
            <div class="ai-buttons" :class="{ 'with-chat-history': showHistoryButton && isChatMode && isMobileView }">
                <!-- 聊天历史按钮 - 移动端左对齐（聊天模式） -->
                <el-button v-if="showHistoryButton && isChatMode && isMobileView" class="ai-func-btn chat-history-btn"
                    circle @click="$emit('toggle-chat-history')" :title="'展开聊天记录'">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M8 9h8M8 13h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" />
                    </svg>
                </el-button>

                <!-- 右侧按钮组（移动端聊天模式特殊布局） -->
                <div class="right-buttons" v-if="showHistoryButton && isChatMode && isMobileView">
                    <div class="voice-btn-container">
                        <el-button class="ai-func-btn voice-btn" :class="{ 'recording': isRecording }" circle
                            @click="$emit('voice-click')"
                            :title="isRecording ? `录音中 ${recordingDuration}s` : '点击开始语音输入'">
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
                    <el-button v-if="!showChatShortcuts && isLoggedIn && isChatMode"
                        class="ai-func-btn shortcuts-toggle-btn" circle @click="$emit('toggle-chat-shortcuts')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M12 5v14m-7-7h14" stroke="#888" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" />
                        </svg>
                    </el-button>
                    <el-button class="ai-send-btn" :class="{ 'generating': isGenerating }"
                        :type="isGenerating ? 'danger' : 'primary'" circle
                        @click="isGenerating ? $emit('stop-generation') : handleSendMessage()"
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

                <!-- 非移动端或无聊天历史按钮时的普通布局 -->
                <template v-if="!(showHistoryButton && isChatMode && isMobileView)">
                    <div class="voice-btn-container">
                        <el-button class="ai-func-btn voice-btn" :class="{ 'recording': isRecording }" circle
                            @click="$emit('voice-click')"
                            :title="isRecording ? `录音中 ${recordingDuration}s` : '点击开始语音输入'">
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
                    <el-button v-if="!showChatShortcuts && isLoggedIn && isChatMode"
                        class="ai-func-btn shortcuts-toggle-btn" circle @click="$emit('toggle-chat-shortcuts')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M12 5v14m-7-7h14" stroke="#888" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" />
                        </svg>
                    </el-button>
                    <el-button class="ai-send-btn" :class="{ 'generating': isGenerating }"
                        :type="isGenerating ? 'danger' : 'primary'" circle
                        @click="isGenerating ? $emit('stop-generation') : handleSendMessage()"
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
                </template>
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
            default: '如：分析比亚迪近期走势及投资价值，考虑新能源政策影响...'
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
        // 是否显示聊天快捷操作
        showChatShortcuts: {
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
        'stop-generation',
        'toggle-chat-shortcuts'
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

            // 非聊天模式下有历史记录按钮时
            if (this.showHistoryButton && !this.isChatMode) {
                classes.push('with-history');
            }

            // 聊天模式下PC端有左侧按钮时
            if (this.showHistoryButton && this.isChatMode && !this.isMobileView) {
                classes.push('with-left-btn');
            }

            return classes;
        }
    },
    methods: {
        handleSendMessage() {
            this.$emit('send-message');
        }
    }
};
</script>

<style scoped>
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
}

.ai-buttons-row {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-top: 8px;
}

/* 非聊天模式 - 历史记录按钮左对齐布局 */
.ai-buttons-row.with-history {
    justify-content: space-between;
}

/* 历史记录按钮左对齐样式 */
.history-left-btn {
    margin-right: auto;
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
@media (max-width: 768px) {

    /* 当有聊天历史按钮时的特殊布局 */
    .ai-buttons.with-chat-history {
        justify-content: space-between;
        width: 100%;
    }

    /* 聊天历史按钮左对齐 */
    .ai-buttons .chat-history-btn {
        margin-right: auto;
    }

    /* 右侧按钮组容器 */
    .ai-buttons.with-chat-history .right-buttons {
        display: flex;
        gap: 8px;
        align-items: center;
        padding-top: 10px;
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
@media (max-width: 768px) {
    .ai-card {
        margin: 0 !important;
        padding-top: 12px !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
        padding-bottom: 20px !important;
        border-radius: 0 !important;
        width: 100% !important;
        box-sizing: border-box !important;
    }

    .ai-input-row {
        padding: 0 12px !important;
        /* 减少左右padding */
    }

    .ai-buttons-row {
        padding: 6px 12px !important;
        /* 减少左右padding */
    }

    /* 移动端按钮尺寸优化 */
    .ai-func-btn {
        width: 32px;
        height: 32px;
        min-width: 32px;
        min-height: 32px;
    }

    .ai-func-btn svg {
        width: 16px;
        height: 16px;
    }

    /* 微信环境下进一步减少边距 */
    :global(body.wechat-browser) .ai-input-row {
        padding: 0 8px !important;
        background: #fff !important;
    }

    :global(body.wechat-browser) .ai-buttons-row {
        padding: 6px 8px !important;
    }
}

/* 超小屏幕优化 */
@media (max-width: 480px) {
    .ai-card {
        padding: 12px 0 calc(env(safe-area-inset-bottom) + 12px) 0 !important;
        width: 100% !important;
        border-radius: 0 !important;
    }

    .ai-input-row {
        padding: 10px 16px !important;
    }

    .ai-func-btn {
        width: 30px;
        height: 30px;
        min-width: 30px;
        min-height: 30px;
    }

    .ai-func-btn svg {
        width: 14px;
        height: 14px;
    }
}
</style>
