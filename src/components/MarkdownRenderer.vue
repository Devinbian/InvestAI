<template>
    <div class="markdown-content" v-html="renderedContent"></div>
</template>

<script setup>
import { computed } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const props = defineProps({
    content: {
        type: String,
        required: true
    }
});

// 配置 marked 选项
marked.setOptions({
    breaks: true, // 支持换行符转换为 <br>
    gfm: true, // 支持 GitHub Flavored Markdown
    sanitize: false, // 我们使用 DOMPurify 来清理
    pedantic: false,
    smartLists: true,
    smartypants: false
});

// 创建自定义渲染器
const renderer = new marked.Renderer();

// 自定义链接渲染（添加安全属性）
renderer.link = function (href, title, text) {
    const titleAttr = title ? ` title="${title}"` : '';
    return `<a href="${href}" target="_blank" rel="noopener noreferrer"${titleAttr}>${text}</a>`;
};

// 自定义代码块渲染
renderer.code = function (code, language) {
    const validLanguage = language && language.match(/^[a-zA-Z0-9_+-]*$/) ? language : '';
    return `<pre class="code-block"><code class="language-${validLanguage}">${code}</code></pre>`;
};

// 自定义内联代码渲染
renderer.codespan = function (code) {
    return `<code class="inline-code">${code}</code>`;
};

// 计算渲染后的内容
const renderedContent = computed(() => {
    if (!props.content) return '';

    // 确保content是字符串类型
    const contentStr = typeof props.content === 'string' ? props.content : String(props.content);

    // 简单测试：如果内容包含复盘关键词，输出调试信息
    if (contentStr.includes('智能复盘')) {
        console.log('=== 复盘消息调试 ===');
        console.log('原始内容:', contentStr);
        console.log('内容类型:', typeof contentStr);
        console.log('前50个字符:', contentStr.substring(0, 50));

        // 测试简单的markdown解析
        const testMarkdown = "1. 测试项目一\n2. 测试项目二";
        const testResult = marked(testMarkdown);
        console.log('测试markdown解析:', testResult);
    }

    try {
        // 使用 marked 解析 markdown，使用自定义渲染器
        const parsed = marked(contentStr, { renderer });

        if (contentStr.includes('智能复盘')) {
            console.log('解析结果:', parsed);
        }

        // 使用 DOMPurify 清理 HTML，防止 XSS 攻击
        const result = DOMPurify.sanitize(parsed, {
            ALLOWED_TAGS: [
                'p', 'br', 'strong', 'em', 'u', 'del', 's', 'strike',
                'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                'ul', 'ol', 'li',
                'blockquote',
                'pre', 'code',
                'a',
                'table', 'thead', 'tbody', 'tr', 'th', 'td',
                'div', 'span', 'input', 'hr'
            ],
            ALLOWED_ATTR: [
                'href', 'target', 'rel', 'title',
                'class', 'type', 'checked', 'disabled'
            ],
            ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
        });

        if (contentStr.includes('智能复盘')) {
            console.log('最终结果:', result);
            console.log('=== 调试结束 ===');
        }

        return result;
    } catch (error) {
        console.error('Markdown parsing error:', error);
        return contentStr; // 如果解析失败，返回原始内容
    }
});
</script>

<style scoped>
.markdown-content {
    line-height: 1.6;
    color: #333;
    word-wrap: break-word;
    overflow-wrap: break-word;
}

/* 标题样式 */
.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
    margin: 16px 0 8px 0;
    font-weight: 600;
    line-height: 1.4;
}

.markdown-content :deep(h1) {
    font-size: 1.5em;
    border-bottom: 1px solid #eee;
    padding-bottom: 8px;
}

.markdown-content :deep(h2) {
    font-size: 1.3em;
}

.markdown-content :deep(h3) {
    font-size: 1.2em;
}

.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
    font-size: 1.1em;
}

/* 段落样式 */
.markdown-content :deep(p) {
    margin: 8px 0;
}

/* 强调样式 */
.markdown-content :deep(strong) {
    font-weight: 600;
    color: #2c3e50;
}

.markdown-content :deep(em) {
    font-style: italic;
    color: #555;
}

.markdown-content :deep(del),
.markdown-content :deep(s),
.markdown-content :deep(strike) {
    text-decoration: line-through;
    color: #888;
}

/* 列表样式 */
.markdown-content :deep(ul),
.markdown-content :deep(ol) {
    margin: 8px 0;
    padding-left: 24px;
}

