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
    methods: {
        handleSendMessage() {
            this.$emit('send-message');
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
        padding: 0 16px !important;
        width: 100% !important;
        box-sizing: border-box !important;
        margin: 0 !important;
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

        /* 微信环境下键盘弹出时的特殊处理 */
        &:focus-within {
            padding: 4px 0 4px 0 !important;
        }

        border-radius: 0 !important;
        background: #fff !important;
        box-shadow: none !important;
        border-top: none !important;
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
        width: 100% !important;
        box-sizing: border-box !important;
        margin: 0 !important;
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

        /* 微信超小屏幕键盘弹出时的处理 */
        &:focus-within {
            padding: 3px 0 3px 0 !important;
        }
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
