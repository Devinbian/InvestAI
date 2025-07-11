<template>
    <div class="markdown-content" v-html="renderedContent"></div>
</template>

<script setup>
import { computed } from 'vue';
import { marked } from 'marked';
import hljs from 'highlight.js';
// 引入highlight.js的CSS样式
import 'highlight.js/styles/github.css';

const props = defineProps({
    content: {
        type: String,
        required: true
    }
});

// 配置marked
marked.setOptions({
    highlight: function (code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return hljs.highlight(code, { language: lang }).value;
            } catch (__) { }
        }
        return hljs.highlightAuto(code).value;
    },
    langPrefix: 'hljs language-',
    breaks: true,
    gfm: true,
    headerIds: false,
    mangle: false,
    // 新增空格保护策略
    baseText: (text) => text.replace(/^\u200B/g, ' ') // 还原零宽空格
});

// 简化的预处理函数
function preprocessContent(content) {
    if (!content) return '';

    // 只做基本的换行符统一，不需要复杂的格式修复
    // 因为服务端已经通过Base64加密确保了内容的完整性
    let processed = content
        .replace(/\r\n/g, '\n')  // 统一换行符
        .replace(/\r/g, '\n');   // 统一换行符

    return processed;
}

// 计算渲染后的内容
const renderedContent = computed(() => {
    if (!props.content) return '';

    try {
        const preprocessed = preprocessContent(props.content);
        return marked.parse(preprocessed);
    } catch (error) {
        console.error('Markdown解析错误:', error);
        // 解析失败时显示原始内容
        return `<pre class="raw-content">${props.content}</pre>`;
    }
});
</script>

<style scoped>
.markdown-content {
    line-height: 1.6;
    color: #333;
    word-wrap: break-word;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif;
    max-width: 100%;
}

/* 标题样式 */
.markdown-content :deep(h1) {
    font-size: 1.8em;
    font-weight: 700;
    color: #1a202c;
    margin: 24px 0 16px 0;
    padding-bottom: 12px;
    border-bottom: 3px solid #3182ce;
}

.markdown-content :deep(h2) {
    font-size: 1.5em;
    font-weight: 600;
    color: #2d3748;
    margin: 20px 0 12px 0;
    padding-bottom: 8px;
    border-bottom: 2px solid #e2e8f0;
}

.markdown-content :deep(h3) {
    font-size: 1.3em;
    font-weight: 600;
    color: #4a5568;
    margin: 16px 0 8px 0;
}

.markdown-content :deep(h4) {
    font-size: 1.2em;
    font-weight: 600;
    color: #4a5568;
    margin: 14px 0 6px 0;
}

.markdown-content :deep(h5) {
    font-size: 1.1em;
    font-weight: 600;
    color: #4a5568;
    margin: 12px 0 4px 0;
}

.markdown-content :deep(h6) {
    font-size: 1em;
    font-weight: 600;
    color: #4a5568;
    margin: 10px 0 4px 0;
}

/* 段落样式 */
.markdown-content :deep(p) {
    margin: 12px 0;
    line-height: 1.7;
    color: #2d3748;
    text-align: justify;
}

/* 强调样式 */
.markdown-content :deep(strong) {
    font-weight: 600;
    color: #1a202c;
}

.markdown-content :deep(em) {
    font-style: italic;
    color: #4a5568;
}

/* 代码样式 */
.markdown-content :deep(code) {
    background: #f1f5f9;
    padding: 2px 4px;
    border-radius: 3px;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 0.9em;
    color: #e53e3e;
}

.markdown-content :deep(pre) {
    background: #f8f9fa;
    padding: 16px;
    border-radius: 6px;
    overflow-x: auto;
    margin: 16px 0;
    border: 1px solid #e2e8f0;
}

.markdown-content :deep(pre code) {
    background: transparent;
    padding: 0;
    color: inherit;
    font-size: 0.9em;
}

/* 列表样式 */
.markdown-content :deep(ul),
.markdown-content :deep(ol) {
    margin: 16px 0;
    padding-left: 28px;
}

.markdown-content :deep(li) {
    margin: 8px 0;
    line-height: 1.6;
    color: #2d3748;
}

.markdown-content :deep(ul li) {
    list-style-type: disc;
}

.markdown-content :deep(ol li) {
    list-style-type: decimal;
}

/* 表格样式 */
.markdown-content :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    background: #fff;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.markdown-content :deep(th) {
    background: #f8f9fa;
    padding: 12px;
    text-align: left;
    font-weight: 600;
    color: #495057;
    border-bottom: 2px solid #dee2e6;
}

.markdown-content :deep(td) {
    padding: 12px;
    border-bottom: 1px solid #dee2e6;
    color: #495057;
}

.markdown-content :deep(tbody tr:nth-child(even)) {
    background: #f8f9fa;
}

.markdown-content :deep(tbody tr:hover) {
    background: #e9ecef;
}

/* 引用样式 */
.markdown-content :deep(blockquote) {
    margin: 16px 0;
    padding: 12px 16px;
    border-left: 4px solid #3182ce;
    background: #f7fafc;
    color: #4a5568;
}

.markdown-content :deep(blockquote p) {
    margin: 0;
}

/* 链接样式 */
.markdown-content :deep(a) {
    color: #3182ce;
    text-decoration: none;
}

.markdown-content :deep(a:hover) {
    text-decoration: underline;
}

/* 分割线样式 */
.markdown-content :deep(hr) {
    margin: 24px 0;
    border: none;
    border-top: 2px solid #e2e8f0;
}

/* 原始内容显示 */
.markdown-content :deep(.raw-content) {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    padding: 16px;
    margin: 16px 0;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 0.9em;
    white-space: pre-wrap;
    word-wrap: break-word;
    color: #495057;
}

/* 代码高亮样式 */
.markdown-content :deep(.hljs) {
    background: #f8f9fa;
    color: #333;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .markdown-content :deep(h1) {
        font-size: 1.5em;
    }

    .markdown-content :deep(h2) {
        font-size: 1.3em;
    }

    .markdown-content :deep(h3) {
        font-size: 1.2em;
    }

    .markdown-content :deep(table) {
        font-size: 0.9em;
    }

    .markdown-content :deep(th),
    .markdown-content :deep(td) {
        padding: 8px;
    }

    .markdown-content :deep(pre) {
        padding: 12px;
        font-size: 0.8em;
    }
}
</style>
