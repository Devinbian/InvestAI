import { ref, nextTick, onMounted, onUnmounted } from "vue";

/**
 * 移动端适配逻辑的composable
 * 包含移动端检测、布局修复、键盘处理、菜单管理等功能
 */
export function useMobileAdaptation() {
  // 响应式状态
  const isMobileView = ref(false);
  const currentOffset = ref(0);
  const isManualDebug = ref(false);
  const showMobileMenu = ref(false); // 控制移动端用户菜单显示

  // 设置动态视口高度CSS变量
  const setDynamicViewportHeight = () => {
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
  };

  // 检测移动端视图
  const checkMobileView = () => {
    const newIsMobileView = window.innerWidth <= 768;
    console.log("移动端检测:", {
      windowWidth: window.innerWidth,
      isMobileView: newIsMobileView,
      previousValue: isMobileView.value,
    });
    isMobileView.value = newIsMobileView;

    // 更新动态视口高度
    setDynamicViewportHeight();
  };

  // 移动端菜单管理
  const showMobileUserMenu = () => {
    showMobileMenu.value = true;
  };

  const hideMobileUserMenu = () => {
    showMobileMenu.value = false;
  };

  const handleMobileCommand = async (command, handleCommand) => {
    // 先关闭菜单
    hideMobileUserMenu();

    // 稍作延迟，让关闭动画完成
    setTimeout(() => {
      if (handleCommand) {
        handleCommand(command);
      }
    }, 200);
  };

  // 移动端侧边栏管理
  const toggleMobileSidebar = (sidebarRef) => {
    console.log("toggleMobileSidebar被调用", {
      sidebarRef: sidebarRef?.value,
      isMobileView: isMobileView.value,
    });

    // 由于调用前已经进行了双重检查，这里直接调用即可
    sidebarRef.value.toggleSidebar();
  };

  // 获取移动端智能荐股配置
  const getMobileSmartRecommendationConfig = (message, getStockListConfig) => {
    const config = getStockListConfig("smartRecommendation");
    return {
      ...config,
      // 移动端特定配置
      // 移除工具栏相关配置，让直接传递的属性生效
      showRecommendIndex: config.showRecommendIndex,
      showWatchlistStatus: config.showWatchlistStatus,
      showPositionStatus: config.showPositionStatus,
      showDetails: true, // 移动端统一使用showDetails
      showReason: config.showReason,
      actions: config.actions,
    };
  };

  // 调整内容位置以适应AI卡片偏移
  const adjustContentForOffset = (offset) => {
    // 查找主要内容区域
    const mainContent = document.querySelector(".main-content");
    const contentWrapper = document.querySelector(".content-wrapper");
    const stockSection = document.querySelector(".stock-section");
    const welcomeSection = document.querySelector(".welcome-section");

    // 为主要内容添加底部padding，避免被上移的AI卡片遮盖
    const paddingOffset = Math.min(offset, 80); // 限制最大padding为80px

    if (mainContent) {
      mainContent.style.setProperty(
        "padding-bottom",
        `${paddingOffset + 20}px`,
        "important",
      );
      mainContent.style.setProperty(
        "transition",
        "padding-bottom 0.3s ease",
        "important",
      );
      console.log(`调整主内容区域底部padding: ${paddingOffset + 20}px`);
    }

    if (contentWrapper) {
      contentWrapper.style.setProperty(
        "padding-bottom",
        `${paddingOffset + 15}px`,
        "important",
      );
      contentWrapper.style.setProperty(
        "transition",
        "padding-bottom 0.3s ease",
        "important",
      );
      console.log(`调整内容包装器底部padding: ${paddingOffset + 15}px`);
    }

    if (stockSection) {
      stockSection.style.setProperty(
        "margin-bottom",
        `${paddingOffset + 10}px`,
        "important",
      );
      stockSection.style.setProperty(
        "transition",
        "margin-bottom 0.3s ease",
        "important",
      );
      console.log(`调整股票区域底部margin: ${paddingOffset + 10}px`);
    }

    // 移动端特别调整welcome-section的底部间距，确保不会太紧
    if (welcomeSection && isMobileView.value) {
      const userAgent = navigator.userAgent.toLowerCase();
      const isWechat = userAgent.includes("micromessenger");

      if (isWechat) {
        // 微信环境下使用较小的间距
        const additionalMargin = Math.min(offset * 0.2, 15);
        welcomeSection.style.setProperty(
          "margin-bottom",
          `${25 + additionalMargin}px`,
          "important",
        );
        console.log(`微信端调整欢迎区域底部margin: ${25 + additionalMargin}px`);
      } else {
        // 浏览器环境下使用较大的间距，因为偏移量增加了
        const additionalMargin = Math.min(offset * 0.4, 50);
        welcomeSection.style.setProperty(
          "margin-bottom",
          `${70 + additionalMargin}px`,
          "important",
        );
        console.log(
          `浏览器端调整欢迎区域底部margin: ${70 + additionalMargin}px`,
        );
      }
      welcomeSection.style.setProperty(
        "transition",
        "margin-bottom 0.3s ease",
        "important",
      );
    }

    console.log("已禁用body padding调整，让CSS控制布局");
  };

  // 重置内容位置
  const resetContentPosition = () => {
    const mainContent = document.querySelector(".main-content");
    const contentWrapper = document.querySelector(".content-wrapper");
    const stockSection = document.querySelector(".stock-section");
    const welcomeSection = document.querySelector(".welcome-section");

    if (mainContent) {
      mainContent.style.removeProperty("padding-bottom");
    }
    if (contentWrapper) {
      contentWrapper.style.removeProperty("padding-bottom");
    }
    if (stockSection) {
      stockSection.style.removeProperty("margin-bottom");
    }
    if (welcomeSection) {
      welcomeSection.style.removeProperty("margin-bottom");
    }
    document.body.style.removeProperty("padding-bottom");
    // 强制清除任何可能的body底部间距
    document.body.style.setProperty("padding-bottom", "0", "important");
    document.body.style.setProperty("margin-bottom", "0", "important");

    console.log("已重置所有内容位置并强制清除body底部间距");
  };

  // 确保移动端修复正确应用
  const ensureMobileFixApplied = (isChatMode = false) => {
    if (!isMobileView.value || isChatMode) return;

    // 如果在手动调试模式，跳过自动修复
    if (isManualDebug.value) {
      console.log("手动调试模式，跳过ensureMobileFixApplied");
      return;
    }

    const userAgent = navigator.userAgent.toLowerCase();
    const isWechat = userAgent.includes("micromessenger");
    const isIOS = userAgent.includes("iphone") || userAgent.includes("ipad");
    const isAndroid = userAgent.includes("android");
    const isChrome =
      userAgent.includes("chrome") || userAgent.includes("crios");
    const isSafari =
      userAgent.includes("safari") &&
      !userAgent.includes("chrome") &&
      !userAgent.includes("crios");

    // 移除强制修复逻辑，不再应用偏移量
    const aiCard = document.querySelector(".ai-card");
    if (aiCard) {
      aiCard.style.removeProperty("transform");
      aiCard.style.removeProperty("transition");
      resetContentPosition();
      currentOffset.value = 0;
      console.log("已移除AI卡片偏移量设置");
    }

    console.log("移动端修复已禁用:", {
      isWechat,
      isIOS,
      isAndroid,
      isSafari,
      isChrome,
    });
  };

  // 移动端聊天框修复 - 使用visualViewport检测实际可视区域
  const fixMobileChatBox = (isChatMode = false) => {
    console.log("fixMobileChatBox被调用", {
      isMobileView: isMobileView.value,
      isChatMode: isChatMode,
      isManualDebug: isManualDebug.value,
    });

    // 如果在手动调试模式，跳过自动修复
    if (isManualDebug.value) {
      console.log("手动调试模式，跳过自动修复");
      return;
    }

    // 移动端下才进行修复（无论是否聊天模式）
    if (isMobileView.value) {
      nextTick(() => {
        const inputArea = document.querySelector(".input-area");
        const aiCard = document.querySelector(".ai-card");

        // 只有在聊天模式下有输入区域，或者主界面模式下有AI卡片时才执行
        if ((inputArea && isChatMode) || (aiCard && !isChatMode)) {
          let bottomOffset = 0;

          // 检测浏览器类型和版本，提供更精确的兼容性处理
          const userAgent = navigator.userAgent.toLowerCase();
          const isAndroid = userAgent.includes("android");
          const isIOS =
            userAgent.includes("iphone") || userAgent.includes("ipad");
          const isChrome =
            userAgent.includes("chrome") || userAgent.includes("crios");
          const isSafari =
            userAgent.includes("safari") &&
            !userAgent.includes("chrome") &&
            !userAgent.includes("crios");
          const isFirefox =
            userAgent.includes("firefox") || userAgent.includes("fxios");
          const isWechat = userAgent.includes("micromessenger");

          // 更新调试信息 - 浏览器类型
          let browserType = "";
          if (isWechat) browserType = "微信";
          else if (isIOS && isSafari) browserType = "iOS Safari";
          else if (isIOS && isChrome) browserType = "iOS Chrome";
          else if (isIOS) browserType = "iOS 其他";
          else if (isAndroid && isChrome) browserType = "Android Chrome";
          else if (isFirefox) browserType = "Firefox";
          else browserType = "其他浏览器";

          // 更精确的iOS Chrome检测
          const isIOSChrome =
            isIOS &&
            (userAgent.includes("crios") || userAgent.includes("chrome"));
          const isIOSSafari = isIOS && isSafari;

          // iOS设备的特殊处理：检测是否有底部安全区域
          const hasIOSBottomBar =
            isIOS &&
            (window.screen.height > window.innerHeight + 100 ||
              (window.CSS &&
                window.CSS.supports &&
                window.CSS.supports(
                  "padding-bottom",
                  "env(safe-area-inset-bottom)",
                )));

          // 使用visualViewport API检测实际可视区域
          if (window.visualViewport) {
            const visualHeight = window.visualViewport.height;
            const windowHeight = window.innerHeight;
            const screenHeight = window.screen.height;

            // 计算底部偏移量
            bottomOffset = Math.max(0, windowHeight - visualHeight);

            // 如果visualViewport检测不到偏移，使用更精确的经验值
            if (bottomOffset < 10) {
              const browserToolbarHeight = Math.max(
                0,
                screenHeight - windowHeight,
              );
              console.log("浏览器工具栏高度检测:", {
                browserToolbarHeight,
                screenHeight,
                windowHeight,
              });

              // iOS设备需要更大的偏移量来避免底部工具栏遮挡
              if (isIOS) {
                if (isSafari) {
                  bottomOffset = hasIOSBottomBar
                    ? Math.max(100, Math.min(browserToolbarHeight * 0.9, 140))
                    : Math.max(90, Math.min(browserToolbarHeight * 0.8, 120));
                } else if (isChrome) {
                  bottomOffset = hasIOSBottomBar
                    ? Math.max(110, Math.min(browserToolbarHeight * 1.0, 150))
                    : Math.max(100, Math.min(browserToolbarHeight * 0.9, 130));
                } else {
                  bottomOffset = hasIOSBottomBar
                    ? Math.max(95, Math.min(browserToolbarHeight * 0.8, 125))
                    : Math.max(85, Math.min(browserToolbarHeight * 0.7, 110));
                }
              } else if (isAndroid && isChrome) {
                bottomOffset = Math.max(
                  70,
                  Math.min(browserToolbarHeight * 0.6, 90),
                );
              } else {
                bottomOffset = Math.max(
                  60,
                  Math.min(browserToolbarHeight * 0.5, 80),
                );
              }

              console.log("使用经验值偏移量:", bottomOffset);
            }

            console.log("VisualViewport检测:", {
              visualHeight,
              windowHeight,
              screenHeight,
              bottomOffset,
              browserToolbarHeight: screenHeight - windowHeight,
              browser: {
                isAndroid,
                isIOS,
                isChrome,
                isSafari,
                isFirefox,
                isWechat,
                isIOSChrome,
                isIOSSafari,
              },
              userAgent: navigator.userAgent,
            });
          } else {
            // 降级方案：根据浏览器类型提供不同的处理
            const screenHeight = window.screen.height;
            const windowHeight = window.innerHeight;
            const browserToolbarHeight = screenHeight - windowHeight;

            if (isWechat) {
              bottomOffset = Math.min(
                20,
                Math.max(0, browserToolbarHeight * 0.2),
              );
            } else if (isIOS) {
              if (isSafari) {
                bottomOffset = Math.max(
                  90,
                  Math.min(browserToolbarHeight * 0.8, 120),
                );
              } else if (isChrome) {
                bottomOffset = Math.max(
                  100,
                  Math.min(browserToolbarHeight * 0.9, 130),
                );
              } else {
                bottomOffset = Math.max(
                  85,
                  Math.min(browserToolbarHeight * 0.7, 110),
                );
              }
            } else if (isAndroid && isChrome) {
              bottomOffset = Math.max(
                70,
                Math.min(browserToolbarHeight * 0.6, 90),
              );
            } else if (isFirefox) {
              bottomOffset = Math.max(
                60,
                Math.min(browserToolbarHeight * 0.5, 80),
              );
            } else {
              bottomOffset = Math.max(
                50,
                Math.min(browserToolbarHeight * 0.5, 80),
              );
            }

            console.log("降级检测:", {
              screenHeight,
              windowHeight,
              browserToolbarHeight,
              bottomOffset,
              browser: {
                isAndroid,
                isIOS,
                isChrome,
                isSafari,
                isFirefox,
                isWechat,
                isIOSChrome,
                isIOSSafari,
              },
              userAgent: navigator.userAgent,
            });
          }

          // 计算最终偏移量
          let finalBottomOffset = bottomOffset;

          // 微信浏览器特殊处理：贴底显示
          if (isWechat) {
            finalBottomOffset = 0;
            console.log("微信浏览器检测，贴底显示:", finalBottomOffset);
          } else {
            // 设置最小偏移量，确保在非微信环境下都有一定的安全距离
            let minOffset;
            if (isIOS) {
              minOffset = isSafari ? 60 : isChrome ? 80 : 60;
            } else {
              minOffset = 30;
            }
            finalBottomOffset = Math.max(minOffset, finalBottomOffset);
          }

          // 聊天模式：清除动态样式，让CSS控制布局
          if (inputArea && isChatMode) {
            // 清除所有可能干扰CSS的动态样式
            inputArea.style.removeProperty("transform");
            inputArea.style.removeProperty("-webkit-transform");
            inputArea.style.removeProperty("bottom");
            inputArea.style.removeProperty("position");
            inputArea.style.removeProperty("margin-bottom");
            inputArea.style.removeProperty("padding-bottom");
            inputArea.style.removeProperty("top");
            inputArea.style.removeProperty("left");
            inputArea.style.removeProperty("right");

            console.log(
              `[聊天模式] 已清除所有动态样式，让CSS根据浏览器类型控制布局`,
            );
            currentOffset.value = 0;
          }

          // 主界面模式：确保AI卡片贴底显示，清除任何可能的动态样式
          if (aiCard && !isChatMode) {
            // 清除所有可能的动态样式，让CSS完全控制
            aiCard.style.removeProperty("transform");
            aiCard.style.removeProperty("-webkit-transform");
            aiCard.style.removeProperty("transition");
            aiCard.style.removeProperty("position");
            aiCard.style.removeProperty("bottom");
            aiCard.style.removeProperty("top");
            aiCard.style.removeProperty("left");
            aiCard.style.removeProperty("right");

            console.log(
              `[主界面模式] 已清除所有动态样式，让CSS控制AI卡片贴底显示`,
            );
            resetContentPosition();
            currentOffset.value = 0;
          }

          console.log(
            `浏览器信息: iOS=${isIOS}, Safari=${isSafari}, Chrome=${isChrome}, 微信=${isWechat}`,
          );
          console.log(`当前模式: ${isChatMode ? "聊天模式" : "主界面模式"}`);
          console.log(`元素检测: inputArea=${!!inputArea}, aiCard=${!!aiCard}`);
        }
      });
    }
  };

  // 重置移动端布局
  const resetMobileLayout = (
    isChatMode = false,
    scrollToTop = null,
    scrollToBottom = null,
    updateChatHistoryHeight = null,
  ) => {
    if (!isMobileView.value) return;

    console.log(
      "重置移动端布局，当前模式:",
      isChatMode ? "聊天模式" : "主页模式",
    );

    // 根据当前模式进行不同的处理
    if (isChatMode) {
      // 聊天模式：只处理input-area，不影响ai-card
      const inputArea = document.querySelector(".input-area");
      if (inputArea) {
        console.log("聊天模式：保持input-area样式，让CSS控制");
      }

      // 重新应用聊天模式的修复
      setTimeout(() => {
        fixMobileChatBox(isChatMode);
        if (updateChatHistoryHeight) {
          updateChatHistoryHeight();
        }
        console.log("聊天模式：重新应用输入框修复和高度更新");
      }, 50);
    } else {
      // 主页模式：处理ai-card，清理input-area
      const inputArea = document.querySelector(".input-area");
      const aiCard = document.querySelector(".ai-card");

      // 保持input-area样式
      if (inputArea) {
        console.log("主页模式：保持input-area样式，让CSS控制");
      }

      // 重置AI卡片样式，确保主页输入框正确显示
      if (aiCard) {
        // 清除聊天模式可能设置的所有样式
        aiCard.removeAttribute("style");
        aiCard.classList.remove("mobile-bottom-fixed");
        console.log("主页模式：清理ai-card聊天样式");
      }

      // 延迟重新应用主页的移动端修复
      setTimeout(() => {
        // 确保页面滚动到顶部
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });

        // 如果有滚动到顶部的回调，调用它
        if (scrollToTop) {
          scrollToTop();
        }

        // 重新应用主页的移动端修复
        ensureMobileFixApplied(isChatMode);
        console.log("主页模式：重新应用移动端修复");
      }, 50);
    }
  };

  // 简化的移动端虚拟键盘处理
  const handleMobileKeyboard = (scrollToBottom = null) => {
    if (!isMobileView.value) return;

    console.log("简化的虚拟键盘处理已启用");

    // 监听orientationchange
    const handleOrientationChange = () => {
      setTimeout(() => {
        // 屏幕旋转后滚动到底部
        if (scrollToBottom) {
          scrollToBottom();
        }
      }, 500);
    };

    window.addEventListener("orientationchange", handleOrientationChange);

    // 返回清理函数
    return () => {
      window.removeEventListener("orientationchange", handleOrientationChange);
    };
  };

  // 防抖函数
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

  // 设置移动端视口监听器
  const setupMobileViewportListeners = (scrollToBottom) => {
    const handleViewportChange = debounce(() => {
      if (isMobileView.value) {
        console.log("视口变化检测，重新调整移动端布局");
        setDynamicViewportHeight();
        fixMobileChatBox();
      }
    }, 150);

    // 监听visualViewport变化（现代浏览器）
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleViewportChange);
      window.visualViewport.addEventListener("scroll", handleViewportChange);
    }

    // 监听window resize作为备用方案
    const handleWindowResize = debounce(() => {
      if (isMobileView.value) {
        console.log("窗口尺寸变化检测，重新调整移动端布局");
        setDynamicViewportHeight();
        setTimeout(() => fixMobileChatBox(), 200);
      }
    }, 300);

    window.addEventListener("resize", handleWindowResize);

    // 监听屏幕方向变化
    const handleOrientationChange = () => {
      setTimeout(() => {
        if (isMobileView.value) {
          console.log("屏幕方向变化，重新调整移动端布局");
          fixMobileChatBox();
          if (scrollToBottom) {
            scrollToBottom();
          }
        }
      }, 500);
    };

    window.addEventListener("orientationchange", handleOrientationChange);

    // 监听焦点变化（可能触发虚拟键盘）
    const handleFocusChange = debounce(() => {
      if (isMobileView.value) {
        setTimeout(() => fixMobileChatBox(), 300);
      }
    }, 200);

    document.addEventListener("focusin", handleFocusChange);
    document.addEventListener("focusout", handleFocusChange);

    // 监听页面可见性变化（用户切换应用后回来）
    const handleVisibilityChange = () => {
      if (!document.hidden && isMobileView.value) {
        setTimeout(() => {
          console.log("页面重新可见，重新调整移动端布局");
          fixMobileChatBox();
        }, 500);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 监听页面聚焦（浏览器标签页切换）
    const handleFocus = () => {
      if (isMobileView.value) {
        setTimeout(() => {
          console.log("页面重新聚焦，重新调整移动端布局");
          fixMobileChatBox();
        }, 300);
      }
    };

    window.addEventListener("focus", handleFocus);

    // 返回清理函数
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener(
          "resize",
          handleViewportChange,
        );
        window.visualViewport.removeEventListener(
          "scroll",
          handleViewportChange,
        );
      }
      window.removeEventListener("resize", handleWindowResize);
      window.removeEventListener("orientationchange", handleOrientationChange);
      document.removeEventListener("focusin", handleFocusChange);
      document.removeEventListener("focusout", handleFocusChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  };

  // 初始化浏览器检测和样式设置
  const initializeMobileBrowserDetection = () => {
    // 强制清除body的底部间距，确保输入框能真正贴底
    document.body.style.setProperty("padding-bottom", "0", "important");
    document.body.style.setProperty("margin-bottom", "0", "important");
    console.log("页面初始化：强制清除body底部间距");

    // 检测浏览器类型并添加CSS类名，用于AI卡片的精确定位
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = userAgent.includes("iphone") || userAgent.includes("ipad");
    const isAndroid = userAgent.includes("android");
    const isChrome =
      userAgent.includes("chrome") || userAgent.includes("crios");
    const isSafari =
      userAgent.includes("safari") &&
      !userAgent.includes("chrome") &&
      !userAgent.includes("crios");

    if (isIOS && isSafari) {
      document.body.classList.add("ios-safari");
      console.log("检测到iOS Safari浏览器");
    } else if (isIOS && isChrome) {
      document.body.classList.add("ios-chrome");
      console.log("检测到iOS Chrome浏览器");
    } else if (isAndroid && isChrome) {
      document.body.classList.add("android-chrome");
      console.log("检测到Android Chrome浏览器");
    }
    console.log("浏览器检测完成:", { isIOS, isAndroid, isChrome, isSafari });
  };

  // 防止页面缩放
  const preventZoom = () => {
    // 防止双击缩放
    let lastTouchEnd = 0;
    const handleTouchEnd = (event) => {
      const now = new Date().getTime();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    };

    document.addEventListener("touchend", handleTouchEnd, false);

    // 防止手势缩放
    const handleGestureStart = (event) => event.preventDefault();
    const handleGestureChange = (event) => event.preventDefault();
    const handleGestureEnd = (event) => event.preventDefault();

    document.addEventListener("gesturestart", handleGestureStart);
    document.addEventListener("gesturechange", handleGestureChange);
    document.addEventListener("gestureend", handleGestureEnd);

    // 防止键盘快捷键缩放
    const handleKeyDown = (event) => {
      if (
        event.ctrlKey &&
        (event.keyCode === 61 ||
          event.keyCode === 107 ||
          event.keyCode === 173 ||
          event.keyCode === 109 ||
          event.keyCode === 187 ||
          event.keyCode === 189)
      ) {
        event.preventDefault();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // 防止鼠标滚轮缩放
    const handleWheel = (event) => {
      if (event.ctrlKey) {
        event.preventDefault();
      }
    };

    document.addEventListener("wheel", handleWheel, { passive: false });

    // 返回清理函数
    return () => {
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("gesturestart", handleGestureStart);
      document.removeEventListener("gesturechange", handleGestureChange);
      document.removeEventListener("gestureend", handleGestureEnd);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("wheel", handleWheel);
    };
  };

  return {
    // 响应式状态
    isMobileView,
    currentOffset,
    isManualDebug,
    showMobileMenu,

    // 核心功能函数
    setDynamicViewportHeight,
    checkMobileView,
    adjustContentForOffset,
    resetContentPosition,
    ensureMobileFixApplied,
    fixMobileChatBox,
    resetMobileLayout,
    handleMobileKeyboard,

    // 工具函数
    debounce,
    setupMobileViewportListeners,
    initializeMobileBrowserDetection,
    preventZoom,

    // 菜单管理函数
    showMobileUserMenu,
    hideMobileUserMenu,
    handleMobileCommand,

    // 侧边栏管理函数
    toggleMobileSidebar,

    // 智能荐股配置函数
    getMobileSmartRecommendationConfig,
  };
}
