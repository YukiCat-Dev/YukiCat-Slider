/**
 * 雪猫 Before&After Slider 兼容性辅助脚本
 * 此文件帮助处理jQuery冲突、缓存问题和常见的主题兼容性问题
 * 版本: 1.0.5 - 防缓存版
 */

(function() {
    'use strict';
    
    // 清除可能的缓存
    clearCacheIfNeeded();
    
    // 在页面加载后执行
    window.addEventListener('load', function() {
        // 检查是否有滑块初始化失败
        setTimeout(function() {
            const sliders = document.querySelectorAll('.yukicat-bas-container:not(.initialized)');
            if (sliders.length > 0) {
                // 尝试使用备用方法初始化滑块
                initializeFailedSliders();
            }
        }, 1000);
    });
    
    // 尝试清除缓存
    function clearCacheIfNeeded() {
        // 检查是否有缓存问题的迹象
        const hasCachingIssue = document.querySelectorAll('.yukicat-bas-container').length > 0 && 
                               document.querySelectorAll('.yukicat-bas-container .yukicat-bas-handle').length === 0;
        
        if (hasCachingIssue) {
            console.warn('YukiCat Slider: 可能存在缓存问题，尝试清除');
            
            // 尝试强制刷新CSS
            const styleElements = document.querySelectorAll('link[rel="stylesheet"]');
            styleElements.forEach(function(style) {
                if (style.href && style.href.includes('yukicat')) {
                    // 添加随机查询参数刷新资源
                    const newHref = style.href.includes('?') 
                        ? style.href + '&_cache_buster=' + new Date().getTime()
                        : style.href + '?_cache_buster=' + new Date().getTime();
                    
                    // 创建新的样式元素
                    const newStyle = document.createElement('link');
                    newStyle.rel = 'stylesheet';
                    newStyle.href = newHref;
                    document.head.appendChild(newStyle);
                    
                    // 移除旧样式表
                    setTimeout(function() {
                        style.disabled = true;
                        style.parentNode.removeChild(style);
                    }, 500);
                }
            });
        }
    }
    
    // 处理主题冲突的辅助方法
    function initializeFailedSliders() {
        // 安全获取jQuery引用
        const jq = window.jQuery || window.$ || false;
        if (!jq) return;
        
        // 恢复可能被覆盖的jQuery方法
        const originalOn = jq.fn.on;
        const originalOff = jq.fn.off;
        const originalAnimate = jq.fn.animate;
        
        try {
            // 尝试初始化失败的滑块
            jq('.yukicat-bas-container:not(.initialized)').each(function() {
                const slider = jq(this);
                
                // 强制重新应用样式
                slider.addClass('yukicat-force-compatibility');
                
                // 尝试使用YukiCatSlider重新初始化
                if (window.YukiCatSlider) {
                    try {
                        const instance = new window.YukiCatSlider(this);
                        slider.data('yukicat-slider', instance);
                        slider.addClass('initialized');
                    } catch(e) {
                        console.warn('YukiCat Slider: 失败时重新初始化错误', e);
                    }
                }
            });
        } catch (e) {
            console.warn('YukiCat Slider: 主题兼容性处理错误', e);
        }
        
        // 恢复原始方法
        if (originalOn) jq.fn.on = originalOn;
        if (originalOff) jq.fn.off = originalOff;
        if (originalAnimate) jq.fn.animate = originalAnimate;
    }
    
    // 添加特殊处理特定主题的方法
    function detectAndFixThemeConflicts() {
        // 获取隔离的jQuery或常规jQuery
        const jq = (window.YukiCatSliderLib && window.YukiCatSliderLib.jQuery) || window.jQuery || window.$;
        if (!jq) return;
        
        // 修复sakura主题冲突
        if (document.body.classList.contains('theme-sakura') || 
            document.querySelector('.sakura_nav')) {
            
            console.log('YukiCat Slider: 检测到Sakura主题，应用特定修复');
            
            // 特殊处理sakura主题的事件传播问题
            jq('.yukicat-bas-container').each(function() {
                const container = jq(this);
                
                // 阻止事件冒泡到导航栏
                container.on('mousedown touchstart', function(e) {
                    e.stopPropagation();
                });
                
                // 强制阻止某些主题行为
                container.find('.yukicat-bas-handle, .yukicat-bas-handle-button')
                    .on('mousedown touchstart', function(e) {
                        e.stopPropagation();
                    });
            });
            
            // 覆盖某些sakura主题的JS函数
            if (window.iro_nav) {
                try {
                    // 备份原始函数
                    const originalIroNav = window.iro_nav;
                    
                    // 重写函数以忽略滑块内的点击
                    window.iro_nav = function(e) {
                        // 如果点击发生在滑块内部，不执行原始函数
                        if (e && e.target && (
                            jq(e.target).closest('.yukicat-bas-container').length ||
                            jq(e.target).hasClass('yukicat-bas-handle') || 
                            jq(e.target).hasClass('yukicat-bas-handle-button')
                        )) {
                            return;
                        }
                        
                        // 否则执行原始函数
                        return originalIroNav.apply(this, arguments);
                    };
                } catch (e) {
                    console.warn('YukiCat Slider: 无法覆盖sakura主题函数', e);
                }
            }
        }
        
        // 检测和修复其他常见主题
        
        // WordPress默认主题
        if (document.body.classList.contains('wp-theme-twentytwenty') || 
            document.body.classList.contains('wp-theme-twentytwentyone') ||
            document.body.classList.contains('wp-theme-twentytwentytwo') ||
            document.body.classList.contains('wp-theme-twentytwentythree')) {
            
            console.log('YukiCat Slider: 检测到WordPress默认主题，应用特定修复');
            
            // 防止默认主题的过渡效果影响滑块
            const style = document.createElement('style');
            style.textContent = `
                .yukicat-bas-container *,
                .yukicat-bas-handle,
                .yukicat-bas-handle-button,
                .yukicat-bas-layer {
                    transition: none !important;
                    animation: none !important;
                }
            `;
            document.head.appendChild(style);
        }
        
        // 通用修复：禁用可能干扰滑块的手势库
        const potentialHammerInstances = [
            'window.Hammer',
            'window.jQuery.fn.hammer',
            'window.$.fn.hammer'
        ];
        
        potentialHammerInstances.forEach(function(path) {
            try {
                const parts = path.split('.');
                let obj = window;
                
                for (let i = 1; i < parts.length - 1; i++) {
                    if (obj[parts[i]]) {
                        obj = obj[parts[i]];
                    } else {
                        return;
                    }
                }
                
                const lastPart = parts[parts.length - 1];
                if (obj[lastPart]) {
                    // 备份原始实例
                    const original = obj[lastPart];
                    
                    // 覆盖实例，忽略滑块内的手势
                    obj[lastPart] = function() {
                        const arg = arguments[0];
                        if (arg && typeof arg === 'object' && arg.jquery) {
                            const element = arg[0];
                            if (element && (
                                jq(element).closest('.yukicat-bas-container').length ||
                                jq(element).hasClass('yukicat-bas-container')
                            )) {
                                console.log('YukiCat Slider: 阻止Hammer.js初始化以避免冲突');
                                return arg;
                            }
                        }
                        return original.apply(this, arguments);
                    };
                    
                    // 保留原始属性
                    for (let prop in original) {
                        if (original.hasOwnProperty(prop)) {
                            obj[lastPart][prop] = original[prop];
                        }
                    }
                }
            } catch (e) {
                // 静默处理
            }
        });
    }
    
    // 在DOM加载完成后执行主题检测
    document.addEventListener('DOMContentLoaded', detectAndFixThemeConflicts);
    
    // 页面加载后再次检查，以防DOM被动态修改
    window.addEventListener('load', detectAndFixThemeConflicts);
})();
