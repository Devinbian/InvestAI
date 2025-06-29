import { ref } from "vue";
import { useResponsiveBreakpoints } from "./useResponsiveBreakpoints";

/**
 * 移动端菜单管理 Composable
 * 专门处理移动端的菜单交互、侧边栏管理等
 */
export function useMobileMenu() {
  const { isMobileView } = useResponsiveBreakpoints();

  // 状态管理
  const showMobileMenu = ref(false);

  /**
   * 显示移动端用户菜单
   */
  const showMobileUserMenu = () => {
    if (!isMobileView.value) return;
    showMobileMenu.value = true;
    console.log("显示移动端用户菜单");
  };

  /**
   * 隐藏移动端用户菜单
   */
  const hideMobileUserMenu = () => {
    showMobileMenu.value = false;
    console.log("隐藏移动端用户菜单");
  };

  /**
   * 处理移动端菜单命令
   */
  const handleMobileCommand = async (command, handleCommand) => {
    if (!isMobileView.value) return;

    // 先关闭菜单
    hideMobileUserMenu();

    // 稍作延迟，让关闭动画完成
    setTimeout(() => {
      if (handleCommand) {
        handleCommand(command);
      }
    }, 200);
  };

  /**
   * 切换移动端侧边栏
   */
  const toggleMobileSidebar = (sidebarRef) => {
    if (!isMobileView.value) return;

    console.log("toggleMobileSidebar被调用", {
      sidebarRef: sidebarRef?.value,
      isMobileView: isMobileView.value,
    });

    // 由于调用前已经进行了双重检查，这里直接调用即可
    if (
      sidebarRef?.value &&
      typeof sidebarRef.value.toggleSidebar === "function"
    ) {
      sidebarRef.value.toggleSidebar();
    } else {
      console.warn("侧边栏引用无效或方法不存在");
    }
  };

  return {
    // 状态
    showMobileMenu,

    // 方法
    showMobileUserMenu,
    hideMobileUserMenu,
    handleMobileCommand,
    toggleMobileSidebar,
  };
}
