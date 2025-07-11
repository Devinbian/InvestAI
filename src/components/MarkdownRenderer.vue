<template>
    <div class="markdown-content" v-html="renderedContent"></div>
</template>

<script setup>
import { computed } from 'vue';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';

const props = defineProps({
    content: {
        type: String,
        required: true
    }
});

// 配置markdown-it实例
const md = new MarkdownIt({
    html: true,        // 启用HTML标签
    breaks: true,      // 将换行符转换为<br>
    linkify: true,     // 自动转换URL为链接
    typographer: true  // 启用一些语言中性的替换和引号美化
});



// 计算渲染后的内容
const renderedContent = computed(() => {
    if (!props.content) return '';

    // 确保content是字符串类型
    let contentStr = typeof props.content === 'string' ? props.content : String(props.content);

    // 添加调试信息
    if (process.env.NODE_ENV === 'development') {
        console.log('原始内容:', contentStr.substring(0, 200) + '...');

        // 检查原始内容中的有序列表
        const originalOrderedLines = contentStr.split('\n').filter(line => line.includes('1.'));
        if (originalOrderedLines.length > 0) {
            console.log('原始内容中包含1.的行:', originalOrderedLines);
        }

        // 检查伪代码示例的格式
        const pseudoCodeLines = contentStr.split('\n').filter(line => line.includes('伪代码示例'));
        if (pseudoCodeLines.length > 0) {
            console.log('原始内容中的伪代码示例:', pseudoCodeLines);
        }

        // 检查是否包含多个#符号的行
        const hashLines = contentStr.split('\n').filter(line => line.includes('####'));
        if (hashLines.length > 0) {
            console.log('原始内容包含多个#符号的行:', hashLines);
        }

        // 专门检查原始内容中的5级标题
        const originalFiveLevelHeaders = contentStr.split('\n').filter(line => line.includes('#####'));
        if (originalFiveLevelHeaders.length > 0) {
            console.log('原始内容5级标题行:', originalFiveLevelHeaders);
            // 检查每个5级标题的具体字符
            originalFiveLevelHeaders.forEach((line, index) => {
                console.log(`原始5级标题${index + 1}详细信息:`, {
                    line: line,
                    chars: line.split('').map((char, i) => `${i}: '${char}' (${char.charCodeAt(0)})`),
                    startsWithCorrectFormat: /^#####\s/.test(line),
                    startsWithIncorrectFormat: /^#####[^\s]/.test(line)
                });
            });
        }

        // 检查是否包含列表项
        const listLines = contentStr.split('\n').filter(line => /^\s*[-*+]\s/.test(line) || /^\s*\d+\.\s/.test(line));
        if (listLines.length > 0) {
            console.log('列表项:', listLines.slice(0, 5));
        }

        // 检查是否有错误的列表项格式
        const incorrectListLines = contentStr.split('\n').filter(line => /^\s*[-*+][^\s]/.test(line));
        if (incorrectListLines.length > 0) {
            console.log('错误的列表项格式:', incorrectListLines.slice(0, 5));
        }
    }

    // 改进的内容预处理
    contentStr = contentStr
        // 标准化行尾
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        // 移除行尾空白
        .replace(/[ \t]+$/gm, '')
        // 修复可能导致pre标签的多个空格问题，但保留列表项的缩进
        .replace(/^    (?!\d+\.|[-*+])/gm, '')  // 移除行首的4个空格（但不是列表项）
        .replace(/\n    (?!\d+\.|[-*+])/g, '\n')  // 移除换行后的4个空格（但不是列表项）
        // 修复markdown语法问题
        // 第一步：修复标题行本身格式（处理没有空格的情况）
        // 处理行首的标题（可能前面有空格），并移除标题前的空格
        .replace(/^(\s*)(#{1,6})([^\s#\n])/gm, '$2 $3')
        .replace(/\n(\s*)(#{1,6})([^\s#\n])/g, '\n$2 $3')
        // 第二步：确保标题前有适当的空行
        .replace(/([^\n])(#{1,6}\s)/g, '$1\n\n$2')
        .replace(/\n(#{1,6}\s)/g, '\n\n$1')
        // 确保列表项格式正确（处理没有空格的情况）
        .replace(/^(\s*)(-|\*|\+)([^\s])/gm, '$1$2 $3')
        .replace(/\n(\s*)(-|\*|\+)([^\s])/g, '\n$1$2 $3')
        // 修复特定格式：将 "**xxx**：" 开头的行转换为列表项（但不影响有序列表）
        .replace(/^(\s*)(\*\*[^*]+\*\*：)(?!\s*\d+\.)/gm, '$1- $2')
        .replace(/\n(\s*)(\*\*[^*]+\*\*：)(?!\s*\d+\.)/g, '\n$1- $2')
        // 确保破折号后面有空格
        .replace(/^(\s*)-([^\s])/gm, '$1- $2')
        .replace(/\n(\s*)-([^\s])/g, '\n$1- $2')
        // 确保列表项前有适当的空行（如果前面不是列表项）
        .replace(/([^\n-*+])\n(\s*)(-|\*|\+)\s/g, '$1\n\n$2$3 ')
        // 修复有序列表格式 - 确保数字后有空格
        .replace(/^(\s*)(\d+\.)([^\s])/gm, '$1$2 $3')
        .replace(/\n(\s*)(\d+\.)([^\s])/g, '\n$1$2 $3')
        // 确保有序列表项前有适当的空行（如果前面不是列表项）
        .replace(/([^\n\d])\n(\s*)(\d+\.)\s/g, '$1\n\n$2$3 ')
        // 清理连续的空行，但保留标题前的双空行
        .replace(/\n{3,}/g, '\n\n');

    // 重新编号有序列表项，确保连续性
    const lines = contentStr.split('\n');
    let orderedListCounter = 0;
    let inOrderedList = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // 检查是否是有序列表项
        if (/^\s*\d+\.\s/.test(line)) {
            if (!inOrderedList) {
                // 开始新的有序列表
                orderedListCounter = 1;
                inOrderedList = true;
            } else {
                // 继续有序列表
                orderedListCounter++;
            }

            // 替换数字
            lines[i] = line.replace(/^\s*\d+\./, (match) => {
                const indent = match.match(/^\s*/)[0];
                return `${indent}${orderedListCounter}.`;
            });
        } else if (/^\s*[-*+]\s/.test(line)) {
            // 无序列表项不中断有序列表的计数
            continue;
        } else if (line.trim() === '') {
            // 空行不中断有序列表
            continue;
        } else if (/^\s+/.test(line) && !(/^\s*#{1,6}\s/.test(line))) {
            // 缩进行（但不是标题）不中断有序列表
            continue;
        } else {
            // 其他内容（如标题、段落等）中断有序列表
            inOrderedList = false;
        }
    }

    contentStr = lines.join('\n')
        // 清理开头和结尾的多余换行符
        .replace(/^\n+/, '')
        .replace(/\n+$/, '');

    // 调试：显示重新编号后的有序列表
    if (process.env.NODE_ENV === 'development') {
        const renumberedOrderedLines = contentStr.split('\n').filter(line => /^\s*\d+\.\s/.test(line));
        if (renumberedOrderedLines.length > 0) {
            console.log('重新编号后的有序列表项:', renumberedOrderedLines);
        }
    }

    // 添加预处理后的调试信息
    if (process.env.NODE_ENV === 'development') {
        console.log('预处理后内容:', contentStr.substring(0, 300) + '...');

        // 检查预处理后的有序列表
        const processedOrderedLines = contentStr.split('\n').filter(line => line.includes('1.'));
        if (processedOrderedLines.length > 0) {
            console.log('预处理后包含1.的行:', processedOrderedLines);
        }

        // 检查预处理后的代码块
        const codeBlockLines = contentStr.split('\n').filter(line => line.includes('```'));
        if (codeBlockLines.length > 0) {
            console.log('预处理后的代码块标记:', codeBlockLines);
        }



        // 检查预处理后的标题行
        const processedHashLines = contentStr.split('\n').filter(line => line.includes('####'));
        if (processedHashLines.length > 0) {
            console.log('预处理后的标题行:', processedHashLines);
        }

        // 专门检查5级标题
        const fiveLevelHeaders = contentStr.split('\n').filter(line => line.includes('#####'));
        if (fiveLevelHeaders.length > 0) {
            console.log('预处理后5级标题行:', fiveLevelHeaders);
            // 检查每个5级标题的具体字符
            fiveLevelHeaders.forEach((line, index) => {
                console.log(`预处理后5级标题${index + 1}详细信息:`, {
                    line: line,
                    chars: line.split('').map((char, i) => `${i}: '${char}' (${char.charCodeAt(0)})`),
                    startsWithCorrectFormat: /^#####\s/.test(line),
                    startsWithIncorrectFormat: /^#####[^\s]/.test(line)
                });
            });
        }

        // 检查是否有正确的标题格式
        const correctHeaders = contentStr.split('\n').filter(line => /^#{1,6}\s/.test(line));
        if (correctHeaders.length > 0) {
            console.log('正确的标题格式:', correctHeaders);
        }

        // 检查是否有错误的标题格式
        const incorrectHeaders = contentStr.split('\n').filter(line => /^#{1,6}[^\s#]/.test(line));
        if (incorrectHeaders.length > 0) {
            console.log('错误的标题格式:', incorrectHeaders);
        }

        // 检查预处理后的列表项格式
        const processedListLines = contentStr.split('\n').filter(line => /^\s*[-*+]\s/.test(line));
        if (processedListLines.length > 0) {
            console.log('预处理后的正确列表项:', processedListLines.slice(0, 5));
        }

        const processedIncorrectListLines = contentStr.split('\n').filter(line => /^\s*[-*+][^\s]/.test(line));
        if (processedIncorrectListLines.length > 0) {
            console.log('预处理后仍然错误的列表项:', processedIncorrectListLines.slice(0, 5));
        }

        // 检查有序列表格式
        const orderedListLines = contentStr.split('\n').filter(line => /^\s*\d+\.\s/.test(line));
        if (orderedListLines.length > 0) {
            console.log('预处理后的正确有序列表项:', orderedListLines.slice(0, 5));
        }

        const incorrectOrderedListLines = contentStr.split('\n').filter(line => /^\s*\d+\.[^\s]/.test(line));
        if (incorrectOrderedListLines.length > 0) {
            console.log('预处理后仍然错误的有序列表项:', incorrectOrderedListLines.slice(0, 5));
        }
    }

    try {
        // 使用markdown-it解析
        const htmlString = md.render(contentStr);

        // 添加调试信息
        if (process.env.NODE_ENV === 'development') {
            console.log('markdown-it解析结果:', htmlString.substring(0, 300) + '...');
        }

        // 使用DOMPurify清理HTML，保留pre和code标签
        const result = DOMPurify.sanitize(htmlString, {
            ALLOWED_TAGS: [
                'p', 'br', 'strong', 'em', 'u', 'del', 's', 'strike',
                'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                'ul', 'ol', 'li',
                'blockquote',
                'a',
                'table', 'thead', 'tbody', 'tr', 'th', 'td',
                'div', 'span', 'hr',
                'pre', 'code'
            ],
            ALLOWED_ATTR: [
                'href', 'target', 'rel', 'title', 'class'
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
    color: #2c3e50;
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
    color: #34495e;
}

.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
    font-size: 1.1em;
    color: #34495e;
}

/* 段落样式 */
.markdown-content :deep(p) {
    margin: 8px 0;
    line-height: inherit;
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

/* 列表样式 */
.markdown-content :deep(ul),
.markdown-content :deep(ol) {
    margin: 4px 0;
    padding-left: 20px;
    display: block;
    visibility: visible;
    opacity: 1;
    overflow: visible;
}

/* 重置有序列表的计数器 */
.markdown-content {
    counter-reset: ordered-list-counter;
}

/* 为有序列表项设置自定义计数器 */
.markdown-content :deep(ol) {
    counter-reset: none;
}

.markdown-content :deep(li) {
    margin: 1px 0;
    line-height: 1.3;
}

.markdown-content :deep(ul li) {
    list-style-type: none;
    position: relative;
    padding-left: 0;
}

.markdown-content :deep(ul li::before) {
    content: "-";
    position: absolute;
    left: -16px;
    color: inherit;
}

.markdown-content :deep(ol li) {
    list-style-type: none;
    display: list-item !important;
    visibility: visible !important;
    opacity: 1 !important;
    overflow: visible !important;
    white-space: normal !important;
    text-indent: 0 !important;
    padding-left: 0 !important;
    color: inherit !important;
    font-size: inherit !important;
    line-height: inherit !important;
    counter-increment: ordered-list-counter;
    position: relative;
}

.markdown-content :deep(ol li::before) {
    content: counter(ordered-list-counter) ". ";
    position: absolute;
    left: -20px;
    color: inherit;
    font-weight: normal;
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

/* 代码样式 - 恢复代码块的样式 */
.markdown-content :deep(code) {
    background: #f6f8fa;
    color: #24292e;
    padding: 2px 4px;
    border-radius: 3px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 0.9em;
    border: 1px solid #e1e4e8;
}

.markdown-content :deep(pre) {
    background: #f6f8fa;
    color: #24292e;
    padding: 12px;
    border-radius: 6px;
    border: 1px solid #e1e4e8;
    margin: 12px 0;
    overflow-x: auto;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 0.9em;
    line-height: 1.4;
    white-space: pre;
}

.markdown-content :deep(pre code) {
    background: none;
    color: inherit;
    padding: 0;
    border: none;
    font-size: inherit;
    font-family: inherit;
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
.markdown-content :deep(table) {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    margin: 12px 0;
}

.markdown-content :deep(table th),
.markdown-content :deep(table td) {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid #e5e7eb;
}

.markdown-content :deep(table th) {
    background: #f8f9fa;
    font-weight: 600;
    color: #374151;
}

.markdown-content :deep(table tr:hover) {
    background: #f9fafb;
}

.markdown-content :deep(table tr:last-child td) {
    border-bottom: none;
}

/* 分割线样式 */
.markdown-content :deep(hr) {
    border: none;
    height: 1px;
    background: linear-gradient(to right, transparent, #e5e7eb, transparent);
    margin: 8px 0;
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

    .markdown-content :deep(pre) {
        padding: 12px;
        font-size: 0.85em;
    }

    .markdown-content :deep(table th),
    .markdown-content :deep(table td) {
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

    .markdown-content :deep(code) {
        background: #374151;
        color: #fbbf24;
        border-color: #4b5563;
    }

    .markdown-content :deep(table) {
        background: #1f2937;
    }

    .markdown-content :deep(table th) {
        background: #374151;
        color: #f3f4f6;
    }

    .markdown-content :deep(table td) {
        border-bottom-color: #4b5563;
    }

    .markdown-content :deep(table tr:hover) {
        background: #374151;
    }

    .markdown-content :deep(code) {
        background: #374151;
        color: #fbbf24;
        border-color: #4b5563;
    }

    .markdown-content :deep(pre) {
        background: #1f2937;
        color: #e5e7eb;
        border-color: #374151;
    }
}
</style>
