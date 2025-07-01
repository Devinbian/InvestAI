import { ref, nextTick } from "vue";
import { ElMessage } from "element-plus";
import { useChatHistoryStore } from "../store/chatHistory";
import { authFetchEventSource } from "@/utils/request";
import { api } from "@/api/api";

export function useChatManager() {
  const chatHistoryStore = useChatHistoryStore();

  // 聊天相关状态
  const chatHistory = ref([]);
  const chatHistoryRef = ref(null);
  const isChatMode = ref(false);
  const isGenerating = ref(false);
  const currentAbortController = ref(null);
  const inputMessage = ref("");

  // 发送消息
  const sendMessage = async (
    userStore,
    isMobileView,
    mobileAdaptation,
    scrollToBottom,
  ) => {
    const message = inputMessage.value.trim();
    if (!message || isGenerating.value) return;

    // 添加用户消息到聊天历史
    chatHistory.value.push({
      role: "user",
      content: message,
      timestamp: Date.now(),
    });

    // 清空输入框并进入聊天模式
    inputMessage.value = "";
    isChatMode.value = true;

    // 创建新的聊天会话（如果需要）
    let conversationId = chatHistoryStore.currentChatId;
    if (!chatHistoryStore.currentChatId) {
      conversationId = await chatHistoryStore.createNewChat();
    }

    // 添加空的AI消息占位符，使用isGenerating标志
    chatHistory.value.push({
      role: "assistant",
      content: "",
      isGenerating: true,
      timestamp: Date.now(),
    });

    isGenerating.value = true;
    currentAbortController.value = new AbortController();

    try {
      // 调用流式API
      await authFetchEventSource(
        `${api.devPrefix}${api.chatStreamApi}?conversationId=${conversationId}&userInput=${encodeURIComponent(message)}`,
        {
          method: "GET",
          headers: {
            Accept: "text/event-stream",
            "Cache-Control": "no-cache",
          },
          signal: currentAbortController.value.signal,
          onopen: async (response) => {
            console.log("流式连接已建立");
          },
          onmessage: (event) => {
            try {
              const data = event.data;

              if (data.trim().length === 0) {
                return;
              }

              // 更新AI消息内容
              const lastMessage =
                chatHistory.value[chatHistory.value.length - 1];
              if (lastMessage && lastMessage.role === "assistant") {
                lastMessage.content += data;
                lastMessage.isGenerating = false; // 开始接收内容时取消生成状态

                // 滚动到底部
                requestAnimationFrame(() => {
                  scrollToBottom();
                });
              }
            } catch (err) {
              console.error("解析消息时出错:", err);
            }
          },
          onclose: () => {
            console.log("流式连接已关闭");
            isGenerating.value = false;
            currentAbortController.value = null;
          },
          onerror: (err) => {
            console.error("流式连接错误:", err);
            isGenerating.value = false;
            currentAbortController.value = null;

            // 更新最后一条AI消息，添加错误标识
            if (
              chatHistory.value.length > 0 &&
              chatHistory.value[chatHistory.value.length - 1].role ===
                "assistant"
            ) {
              const lastMessage =
                chatHistory.value[chatHistory.value.length - 1];
              if (lastMessage.content) {
                lastMessage.content += "\n\n[连接中断]";
              } else {
                lastMessage.content = "[连接中断]";
              }
              lastMessage.isGenerating = false; // 错误时取消生成状态
              // 触发响应式更新
              chatHistory.value = [...chatHistory.value];
            }

            ElMessage.error("连接中断，请重试");
          },
        },
      );
    } catch (err) {
      console.error("发送消息失败:", err);
      isGenerating.value = false;
      currentAbortController.value = null;

      // 更新最后一条AI消息，添加错误标识
      if (
        chatHistory.value.length > 0 &&
        chatHistory.value[chatHistory.value.length - 1].role === "assistant"
      ) {
        const lastMessage = chatHistory.value[chatHistory.value.length - 1];
        if (lastMessage.content) {
          lastMessage.content += "\n\n[请求失败]";
        } else {
          lastMessage.content = "[请求失败]";
        }
        lastMessage.isGenerating = false; // 错误时取消生成状态
        // 触发响应式更新
        chatHistory.value = [...chatHistory.value];
      }

      ElMessage.error("发送消息失败，请重试");
    }

    // 移动端处理
    if (isMobileView.value) {
      setTimeout(() => {
        mobileAdaptation.fixMobileChatBox(isChatMode.value);
      }, 100);
    }
  };

  // 停止生成
  const stopGeneration = () => {
    if (currentAbortController.value) {
      currentAbortController.value.abort();
      currentAbortController.value = null;
    }

    // 无论是否有AbortController，只要isGenerating为true就可以停止
    if (isGenerating.value) {
      // 重置生成状态
      isGenerating.value = false;

      // 更新最后一条AI消息，添加停止标识
      if (
        chatHistory.value.length > 0 &&
        chatHistory.value[chatHistory.value.length - 1].role === "assistant"
      ) {
        const lastMessage = chatHistory.value[chatHistory.value.length - 1];
        if (lastMessage.content && lastMessage.content.trim() !== "") {
          // 如果已有内容，添加停止标识
          lastMessage.content += "\n\n[已停止生成]";
        } else {
          // 如果没有内容，设置停止标识
          lastMessage.content = "[已停止生成]";
        }
        lastMessage.isGenerating = false; // 停止时取消生成状态
        // 触发响应式更新
        chatHistory.value = [...chatHistory.value];
      }

      console.log("🛑 生成已停止");
    } else {
      console.log("🛑 当前没有正在进行的生成任务");
    }
  };

  // 创建新聊天
  const createNewChat = (isMobileView, mobileAdaptation, scrollToTop) => {
    chatHistory.value = [];
    inputMessage.value = "";
    isChatMode.value = false;
    chatHistoryStore.clearCurrentChat();

    // 确保移动端布局重置
    if (isMobileView.value) {
      nextTick(() => {
        setTimeout(() => {
          mobileAdaptation.resetMobileLayout(isChatMode.value, scrollToTop);
        }, 100);
      });
    }

    ElMessage.success("已创建新聊天");
  };

  // 滚动到底部
  const scrollToBottom = () => {
    if (chatHistoryRef.value) {
      nextTick(() => {
        // 使用CSS原生smooth滚动，性能更好
        chatHistoryRef.value.scrollTo({
          top: chatHistoryRef.value.scrollHeight,
          behavior: "smooth",
        });
      });
    }
  };

  // 滚动到顶部
  const scrollToTop = () => {
    if (chatHistoryRef.value) {
      chatHistoryRef.value.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  // 滚动处理 - 简化版本
  const handleScroll = () => {
    // 移除复杂的滚动处理逻辑，让浏览器原生处理滚动性能优化
    // 如果需要特殊处理，可以在这里添加简单的逻辑
  };

  // 更新聊天历史高度
  const updateChatHistoryHeight = () => {
    nextTick(() => {
      if (chatHistoryRef.value) {
        const windowHeight = window.innerHeight;
        const topNavHeight = 60; // TopNavbar高度
        const inputAreaHeight = 120; // 输入区域高度
        const availableHeight = windowHeight - topNavHeight - inputAreaHeight;

        chatHistoryRef.value.style.maxHeight = `${availableHeight}px`;
        console.log("聊天历史区域高度已更新:", availableHeight);
      }
    });
  };

  // 聊天历史相关操作
  const handleLoadChat = (chat) => {
    chatHistory.value = chat.messages || [];
    isChatMode.value = chatHistory.value.length > 0;
    chatHistoryStore.setCurrentChat(chat.id);

    nextTick(() => {
      scrollToBottom();
    });
  };

  const handleCreateNewChat = async () => {
    try {
      const chatId = await chatHistoryStore.createNewChat();
      createNewChat();
      console.log("新聊天创建成功:", chatId);
    } catch (error) {
      console.error("创建新聊天失败:", error);
      ElMessage.error("创建新聊天失败");
    }
  };

  const handleRenameChat = (chatId, newTitle) => {
    chatHistoryStore.renameChat(chatId, newTitle);
  };

  const handleDeleteChat = (chatId) => {
    chatHistoryStore.deleteChat(chatId);
    if (chatHistoryStore.currentChatId === chatId) {
      createNewChat();
    }
  };

  return {
    // 状态
    chatHistory,
    chatHistoryRef,
    isChatMode,
    isGenerating,
    inputMessage,

    // 方法
    sendMessage,
    stopGeneration,
    createNewChat,
    scrollToBottom,
    scrollToTop,
    handleScroll,
    updateChatHistoryHeight,
    handleLoadChat,
    handleCreateNewChat,
    handleRenameChat,
    handleDeleteChat,
  };
}
