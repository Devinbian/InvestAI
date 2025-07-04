import {
  riskOptions,
  experienceOptions,
  subSectors,
  userTraits,
} from "@/config/userPortrait";

/**
 * 获取风险偏好文本
 * @param {number|string} level - 风险等级（数值或字符串）
 * @returns {string} 风险偏好文本
 */
export const getRiskLevelText = (level) => {
  // 先尝试从配置中查找
  const option = riskOptions.find(
    (opt) => opt.riskLevel === level || opt.value === level,
  );

  if (option) {
    return option.title;
  }

  return "未设置";
};

/**
 * 获取投资经验文本
 * @param {number|string} experience - 投资经验（数值或字符串）
 * @returns {string} 投资经验文本
 */
export const getExperienceText = (experience) => {
  // 先尝试从配置中查找
  const option = experienceOptions.find(
    (opt) => opt.id === experience || opt.name === experience,
  );

  if (option) {
    return option.title;
  }

  return "未设置";
};

/**
 * 获取关注行业文本
 * @param {Array} focusIndustry - 关注行业数组
 * @returns {string} 关注行业文本
 */
export const getFocusIndustryText = (focusIndustry) => {
  const labels = [];
  focusIndustry = focusIndustry || [];

  focusIndustry.forEach((item) => {
    if (item.children && Array.isArray(item.children)) {
      item.children.forEach((child) => {
        if (child.label) labels.push(child.label);
      });
    }
  });

  return labels.length > 0 ? labels.join("、") : "未设置";
};

/**
 * 根据子行业value获取标签
 * @param {string} sectorValue - 子行业value
 * @returns {string} 子行业标签
 */
export const getSectorLabel = (sectorValue) => {
  const sector = subSectors.find((sub) => sub.value === sectorValue);
  return sector ? sector.label : sectorValue;
};

/**
 * 获取行业摘要文本
 * @param {Object} sectors - 行业选择对象
 * @returns {string} 行业摘要文本
 */
export const getSectorsSummary = (sectors) => {
  if (sectors && sectors.subCategories && sectors.subCategories.length > 0) {
    const names = sectors.subCategories.map((s) => getSectorLabel(s));
    return names.slice(0, 5).join("、") + (names.length > 5 ? "..." : "");
  }
  return "未选择";
};

/**
 * 获取用户特征描述
 * @param {string} traitId - 特征ID
 * @param {number} value - 特征值
 * @returns {string} 特征描述
 */
export const getTraitDescription = (traitId, value) => {
  const trait = userTraits.find((t) => t.id === traitId);
  if (!trait) return "";
  const option = trait.options.find((opt) => opt.value === value);
  if (!option) return "";

  // 返回具体描述，更友好易读
  return option.desc;
};

/**
 * 获取用户特征标题
 * @param {string} traitId - 特征ID
 * @returns {string} 特征标题
 */
export const getTraitTitle = (traitId) => {
  const trait = userTraits.find((t) => t.id === traitId);
  return trait ? trait.title : "";
};
