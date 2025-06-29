import { ref, nextTick, onMounted, onUnmounted } from "vue";
import { useResponsiveBreakpoints } from "./useResponsiveBreakpoints";

/**
 * 移动端布局管理 Composable
 * 专门处理移动端的布局调整、键盘处理、视口管理等
 */
export function useMobileLayout() {
  const { isMobileView } = useResponsiveBreakpoints();

  // 状态管理
  const currentOffset = ref(0);
  const isKeyboardVisible = ref(false);
  const viewportHeight = ref(window.innerHeight);

  // 清理函数集合
  const cleanupFunctions = [];

  /**
   * 设置动态视口高度CSS变量
   */
  const setDynamicViewportHeight = () => {
    if (typeof window === "undefined") return;

    // 设置CSS变量以支持动态视口高度
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);

    // 如果支持visualViewport API，使用更精确的值
    if (window.visualViewport) {
      const visualVh = window.visualViewport.height * 0.01;
      document.documentElement.style.setProperty(
        "--visual-vh",
        `${visualVh}px`,
      );
    }

    viewportHeight.value = window.innerHeight;
  };

  /**
   * 调整内容位置以适应AI卡片偏移
   */
  const adjustContentForOffset = (offset) => {
    if (!isMobileView.value) return;

    // 查找主要内容区域
    const selectors = [
      ".main-content",
      ".content-wrapper",
      ".stock-section",
      ".welcome-section",
    ];

    const elements = selectors.map((selector) =>
      document.querySelector(selector),
    );
    const paddingOffset = Math.min(offset, 80); // 限制最大padding为80px

    elements.forEach((element, index) => {
      if (!element) return;

      const paddingValues = [
        paddingOffset + 20, // main-content
        paddingOffset + 15, // content-wrapper
        paddingOffset + 10, // stock-section
        0, // welcome-section (特殊处理)
      ];

      if (index < 3) {
        const property = index === 2 ? "margin-bottom" : "padding-bottom";
        element.style.setProperty(
          property,
          `${paddingValues[index]}px`,
          "important",
        );
        element.style.setProperty(
          "transition",
          `${property} 0.3s ease`,
          "important",
        );
      }
    });

    // 特殊处理welcome-section
    const welcomeSection = elements[3];
    if (welcomeSection) {
      const userAgent = navigator.userAgent.toLowerCase();
      const isWechat = userAgent.includes("micromessenger");

      const additionalMargin = isWechat
        ? Math.min(offset * 0.2, 15)
        : Math.min(offset * 0.4, 50);

      const baseMargin = isWechat ? 25 : 70;

      welcomeSection.style.setProperty(
        "margin-bottom",
        `${baseMargin + additionalMargin}px`,
        "important",
      );
      welcomeSection.style.setProperty(
        "transition",
        "margin-bottom 0.3s ease",
        "important",
      );
    }

    currentOffset.value = offset;
  };

  /**
   * 重置内容位置
   */
  const resetContentPosition = () => {
    const selectors = [
      ".main-content",
      ".content-wrapper",
      ".stock-section",
      ".welcome-section",
    ];

    selectors.forEach((selector) => {
      const element = document.querySelector(selector);
      if (element) {
        element.style.removeProperty("padding-bottom");
        element.style.removeProperty("margin-bottom");
      }
    });

    document.body.style.removeProperty("padding-bottom");
    currentOffset.value = 0;
  };

  /**
   * 移动端聊天框布局修复
   */
  const fixMobileChatBox = (isChatMode = false) => {
    if (!isMobileView.value) return;

    const inputArea = document.querySelector(".input-area");
    if (!inputArea) return;

    if (isChatMode) {
      // 聊天模式：确保输入框贴底
      inputArea.style.setProperty("position", "fixed", "important");
      inputArea.style.setProperty("bottom", "0", "important");
      inputArea.style.setProperty("left", "0", "important");
      inputArea.style.setProperty("right", "0", "important");
      inputArea.style.setProperty("z-index", "1000", "important");

      console.log("移动端聊天模式：输入框已固定到底部");
    } else {
      // 主页模式：让CSS控制布局
      const propertiesToRemove = [
        "position",
        "bottom",
        "left",
        "right",
        "z-index",
      ];
      propertiesToRemove.forEach((prop) => {
        inputArea.style.removeProperty(prop);
      });

      console.log("移动端主页模式：已移除输入框固定定位");
    }
  };

  /**
   * 键盘显示/隐藏处理
   */
  const handleKeyboardVisibility = () => {
    if (!isMobileView.value) return;

    let initialViewportHeight = window.innerHeight;
    let keyboardHeight = 0;

    const handleResize = () => {
      const currentViewportHeight = window.innerHeight;
      const heightDifference = initialViewportHeight - currentViewportHeight;

      // 判断键盘是否显示（高度变化超过150px认为是键盘）
      const keyboardVisible = heightDifference > 150;

      if (keyboardVisible !== isKeyboardVisible.value) {
        isKeyboardVisible.value = keyboardVisible;
        keyboardHeight = keyboardVisible ? heightDifference : 0;

        console.log("键盘状态变化:", {
          visible: keyboardVisible,
          height: keyboardHeight,
          viewportHeight: currentViewportHeight,
        });

        // 更新视口高度变量
        setDynamicViewportHeight();

        // 触发自定义事件
        window.dispatchEvent(
          new CustomEvent("keyboardToggle", {
            detail: { visible: keyboardVisible, height: keyboardHeight },
          }),
        );
      }
    };

    // 使用visualViewport API（更准确）
    if (window.visualViewport) {
      const handleVisualViewportChange = () => {
        const heightDifference =
          window.innerHeight - window.visualViewport.height;
        const keyboardVisible = heightDifference > 150;

        if (keyboardVisible !== isKeyboardVisible.value) {
          isKeyboardVisible.value = keyboardVisible;
          setDynamicViewportHeight();
        }
      };

      window.visualViewport.addEventListener(
        "resize",
        handleVisualViewportChange,
      );
      cleanupFunctions.push(() => {
        window.visualViewport.removeEventListener(
          "resize",
          handleVisualViewportChange,
        );
      });
    } else {
      // 降级到window resize
      window.addEventListener("resize", handleResize, { passive: true });
      cleanupFunctions.push(() => {
        window.removeEventListener("resize", handleResize);
      });
    }
  };

  /**
   * 防止页面缩放（移动端）
   */
  const preventZoom = () => {
    if (!isMobileView.value) return;

    // 防止双击缩放
    const handleTouchEnd = (event) => {
      const now = Date.now();
      if (now - (handleTouchEnd.lastTap || 0) < 300) {
        event.preventDefault();
      }
      handleTouchEnd.lastTap = now;
    };

    // 防止手势缩放
    const preventGesture = (event) => event.preventDefault();

    // 防止键盘快捷键缩放
    const handleKeyDown = (event) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        (event.key === "+" || event.key === "-" || event.key === "0")
      ) {
        event.preventDefault();
      }
    };

    // 防止滚轮缩放
    const handleWheel = (event) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
      }
    };

    // 添加事件监听器
    document.addEventListener("touchend", handleTouchEnd, { passive: false });
    document.addEventListener("gesturestart", preventGesture, {
      passive: false,
    });
    document.addEventListener("gesturechange", preventGesture, {
      passive: false,
    });
    document.addEventListener("gestureend", preventGesture, { passive: false });
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("wheel", handleWheel, { passive: false });

    // 添加清理函数
    cleanupFunctions.push(() => {
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("gesturestart", preventGesture);
      document.removeEventListener("gesturechange", preventGesture);
      document.removeEventListener("gestureend", preventGesture);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("wheel", handleWheel);
    });
  };

  /**
   * 重置移动端布局
   */
  const resetMobileLayout = (isChatMode = false) => {
    if (!isMobileView.value) return;

    console.log("重置移动端布局:", { isChatMode });

    // 重置内容位置
    resetContentPosition();

    // 修复聊天框布局
    fixMobileChatBox(isChatMode);

    // 更新视口高度
    setDynamicViewportHeight();
  };

  /**
   * 初始化移动端布局
   */
  const initMobileLayout = () => {
    if (!isMobileView.value) return;

    console.log("初始化移动端布局");

    // 设置初始视口高度
    setDynamicViewportHeight();

    // 设置键盘处理
    handleKeyboardVisibility();

    // 设置缩放防护
    preventZoom();
  };

  // 组件挂载时初始化
  onMounted(() => {
    if (isMobileView.value) {
      nextTick(() => {
        initMobileLayout();
      });
    }
  });

  // 组件卸载时清理
  onUnmounted(() => {
    cleanupFunctions.forEach((cleanup) => cleanup());
    cleanupFunctions.length = 0;
  });

  return {
    // 状态
    currentOffset,
    isKeyboardVisible,
    viewportHeight,

    // 方法
    setDynamicViewportHeight,
    adjustContentForOffset,
    resetContentPosition,
    fixMobileChatBox,
    resetMobileLayout,
    initMobileLayout,
  };
}
