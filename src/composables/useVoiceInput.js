import { ref } from "vue";
import { ElMessage } from "element-plus";

export function useVoiceInput() {
  // 语音相关状态
  const isRecording = ref(false);
  const recognition = ref(null);
  const voiceTimer = ref(null);
  const recordingDuration = ref(0);
  const wxVoiceLocalId = ref("");
  const isWxVoiceSupported = ref(false);
  const isWechatEnv = ref(false);

  // 检测是否为微信内置浏览器
  const isWechatBrowser = () => {
    const ua = navigator.userAgent.toLowerCase();
    return ua.includes("micromessenger");
  };

  // 初始化微信JS-SDK语音功能
  const initWechatVoice = () => {
    if (isWechatBrowser() && typeof wx !== "undefined") {
      try {
        wx.checkJsApi({
          jsApiList: ["startRecord", "stopRecord", "translateVoice"],
          success: function (res) {
            if (
              res.checkResult.startRecord &&
              res.checkResult.stopRecord &&
              res.checkResult.translateVoice
            ) {
              isWxVoiceSupported.value = true;
              console.log("微信语音识别功能可用");
            }
          },
        });
      } catch (error) {
        console.log("微信JS-SDK未配置或不可用");
      }
    }
  };

  // 开始录音计时
  const startRecordingTimer = () => {
    recordingDuration.value = 0;
    voiceTimer.value = setInterval(() => {
      recordingDuration.value++;

      // 15秒时提示用户
      if (recordingDuration.value === 15) {
        ElMessage.info("💡 继续说话，或点击麦克风按钮结束录音");
      }

      // 45秒时警告用户即将停止
      if (recordingDuration.value === 45) {
        ElMessage.warning("⏰ 录音即将结束，还有15秒");
      }

      // 最长录音60秒
      if (recordingDuration.value >= 60) {
        ElMessage.info("⏱️ 录音时间已达上限，自动停止");
        stopVoiceRecording();
      }
    }, 1000);
  };

  // 停止录音
  const stopRecording = () => {
    isRecording.value = false;
    if (voiceTimer.value) {
      clearInterval(voiceTimer.value);
      voiceTimer.value = null;
    }
    recordingDuration.value = 0;
  };

  // 微信开始录音
  const startWechatVoiceRecord = () => {
    if (!isWxVoiceSupported.value) {
      ElMessage.error("微信语音功能不可用，请确保在微信中打开并配置了JS-SDK");
      return;
    }

    wx.startRecord({
      success: function () {
        isRecording.value = true;
        startRecordingTimer();
        ElMessage.success("🎤 开始微信语音输入，请说话...");
      },
      cancel: function () {
        ElMessage.info("用户取消录音");
        stopRecording();
      },
    });
  };

  // 微信停止录音并识别
  const stopWechatVoiceRecord = (inputMessage) => {
    if (!isWxVoiceSupported.value) return;

    wx.stopRecord({
      success: function (res) {
        wxVoiceLocalId.value = res.localId;

        // 识别语音
        wx.translateVoice({
          localId: wxVoiceLocalId.value,
          isShowProgressTips: 1,
          success: function (res) {
            const result = res.translateResult;
            if (result && result.trim()) {
              // 更新输入框内容
              const currentValue = inputMessage.value.trim();
              if (currentValue) {
                inputMessage.value = currentValue + " " + result.trim();
              } else {
                inputMessage.value = result.trim();
              }
              ElMessage.success(
                `语音识别完成: "${result.substring(0, 20)}${result.length > 20 ? "..." : ""}"`,
              );
            } else {
              ElMessage.warning("未识别到语音内容，请重试");
            }
            stopRecording();
          },
          fail: function (res) {
            ElMessage.error("语音识别失败，请重试");
            stopRecording();
          },
        });
      },
      fail: function (res) {
        ElMessage.error("录音失败，请重试");
        stopRecording();
      },
    });
  };

  // 初始化语音识别
  const initSpeechRecognition = (inputMessage) => {
    // 微信内置浏览器不支持语音识别
    if (isWechatBrowser()) {
      console.log("微信内置浏览器不支持语音识别");
      return false;
    }

    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      try {
        const SpeechRecognition =
          window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition.value = new SpeechRecognition();

        // 配置语音识别参数
        recognition.value.continuous = true;
        recognition.value.interimResults = true;
        recognition.value.lang = "zh-CN";
        recognition.value.maxAlternatives = 1;

        // 识别结果处理
        recognition.value.onresult = (event) => {
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            }
          }

          // 更新输入框内容
          if (finalTranscript) {
            const cleanedText = finalTranscript.trim();
            const currentValue = inputMessage.value.trim();
            if (currentValue) {
              inputMessage.value = currentValue + " " + cleanedText;
            } else {
              inputMessage.value = cleanedText;
            }
          }
        };

        // 识别开始
        recognition.value.onstart = () => {
          console.log("语音识别开始");
          startRecordingTimer();
        };

        // 识别结束
        recognition.value.onend = () => {
          console.log("语音识别结束");
          stopRecording();
        };

        // 识别错误处理
        recognition.value.onerror = (event) => {
          console.error("语音识别错误:", event.error);
          let errorMessage = "语音识别失败";

          switch (event.error) {
            case "no-speech":
              errorMessage = "未检测到语音，请重新尝试";
              break;
            case "audio-capture":
              errorMessage = "无法访问麦克风，请检查权限设置";
              break;
            case "not-allowed":
              errorMessage = "麦克风权限被拒绝，请在浏览器设置中允许麦克风访问";
              break;
            case "network":
              errorMessage = "网络连接异常，请检查网络后重试";
              break;
            case "language-not-supported":
              errorMessage = "不支持中文语音识别";
              break;
          }

          ElMessage.error(errorMessage);
          stopRecording();
        };

        return true;
      } catch (error) {
        console.error("初始化语音识别失败:", error);
        return false;
      }
    }
    return false;
  };

  // 开始语音录音
  const startVoiceRecording = () => {
    // 微信浏览器优先使用微信语音功能
    if (isWechatBrowser()) {
      if (isWxVoiceSupported.value) {
        startWechatVoiceRecord();
      } else {
        console.log("微信环境：语音功能需要JS-SDK配置");
      }
      return;
    }

    if (!recognition.value) {
      ElMessage.error("您的浏览器不支持语音识别功能，建议使用Chrome浏览器");
      return;
    }

    try {
      isRecording.value = true;
      recognition.value.start();
      ElMessage.success("🎤 开始语音输入，请说话...");
    } catch (error) {
      console.error("启动语音识别失败:", error);
      ElMessage.error("启动语音识别失败，请重试");
      stopRecording();
    }
  };

  // 停止语音录音
  const stopVoiceRecording = (inputMessage) => {
    // 微信浏览器使用微信语音功能
    if (isWechatBrowser() && isWxVoiceSupported.value) {
      stopWechatVoiceRecord(inputMessage);
      return;
    }

    if (recognition.value && isRecording.value) {
      recognition.value.stop();
    }
    stopRecording();
  };

  // 语音点击处理
  const onVoiceClick = (inputMessage) => {
    console.log("语音按钮点击");

    // 微信环境特殊处理
    if (isWechatBrowser()) {
      ElMessage({
        message: "💬 微信语音功能需要JS-SDK配置，当前暂不可用",
        type: "warning",
        duration: 4000,
        showClose: true,
        dangerouslyUseHTMLString: false,
      });
      return;
    }

    if (isRecording.value) {
      stopVoiceRecording(inputMessage);
      ElMessage.info("🛑 语音输入已停止");
    } else {
      startVoiceRecording();
    }
  };

  // 初始化语音功能
  const initVoice = (inputMessage) => {
    isWechatEnv.value = isWechatBrowser();
    if (isWechatEnv.value) {
      initWechatVoice();
    } else {
      initSpeechRecognition(inputMessage);
    }
  };

  // 清理语音资源
  const cleanupVoice = () => {
    if (recognition.value && isRecording.value) {
      recognition.value.stop();
    }
    if (voiceTimer.value) {
      clearInterval(voiceTimer.value);
    }
    stopRecording();
  };

  return {
    // 状态
    isRecording,
    recordingDuration,
    isWechatEnv,

    // 方法
    onVoiceClick,
    initVoice,
    cleanupVoice,
    startVoiceRecording,
    stopVoiceRecording,
  };
}