.markdown-content :deep(li) {
    margin: 4px 0;
    line-height: 1.5;
}

.markdown-content :deep(ul li) {
    list-style-type: disc;
}

.markdown-content :deep(ol li) {
    list-style-type: decimal;
}

/* 任务列表样式 */
.markdown-content :deep(.task-list-item) {
    list-style: none;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 6px 0;
}

.markdown-content :deep(.task-checkbox) {
    width: 16px;
    height: 16px;
    border: 2px solid #d1d5db;
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: bold;
    color: white;
    flex-shrink: 0;
    margin-top: 2px;
    transition: all 0.2s ease;
}

.markdown-content :deep(.task-checkbox.checked) {
    background: #10b981;
    border-color: #10b981;
}

.markdown-content :deep(.task-text) {
    flex: 1;
    line-height: 1.5;
}

.markdown-content :deep(.task-text.completed) {
    text-decoration: line-through;
    color: #6b7280;
}

/* 引用样式 */
.markdown-content :deep(blockquote) {
    margin: 12px 0;
    padding: 12px 16px;
    background: #f8f9fa;
    border-left: 4px solid #3b82f6;
    border-radius: 0 4px 4px 0;
    color: #555;
    font-style: italic;
}

.markdown-content :deep(blockquote p) {
    margin: 0;
}

/* 代码样式 */
.markdown-content :deep(.inline-code) {
    background: #f1f5f9;
    color: #e11d48;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 0.9em;
    border: 1px solid #e2e8f0;
}

.markdown-content :deep(.code-block) {
    background: #1e293b;
    color: #e2e8f0;
    padding: 16px;
    border-radius: 8px;
    margin: 12px 0;
    overflow-x: auto;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 0.9em;
    line-height: 1.5;
}

.markdown-content :deep(.code-block code) {
    background: none;
    color: inherit;
    padding: 0;
    border: none;
    font-size: inherit;
}

/* 链接样式 */
.markdown-content :deep(a) {
    color: #3b82f6;
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: all 0.2s ease;
}

.markdown-content :deep(a:hover) {
    color: #2563eb;
    border-bottom-color: #2563eb;
}

/* 表格样式 */
.markdown-content :deep(.table-wrapper) {
    overflow-x: auto;
    margin: 12px 0;
}

.markdown-content :deep(.markdown-table) {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.markdown-content :deep(.markdown-table th),
.markdown-content :deep(.markdown-table td) {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid #e5e7eb;
}

.markdown-content :deep(.markdown-table th) {
    background: #f8f9fa;
    font-weight: 600;
    color: #374151;
}

.markdown-content :deep(.markdown-table tr:hover) {
    background: #f9fafb;
}

.markdown-content :deep(.markdown-table tr:last-child td) {
    border-bottom: none;
}

/* 分割线样式 */
.markdown-content :deep(hr) {
    border: none;
    height: 1px;
    background: linear-gradient(to right, transparent, #e5e7eb, transparent);
    margin: 24px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .markdown-content :deep(h1) {
        font-size: 1.3em;
    }

    .markdown-content :deep(h2) {
        font-size: 1.2em;
    }

    .markdown-content :deep(h3) {
        font-size: 1.1em;
    }

    .markdown-content :deep(.code-block) {
        padding: 12px;
        font-size: 0.85em;
    }

    .markdown-content :deep(.markdown-table th),
    .markdown-content :deep(.markdown-table td) {
        padding: 8px 12px;
        font-size: 0.9em;
    }
}

/* 暗色主题支持 */
@media (prefers-color-scheme: dark) {
    .markdown-content {
        color: #e5e7eb;
    }

    .markdown-content :deep(strong) {
        color: #f3f4f6;
    }

    .markdown-content :deep(blockquote) {
        background: #374151;
        color: #d1d5db;
        border-left-color: #60a5fa;
    }

    .markdown-content :deep(.inline-code) {
        background: #374151;
        color: #fbbf24;
        border-color: #4b5563;
    }

    .markdown-content :deep(.markdown-table) {
        background: #1f2937;
    }

    .markdown-content :deep(.markdown-table th) {
        background: #374151;
        color: #f3f4f6;
    }

    .markdown-content :deep(.markdown-table td) {
        border-bottom-color: #4b5563;
    }

    .markdown-content :deep(.markdown-table tr:hover) {
        background: #374151;
    }
}
</style>
