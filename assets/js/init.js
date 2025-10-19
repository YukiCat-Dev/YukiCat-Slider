/**
 * YukiCat Before&After Slider - Initialization Script
 * Ensures sliders are properly initialized on page load and for dynamic content
 */

(function() {
    'use strict';
    
    // 确保在DOM准备好后初始化滑块
    document.addEventListener("DOMContentLoaded", function() {
        // 尝试使用WordPress的jQuery
        var $ = window.jQuery || window.$ || false;
        
        // 如果jQuery可用，初始化所有滑块
        if ($) {
            // 封装初始化功能
            function initAllSliders() {
                try {
                    $(".yukicat-bas-container").each(function() {
                        if (!$(this).data("yukicat-slider") && window.YukiCatSlider) {
                            var slider = new window.YukiCatSlider(this);
                            $(this).data("yukicat-slider", slider);
                        }
                    });
                } catch(e) {
                    // 静默处理错误
                }
            }
            
            // 初始初始化
            initAllSliders();
            
            // 在页面加载完成后再次初始化（捕获延迟加载的图片）
            $(window).on("load", initAllSliders);
            
            // 处理AJAX加载和动态内容
            if (window.MutationObserver) {
                var observer = new MutationObserver(function(mutations) {
                    var hasNewContent = false;
                    
                    // 检查是否有新内容添加
                    mutations.forEach(function(mutation) {
                        if (mutation.addedNodes.length) {
                            hasNewContent = true;
                        }
                    });
                    
                    // 只有在添加了新节点时才重新初始化
                    if (hasNewContent) {
                        initAllSliders();
                    }
                });
                
                // 观察整个文档树变化
                observer.observe(document.body, { childList: true, subtree: true });
            }
            
            // 针对某些主题的特殊事件
            $(document).on("post-load updated_checkout updated_cart_totals after_ajax_form_submit rendered_block", initAllSliders);
        }
    });
})();
