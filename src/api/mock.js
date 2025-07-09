import Mock from "mockjs";
import { generateMessageId } from "@/utils/formatters";

// 模拟股票数据
const stockList = Mock.mock({
  "list|10": [
    {
      "code|600000-603999": 1,
      name: "@cword(2,4)",
      "price|10-100.2": 1,
      "change|0-10.2": 1,
      "changePercent|0-10.2": 1,
      industry:
        '@pick(["科技", "金融", "医疗健康", "消费", "能源", "房地产", "制造业", "农业"])',
      "pe|0-100.2": 1,
      "pb|0-10.2": 1,
      "marketCap|100000000-10000000000": 1,
    },
  ],
}).list;

// 模拟对话历史
const chatHistory = [
  {
    id: generateMessageId(),
    role: "assistant",
    content:
      "您好！我是您的智能投资助手。我可以帮您分析股票、提供投资建议，以及回答您的投资相关问题。请问有什么我可以帮您的吗？",
  },
];

// 模拟API响应
export const mockApi = {
  // 获取股票列表
  getStockList: () => {
    return Promise.resolve({
      code: 200,
      data: stockList,
      message: "success",
    });
  },

  // 获取对话历史
  getChatHistory: () => {
    return Promise.resolve({
      code: 200,
      data: chatHistory,
      message: "success",
    });
  },

  // 发送消息 - 简化版本，移除所有快捷操作按钮相关的mock数据
  sendMessage: (message) => {
    // 确保message是字符串类型
    if (typeof message !== "string") {
      if (message && typeof message === "object") {
        // 如果是对象，尝试获取content或title字段，或转换为JSON字符串
        message = message.content || message.title || JSON.stringify(message);
      } else {
        // 其他类型转换为字符串
        message = String(message || "");
      }
    }

    // 通用AI响应
    const responses = [
      "根据您的风险偏好和投资目标，我建议您可以关注以下股票。",
      "从技术面分析，该股票目前处于上升趋势，但需要注意风险控制。",
      "根据基本面分析，该公司的财务状况良好，具有长期投资价值。",
      "建议您关注该行业的龙头企业，它们通常具有更好的抗风险能力。",
      "从估值角度来看，目前该股票的PE处于历史低位，具有投资价值。",
      "感谢您的提问，我会根据市场情况为您提供专业的投资建议。",
      "投资需要谨慎，建议您分散投资，控制风险。",
      "根据当前市场环境，建议您关注具有长期增长潜力的优质股票。",
    ];

    const response = {
      id: generateMessageId(),
      role: "assistant",
      content: responses[Math.floor(Math.random() * responses.length)],
      hasStockInfo: false,
    };

    chatHistory.push(
      { id: generateMessageId(), role: "user", content: message },
      response,
    );

    return Promise.resolve({
      code: 200,
      data: response,
      message: "success",
    });
  },
};

// 模拟微信登录API
export const wechatLoginApi = {
  // 获取微信登录二维码
  getQRCode: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            qrCode:
              "https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=mock_ticket_" +
              Date.now(),
            ticket: "mock_ticket_" + Date.now(),
            expireTime: Date.now() + 5 * 60 * 1000, // 5分钟过期
          },
        });
      }, 500);
    });
  },

  // 检查扫码状态
  checkScanStatus: (ticket) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 模拟不同的扫码状态
        const random = Math.random();
        if (random < 0.3) {
          // 30% 概率还未扫码
          resolve({
            success: true,
            data: {
              status: "waiting",
              message: "等待扫码",
            },
          });
        } else if (random < 0.6) {
          // 30% 概率已扫码但未确认
          resolve({
            success: true,
            data: {
              status: "scanned",
              message: "已扫码，请在手机上确认登录",
            },
          });
        } else {
          // 40% 概率登录成功
          resolve({
            success: true,
            data: {
              status: "confirmed",
              message: "登录成功",
              userInfo: {
                openid: "wx_" + Date.now(),
                nickname: "微信用户" + Math.floor(Math.random() * 1000),
                avatar:
                  "https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTLL4JuXdK8rM8tO3dJKuKcuXiaBL7jb9h9ib9nz1CpweE8icQJ4EjHsjzHMrKKKfFSr6zrKx7gtKvCUA/132",
                unionid: "union_" + Date.now(),
              },
            },
          });
        }
      }, 1000);
    });
  },

  // 直接微信登录（移动端）
  mobileLogin: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            token: "wechat-token-" + Date.now(),
            userInfo: {
              openid: "wx_" + Date.now(),
              nickname: "微信用户" + Math.floor(Math.random() * 1000),
              avatar:
                "https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTLL4JuXdK8rM8tO3dJKuKcuXiaBL7jb9h9ib9nz1CpweE8icQJ4EjHsjzHMrKKKfFSr6zrKx7gtKvCUA/132",
              unionid: "union_" + Date.now(),
              loginType: "wechat",
            },
          },
        });
      }, 2000);
    });
  },
};
