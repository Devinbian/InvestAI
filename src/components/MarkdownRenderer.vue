<template>
    <div class="markdown-content" :class="{ 'compact-recap': isRecapMessage }" v-html="renderedContent"></div>
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

// 检测是否为智能复盘消息
const isRecapMessage = computed(() => {
    if (!props.content) return false;
    const contentStr = typeof props.content === 'string' ? props.content : String(props.content);
    return contentStr.includes('智能复盘') || contentStr.includes('请帮我进行全面的智能投资复盘分析');
});

// 计算渲染后的内容
const renderedContent = computed(() => {
    if (!props.content) return '';

    // 确保content是字符串类型
    const contentStr = typeof props.content === 'string' ? props.content : String(props.content);

    // console.log('Original Content:', contentStr);

    try {
        // 使用 marked 解析 markdown，使用自定义渲染器
        const parsed = marked(contentStr, { renderer });

        // console.log('Parsed Markdown:', parsed);

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
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    min-height: fit-content;
    /* 确保markdown内容可以被选择 */
    -webkit-user-select: text !important;
    -khtml-user-select: text !important;
    -moz-user-select: text !important;
    -ms-user-select: text !important;
    user-select: text !important;
}

/* 确保所有子元素都可以被选择 */
.markdown-content :deep(*) {
    -webkit-user-select: text !important;
    -khtml-user-select: text !important;
    -moz-user-select: text !important;
    -ms-user-select: text !important;
    user-select: text !important;
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
    line-height: inherit;
    /* 继承容器的行高 */
    display: block;
    width: 100%;
    box-sizing: border-box;
}

/* 最后一个段落的底部间距清零 */
.markdown-content :deep(p:last-child) {
    margin-bottom: 0 !important;
    padding-bottom: 0 !important;
}

/* 第一个段落的顶部间距清零 */
.markdown-content :deep(p:first-child) {
    margin-top: 0 !important;
    padding-top: 0 !important;
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

/* 最后一个列表的底部间距清零 */
.markdown-content :deep(ul:last-child),
.markdown-content :deep(ol:last-child) {
    margin-bottom: 0 !important;
    padding-bottom: 0 !important;
}

/* 第一个列表的顶部间距清零 */
.markdown-content :deep(ul:first-child),
.markdown-content :deep(ol:first-child) {
    margin-top: 0 !important;
    padding-top: 0 !important;
}

/* 确保所有最后的元素都没有底部间距 */
.markdown-content :deep(*:last-child) {
    margin-bottom: 0 !important;
    padding-bottom: 0 !important;
}

/* 确保所有第一个元素都没有顶部间距 */
.markdown-content :deep(*:first-child) {
    margin-top: 0 !important;
    padding-top: 0 !important;
}

/* 单行文本优化：当只有一个段落时，完全贴合容器 */
.markdown-content:has(p:only-child) {
    align-items: stretch;
}

.markdown-content :deep(p:only-child) {
    margin: 0 !important;
    padding: 0 !important;
    flex: 1;
    display: flex;
    align-items: center;
    min-height: 1em;
}

/* 强制清除所有可能的间距 */
.markdown-content :deep(p),
.markdown-content :deep(div),
.markdown-content :deep(span) {
    margin-bottom: 0 !important;
    padding-bottom: 0 !important;
}

.markdown-content :deep(p:last-child),
.markdown-content :deep(div:last-child),
.markdown-content :deep(span:last-child) {
    margin-bottom: 0 !important;
    padding-bottom: 0 !important;
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
    margin-bottom: 0;
    padding-bottom: 0;
}

/* 智能复盘消息的紧凑样式 */
.markdown-content.compact-recap :deep(p) {
    margin: 2px 0;
    line-height: 1.3;
}

.markdown-content.compact-recap :deep(p:last-child) {
    margin-bottom: 0;
}

.markdown-content.compact-recap :deep(p:first-child) {
    margin-top: 0;
}

.markdown-content.compact-recap :deep(ol) {
    margin: 0;
    padding-left: 18px;
    line-height: 0.6;
}

.markdown-content.compact-recap :deep(ol:last-child) {
    margin-bottom: 0;
}

.markdown-content.compact-recap :deep(ol li) {
    margin: 0;
    padding: 0;
    line-height: 1.2;
    display: list-item;
    list-style-position: outside;
}

.markdown-content.compact-recap {
    line-height: 1.3;
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
