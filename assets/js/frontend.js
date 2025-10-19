/**
 * 雪猫 Before&After Slider - 前端脚本
 */

(function() {
    'use strict';
    
    // 使用jQuery
    var $ = window.jQuery || window.$;
    
    if (!$) {
        console.warn('YukiCat Slider: jQuery not found. Will retry when document is ready.');
        document.addEventListener('DOMContentLoaded', function() {
            // 最后尝试获取jQuery
            $ = window.jQuery || window.$;
            
            if (!$) {
                console.warn('YukiCat Slider: All jQuery detection methods failed. Slider will not initialize.');
                return;
            } else {
                // jQuery已找到，延迟初始化
                initWithjQuery($);
            }
        });
        return;
    } else {
        // jQuery可用，立即使用
        initWithjQuery($);
    }

function initWithjQuery($) {

    class YukiCatSlider {
        constructor(element, options) {
            if (!element) {
                return;
            }
            
            this.container = $(element);
            
            // Check if we're in a shadow root
            this.shadowRoot = (options && options.shadowRoot) || null;
            
            // Use shadow root as document context if available
            this.doc = this.shadowRoot || document;
            
            // 安全检查：确保找到容器
            if (!this.container.length) {
                return;
            }
            
            // 已初始化检查 - 防止重复初始化
            const existingInstance = this.container.data('yukicat-slider-initialized');
            if (existingInstance) {
                return;
            }
            
            this.container.data('yukicat-slider-initialized', true);
            
            this.isActive = false;
            this.currentPosition = 50; // 百分比
            this.currentIndex = 0;
            this.nextIndex = 1;
            this.layers = this.container.find('.yukicat-bas-layer');
            this.handle = this.container.find('.yukicat-bas-handle');
            this.handleButton = this.container.find('.yukicat-bas-handle-button');
            this.progressBar = this.container.find('.yukicat-bas-progress-bar');
            this.indicators = this.container.find('.yukicat-bas-indicator');
            this.totalImages = this.layers.length;
            this.animationFrame = null;
            this.containerRect = null;
            
            // 检查必要的元素
            if (this.layers.length < 2) {
                return;
            }
            
            if (!this.handle.length || !this.handleButton.length) {
                return;
            }
            
            // 配置选项
            this.options = $.extend({
                moveSliderOnHover: false,        // 悬停时移动滑块
                clickToMove: true,               // 点击时移动滑块
                moveWithHandleOnly: false,       // 仅通过滑块把手移动
                autoSlide: false,                // 自动滑动
                autoSlideTime: 5000,             // 自动滑动时间间隔（毫秒）
                orientation: 'horizontal'        // 方向 horizontal/vertical
            }, options || {});
            
            // 根据容器的属性设置
            try {
                if (this.container.data('hover-move') !== undefined) {
                    this.options.moveSliderOnHover = this.container.data('hover-move') === 'true';
                }
                if (this.container.data('click-move') !== undefined) {
                    this.options.clickToMove = this.container.data('click-move') === 'true';
                }
                if (this.container.data('handle-only') !== undefined) {
                    this.options.moveWithHandleOnly = this.container.data('handle-only') === 'true';
                }
                if (this.container.data('auto-slide') !== undefined) {
                    this.options.autoSlide = this.container.data('auto-slide') === 'true';
                }
                if (this.container.data('orientation') !== undefined) {
                    this.options.orientation = this.container.data('orientation');
                }
            } catch (e) {
                // 静默处理数据属性错误
            }
            
            // 设置正确的方向类
            if (this.options.orientation === 'vertical') {
                this.container.addClass('yukicat-bas-vertical');
            }
            
            try {
                this.init();
            } catch(e) {
                // 静默处理初始化错误，防止影响页面其他部分
            }
        }

        init() {
            try {
                // 检查是否在Gutenberg编辑器环境中
                const isInEditor = window.wp && window.wp.blocks && 
                                (window.wp.data && window.wp.data.select('core/editor') || 
                                document.body.classList.contains('block-editor-page'));
                
                // 给所有图层添加正确的类名
                if (this.layers && this.layers.length >= 2) {
                    // 分配Before/After类到图层
                    for(let i = 0; i < this.layers.length; i++) {
                        try {
                            const $layer = $(this.layers[i]);
                            if (!$layer || !$layer.length) continue;
                            
                            // 清除可能存在的类
                            $layer.removeClass('active next yukicat-bas-before yukicat-bas-after');
                            
                            if (i === 0) {
                                $layer.addClass('yukicat-bas-before');
                                $layer.addClass('active');
                            } else if (i === 1) {
                                $layer.addClass('yukicat-bas-after');
                                $layer.addClass('next');
                            } else {
                                $layer.addClass('yukicat-bas-extra');
                            }
                            
                            // 确保所有图层可见性正确
                            $layer.css('opacity', i < 2 ? 1 : 0);
                        } catch (layerError) {
                            // 静默处理单个图层的错误
                        }
                    }
                    
                    // 特殊处理：在Gutenberg编辑器中可能需要交换顺序
                    if (isInEditor) {
                        try {
                            // 由于在编辑器环境中顺序可能会变，我们通过标签或其他方式确保正确的顺序
                            const beforeLayer = this.layers.filter('.yukicat-bas-before').first();
                            const afterLayer = this.layers.filter('.yukicat-bas-after').first();
                            
                            // 如果标记了但顺序错了，交换它们的DOM顺序
                            if (beforeLayer.length && afterLayer.length && beforeLayer.index() > afterLayer.index()) {
                                const layersContainer = beforeLayer.parent();
                                if (layersContainer && layersContainer.length) {
                                    layersContainer.prepend(beforeLayer);
                                    
                                    // 刷新layers引用和索引
                                    this.layers = this.container.find('.yukicat-bas-layer');
                                }
                            }
                        } catch (editorError) {
                            // 静默处理编辑器环境中的错误
                        }
                    }
                }
                
                // 绑定事件和设置键盘
                try {
                    this.bindEvents();
                    this.setupKeyboard();
                } catch (eventsError) {
                    // 静默处理事件绑定错误
                }
                
                // 设置正确的方向类
                if (this.options && this.options.orientation === 'vertical') {
                    this.container.addClass('yukicat-bas-vertical');
                }
                
                // 强制设置初始状态
                try {
                    this.forceInitialState();
                    
                    // 更新滑块位置
                    this.updateSlider();
                    
                    // 处理图片大小差异
                    this.adjustImageSizes();
                } catch (stateError) {
                    // 静默处理状态设置错误
                }
                
                // 特殊处理Gutenberg编辑器环境
                if (isInEditor) {
                    // 确保在编辑器中正确显示
                    this.container.addClass('yukicat-bas-in-editor');
                    
                    // 强制重新计算尺寸
                    setTimeout(() => {
                        try {
                            this.handleResize();
                            this.forceInitialState();
                            
                            // 在编辑器中固定初始位置为50%
                            this.setPosition(50);
                        } catch (editorResizeError) {
                            // 静默处理编辑器环境中的重新计算错误
                        }
                    }, 100);
                }
                
                // 添加初始动画提示，非编辑器环境下显示
                if (!isInEditor && this.handleButton && this.handleButton.length) {
                    setTimeout(() => {
                        try {
                            this.handleButton.addClass('active');
                            setTimeout(() => {
                                this.handleButton.removeClass('active');
                            }, 3000);
                        } catch (animationError) {
                            // 静默处理动画错误
                        }
                    }, 1000);
                }
            } catch (initError) {
                // 静默处理整个初始化过程中的错误
            }
        }

        forceInitialState() {
            // 强制设置正确的初始状态
            if (this.totalImages >= 2) {
                // 移除所有类，重新设置
                this.layers.removeClass('active next');
                
                // 第一张图片设为active（顶层，显示左边）
                this.layers.eq(0).addClass('active');
                
                // 第二张图片设为next（底层，显示右边）
                this.layers.eq(1).addClass('next');
                
                // 立即应用裁剪 - 正确的方向：左边是第一张图片，右边是第二张图片
                // active层（第一张图片）从右边裁剪，显示左侧部分
                this.layers.eq(0).css('clip-path', `inset(0 ${100-this.currentPosition}% 0 0)`);
                // next层（第二张图片）完整显示作为背景
                this.layers.eq(1).css('clip-path', 'none');
                
                // 静默执行，无需日志输出
            }
        }

        bindEvents() {
            try {
                // 存储绑定的函数引用，以便解绑和重新绑定
                this._boundStartDrag = this.startDrag.bind(this);
                this._boundDrag = this.drag.bind(this);
                this._boundEndDrag = this.endDrag.bind(this);
                this._boundIndicatorClick = this.handleIndicatorClick.bind(this);
                this._boundHandleResize = this.handleResize.bind(this);
                this._boundHandleHover = this.handleHover ? this.handleHover.bind(this) : null;
                this._boundHandleClick = this.handleClick ? this.handleClick.bind(this) : null;
                
                // 添加命名空间到所有事件，便于清理
                const namespace = '.yukicat-slider';
                
                // 鼠标事件 - 绑定到容器和滑块
                if (this.handle && this.handle.length) {
                    this.handle.off('mousedown' + namespace + ' touchstart' + namespace)
                             .on('mousedown' + namespace + ' touchstart' + namespace, this._boundStartDrag);
                }
                
                // 仅当不限制为只能拖动手柄时，允许点击容器任意位置拖动
                if (this.container && this.container.length) {
                    this.container.off('mousedown' + namespace + ' touchstart' + namespace)
                                 .on('mousedown' + namespace + ' touchstart' + namespace, (e) => {
                        try {
                            // 只有点击到容器本身或滑块时才开始拖拽
                            if (e.target === this.container[0] || $(e.target).closest('.yukicat-bas-handle').length > 0) {
                                if (e.type === 'touchstart') {
                                    e.preventDefault(); // 防止触摸时的滚动
                                }
                                this.startDrag(e);
                            }
                        } catch (dragError) {
                            // 静默处理拖拽启动错误
                        }
                    });
                }
                
                // 使用命名空间防止重复绑定和冲突
                try {
                    // Use shadowRoot context if available, otherwise use document
                    const docContext = this.shadowRoot ? $(this.shadowRoot) : $(document);
                    
                    docContext.off('mousemove.yukicat touchmove.yukicat')
                              .on('mousemove.yukicat touchmove.yukicat', this._boundDrag);
                    docContext.off('mouseup.yukicat touchend.yukicat')
                              .on('mouseup.yukicat touchend.yukicat', this._boundEndDrag);
                } catch (documentBindError) {
                    // 静默处理文档事件绑定错误
                }

                // 指示器点击
                if (this.indicators && this.indicators.length) {
                    this.indicators.off('click' + namespace).on('click' + namespace, this._boundIndicatorClick);
                }

                // 悬停时移动滑块
                if (this._boundHandleHover && this.options && this.options.moveSliderOnHover && this.container && this.container.length) {
                    this.container.off('mousemove' + namespace).on('mousemove' + namespace, this._boundHandleHover);
                }
                
                // 点击时移动滑块
                if (this._boundHandleClick && this.options && this.options.clickToMove && this.container && this.container.length) {
                    this.container.off('click' + namespace).on('click' + namespace, this._boundHandleClick);
                }
                
                // 自动滑动
                if (this.options && this.options.autoSlide && typeof this.startAutoSlide === 'function') {
                    this.startAutoSlide();
                    
                    // 当鼠标悬停时停止自动滑动，移开时恢复
                    if (this.container && this.container.length) {
                        this.container.off('mouseenter' + namespace).on('mouseenter' + namespace, () => {
                            try {
                                if (typeof this.stopAutoSlide === 'function') {
                                    this.stopAutoSlide();
                                }
                            } catch (autoSlideError) {
                                // 静默处理自动滑动错误
                            }
                        });
                        
                        this.container.off('mouseleave' + namespace).on('mouseleave' + namespace, () => {
                            try {
                                if (this.options && this.options.autoSlide && typeof this.startAutoSlide === 'function') {
                                    this.startAutoSlide();
                                }
                            } catch (autoSlideError) {
                                // 静默处理自动滑动错误
                            }
                        });
                    }
                }

                // 窗口调整大小 - 使用节流函数防止过度触发
                try {
                    $(window).off('resize.yukicat').on('resize.yukicat', this._boundHandleResize);
                } catch (resizeError) {
                    // 静默处理窗口调整大小事件绑定错误
                }

                // 防止图片拖拽和右键菜单
                try {
                    if (this.container && this.container.length) {
                        this.container.find('img').off('dragstart' + namespace + ' selectstart' + namespace + ' contextmenu' + namespace)
                                           .on('dragstart' + namespace + ' selectstart' + namespace + ' contextmenu' + namespace, function(e) {
                            e.preventDefault();
                            return false;
                        });
                        
                        // 防止整个容器的默认行为，但允许滑块交互
                        this.container.off('dragstart' + namespace + ' selectstart' + namespace + ' contextmenu' + namespace)
                                     .on('dragstart' + namespace + ' selectstart' + namespace + ' contextmenu' + namespace, function(e) {
                            if (!$(e.target).closest('.yukicat-bas-handle').length) {
                                e.preventDefault();
                                return false;
                            }
                        });
                    }
                } catch (dragError) {
                    // 静默处理图片拖拽防止错误
                }
            } catch (bindError) {
                // 静默处理整个事件绑定过程中的错误
            }
        }

        setupKeyboard() {
            this.container.attr('tabindex', '0');
            this.container.on('keydown', this.handleKeyboard.bind(this));
        }

        startDrag(e) {
            // 防止重复触发
            if (this.isActive) {
                return;
            }
            
            // 检查是否只允许通过滑块把手拖动
            if (this.options && this.options.moveWithHandleOnly) {
                // 如果用户点击的不是把手区域，忽略事件
                const targetEl = $(e.target);
                if (!targetEl.is('.yukicat-bas-handle') && !targetEl.is('.yukicat-bas-handle-button') && 
                    !targetEl.closest('.yukicat-bas-handle, .yukicat-bas-handle-button').length) {
                    return;
                }
            }
            
            if (e.cancelable) {
                e.preventDefault();
            }
            e.stopPropagation();
            
            this.isActive = true;
            this.container.addClass('dragging');
            this.handleButton.addClass('active');
            
            // 保存起始点，用于计算拖动距离
            if (e.type === 'touchstart' && e.originalEvent && e.originalEvent.touches && e.originalEvent.touches[0]) {
                this.dragStartX = e.originalEvent.touches[0].clientX;
                this.dragStartY = e.originalEvent.touches[0].clientY;
            } else if (e.touches && e.touches[0]) {
                this.dragStartX = e.touches[0].clientX;
                this.dragStartY = e.touches[0].clientY;
            } else {
                this.dragStartX = e.clientX;
                this.dragStartY = e.clientY;
            }
            
            // 立即获取容器尺寸，避免后续计算错误
            this.containerRect = this.container[0].getBoundingClientRect();
        }

        drag(e) {
            if (!this.isActive) return;
            
            if (e.cancelable) {
                e.preventDefault();
            }
            e.stopPropagation();
            
            // 提取触摸/鼠标坐标，考虑不同浏览器和设备的兼容性
            let clientX, clientY;
            
            if (e.type.includes('touch')) {
                if (e.originalEvent && e.originalEvent.touches && e.originalEvent.touches[0]) {
                    clientX = e.originalEvent.touches[0].clientX;
                    clientY = e.originalEvent.touches[0].clientY;
                } else if (e.touches && e.touches[0]) {
                    clientX = e.touches[0].clientX;
                    clientY = e.touches[0].clientY;
                } else {
                    return; // 无效的触摸事件
                }
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }
            
            // 使用缓存的容器尺寸，如果没有则重新获取
            const rect = this.containerRect || this.container[0].getBoundingClientRect();
            
            // 根据方向计算位置
            let newPosition;
            if (this.options && this.options.orientation === 'vertical') {
                const y = clientY - rect.top;
                newPosition = Math.max(0, Math.min(100, (y / rect.height) * 100));
            } else {
                const x = clientX - rect.left;
                newPosition = Math.max(0, Math.min(100, (x / rect.width) * 100));
            }
            
            // 防止值跳变
            if (Math.abs(newPosition - this.currentPosition) > 50) {
                // 如果变化太大，可能是出现了问题，使用缓慢渐进的方式调整
                this.currentPosition = this.currentPosition + (newPosition - this.currentPosition) * 0.1;
            } else {
                this.currentPosition = newPosition;
            }
            
            // 更新UI
            this.updateSlider();
            this.updateImageTransition();
        }

        endDrag() {
            if (!this.isActive) return;
            
            this.isActive = false;
            this.container.removeClass('dragging');
            this.handleButton.removeClass('active');
            
            // 清除缓存的容器尺寸
            this.containerRect = null;
        }

        updateSlider() {
            try {
                // 先检查必要的元素是否存在
                if (!this.handle || !this.handle.length || !this.progressBar || !this.progressBar.length) {
                    return;
                }
                
                // 根据方向更新滑块位置
                if (this.options && this.options.orientation === 'horizontal') {
                    try {
                        this.handle.css({
                            'left': this.currentPosition + '%',
                            'top': ''
                        });
                        // 更新进度条
                        this.progressBar.css({
                            'width': this.currentPosition + '%',
                            'height': ''
                        });
                    } catch (horizontalError) {
                        // 静默处理水平方向更新错误
                    }
                } else {
                    try {
                        this.handle.css({
                            'top': this.currentPosition + '%',
                            'left': ''
                        });
                        // 更新进度条
                        this.progressBar.css({
                            'height': this.currentPosition + '%',
                            'width': ''
                        });
                    } catch (verticalError) {
                        // 静默处理垂直方向更新错误
                    }
                }
                
                // 更新图片裁剪
                this.updateImageClipping();
            } catch (updateError) {
                // 静默处理整个更新过程中的错误
            }
        }

        updateImageTransition() {
            if (this.totalImages <= 2) return;
            
            // 计算应该显示的图片索引
            const segmentSize = 100 / (this.totalImages - 1);
            const newIndex = Math.floor(this.currentPosition / segmentSize);
            const newNextIndex = Math.min(newIndex + 1, this.totalImages - 1);
            
            if (newIndex !== this.currentIndex || newNextIndex !== this.nextIndex) {
                this.currentIndex = newIndex;
                this.nextIndex = newNextIndex;
                this.updateActiveImages();
                this.updateIndicators();
            }
        }

        updateActiveImages() {
            this.layers.removeClass('active next');
            
            if (this.totalImages <= 2) {
                // 两张图片模式，始终显示两张
                this.layers.eq(0).addClass('active');
                if (this.totalImages === 2) {
                    this.layers.eq(1).addClass('next');
                }
            } else {
                // 多张图片模式
                this.layers.eq(this.currentIndex).addClass('active');
                
                // 显示下一张图片（如果存在）
                if (this.nextIndex !== this.currentIndex) {
                    this.layers.eq(this.nextIndex).addClass('next');
                }
            }
        }

        updateImageClipping() {
            if (this.totalImages <= 2) {
                // 传统的两张图片模式
                // 第一张图片（顶层active）从右边裁剪，显示左边部分
                this.layers.eq(0).css({
                    'clip-path': `inset(0 ${100-this.currentPosition}% 0 0)`
                });
                
                // 第二张图片（底层next）不裁剪，完全显示作为背景
                if (this.totalImages === 2) {
                    this.layers.eq(1).css('clip-path', 'none');
                    
                    // 静默执行，无需日志输出
                }
            } else {
                // 多张图片模式
                const segmentSize = 100 / (this.totalImages - 1);
                const currentSegment = this.currentPosition / segmentSize;
                const segmentProgress = (currentSegment - this.currentIndex) * 100;
                
                // 重置所有图片的裁剪
                this.layers.css('clip-path', 'none');
                
                // 只对活动图片应用裁剪
                if (this.nextIndex !== this.currentIndex) {
                    // 当前活动图片从右边裁剪
                    this.layers.eq(this.currentIndex).css({
                        'clip-path': `inset(0 ${100 - segmentProgress}% 0 0)`
                    });
                }
            }
        }

        updateIndicators() {
            if (this.indicators.length === 0) return;
            
            this.indicators.removeClass('active');
            this.indicators.eq(this.currentIndex).addClass('active');
        }

        handleIndicatorClick(e) {
            const index = $(e.currentTarget).data('index');
            this.jumpToImage(index);
        }

        jumpToImage(index) {
            if (index < 0 || index >= this.totalImages) return;
            
            const segmentSize = 100 / (this.totalImages - 1);
            this.currentPosition = index * segmentSize;
            this.currentIndex = index;
            this.nextIndex = Math.min(index + 1, this.totalImages - 1);
            
            this.updateSlider();
            this.updateActiveImages();
            this.updateIndicators();
        }

        handleKeyboard(e) {
            const step = 5; // 每次移动5%
            
            switch(e.which) {
                case 37: // 左箭头
                    e.preventDefault();
                    this.currentPosition = Math.max(0, this.currentPosition - step);
                    this.updateSlider();
                    this.updateImageTransition();
                    break;
                    
                case 39: // 右箭头
                    e.preventDefault();
                    this.currentPosition = Math.min(100, this.currentPosition + step);
                    this.updateSlider();
                    this.updateImageTransition();
                    break;
                    
                case 36: // Home键
                    e.preventDefault();
                    this.jumpToImage(0);
                    break;
                    
                case 35: // End键
                    e.preventDefault();
                    this.jumpToImage(this.totalImages - 1);
                    break;
                    
                case 32: // 空格键 - 重置到中间
                    e.preventDefault();
                    this.currentPosition = 50;
                    this.updateSlider();
                    this.updateImageTransition();
                    break;
            }
        }

        handleResize() {
            // 响应式处理
            this.updateSlider();
        }

        // 公共方法
        setPosition(percentage) {
            this.currentPosition = Math.max(0, Math.min(100, percentage));
            this.updateSlider();
            this.updateImageTransition();
        }

        reset() {
            this.setPosition(50);
        }

        getCurrentPosition() {
            return this.currentPosition;
        }

        getCurrentImageIndex() {
            return this.currentIndex;
        }

        destroy() {
            try {
                // 先将isActive设置为false以防止任何正在进行的操作
                this.isActive = false;
                
                // 取消任何动画帧
                if (this.animationFrame) {
                    cancelAnimationFrame(this.animationFrame);
                    this.animationFrame = null;
                }
                
                // 停止自动滑动
                if (typeof this.stopAutoSlide === 'function') {
                    try {
                        this.stopAutoSlide();
                    } catch (e) {
                        // 静默处理停止自动滑动的错误
                    }
                }
                
                // 安全地清理事件监听器
                try {
                    // Use shadowRoot context if available, otherwise use document
                    const docContext = this.shadowRoot ? $(this.shadowRoot) : $(document);
                    
                    // 移除文档级别的事件监听器
                    docContext.off('mousemove.yukicat touchmove.yukicat');
                    docContext.off('mouseup.yukicat touchend.yukicat');
                    docContext.off('keydown.yukicat');
                    
                    // 移除滑块把手的事件
                    if (this.handle && this.handle.length) {
                        this.handle.off('.yukicat-slider'); // 使用命名空间移除事件
                    }
                    
                    // 移除按钮的事件
                    if (this.handleButton && this.handleButton.length) {
                        this.handleButton.off('.yukicat-slider');
                    }
                } catch (e) {
                    // 静默处理移除事件的错误
                }
                
                // 清理容器
                try {
                    if (this.container && this.container.length) {
                        this.container.off('.yukicat-slider'); // 使用命名空间移除事件
                        // 移除可能的类
                        this.container.removeClass('dragging initialized');
                        // 移除数据引用
                        this.container.removeData('yukicat-slider');
                        this.container.removeData('yukicat-slider-initialized');
                    }
                } catch (e) {
                    // 静默处理容器清理错误
                }
                
                // 清理指示器
                try {
                    if (this.indicators && this.indicators.length) {
                        this.indicators.off('.yukicat-slider'); // 使用命名空间移除事件
                    }
                } catch (e) {
                    // 静默处理指示器清理错误
                }
                
                // 还原图层样式
                try {
                    if (this.layers && this.layers.length) {
                        this.layers.css({
                            'clip-path': '',
                            'opacity': ''
                        });
                    }
                } catch (e) {
                    // 静默处理样式还原错误
                }
                
                // 使用命名空间清理文档级别的事件
                try {
                    // Use shadowRoot context if available, otherwise use document  
                    const docContext = this.shadowRoot ? $(this.shadowRoot) : $(document);
                    const winContext = this.shadowRoot ? $(this.shadowRoot) : $(window);
                    
                    docContext.off('mousemove.yukicat');
                    docContext.off('mouseup.yukicat');
                    docContext.off('touchmove.yukicat');
                    docContext.off('touchend.yukicat');
                    winContext.off('resize.yukicat');
                } catch (e) {
                    // 静默处理文档事件清理错误
                }
            } catch (destroyError) {
                // 静默处理整个销毁过程中的错误
            }
        }
    }

    // 改进的自动初始化函数
    function initSliders() {
        try {
            // 保存页面上原有的jQuery冲突变量
            const _$ = window.$ || null;
            
            // 确保使用jQuery而非其他库（避免与Prototype等冲突）
            (function($) {
                // 仅初始化尚未初始化的滑块
                $('.yukicat-bas-container:not([data-yukicat-slider-initialized="true"])').each(function() {
                    const $container = $(this);
                    
                    // 检查是否已经初始化过（双重检查）
                    if ($container.data('yukicat-slider-initialized') === true) {
                        return;
                    }
                    
                    // 确保容器有一个唯一ID
                    if (!$container.attr('data-slider-id')) {
                        $container.attr('data-slider-id', 'yukicat-slider-' + Math.random().toString(36).substr(2, 9));
                    }
                    
                    // 确保图片已加载 - 添加loaded类
                    $container.find('img').each(function() {
                        const $img = $(this);
                        if (this.complete) {
                            $img.addClass('loaded');
                        } else {
                            $img.on('load', function() {
                                $(this).addClass('loaded');
                            });
                            
                            // 添加错误处理
                            $img.on('error', function() {
                                // 静默处理错误
                                $(this).addClass('error');
                                $(this).css({
                                    'background-color': '#f0f0f0',
                                    'visibility': 'visible'
                                });
                            });
                        }
                    });
                    
                    try {
                        // 创建新实例
                        const slider = new YukiCatSlider(this);
                        if (slider) {
                            $container.data('yukicat-slider', slider);
                            // 标记初始化完成
                            $container.addClass('initialized');
                        }
                    } catch (e) {
                        // 静默处理单个滑块的错误
                    }
                });
            })(jQuery);
            
            // 恢复原有的$变量，避免破坏其他脚本
            if (_$ !== null) {
                window.$ = _$;
            }
        } catch (e) {
            // 静默处理整个初始化过程的错误
        }
    }

    // 页面加载完成后初始化
    $(document).ready(function() {
        initSliders();
        
        // 使用递增的延迟检查，确保动态加载的内容也能被初始化
        setTimeout(initSliders, 300);
        setTimeout(initSliders, 800);
        setTimeout(initSliders, 1500);
    });

    // 监听窗口加载完成事件
    $(window).on('load', function() {
        initSliders();
        
        // 在load事件后添加CSS变量，帮助解决某些主题样式问题
        $('body').append(`
            <style>
                .yukicat-bas-layer.active.yukicat-bas-before {
                    --clip-right: ${50}%;
                }
            </style>
        `);
        
        // 处理可能的图片延迟加载
        setTimeout(function() {
            $('.yukicat-bas-layer img').each(function() {
                if (!$(this).hasClass('loaded')) {
                    $(this).addClass('loaded');
                    $(this).css('visibility', 'visible');
                }
            });
            // 再次初始化
            initSliders();
        }, 2000);
    });
    
    // 特别针对Gutenberg编辑器的处理
    if (window.wp && window.wp.data && window.wp.data.subscribe) {
        let lastBlockCount = 0;
        
        // 监听区块变化
        window.wp.data.subscribe(() => {
            try {
                // 优先使用新版API
                let blocks;
                if (window.wp.data.select('core/block-editor')) {
                    blocks = window.wp.data.select('core/block-editor').getBlocks();
                } else if (window.wp.data.select('core/editor')) {
                    blocks = window.wp.data.select('core/editor').getBlocks();
                }
                
                if (blocks && blocks.length !== lastBlockCount) {
                    lastBlockCount = blocks.length;
                    // 区块数量变化时重新初始化
                    setTimeout(initSliders, 100);
                }
            } catch (e) {
                // 忽略错误
            }
        });
    }
    
    // 处理滚动事件，使滑块在视口中时显示
    $(window).on('scroll', function() {
        $('.yukicat-bas-container:not(.initialized)').each(function() {
            const rect = this.getBoundingClientRect();
            const windowHeight = window.innerHeight || document.documentElement.clientHeight;
            
            // 如果滑块在可视区域
            if (rect.top <= windowHeight && rect.bottom >= 0) {
                initSliders();
            }
        });
    });

    // 增强的MutationObserver，更好地处理动态添加的滑块
    try {
        const observer = new MutationObserver(function(mutations) {
            let slidersFound = false;
            let gutenbergEditorChanges = false;
            
            mutations.forEach(function(mutation) {
                // 检测是否是古腾堡编辑器中的变化
                if (mutation.target && (
                    mutation.target.classList && 
                    (mutation.target.classList.contains('block-editor-block-list__layout') ||
                     mutation.target.classList.contains('wp-block')))) {
                    gutenbergEditorChanges = true;
                }
                
                if (mutation.type === 'childList') {
                    // 检查是否有新增的滑块元素
                    mutation.addedNodes.forEach(function(node) {
                        try {
                            if (node && node.nodeType === 1) {
                                const $node = $(node);
                                
                                // 直接添加的滑块容器
                                if ($node.hasClass && $node.hasClass('yukicat-bas-container')) {
                                    slidersFound = true;
                                } 
                                // 添加的元素包含滑块容器
                                else if ($node.find && $node.find('.yukicat-bas-container').length > 0) {
                                    slidersFound = true;
                                }
                            }
                        } catch (e) {
                            // 静默处理节点错误
                        }
                    });
                    
                    // 检查属性变化（如添加class）
                    if (mutation.target && mutation.target.nodeType === 1) {
                        try {
                            const $target = $(mutation.target);
                            if (($target.hasClass && $target.hasClass('yukicat-bas-container')) || 
                                ($target.find && $target.find('.yukicat-bas-container').length > 0)) {
                                slidersFound = true;
                            }
                        } catch (e) {
                            // 静默处理目标错误
                        }
                    }
                }
            });
            
            // 如果找到滑块，延迟初始化（防止DOM未完全渲染）
            if (slidersFound) {
                // 确保图片完全加载
                setTimeout(function() {
                    $('.yukicat-bas-container:not(.initialized)').each(function() {
                        $(this).find('img').addClass('loaded').css('visibility', 'visible');
                    });
                    initSliders();
                }, 200);
            }
            
            // 如果是Gutenberg编辑器中的变化，多次尝试初始化
            if (gutenbergEditorChanges) {
                // 在编辑器中需要多次尝试，因为DOM可能会被编辑器多次修改
                setTimeout(initSliders, 100);
                setTimeout(initSliders, 500);
                setTimeout(initSliders, 1000);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style', 'data-block', 'data-type']
        });
    } catch (e) {
        // 浏览器不支持MutationObserver或发生错误
        // 回退到轮询检查
        setInterval(function() {
            // 检查页面上未初始化的滑块
            if ($('.yukicat-bas-container:not(.initialized)').length > 0) {
                initSliders();
            }
        }, 2000);
    }

    // 全局API
    window.YukiCatSlider = YukiCatSlider;

    // jQuery插件形式
    $.fn.yukicatSlider = function(options) {
        return this.each(function() {
            if (!$(this).data('yukicat-slider')) {
                const slider = new YukiCatSlider(this);
                $(this).data('yukicat-slider', slider);
            }
        });
    };
}

// 立即执行上面创建的函数
})();