import { ref, computed, onMounted, onUnmounted } from "vue";

/**
 * 响应式断点管理 Composable
 * 统一管理所有断点检测，避免重复代码
 */

// 断点配置 - 与SCSS保持一致
export const BREAKPOINTS = {
  "mobile-xs": 320,
  "mobile-sm": 375,
  mobile: 480,
  "mobile-lg": 640,
  "tablet-sm": 768,
  tablet: 1024,
  "tablet-lg": 1200,
  "desktop-sm": 1200,
  "desktop-md": 1300,
  desktop: 1400,
  "desktop-lg": 1600,
  "desktop-xl": 1920,
};

// 全局状态 - 单例模式，避免重复监听
let globalBreakpointState = null;
let globalListeners = new Set();
let resizeObserver = null;

/**
 * 创建全局断点状态
 */
function createGlobalBreakpointState() {
  const currentWidth = ref(window.innerWidth);
  const currentHeight = ref(window.innerHeight);

  // 基础断点检测
  const breakpointStates = computed(() => {
    const width = currentWidth.value;
    return {
      isMobileXs: width <= BREAKPOINTS["mobile-xs"],
      isMobileSm: width <= BREAKPOINTS["mobile-sm"],
      isMobile: width <= BREAKPOINTS["mobile"],
      isMobileLg: width <= BREAKPOINTS["mobile-lg"],
      isTabletSm: width <= BREAKPOINTS["tablet-sm"],
      isTablet: width <= BREAKPOINTS["tablet"],
      isTabletLg: width <= BREAKPOINTS["tablet-lg"],
      isDesktopSm: width >= BREAKPOINTS["desktop-sm"],
      isDesktopMd: width >= BREAKPOINTS["desktop-md"],
      isDesktop: width >= BREAKPOINTS["desktop"],
      isDesktopLg: width >= BREAKPOINTS["desktop-lg"],
      isDesktopXl: width >= BREAKPOINTS["desktop-xl"],
    };
  });

  // 设备类型检测
  const deviceType = computed(() => {
    const width = currentWidth.value;
    if (width <= BREAKPOINTS["tablet-sm"]) return "mobile";
    if (width <= BREAKPOINTS["desktop"]) return "tablet";
    return "desktop";
  });

  // 常用检测
  const isMobileView = computed(
    () => currentWidth.value <= BREAKPOINTS["tablet-sm"],
  );
  const isTabletView = computed(
    () =>
      currentWidth.value > BREAKPOINTS["tablet-sm"] &&
      currentWidth.value <= BREAKPOINTS["desktop"],
  );
  const isDesktopView = computed(
    () => currentWidth.value > BREAKPOINTS["desktop"],
  );

  // 屏幕方向检测
  const isPortrait = computed(() => currentHeight.value > currentWidth.value);
  const isLandscape = computed(() => currentWidth.value > currentHeight.value);

  // 触摸设备检测
  const isTouchDevice = computed(() => {
    return "ontouchstart" in window || navigator.maxTouchPoints > 0;
  });

  // 更新尺寸
  const updateDimensions = () => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;

    if (currentWidth.value !== newWidth || currentHeight.value !== newHeight) {
      currentWidth.value = newWidth;
      currentHeight.value = newHeight;

      // 通知所有监听器
      globalListeners.forEach((callback) =>
        callback({
          width: newWidth,
          height: newHeight,
          deviceType: deviceType.value,
          isMobileView: isMobileView.value,
        }),
      );
    }
  };

  return {
    currentWidth,
    currentHeight,
    breakpointStates,
    deviceType,
    isMobileView,
    isTabletView,
    isDesktopView,
    isPortrait,
    isLandscape,
    isTouchDevice,
    updateDimensions,
  };
}

/**
 * 设置全局监听器
 */
function setupGlobalListeners() {
  if (typeof window === "undefined") return;

  // 防抖处理
  let timeoutId = null;
  const debouncedUpdate = () => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      globalBreakpointState.updateDimensions();
    }, 16); // 约60fps
  };

  // 窗口大小变化监听
  window.addEventListener("resize", debouncedUpdate, { passive: true });

  // 屏幕方向变化监听
  if (screen.orientation) {
    screen.orientation.addEventListener("change", debouncedUpdate);
  } else {
    window.addEventListener("orientationchange", debouncedUpdate);
  }

  // 清理函数
  return () => {
    window.removeEventListener("resize", debouncedUpdate);
    if (screen.orientation) {
      screen.orientation.removeEventListener("change", debouncedUpdate);
    } else {
      window.removeEventListener("orientationchange", debouncedUpdate);
    }
    if (timeoutId) clearTimeout(timeoutId);
  };
}

/**
 * 响应式断点 Composable
 */
export function useResponsiveBreakpoints() {
  // 初始化全局状态（单例）
  if (!globalBreakpointState && typeof window !== "undefined") {
    globalBreakpointState = createGlobalBreakpointState();
    setupGlobalListeners();
  }

  // 如果是服务端渲染，返回默认值
  if (!globalBreakpointState) {
    return {
      currentWidth: ref(1920),
      currentHeight: ref(1080),
      breakpointStates: ref({}),
      deviceType: ref("desktop"),
      isMobileView: ref(false),
      isTabletView: ref(false),
      isDesktopView: ref(true),
      isPortrait: ref(false),
      isLandscape: ref(true),
      isTouchDevice: ref(false),
      addBreakpointListener: () => {},
      removeBreakpointListener: () => {},
      checkBreakpoint: () => false,
      getBreakpointValue: () => 0,
    };
  }

  // 添加断点变化监听器
  const addBreakpointListener = (callback) => {
    globalListeners.add(callback);
  };

  // 移除断点变化监听器
  const removeBreakpointListener = (callback) => {
    globalListeners.delete(callback);
  };

  // 检查特定断点
  const checkBreakpoint = (breakpoint, operator = "max") => {
    const value = BREAKPOINTS[breakpoint];
    if (!value) {
      console.warn(`断点 ${breakpoint} 不存在`);
      return false;
    }

    const currentWidth = globalBreakpointState.currentWidth.value;
    return operator === "max" ? currentWidth <= value : currentWidth >= value;
  };

  // 获取断点值
  const getBreakpointValue = (breakpoint) => {
    return BREAKPOINTS[breakpoint] || 0;
  };

  // 组件卸载时清理
  onUnmounted(() => {
    // 注意：不清理全局状态，因为可能有其他组件在使用
  });

  return {
    // 响应式状态
    currentWidth: globalBreakpointState.currentWidth,
    currentHeight: globalBreakpointState.currentHeight,
    breakpointStates: globalBreakpointState.breakpointStates,
    deviceType: globalBreakpointState.deviceType,
    isMobileView: globalBreakpointState.isMobileView,
    isTabletView: globalBreakpointState.isTabletView,
    isDesktopView: globalBreakpointState.isDesktopView,
    isPortrait: globalBreakpointState.isPortrait,
    isLandscape: globalBreakpointState.isLandscape,
    isTouchDevice: globalBreakpointState.isTouchDevice,

    // 方法
    addBreakpointListener,
    removeBreakpointListener,
    checkBreakpoint,
    getBreakpointValue,
  };
}

/**
 * 简化版移动端检测 Composable
 * 为了向后兼容，保留原有的简单接口
 */
export function useMobileDetection() {
  const { isMobileView, deviceType, isTouchDevice } =
    useResponsiveBreakpoints();

  return {
    isMobileView,
    deviceType,
    isTouchDevice,
  };
}
