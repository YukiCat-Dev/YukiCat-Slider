/**
 * 雪猫 Before&After Slider - 前端脚本 (无jQuery依赖)
 */

// Import web component
import './web-component.js';

(function() {
    'use strict';
    
    // 辅助函数：获取/设置 data 属性
    function getData(element, key) {
        const dataKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        return element.dataset[dataKey];
    }
    
    function setData(element, key, value) {
        const dataKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        element.dataset[dataKey] = value;
    }

    class YukiCatSlider {
        constructor(element, options) {
            if (!element) {
                return;
            }
            
            // 支持 DOM 元素和选择器字符串
            this.container = typeof element === 'string' ? document.querySelector(element) : element;
            
            if (!this.container) {
                return;
            }
            
            // 检查是否在 shadow root 中
            this.shadowRoot = (options && options.shadowRoot) || null;
            
            // 使用 shadow root 作为文档上下文（如果可用）
            this.doc = this.shadowRoot || document;
            
            // 已初始化检查 - 防止重复初始化
            if (getData(this.container, 'yukicat-slider-initialized')) {
                return;
            }
            
            setData(this.container, 'yukicat-slider-initialized', 'true');
            
            this.isActive = false;
            this.currentPosition = 50; // 百分比
            this.currentIndex = 0;
            this.nextIndex = 1;
            this.layers = Array.from(this.container.querySelectorAll('.yukicat-bas-layer'));
            this.handle = this.container.querySelector('.yukicat-bas-handle');
            this.handleButton = this.container.querySelector('.yukicat-bas-handle-button');
            this.indicators = Array.from(this.container.querySelectorAll('.yukicat-bas-indicator'));
            this.totalImages = this.layers.length;
            this.animationFrame = null;
            this.containerRect = null;
            
            // 检查必要的元素
            if (this.layers.length < 2 || !this.handle || !this.handleButton) {
                return;
            }
            
            // 配置选项
            this.options = Object.assign({
                moveSliderOnHover: false,
                clickToMove: true,
                moveWithHandleOnly: false,
                autoSlide: false,
                autoSlideTime: 5000,
                orientation: 'horizontal'
            }, options || {});
            
            // 根据容器的 data 属性设置
            try {
                const hoverMove = getData(this.container, 'hover-move');
                if (hoverMove !== undefined) {
                    this.options.moveSliderOnHover = hoverMove === 'true';
                }
                const clickMove = getData(this.container, 'click-move');
                if (clickMove !== undefined) {
                    this.options.clickToMove = clickMove === 'true';
                }
                const handleOnly = getData(this.container, 'handle-only');
                if (handleOnly !== undefined) {
                    this.options.moveWithHandleOnly = handleOnly === 'true';
                }
                const autoSlide = getData(this.container, 'auto-slide');
                if (autoSlide !== undefined) {
                    this.options.autoSlide = autoSlide === 'true';
                }
                const orientation = getData(this.container, 'orientation');
                if (orientation !== undefined) {
                    this.options.orientation = orientation;
                }
            } catch (e) {
                // 静默处理数据属性错误
            }
            
            // 设置正确的方向类
            if (this.options.orientation === 'vertical') {
                this.container.classList.add('yukicat-bas-vertical');
            }
            
            // 根据方向创建获取客户端坐标的函数（可复用模式）
            this.getClientCoord = this.options.orientation === 'vertical' 
                ? (e) => e.clientY 
                : (e) => e.clientX;
            
            try {
                this.init();
            } catch(e) {
                // 静默处理初始化错误，防止影响页面其他部分
            }
        }

        init() {
            // 检查是否在Gutenberg编辑器环境中
            const isInEditor = window.wp && window.wp.blocks && 
                            (window.wp.data && window.wp.data.select('core/editor') || 
                            document.body.classList.contains('block-editor-page'));
            
            // 给所有图层添加正确的类名
            if (this.layers && this.layers.length >= 2) {
                // 分配Before/After类到图层
                for(let i = 0; i < this.layers.length; i++) {
                    const layer = this.layers[i];
                    
                    // 清除可能存在的类
                    layer.classList.remove('active', 'next', 'yukicat-bas-before', 'yukicat-bas-after');
                    
                    if (i === 0) {
                        layer.classList.add('yukicat-bas-before', 'active');
                    } else if (i === 1) {
                        layer.classList.add('yukicat-bas-after', 'next');
                    } else {
                        layer.classList.add('yukicat-bas-extra');
                    }
                    
                    // 确保所有图层可见性正确
                    layer.style.opacity = i < 2 ? '1' : '0';
                }
                
                // 特殊处理：在Gutenberg编辑器中可能需要交换顺序
                if (isInEditor) {
                    const beforeLayer = this.layers.find(l => l.classList.contains('yukicat-bas-before'));
                    const afterLayer = this.layers.find(l => l.classList.contains('yukicat-bas-after'));
                    
                    if (beforeLayer && afterLayer) {
                        const beforeIndex = this.layers.indexOf(beforeLayer);
                        const afterIndex = this.layers.indexOf(afterLayer);
                        
                        if (beforeIndex > afterIndex) {
                            const layersContainer = beforeLayer.parentNode;
                            if (layersContainer) {
                                layersContainer.insertBefore(beforeLayer, layersContainer.firstChild);
                                // 刷新layers引用
                                this.layers = Array.from(this.container.querySelectorAll('.yukicat-bas-layer'));
                            }
                        }
                    }
                }
            }
            
            // 绑定事件和设置键盘
            this.bindEvents();
            this.setupKeyboard();
            
            // 设置正确的方向类
            if (this.options && this.options.orientation === 'vertical') {
                this.container.classList.add('yukicat-bas-vertical');
            }
            
            // 强制设置初始状态
            this.forceInitialState();
            
            // 更新滑块位置
            this.updateSlider();
            
            // 处理图片大小差异
            if (typeof this.adjustImageSizes === 'function') {
                this.adjustImageSizes();
            }
            
            // 特殊处理Gutenberg编辑器环境
            if (isInEditor) {
                this.container.classList.add('yukicat-bas-in-editor');
                
                setTimeout(() => {
                    this.handleResize();
                    this.forceInitialState();
                    this.setPosition(50);
                }, 100);
            }
            
            // 添加初始动画提示，非编辑器环境下显示
            if (!isInEditor && this.handleButton) {
                setTimeout(() => {
                    this.handleButton.classList.add('active');
                    setTimeout(() => {
                        this.handleButton.classList.remove('active');
                    }, 3000);
                }, 1000);
            }
        }

        forceInitialState() {
            // 强制设置正确的初始状态
            if (this.totalImages >= 2) {
                // 移除所有类，重新设置
                this.layers.forEach(layer => {
                    layer.classList.remove('active', 'next');
                });
                
                // 第一张图片设为active（顶层，显示左边）
                this.layers[0].classList.add('active');
                
                // 第二张图片设为next（底层，显示右边）
                this.layers[1].classList.add('next');
                
                // 立即应用裁剪
                this.layers[0].style.clipPath = `inset(0 ${100-this.currentPosition}% 0 0)`;
                this.layers[1].style.clipPath = 'none';
            }
        }

        bindEvents() {
            // 存储绑定的函数引用，以便解绑和重新绑定
            this._boundStartDrag = this.startDrag.bind(this);
            this._boundIndicatorClick = this.handleIndicatorClick.bind(this);
            this._boundHandleResize = this.handleResize.bind(this);
            this._boundHandleHover = this.handleHover ? this.handleHover.bind(this) : null;
            this._boundHandleClick = this.handleClick ? this.handleClick.bind(this) : null;
            
            // 使用Pointer Events替代Touch/Mouse Events
            if (this.handle) {
                this.handle.addEventListener('pointerdown', this._boundStartDrag);
            }
            
            // 仅当不限制为只能拖动手柄时，允许点击容器任意位置拖动
            if (!this.options.moveWithHandleOnly) {
                this.container.addEventListener('pointerdown', (e) => {
                    // 只有点击到容器本身或滑块时才开始拖拽
                    if (e.target === this.container || e.target.closest('.yukicat-bas-handle')) {
                        this.startDrag(e);
                    }
                });
            }

            // 注意：pointermove 和 pointerup 事件现在在 startDrag 中动态注册

            // 指示器点击
            if (this.indicators && this.indicators.length) {
                this.indicators.forEach(indicator => {
                    indicator.addEventListener('click', this._boundIndicatorClick);
                });
            }

            // 悬停时移动滑块
            if (this._boundHandleHover && this.options && this.options.moveSliderOnHover) {
                this.container.addEventListener('pointermove', this._boundHandleHover);
            }
            
            // 点击时移动滑块
            if (this._boundHandleClick && this.options && this.options.clickToMove) {
                this.container.addEventListener('click', this._boundHandleClick);
            }
            
            // 自动滑动
            if (this.options && this.options.autoSlide && typeof this.startAutoSlide === 'function') {
                this.startAutoSlide();
                
                // 当鼠标悬停时停止自动滑动，移开时恢复
                this.container.addEventListener('pointerenter', () => {
                    if (typeof this.stopAutoSlide === 'function') {
                        this.stopAutoSlide();
                    }
                });
                
                this.container.addEventListener('pointerleave', () => {
                    if (this.options && this.options.autoSlide && typeof this.startAutoSlide === 'function') {
                        this.startAutoSlide();
                    }
                });
            }

            // 窗口调整大小
            window.addEventListener('resize', this._boundHandleResize);

            // 防止图片拖拽和右键菜单
            const images = this.container.querySelectorAll('img');
            images.forEach(img => {
                img.addEventListener('dragstart', (e) => e.preventDefault());
                img.addEventListener('selectstart', (e) => e.preventDefault());
                img.addEventListener('contextmenu', (e) => e.preventDefault());
            });
            
            // 防止整个容器的默认行为，但允许滑块交互
            this.container.addEventListener('dragstart', (e) => {
                if (!e.target.closest('.yukicat-bas-handle')) {
                    e.preventDefault();
                }
            });
            this.container.addEventListener('selectstart', (e) => {
                if (!e.target.closest('.yukicat-bas-handle')) {
                    e.preventDefault();
                }
            });
            this.container.addEventListener('contextmenu', (e) => {
                if (!e.target.closest('.yukicat-bas-handle')) {
                    e.preventDefault();
                }
            });
        }

        setupKeyboard() {
            this.container.setAttribute('tabindex', '0');
            this.container.addEventListener('keydown', this.handleKeyboard.bind(this));
        }

        startDrag(e) {
            // 防止重复触发
            if (this.isActive) {
                return;
            }
            
            // 检查是否只允许通过滑块把手拖动
            if (this.options && this.options.moveWithHandleOnly) {
                const target = e.target;
                if (!target.classList.contains('yukicat-bas-handle') && 
                    !target.classList.contains('yukicat-bas-handle-button') && 
                    !target.closest('.yukicat-bas-handle') &&
                    !target.closest('.yukicat-bas-handle-button')) {
                    return;
                }
            }
            
            if (e.cancelable) {
                e.preventDefault();
            }
            e.stopPropagation();
            
            this.isActive = true;
            this.container.classList.add('dragging');
            this.handleButton.classList.add('active');
            
            // 立即获取容器尺寸，避免后续计算错误
            this.containerRect = this.container.getBoundingClientRect();
            
            // 创建拖动和结束拖动的处理函数
            this._boundDrag = this.drag.bind(this);
            this._boundEndDrag = this.endDrag.bind(this);
            
            // 动态在 document 上注册 pointermove 和 pointerup 事件
            // 注意：按照issue要求，在ShadowRoot上注册会导致功能异常，所以使用document
            document.addEventListener('pointermove', this._boundDrag);
            document.addEventListener('pointerup', this._boundEndDrag);
            document.addEventListener('pointercancel', this._boundEndDrag);
        }

        drag(e) {
            if (!this.isActive) return;
            
            if (e.cancelable) {
                e.preventDefault();
            }
            e.stopPropagation();
            
            // 使用可复用的编程模式：只获取需要的坐标（clientX或clientY）
            const clientCoord = this.getClientCoord(e);
            
            // 使用缓存的容器尺寸，如果没有则重新获取
            const rect = this.containerRect || this.container.getBoundingClientRect();
            
            // 根据方向计算位置
            let newPosition;
            if (this.options && this.options.orientation === 'vertical') {
                const y = clientCoord - rect.top;
                newPosition = Math.max(0, Math.min(100, (y / rect.height) * 100));
            } else {
                const x = clientCoord - rect.left;
                newPosition = Math.max(0, Math.min(100, (x / rect.width) * 100));
            }
            
            // 防止值跳变
            if (Math.abs(newPosition - this.currentPosition) > 50) {
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
            this.container.classList.remove('dragging');
            this.handleButton.classList.remove('active');
            
            // 清除缓存的容器尺寸
            this.containerRect = null;
            
            // 动态移除在 startDrag 中注册的事件监听器
            document.removeEventListener('pointermove', this._boundDrag);
            document.removeEventListener('pointerup', this._boundEndDrag);
            document.removeEventListener('pointercancel', this._boundEndDrag);
        }

        updateSlider() {
            // 先检查必要的元素是否存在
            if (!this.handle) {
                throw new Error('YukiCatSlider: Required element (handle) not found');
            }
            
            // 根据方向更新滑块位置
            if (this.options && this.options.orientation === 'horizontal') {
                this.handle.style.left = this.currentPosition + '%';
                this.handle.style.top = '';
            } else {
                this.handle.style.top = this.currentPosition + '%';
                this.handle.style.left = '';
            }
            
            // 更新图片裁剪
            this.updateImageClipping();
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
            this.layers.forEach(layer => {
                layer.classList.remove('active', 'next');
            });
            
            if (this.totalImages <= 2) {
                // 两张图片模式，始终显示两张
                this.layers[0].classList.add('active');
                if (this.totalImages === 2) {
                    this.layers[1].classList.add('next');
                }
            } else {
                // 多张图片模式
                this.layers[this.currentIndex].classList.add('active');
                
                // 显示下一张图片（如果存在）
                if (this.nextIndex !== this.currentIndex) {
                    this.layers[this.nextIndex].classList.add('next');
                }
            }
        }

        updateImageClipping() {
            if (this.totalImages <= 2) {
                // 传统的两张图片模式
                this.layers[0].style.clipPath = `inset(0 ${100-this.currentPosition}% 0 0)`;
                
                if (this.totalImages === 2) {
                    this.layers[1].style.clipPath = 'none';
                }
            } else {
                // 多张图片模式
                const segmentSize = 100 / (this.totalImages - 1);
                const currentSegment = this.currentPosition / segmentSize;
                const segmentProgress = (currentSegment - this.currentIndex) * 100;
                
                // 重置所有图片的裁剪
                this.layers.forEach(layer => {
                    layer.style.clipPath = 'none';
                });
                
                // 只对活动图片应用裁剪
                if (this.nextIndex !== this.currentIndex) {
                    this.layers[this.currentIndex].style.clipPath = `inset(0 ${100 - segmentProgress}% 0 0)`;
                }
            }
        }

        updateIndicators() {
            if (this.indicators.length === 0) return;
            
            this.indicators.forEach(indicator => {
                indicator.classList.remove('active');
            });
            this.indicators[this.currentIndex].classList.add('active');
        }

        handleIndicatorClick(e) {
            const index = parseInt(getData(e.currentTarget, 'index'));
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
            
            switch(e.which || e.keyCode) {
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
                
                // 移除事件监听器
                if (this.handle && this._boundStartDrag) {
                    this.handle.removeEventListener('pointerdown', this._boundStartDrag);
                }
                
                if (this.indicators && this._boundIndicatorClick) {
                    this.indicators.forEach(indicator => {
                        indicator.removeEventListener('click', this._boundIndicatorClick);
                    });
                }
                
                if (this._boundHandleResize) {
                    window.removeEventListener('resize', this._boundHandleResize);
                }
                
                // 移除可能在 startDrag 中注册的事件
                if (this._boundDrag) {
                    document.removeEventListener('pointermove', this._boundDrag);
                }
                if (this._boundEndDrag) {
                    document.removeEventListener('pointerup', this._boundEndDrag);
                    document.removeEventListener('pointercancel', this._boundEndDrag);
                }
                
                // 清理容器
                if (this.container) {
                    this.container.classList.remove('dragging', 'initialized');
                    setData(this.container, 'yukicat-slider', '');
                    setData(this.container, 'yukicat-slider-initialized', '');
                }
                
                // 还原图层样式
                if (this.layers && this.layers.length) {
                    this.layers.forEach(layer => {
                        layer.style.clipPath = '';
                        layer.style.opacity = '';
                    });
                }
            } catch (destroyError) {
                // 静默处理整个销毁过程中的错误
            }
        }
    }

    // 自动初始化函数
    function initSliders() {
        try {
            const containers = document.querySelectorAll('.yukicat-bas-container:not([data-yukicat-slider-initialized="true"])');
            
            containers.forEach(container => {
                // 检查是否已经初始化过（双重检查）
                if (getData(container, 'yukicat-slider-initialized') === 'true') {
                    return;
                }
                
                // 确保容器有一个唯一ID
                if (!getData(container, 'slider-id')) {
                    setData(container, 'slider-id', 'yukicat-slider-' + Math.random().toString(36).substr(2, 9));
                }
                
                // 确保图片已加载
                const images = container.querySelectorAll('img');
                images.forEach(img => {
                    if (img.complete) {
                        img.classList.add('loaded');
                    } else {
                        img.addEventListener('load', function() {
                            this.classList.add('loaded');
                        });
                        
                        img.addEventListener('error', function() {
                            this.classList.add('error');
                            this.style.backgroundColor = '#f0f0f0';
                            this.style.visibility = 'visible';
                        });
                    }
                });
                
                try {
                    // 创建新实例
                    const slider = new YukiCatSlider(container);
                    if (slider) {
                        setData(container, 'yukicat-slider', 'initialized');
                        container.classList.add('initialized');
                    }
                } catch (e) {
                    // 静默处理单个滑块的错误
                }
            });
        } catch (e) {
            // 静默处理整个初始化过程的错误
        }
    }

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initSliders();
        });
    } else {
        initSliders();
    }

    // 监听窗口加载完成事件（用于捕获延迟加载的图片）
    window.addEventListener('load', function() {
        initSliders();
    });
    
    // WordPress特定事件钩子（当jQuery可用时）
    // 这些是WordPress主题和插件常用的事件，用于处理AJAX内容加载
    if (window.jQuery) {
        const $ = window.jQuery;
        // 监听WordPress和WooCommerce的动态内容事件
        $(document).on('post-load updated_checkout updated_cart_totals after_ajax_form_submit rendered_block', function() {
            initSliders();
        });
    }

    // 全局API
    window.YukiCatSlider = YukiCatSlider;

})();
