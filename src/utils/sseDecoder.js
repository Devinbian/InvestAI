/**
 * SSE数据解密工具函数
 * 处理服务端Base64加密的SSE数据
 */

/**
 * 正确的Base64解码函数，支持UTF-8字符
 * @param {string} base64String - Base64编码的字符串
 * @returns {string} 解码后的UTF-8字符串
 */
function decodeBase64UTF8(base64String) {
  try {
    // 使用atob解码Base64
    const binaryString = atob(base64String);

    // 将二进制字符串转换为字节数组
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // 使用TextDecoder将字节数组解码为UTF-8字符串
    const decoder = new TextDecoder("utf-8");
    return decoder.decode(bytes);
  } catch (error) {
    throw new Error(`Base64解码失败: ${error.message}`);
  }
}

/**
 * 检查字符串是否为有效的Base64编码
 * @param {string} str - 待检查的字符串
 * @returns {boolean} 是否为有效的Base64编码
 */
function isValidBase64(str) {
  if (!str || typeof str !== "string") {
    return false;
  }

  // Base64字符集：A-Z, a-z, 0-9, +, /, =
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;

  // 检查字符集
  if (!base64Regex.test(str)) {
    return false;
  }

  // 检查长度（Base64编码的长度必须是4的倍数）
  if (str.length % 4 !== 0) {
    return false;
  }

  return true;
}

/**
 * 统一的SSE数据处理函数
 * @param {string} rawData - 原始SSE数据
 * @param {string} context - 上下文标识（用于调试日志）
 * @returns {string} 处理后的数据
 */
export function processSSEData(rawData, context = "SSE") {
  let data = rawData;

  // 🔍 详细调试日志
  console.log(`🔍 ${context}-开始处理SSE数据:`, {
    原始数据: JSON.stringify(rawData),
    数据长度: rawData?.length || 0,
    数据类型: typeof rawData,
  });

  // 🔓 Base64解密处理
  try {
    // 检查是否为有效的Base64编码数据
    if (data && typeof data === "string" && data.length > 0) {
      // 首先检查是否为有效的Base64格式
      if (isValidBase64(data)) {
        console.log(`🔍 ${context}-检测到有效Base64格式，尝试解密...`);

        // 使用正确的UTF-8解码方法
        const decoded = decodeBase64UTF8(data);

        // 验证解码结果是否包含可读字符
        if (decoded && decoded.length > 0) {
          data = decoded;
          console.log(`🔓 ${context}-Base64解密成功:`, {
            原始数据: JSON.stringify(rawData),
            解密结果: JSON.stringify(data),
            解密前长度: rawData.length,
            解密后长度: data.length,
          });
        } else {
          console.log(`🔓 ${context}-Base64解密结果为空，使用原始数据`);
        }
      } else {
        console.log(`🔍 ${context}-不是有效的Base64格式，使用原始数据`);
      }
    } else {
      console.log(`🔍 ${context}-数据为空或格式无效，使用原始数据`);
    }
  } catch (error) {
    // 如果不是base64编码或解码失败，使用原始数据
    console.log(`🔓 ${context}-Base64解密失败，使用原始数据:`, error.message);
  }

  // ✅ Base64解密后的内容应该是完整且格式正确的，不需要额外的格式修复
  console.log(`🔍 ${context}-最终处理结果:`, {
    最终数据: JSON.stringify(data),
    最终长度: data?.length || 0,
  });

  return data;
}

// 🗑️ 不再需要复杂的格式修复函数
// Base64解密后的内容应该是完整且格式正确的
