import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import MarkdownIt from 'markdown-it';

// 配置Markdown解析器
const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true
});

/**
 * PDF生成器类
 */
export class PDFGenerator {
    constructor() {
        this.pageWidth = 210; // A4宽度（mm）
        this.pageHeight = 297; // A4高度（mm）
        this.margin = 20; // 页边距（mm）
        this.contentWidth = this.pageWidth - 2 * this.margin;
        this.contentHeight = this.pageHeight - 2 * this.margin;
    }

    /**
     * 将Markdown内容转换为PDF
     * @param {string} markdownContent - Markdown内容
     * @param {Object} options - 配置选项
     * @returns {Promise<void>}
     */
    async generatePDF(markdownContent, options = {}) {
        const {
            filename = '量化分析报告.pdf',
            title = '量化分析报告',
            stockInfo = {},
            watermark = true
        } = options;

        try {
            // 创建临时HTML容器
            const htmlContent = this.createHTMLContent(markdownContent, title, stockInfo);
            const tempContainer = this.createTempContainer(htmlContent);
            
            // 等待内容渲染完成
            await this.waitForImagesLoad(tempContainer);
            
            // 生成PDF
            await this.convertToPDF(tempContainer, filename, {
                title,
                stockInfo,
                watermark
            });
            
            // 清理临时容器
            document.body.removeChild(tempContainer);
            
        } catch (error) {
            console.error('PDF生成失败:', error);
            throw new Error('PDF生成失败，请稍后重试');
        }
    }

    /**
     * 创建HTML内容
     * @param {string} markdownContent - Markdown内容
     * @param {string} title - 报告标题
     * @param {Object} stockInfo - 股票信息
     * @returns {string}
     */
    createHTMLContent(markdownContent, title, stockInfo) {
        const htmlContent = md.render(markdownContent);
        const pdfExportDate = new Date().toLocaleDateString('zh-CN');
        
        // 格式化报告生成时间
        let reportGenerateDate = '';
        if (stockInfo.createdAt) {
            reportGenerateDate = new Date(stockInfo.createdAt).toLocaleDateString('zh-CN');
        }
        
        return `
            <div class="pdf-container">
                <!-- 报告头部 -->
                <div class="pdf-header">
                    <div class="header-top">
                        <div class="logo-section">
                            <img src="/logo.png" alt="InvestAI Logo" class="pdf-logo">
                            <div class="brand-info">
                                <div class="brand-name">InvestAI</div>
                                <div class="brand-subtitle">智能投资助手</div>
                            </div>
                        </div>
                        <div class="date-info">
                            ${reportGenerateDate ? `<div class="report-date">报告生成：${reportGenerateDate}</div>` : ''}
                            <div class="export-date">PDF导出：${pdfExportDate}</div>
                        </div>
                    </div>
                    <h1 class="pdf-title">${title}</h1>
                    <div class="pdf-meta">
                        <div class="stock-info">
                            <span class="stock-name">${stockInfo.name || ''}</span>
                            <span class="stock-code">(${stockInfo.code || ''})</span>
                        </div>
                    </div>
                    <hr class="pdf-divider">
                </div>
                
                <!-- 报告内容 -->
                <div class="pdf-content">
                    ${htmlContent}
                </div>
                
                <!-- 报告尾部 -->
                <div class="pdf-footer">
                    <hr class="pdf-divider">
                    <div class="footer-content">
                        <div class="footer-logo">
                            <img src="/logo.png" alt="InvestAI Logo" class="footer-logo-img">
                            <span class="footer-brand">InvestAI 智能投资助手</span>
                        </div>
                        <div class="footer-text">
                            <p><strong>免责声明：</strong>本报告由AI智能投资助手生成，仅供参考，不构成投资建议。</p>
                            <p>投资有风险，决策需谨慎。请根据自身风险承受能力谨慎投资。</p>
                            <p class="copyright">© 2024 InvestAI Platform. All rights reserved.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 创建临时HTML容器
     * @param {string} htmlContent - HTML内容
     * @returns {HTMLElement}
     */
    createTempContainer(htmlContent) {
        const container = document.createElement('div');
        container.style.cssText = `
            position: fixed;
            top: -10000px;
            left: -10000px;
            width: 794px;
            background: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif;
            z-index: -1;
            overflow: hidden;
        `;
        
        container.innerHTML = htmlContent + this.getPDFStyles();
        document.body.appendChild(container);
        
        return container;
    }

    /**
     * 获取PDF样式
     * @returns {string}
     */
    getPDFStyles() {
        return `
            <style>
                .pdf-container {
                    width: 754px;
                    padding: 20px;
                    background: white;
                    color: #333;
                    line-height: 1.6;
                    font-size: 14px;
                }
                
                .pdf-header {
                    margin-bottom: 30px;
                }
                
                .header-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 20px;
                }
                
