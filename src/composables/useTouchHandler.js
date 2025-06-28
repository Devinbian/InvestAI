import { ref } from "vue";

/**
 * 移动端触摸处理 Composable
 * 统一处理触摸开始、移动、结束事件，区分点击和拖拽操作
 */
export function useTouchHandler() {
  // 触摸状态管理
  const touchState = ref({
    startX: 0,
    startY: 0,
    startTime: 0,
    isDragging: false,
    currentTarget: null,
  });

  // 触摸阈值配置
  const TOUCH_CONFIG = {
    DRAG_THRESHOLD: 10, // 拖拽距离阈值（像素）
    TAP_TIME_THRESHOLD: 300, // 点击时间阈值（毫秒）
    MOBILE_BREAKPOINT: 768, // 移动端断点
  };

  /**
   * 处理触摸开始事件
   * @param {Object} target - 触摸目标对象
   * @param {TouchEvent} event - 触摸事件
   */
  const handleTouchStart = (target, event) => {
    // 只在移动端处理
    if (window.innerWidth <= TOUCH_CONFIG.MOBILE_BREAKPOINT) {
      const touch = event.touches[0];
      touchState.value = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
        isDragging: false,
        currentTarget: target,
      };
    }
  };

  /**
   * 处理触摸移动事件
   * @param {TouchEvent} event - 触摸事件
   */
  const handleTouchMove = (event) => {
    // 只在移动端且有触摸目标时处理
    if (
      window.innerWidth <= TOUCH_CONFIG.MOBILE_BREAKPOINT &&
      touchState.value.currentTarget
    ) {
      const touch = event.touches[0];
      const deltaX = Math.abs(touch.clientX - touchState.value.startX);
      const deltaY = Math.abs(touch.clientY - touchState.value.startY);

      // 如果移动距离超过阈值，则认为是拖拽操作
      if (
        deltaX > TOUCH_CONFIG.DRAG_THRESHOLD ||
        deltaY > TOUCH_CONFIG.DRAG_THRESHOLD
      ) {
        touchState.value.isDragging = true;
      }
    }
  };

  /**
   * 处理触摸结束事件
   * @param {TouchEvent} event - 触摸事件
   * @param {Function} onTap - 点击回调函数
   * @param {Function} onDrag - 拖拽回调函数（可选）
   * @returns {boolean} 是否为点击操作
   */
  const handleTouchEnd = (event, onTap, onDrag = null) => {
    // 只在移动端且有触摸目标时处理
    if (
      window.innerWidth <= TOUCH_CONFIG.MOBILE_BREAKPOINT &&
      touchState.value.currentTarget
    ) {
      const currentTime = Date.now();
      const timeDiff = currentTime - touchState.value.startTime;
      const target = touchState.value.currentTarget;

      let isTap = false;

      // 判断是短时间的触摸且没有拖拽，则认为是点击
      if (
        timeDiff < TOUCH_CONFIG.TAP_TIME_THRESHOLD &&
        !touchState.value.isDragging
      ) {
        isTap = true;
        if (onTap && typeof onTap === "function") {
          onTap(target);
        }
      } else if (
        touchState.value.isDragging &&
        onDrag &&
        typeof onDrag === "function"
      ) {
        // 处理拖拽结束
        onDrag(target, touchState.value);
      }

      // 重置触摸状态
      resetTouchState();

      return isTap;
    }

    return false;
  };

  /**
   * 重置触摸状态
   */
  const resetTouchState = () => {
    touchState.value = {
      startX: 0,
      startY: 0,
      startTime: 0,
      isDragging: false,
      currentTarget: null,
    };
  };

  /**
   * 检查是否为移动端
   * @returns {boolean}
   */
  const isMobile = () => {
    return window.innerWidth <= TOUCH_CONFIG.MOBILE_BREAKPOINT;
  };

  /**
   * 处理桌面端点击事件
   * @param {Object} target - 点击目标
   * @param {Function} onClick - 点击回调函数
   */
  const handleClick = (target, onClick) => {
    if (!isMobile() && onClick && typeof onClick === "function") {
      onClick(target);
    }
  };

  return {
    touchState,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleClick,
    resetTouchState,
    isMobile,
    TOUCH_CONFIG,
  };
}
