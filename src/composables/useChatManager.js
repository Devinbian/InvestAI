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

    // 添加空的AI消息占位符
    chatHistory.value.push({
      role: "assistant",
      content: "",
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
            ElMessage.error("连接中断，请重试");
          },
        },
      );
    } catch (err) {
      console.error("发送消息失败:", err);
      isGenerating.value = false;
      currentAbortController.value = null;

      // 移除失败的消息
      if (
        chatHistory.value.length > 0 &&
        chatHistory.value[chatHistory.value.length - 1].role === "assistant"
      ) {
        chatHistory.value.pop();
      }
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
      isGenerating.value = false;
      currentAbortController.value = null;
    }

    if (
      chatHistory.value.length > 0 &&
      chatHistory.value[chatHistory.value.length - 1].role === "assistant"
    ) {
      const lastMessage = chatHistory.value[chatHistory.value.length - 1];
      if (lastMessage.content) {
        // 保留已生成的内容
      } else {
        // 移除空消息
        chatHistory.value.pop();
      }
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
      const isMobile = window.innerWidth <= 768;

      nextTick(() => {
        if (isMobile) {
          // 移动端特殊处理
          const maxScrollTop =
            chatHistoryRef.value.scrollHeight -
            chatHistoryRef.value.clientHeight;
          chatHistoryRef.value.scrollTop = maxScrollTop;
        } else {
          chatHistoryRef.value.scrollTo({
            top: chatHistoryRef.value.scrollHeight,
            behavior: "smooth",
          });
        }

        setTimeout(() => {
          if (chatHistoryRef.value) {
            chatHistoryRef.value.scrollTop = chatHistoryRef.value.scrollHeight;
          }
        }, 100);

        setTimeout(() => {
          if (chatHistoryRef.value && isMobile) {
            const currentScrollTop = chatHistoryRef.value.scrollTop;
            const maxScrollTop =
              chatHistoryRef.value.scrollHeight -
              chatHistoryRef.value.clientHeight;
            if (currentScrollTop < maxScrollTop) {
              chatHistoryRef.value.scrollTop = maxScrollTop;
            }
          }
        }, 300);
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

  // 滚动处理
  let scrollTimer = null;
  const handleScroll = () => {
    if (chatHistoryRef.value) {
      // 添加滚动中的类名
      chatHistoryRef.value.classList.add("scrolling");

      // 清除之前的定时器
      if (scrollTimer) {
        clearTimeout(scrollTimer);
      }

      // 设置定时器，滚动停止后1.5秒隐藏滚动条
      scrollTimer = setTimeout(() => {
        if (chatHistoryRef.value) {
          chatHistoryRef.value.classList.remove("scrolling");
        }
      }, 1500);
    }
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
