import { defineStore } from "pinia";
import { createConversation } from "@/api/api";

export const useChatHistoryStore = defineStore("chatHistory", {
  state: () => ({
    chatHistoryList: JSON.parse(
      localStorage.getItem("chatHistoryList") || "[]",
    ),
    currentChatId: null,
    currentChatMessages: [],
  }),

  getters: {
    // 获取当前聊天记录
    getCurrentChat: (state) => {
      return state.chatHistoryList.find(
        (chat) => chat.id === state.currentChatId,
      );
    },

    // 按时间分组的聊天记录
    getTodayChats: (state) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return state.chatHistoryList.filter((chat) => {
        const chatDate = new Date(chat.lastMessage);
        chatDate.setHours(0, 0, 0, 0);
        return chatDate.getTime() === today.getTime();
      });
    },

    getYesterdayChats: (state) => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      return state.chatHistoryList.filter((chat) => {
        const chatDate = new Date(chat.lastMessage);
        chatDate.setHours(0, 0, 0, 0);
        return chatDate.getTime() === yesterday.getTime();
      });
    },

    getThisWeekChats: (state) => {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(23, 59, 59, 999);

      return state.chatHistoryList.filter((chat) => {
        const chatDate = new Date(chat.lastMessage);
        return chatDate >= weekStart && chatDate <= yesterday;
      });
    },

    getOlderChats: (state) => {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      weekStart.setHours(0, 0, 0, 0);

      return state.chatHistoryList.filter((chat) => {
        const chatDate = new Date(chat.lastMessage);
        return chatDate < weekStart;
      });
    },

    // 搜索聊天记录
    searchChats: (state) => (keyword) => {
      if (!keyword) return state.chatHistoryList;

      return state.chatHistoryList.filter(
        (chat) =>
          chat.title.toLowerCase().includes(keyword.toLowerCase()) ||
          chat.messages.some(
            (msg) =>
              msg.content &&
              msg.content.toLowerCase().includes(keyword.toLowerCase()),
          ),
      );
    },
  },

  actions: {
    // 保存到localStorage
    saveChatHistory() {
      localStorage.setItem(
        "chatHistoryList",
        JSON.stringify(this.chatHistoryList),
      );
    },

    // 生成聊天标题
    generateChatTitle(messages) {
      // 从第一条用户消息生成标题
      const firstUserMessage = messages.find((msg) => msg.role === "user");
      if (firstUserMessage && firstUserMessage.content) {
        let title = firstUserMessage.content.substring(0, 30);
        if (firstUserMessage.content.length > 30) {
          title += "...";
        }
        return title;
      }
      return "新对话";
    },

    // 创建新聊天
    async createNewChat(messages = []) {
      let chatId = await this.getConversationId();
      //let chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const title = this.generateChatTitle(messages);

      const newChat = {
        id: chatId,
        title,
        messages: [...messages],
        createdAt: Date.now(),
        lastMessage: Date.now(),
      };

      this.chatHistoryList.unshift(newChat);
      this.currentChatId = chatId;
      this.currentChatMessages = [...messages];
      this.saveChatHistory();

      return chatId;
    },

    // 获取会话ID
    async getConversationId() {
      let chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      try {
        const response = await createConversation();
        if (response && response.data && response.data.success) {
          chatId = response.data.data;
          console.log("获取会话ID成功:", chatId);
        }
      } catch (error) {}
      return chatId;
    },

    // 加载聊天记录
    loadChat(chatId) {
      const chat = this.chatHistoryList.find((c) => c.id === chatId);
      if (chat) {
        this.currentChatId = chatId;
        this.currentChatMessages = [...chat.messages];
        return chat.messages;
      }
      return [];
    },

    // 设置当前聊天
    setCurrentChat(chatId) {
      const chat = this.chatHistoryList.find((c) => c.id === chatId);
      if (chat) {
        this.currentChatId = chatId;
        this.currentChatMessages = [...chat.messages];
        console.log("设置当前聊天:", chatId, "消息数量:", chat.messages.length);
        return true;
      }
      console.warn("未找到聊天记录:", chatId);
      return false;
    },

    // 更新当前聊天消息
    updateCurrentChatMessages(messages) {
      this.currentChatMessages = [...messages];

      if (this.currentChatId) {
        const chatIndex = this.chatHistoryList.findIndex(
          (chat) => chat.id === this.currentChatId,
        );
        if (chatIndex > -1) {
          this.chatHistoryList[chatIndex].messages = [...messages];
          this.chatHistoryList[chatIndex].lastMessage = Date.now();

          // 如果是第一次添加消息，更新标题
          if (
            messages.length > 0 &&
            this.chatHistoryList[chatIndex].title === "新对话"
          ) {
            this.chatHistoryList[chatIndex].title =
              this.generateChatTitle(messages);
          }

          this.saveChatHistory();
        }
      }
    },

    // 添加消息到当前聊天
    addMessageToCurrentChat(message) {
      this.currentChatMessages.push(message);
      this.updateCurrentChatMessages(this.currentChatMessages);
    },

    // 重命名聊天
    renameChat(chatId, newTitle) {
      const chatIndex = this.chatHistoryList.findIndex(
        (chat) => chat.id === chatId,
      );
      if (chatIndex > -1) {
        this.chatHistoryList[chatIndex].title = newTitle;
        this.saveChatHistory();
        return true;
      }
      return false;
    },

    // 删除聊天
    deleteChat(chatId) {
      const chatIndex = this.chatHistoryList.findIndex(
        (chat) => chat.id === chatId,
      );
      if (chatIndex > -1) {
        this.chatHistoryList.splice(chatIndex, 1);

        // 如果删除的是当前聊天，清空当前状态
        if (this.currentChatId === chatId) {
          this.currentChatId = null;
          this.currentChatMessages = [];
        }

        this.saveChatHistory();
        return true;
      }
      return false;
    },

    // 清空当前聊天
    clearCurrentChat() {
      this.currentChatId = null;
      this.currentChatMessages = [];
    },

    // 获取聊天总数
    getChatCount() {
      return this.chatHistoryList.length;
    },

    // 清空所有聊天历史
    clearAllChats() {
      this.chatHistoryList = [];
      this.currentChatId = null;
      this.currentChatMessages = [];
      this.saveChatHistory();
    },

    // 导出聊天历史
    exportChatHistory() {
      return JSON.stringify(this.chatHistoryList, null, 2);
    },

    // 导入聊天历史
    importChatHistory(jsonData) {
      try {
        const importedChats = JSON.parse(jsonData);
        if (Array.isArray(importedChats)) {
          this.chatHistoryList = importedChats;
          this.saveChatHistory();
          return true;
        }
      } catch (error) {
        console.error("导入聊天历史失败:", error);
      }
      return false;
    },
  },
});