                .logo-section {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .pdf-logo {
                    width: 40px;
                    height: 40px;
                    object-fit: contain;
                }
                
                .brand-info {
                    display: flex;
                    flex-direction: column;
                }
                
                .brand-name {
                    font-size: 18px;
                    font-weight: bold;
                    color: #1a202c;
                    line-height: 1.2;
                }
                
                .brand-subtitle {
                    font-size: 12px;
                    color: #666;
                    margin-top: 2px;
                }
                
                .date-info {
                    text-align: right;
                    color: #666;
                    line-height: 1.5;
                }
                
                .report-date {
                    color: #3182ce;
                    font-weight: 600;
                    margin-bottom: 4px;
                    font-size: 12px;
                }
                
                .export-date {
                    color: #666;
                    font-size: 11px;
                }
                
                .pdf-title {
                    font-size: 24px;
                    font-weight: bold;
                    color: #1a202c;
                    margin: 0 0 16px 0;
                    text-align: center;
                }
                
                .pdf-meta {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    margin-bottom: 16px;
                    font-size: 14px;
                    color: #666;
                }
                
                .stock-info {
                    font-weight: 600;
                    text-align: center;
                }
                
                .stock-name {
                    color: #1a202c;
                    font-size: 16px;
                }
                
                .stock-code {
                    color: #666;
                    margin-left: 4px;
                    font-size: 14px;
                }
                
                .pdf-divider {
                    border: none;
                    border-top: 2px solid #e2e8f0;
                    margin: 16px 0;
                }
                
                .pdf-content {
                    min-height: 600px;
                }
                
                .pdf-content h1 {
                    font-size: 20px;
                    font-weight: bold;
                    color: #1a202c;
                    margin: 24px 0 16px 0;
                    border-bottom: 2px solid #3182ce;
                    padding-bottom: 8px;
                }
                
                .pdf-content h2 {
                    font-size: 18px;
                    font-weight: 600;
                    color: #2d3748;
                    margin: 20px 0 12px 0;
                    border-bottom: 1px solid #e2e8f0;
                    padding-bottom: 6px;
                }
                
                .pdf-content h3 {
                    font-size: 16px;
                    font-weight: 600;
                    color: #4a5568;
                    margin: 16px 0 8px 0;
                }
                
                .pdf-content h4 {
                    font-size: 14px;
                    font-weight: 600;
                    color: #4a5568;
                    margin: 14px 0 6px 0;
                }
                
                .pdf-content p {
                    margin: 8px 0;
                    line-height: 1.7;
                    color: #2d3748;
                    text-align: justify;
                }
                
                .pdf-content table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 16px 0;
                    font-size: 12px;
                }
                
                .pdf-content th {
                    background: #f8f9fa;
                    padding: 8px;
                    text-align: left;
                    font-weight: 600;
                    border: 1px solid #dee2e6;
                }
                
                .pdf-content td {
                    padding: 8px;
                    border: 1px solid #dee2e6;
                }
                
                .pdf-content ul, .pdf-content ol {
                    margin: 12px 0;
                    padding-left: 24px;
                }
                
                .pdf-content li {
                    margin: 4px 0;
                    line-height: 1.6;
                }
                
