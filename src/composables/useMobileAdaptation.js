import { ref, nextTick, onMounted, onUnmounted } from "vue";
import { useResponsiveBreakpoints } from "./useResponsiveBreakpoints";
import { useMobileLayout } from "./useMobileLayout";
import { useMobileMenu } from "./useMobileMenu";
import { timerManager } from "@/utils/performanceOptimizer";

/**
 * 移动端适配逻辑的composable（重构版）
 * 整合了响应式断点、布局管理、菜单管理等功能
 * 保持向后兼容性
 */
export function useMobileAdaptation() {
  // 使用新的模块化composables
  const breakpoints = useResponsiveBreakpoints();
  const layout = useMobileLayout();
  const menu = useMobileMenu();

  // 保持向后兼容的响应式状态
  const isManualDebug = ref(false);

  // 缓存和防抖相关状态
  const lastCheckTime = ref(0);
  const lastViewportSize = ref({ width: 0, height: 0 });
  const CHECK_DEBOUNCE_DELAY = 150;

  // 向后兼容的方法包装
  const setDynamicViewportHeight = layout.setDynamicViewportHeight;
  const showMobileUserMenu = menu.showMobileUserMenu;
  const hideMobileUserMenu = menu.hideMobileUserMenu;
  const handleMobileCommand = menu.handleMobileCommand;
  const toggleMobileSidebar = menu.toggleMobileSidebar;

  // 检测移动端视图（优化版本，避免重复调用）
  const checkMobileView = () => {
    const now = Date.now();
    const currentSize = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    // 防抖：如果距离上次检查时间过短，跳过
    if (now - lastCheckTime.value < CHECK_DEBOUNCE_DELAY) {
      return;
    }

    // 缓存：如果视口大小没有变化，跳过
    if (
      currentSize.width === lastViewportSize.value.width &&
      currentSize.height === lastViewportSize.value.height
    ) {
      return;
    }

    // 更新缓存
    lastCheckTime.value = now;
    lastViewportSize.value = currentSize;

    // 现在由useResponsiveBreakpoints自动处理
    console.log("移动端检测:", {
      windowWidth: breakpoints.currentWidth.value,
      isMobileView: breakpoints.isMobileView.value,
      deviceType: breakpoints.deviceType.value,
    });
  };

  // 获取移动端智能荐股配置
  const getMobileSmartRecommendationConfig = (message, getStockListConfig) => {
    const config = getStockListConfig("smartRecommendation");
    return {
      ...config,
      // 移动端特定配置
      showRecommendIndex: config.showRecommendIndex,
      showWatchlistStatus: config.showWatchlistStatus,
      showPositionStatus: config.showPositionStatus,
      showDetails: true, // 移动端统一使用showDetails
      showReason: config.showReason,
      actions: config.actions,
    };
  };

  // 向后兼容的布局方法包装
  const adjustContentForOffset = (offset) => {
    // 添加移动端检查
    if (!breakpoints.isMobileView.value) return;
    layout.adjustContentForOffset(offset);
  };

  const resetContentPosition = () => {
    layout.resetContentPosition();
  };

  // 确保移动端修复正确应用（优化版本）
  const ensureMobileFixApplied = (isChatMode = false) => {
    if (!breakpoints.isMobileView.value || isChatMode) return;

    if (isManualDebug.value) {
      console.log("手动调试模式，跳过ensureMobileFixApplied");
      return;
    }

    // 使用定时器管理器防抖
    timerManager.clear("mobile-fix-ensure");
    timerManager.create(
      "mobile-fix-ensure",
      () => {
        // 使用新的布局管理
        layout.resetContentPosition();
        console.log("移动端布局已重置");
      },
      50,
    );
  };

  // 移动端聊天框修复（优化版本，避免重复调用）
  const fixMobileChatBox = (isChatMode = false) => {
    console.log("fixMobileChatBox被调用", {
      isMobileView: breakpoints.isMobileView.value,
      isChatMode: isChatMode,
      isManualDebug: isManualDebug.value,
    });

    if (isManualDebug.value) {
      console.log("手动调试模式，跳过自动修复");
      return;
    }

    // 使用定时器管理器防抖
    timerManager.clear("mobile-chat-fix");
    timerManager.create(
      "mobile-chat-fix",
      () => {
        // 使用新的布局管理
        layout.fixMobileChatBox(isChatMode);
      },
      100,
    );
  };

  // 重置移动端布局（使用新的布局管理）
  const resetMobileLayout = (
    isChatMode = false,
    scrollToTop = null,
    scrollToBottom = null,
    updateChatHistoryHeight = null,
  ) => {
    console.log("resetMobileLayout被调用", {
      isMobileView: breakpoints.isMobileView.value,
      isChatMode,
    });

    if (!breakpoints.isMobileView.value) return;

    // 使用新的布局管理
    layout.resetMobileLayout(isChatMode);

    // 执行传入的回调函数
    if (scrollToTop) scrollToTop();
    if (scrollToBottom) scrollToBottom();
    if (updateChatHistoryHeight) updateChatHistoryHeight();
  };

  // 处理移动端键盘（简化版）
  const handleMobileKeyboard = (scrollToBottom = null) => {
    if (!breakpoints.isMobileView.value) return;

    console.log("处理移动端键盘");

    // 更新视口高度
    layout.setDynamicViewportHeight();

    // 执行回调
    if (scrollToBottom) {
      setTimeout(() => scrollToBottom(), 100);
    }
  };

  // 防抖函数（保持向后兼容）
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // 设置移动端视口监听器（简化版）
  const setupMobileViewportListeners = (scrollToBottom) => {
    if (!breakpoints.isMobileView.value) return;

    console.log("设置移动端视口监听器");

    // 监听断点变化
    const handleBreakpointChange = (data) => {
      console.log("断点变化:", data);
      if (scrollToBottom) scrollToBottom();
    };

    breakpoints.addBreakpointListener(handleBreakpointChange);

    // 返回清理函数
    return () => {
      breakpoints.removeBreakpointListener(handleBreakpointChange);
    };
  };

  // 初始化移动端浏览器检测（简化版）
  const initializeMobileBrowserDetection = () => {
    if (!breakpoints.isMobileView.value) return;

    console.log("初始化移动端浏览器检测", {
      deviceType: breakpoints.deviceType.value,
      isTouchDevice: breakpoints.isTouchDevice.value,
    });
  };

  // 防止缩放（使用新的布局管理）
  const preventZoom = () => {
    // 这个功能已经在useMobileLayout中实现
    console.log("防缩放功能已在useMobileLayout中处理");
  };

  // 组件挂载时初始化
  onMounted(() => {
    if (breakpoints.isMobileView.value) {
      initializeMobileBrowserDetection();
    }
  });

  // 返回向后兼容的API
  return {
    // 响应式状态（向后兼容）
    isMobileView: breakpoints.isMobileView,
    currentOffset: layout.currentOffset,
    isManualDebug,
    showMobileMenu: menu.showMobileMenu,

    // 方法（向后兼容）
    checkMobileView,
    setDynamicViewportHeight,
    showMobileUserMenu,
    hideMobileUserMenu,
    handleMobileCommand,
    toggleMobileSidebar,
    getMobileSmartRecommendationConfig,
    adjustContentForOffset,
    resetContentPosition,
    ensureMobileFixApplied,
    fixMobileChatBox,
    resetMobileLayout,
    handleMobileKeyboard,
    debounce,
    setupMobileViewportListeners,
    initializeMobileBrowserDetection,
    preventZoom,

    // 新增：暴露底层composables（可选使用）
    breakpoints,
    layout,
    menu,
  };
}
