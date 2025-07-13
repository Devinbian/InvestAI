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

  // 发送消息 - 支持资讯推送的特殊处理
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

    // 检查是否是资讯推送请求
    if (message.includes("资讯推送")) {
      const newsResponse = {
        id: generateMessageId(),
        role: "assistant",
        content: `以下是最新的财经资讯：
1. 安达集团厨房插件进入中国商飞机客户选项指南支达维研发的"羽享"厨房插件系列产品成功进入中国商飞客户选项指南，标志着其产品从国产化替代转型为OEM产品。
2. 绿景中国地产基金投资延期绿景中国地产公告，清盘呈请投资进一步延期至2025年8月4日。
3. 马来西亚易部长谈关税上调马来西亚贸易部长表示，不清楚为何关税税率从最初的24%上调，需询问美国贸易代表，并强调不能在国家主权问题上妥协。
4. 印度计划收回非法占用土地印度计划收回非法占用土地并启动防长宣布，计划在8月前收回300万公顷被非法占用的森林和土地。
5. 澳大利亚矿业受工行动澳大利亚矿业与能源工会表示，格伦科尔马兰地下矿因罢工行动停止工作。
6. 华能国际等投资成立新能源公司华能国际与华能水电共同投资成立华能（动脂）新能源有限公司，业务涵盖新能源技术开发等。
7. 山西开行首趟跨里海中欧班列山西开行首趟跨里海中欧班列，深化与欧洲及中亚平台贸易合作。
8. 广西中越班列发货量增长上半年广西始发中越班列发货量同比增长283%，汽车零配件等出口增长显著`,
        isNewsUpdate: true,
        hasInteractionButtons: false,
        interactionData: null,
        hasStockInfo: false,
      };

      chatHistory.push(
        { id: generateMessageId(), role: "user", content: message },
        newsResponse,
      );

      return Promise.resolve({
        code: 200,
        data: newsResponse,
        message: "success",
      });
    }

    // 通用AI响应 - 已移除随机响应，改为简单的确认响应
    const response = {
      id: generateMessageId(),
      role: "assistant",
      content: "正在为您分析相关内容...",
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