                .pdf-content code {
                    background: #f1f5f9;
                    padding: 2px 4px;
                    border-radius: 3px;
                    font-family: 'Consolas', 'Monaco', monospace;
                    font-size: 12px;
                    color: #e53e3e;
                }
                
                .pdf-content pre {
                    background: #f8f9fa;
                    padding: 12px;
                    border-radius: 4px;
                    overflow-x: auto;
                    margin: 12px 0;
                    border: 1px solid #e2e8f0;
                }
                
                .pdf-content pre code {
                    background: transparent;
                    padding: 0;
                    color: inherit;
                }
                
                .pdf-content blockquote {
                    margin: 12px 0;
                    padding: 8px 12px;
                    border-left: 3px solid #3182ce;
                    background: #f7fafc;
                    color: #4a5568;
                }
                
                .pdf-footer {
                    margin-top: 40px;
                    page-break-inside: avoid;
                }
                
                .footer-content {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                
                .footer-logo {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    margin-bottom: 8px;
                }
                
                .footer-logo-img {
                    width: 24px;
                    height: 24px;
                    object-fit: contain;
                }
                
                .footer-brand {
                    font-size: 12px;
                    font-weight: 600;
                    color: #1a202c;
                }
                
                .footer-text {
                    text-align: center;
                    font-size: 10px;
                    color: #666;
                    line-height: 1.5;
                }
                
                .footer-text p {
                    margin: 6px 0;
                }
                
                .footer-text .copyright {
                    margin-top: 12px;
                    font-size: 9px;
                    color: #888;
                    border-top: 1px solid #e2e8f0;
                    padding-top: 8px;
                }
                
                /* 分页控制 */
                .page-break {
                    page-break-before: always;
                }
                
                /* 避免孤行和内容截断 */
                h1, h2, h3, h4, h5, h6 {
                    page-break-after: avoid;
                    page-break-inside: avoid;
                    margin-top: 24px;
                    margin-bottom: 16px;
                }
                
                p {
                    page-break-inside: avoid;
                    margin-bottom: 12px;
                    line-height: 1.6;
                }
                
                li {
                    page-break-inside: avoid;
                    margin-bottom: 8px;
                }
                
                table {
                    page-break-inside: avoid;
                    margin: 16px 0;
                    border-collapse: collapse;
                }
                
                blockquote {
                    page-break-inside: avoid;
                    margin: 16px 0;
                    padding: 12px 16px;
                    border-left: 4px solid #3182ce;
                    background: #f8fafc;
                }
                
                pre, code {
                    page-break-inside: avoid;
                    margin: 12px 0;
                    padding: 12px;
                    background: #f1f5f9;
                    border-radius: 4px;
                }
                
                /* 确保列表项不被分割 */
                ul, ol {
                    page-break-inside: avoid;
                    margin: 12px 0;
                    padding-left: 24px;
                }
                
                /* 图片和媒体元素 */
                img {
                    page-break-inside: avoid;
                    max-width: 100%;
                    height: auto;
                    margin: 12px 0;
                }
                
                /* 表格样式优化 */
                table th, table td {
                    padding: 8px 12px;
                    border: 1px solid #e2e8f0;
                    text-align: left;
                }
                
                table th {
                    background: #f8fafc;
                    font-weight: 600;
                }
                
                /* 强制保持在一起的元素 */
                .keep-together {
                    page-break-inside: avoid;
                }
                
                /* 段落间距优化 */
                .pdf-content > *:first-child {
                    margin-top: 0;
                }
                
                .pdf-content > *:last-child {
                    margin-bottom: 0;
                }
            </style>
        `;
    }

    /**
     * 等待图片加载完成
     * @param {HTMLElement} container - 容器元素
     * @returns {Promise<void>}
     */
    async waitForImagesLoad(container) {
        const images = container.querySelectorAll('img');
        const promises = Array.from(images).map(img => {
            return new Promise((resolve) => {
                if (img.complete) {
                    resolve();
                } else {
                    img.onload = resolve;
                    img.onerror = resolve;
                    // 设置超时，避免无限等待
                    setTimeout(resolve, 3000);
                }
            });
        });
        
        await Promise.all(promises);
        // 额外等待一点时间确保渲染完成
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    /**
     * 转换为PDF
     * @param {HTMLElement} container - 容器元素
     * @param {string} filename - 文件名
     * @param {Object} options - 选项
     * @returns {Promise<void>}
     */
    async convertToPDF(container, filename, options) {
        const { title, stockInfo, watermark } = options;
        
        try {
            // 使用智能分页方案
            await this.generateSmartPaginatedPDF(container, filename, options);
        } catch (error) {
            console.warn('智能分页失败，使用备用方案:', error);
            // 备用方案：使用原有的简单分页
            await this.generateSimplePaginatedPDF(container, filename, options);
        }
    }

    /**
     * 智能分页PDF生成
     * @param {HTMLElement} container - 容器元素
     * @param {string} filename - 文件名
     * @param {Object} options - 选项
     */
    async generateSmartPaginatedPDF(container, filename, options) {
        const { title, stockInfo, watermark } = options;
        
        // 使用html2canvas生成完整的PDF内容
        const canvas = await html2canvas(container, {
            scale: 2, // 提高清晰度
            useCORS: true,
            allowTaint: false,
            backgroundColor: '#ffffff',
            width: 794,
            height: container.scrollHeight,
            scrollX: 0,
            scrollY: 0
        });
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = this.contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // 如果内容高度超过一页，需要分页
        if (imgHeight > this.contentHeight) {
            await this.addMultiplePages(pdf, canvas, imgWidth);
        } else {
            // 单页内容
            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', this.margin, this.margin, imgWidth, imgHeight);
        }
        
        // 添加水印（如果需要）
        if (watermark) {
            this.addWatermark(pdf);
        }
        
        // 设置PDF元数据
        pdf.setProperties({
            title: title,
            subject: `${stockInfo.name}(${stockInfo.code})量化分析报告`,
            author: 'AI智能投资助手',
            creator: 'InvestAI Platform'
        });
        
        // 下载PDF
        pdf.save(filename);
    }

    /**
     * 备用的简单分页PDF生成
     * @param {HTMLElement} container - 容器元素
     * @param {string} filename - 文件名
     * @param {Object} options - 选项
     */
    async generateSimplePaginatedPDF(container, filename, options) {
        const { title, stockInfo, watermark } = options;
        
        // 使用html2canvas生成图片
        const canvas = await html2canvas(container, {
            scale: 2, // 提高清晰度
            useCORS: true,
            allowTaint: false,
            backgroundColor: '#ffffff',
            width: 794,
            height: container.scrollHeight,
            scrollX: 0,
            scrollY: 0
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        // 计算图片在PDF中的尺寸
        const imgWidth = this.contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // 如果内容高度超过一页，需要分页
        if (imgHeight > this.contentHeight) {
            await this.addMultiplePages(pdf, canvas, imgWidth);
        } else {
            // 单页内容
            pdf.addImage(imgData, 'PNG', this.margin, this.margin, imgWidth, imgHeight);
        }
        
        // 添加水印（如果需要）
        if (watermark) {
            this.addWatermark(pdf);
        }
        
        // 设置PDF元数据
        pdf.setProperties({
            title: title,
            subject: `${stockInfo.name}(${stockInfo.code})量化分析报告`,
            author: 'AI智能投资助手',
            creator: 'InvestAI Platform'
        });
        
        // 下载PDF
        pdf.save(filename);
    }

    /**
     * 将内容分割为逻辑块
     * @param {HTMLElement} container - 容器元素
     * @returns {Array<HTMLElement>} 内容块数组
     */
    splitContentIntoBlocks(container) {
        const blocks = [];
        const contentDiv = container.querySelector('.pdf-content');
        
        if (!contentDiv) {
            // 如果没有找到.pdf-content，使用整个容器
            blocks.push(container);
            return blocks;
        }
        
        const children = contentDiv.children;
        
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            
            // 根据元素类型决定是否可以分割
            if (this.isBlockElement(child)) {
                // 对于表格、列表等复杂元素，检查是否需要特殊处理
                if (this.isComplexElement(child)) {
                    blocks.push(this.wrapElement(child));
                } else {
                    blocks.push(child);
                }
            } else {
                // 将内联元素组合成块
                const inlineBlock = document.createElement('div');
                inlineBlock.appendChild(child.cloneNode(true));
                blocks.push(inlineBlock);
            }
        }
        
        return blocks;
    }

    /**
     * 判断是否为复杂元素（需要特殊处理）
     * @param {HTMLElement} element - 元素
     * @returns {boolean}
     */
    isComplexElement(element) {
        const complexElements = ['table', 'ul', 'ol', 'blockquote', 'pre'];
        return complexElements.includes(element.tagName.toLowerCase());
    }

    /**
     * 包装元素以确保样式正确应用
     * @param {HTMLElement} element - 元素
     * @returns {HTMLElement}
     */
    wrapElement(element) {
        const wrapper = document.createElement('div');
        wrapper.className = 'keep-together';
        wrapper.appendChild(element.cloneNode(true));
        return wrapper;
    }

    /**
     * 判断是否为块级元素
     * @param {HTMLElement} element - 元素
     * @returns {boolean}
     */
    isBlockElement(element) {
        const blockElements = [
            'div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'table', 'ul', 'ol', 'li', 'blockquote', 'pre',
            'section', 'article', 'header', 'footer', 'aside'
        ];
        return blockElements.includes(element.tagName.toLowerCase());
    }

    /**
     * 渲染单个内容块
     * @param {HTMLElement} block - 内容块
     * @returns {Promise<HTMLCanvasElement>}
     */
    async renderBlock(block) {
        // 创建临时容器
        const tempContainer = document.createElement('div');
        tempContainer.style.cssText = `
            position: fixed;
            top: -10000px;
            left: -10000px;
            width: 754px;
            background: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif;
            z-index: -1;
            padding: 20px;
        `;
        
        // 复制样式
        tempContainer.innerHTML = this.getPDFStyles();
        tempContainer.appendChild(block.cloneNode(true));
        document.body.appendChild(tempContainer);
        
        try {
            // 等待渲染完成
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // 生成canvas
            const canvas = await html2canvas(tempContainer, {
                scale: 2,
                useCORS: true,
                allowTaint: false,
                backgroundColor: '#ffffff',
                width: 794,
                height: tempContainer.scrollHeight
            });
            
            return canvas;
        } finally {
            // 清理临时容器
            document.body.removeChild(tempContainer);
        }
    }

    /**
     * 分割过大的块
     * @param {HTMLCanvasElement} canvas - 画布
     * @returns {Promise<Array<HTMLCanvasElement>>}
     */
    async splitLargeBlock(canvas) {
        const subPages = [];
        const maxHeight = (this.contentHeight * canvas.width) / this.contentWidth;
        const totalPages = Math.ceil(canvas.height / maxHeight);
        
        for (let i = 0; i < totalPages; i++) {
            const startY = i * maxHeight;
            const endY = Math.min(startY + maxHeight, canvas.height);
            const subHeight = endY - startY;
            
            // 创建子页面canvas
            const subCanvas = document.createElement('canvas');
            const subCtx = subCanvas.getContext('2d');
            subCanvas.width = canvas.width;
            subCanvas.height = subHeight;
            
            // 绘制子页面内容
            subCtx.drawImage(
                canvas,
                0, startY, canvas.width, subHeight,
                0, 0, canvas.width, subHeight
            );
            
            subPages.push(subCanvas);
        }
        
        return subPages;
    }

    /**
     * 添加多页内容（智能分页）
     * @param {jsPDF} pdf - PDF对象
     * @param {HTMLCanvasElement} canvas - 画布
     * @param {number} imgWidth - 图片宽度
     * @returns {Promise<void>}
     */
    async addMultiplePages(pdf, canvas, imgWidth) {
        const pageHeight = this.contentHeight;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const totalPages = Math.ceil(imgHeight / pageHeight);
        
        // 计算每页的实际像素高度
        const pageHeightInPixels = (pageHeight * canvas.width) / imgWidth;
        
        for (let i = 0; i < totalPages; i++) {
            if (i > 0) {
                pdf.addPage();
            }
            
            let sourceY = i * pageHeightInPixels;
            let sourceHeight = Math.min(pageHeightInPixels, canvas.height - sourceY);
            
            // 如果不是最后一页，尝试找到更好的分页位置
            if (i < totalPages - 1) {
                const betterBreakPoint = this.findBetterBreakPoint(
                    canvas, 
                    sourceY, 
                    sourceY + sourceHeight,
                    pageHeightInPixels * 0.1 // 允许10%的调整空间
                );
                
                if (betterBreakPoint > sourceY) {
                    sourceHeight = betterBreakPoint - sourceY;
                }
            }
            
            // 创建当前页的canvas
            const pageCanvas = document.createElement('canvas');
            const pageCtx = pageCanvas.getContext('2d');
            pageCanvas.width = canvas.width;
            pageCanvas.height = sourceHeight;
            
            // 设置白色背景
            pageCtx.fillStyle = '#ffffff';
            pageCtx.fillRect(0, 0, canvas.width, sourceHeight);
            
            // 绘制当前页内容
            pageCtx.drawImage(
                canvas,
                0, sourceY, canvas.width, sourceHeight,
                0, 0, canvas.width, sourceHeight
            );
            
            const pageImgData = pageCanvas.toDataURL('image/png');
            const currentPageHeight = (sourceHeight * imgWidth) / canvas.width;
            
            pdf.addImage(
                pageImgData,
                'PNG',
                this.margin,
                this.margin,
                imgWidth,
                currentPageHeight
            );
        }
    }

    /**
     * 寻找更好的分页位置
     * @param {HTMLCanvasElement} canvas - 画布
     * @param {number} startY - 开始Y坐标
     * @param {number} endY - 结束Y坐标
     * @param {number} tolerance - 容忍度
     * @returns {number} 更好的分页位置
     */
    findBetterBreakPoint(canvas, startY, endY, tolerance) {
        const ctx = canvas.getContext('2d');
        const searchStart = Math.max(startY, endY - tolerance);
        const searchEnd = Math.min(endY, startY + tolerance);
        
        // 寻找空白行（更可能是段落间距）
        for (let y = searchEnd; y >= searchStart; y -= 5) {
            const imageData = ctx.getImageData(0, y, canvas.width, 1);
            const data = imageData.data;
            
            let isWhiteLine = true;
            for (let i = 0; i < data.length; i += 4) {
                // 检查RGB值是否接近白色
                if (data[i] < 250 || data[i + 1] < 250 || data[i + 2] < 250) {
                    isWhiteLine = false;
                    break;
                }
            }
            
            if (isWhiteLine) {
                return y;
            }
        }
        
        return endY; // 如果没找到更好的位置，返回原位置
    }

    /**
     * 添加水印
     * @param {jsPDF} pdf - PDF对象
     */
    addWatermark(pdf) {
        const pageCount = pdf.internal.getNumberOfPages();
        
        for (let i = 1; i <= pageCount; i++) {
            pdf.setPage(i);
            pdf.setGState(new pdf.GState({ opacity: 0.1 }));
            pdf.setTextColor(150, 150, 150);
            pdf.setFontSize(50);
            
            // 旋转文字作为水印
            pdf.text(
                'InvestAI',
                this.pageWidth / 2,
                this.pageHeight / 2,
                {
                    angle: 45,
                    align: 'center',
                    baseline: 'middle'
                }
            );
            
            // 恢复透明度
            pdf.setGState(new pdf.GState({ opacity: 1 }));
        }
    }
}

// 创建单例实例
export const pdfGenerator = new PDFGenerator();

// 便捷方法
export const generateReportPDF = async (markdownContent, options) => {
    return await pdfGenerator.generatePDF(markdownContent, options);
}; 