/**
 * 雪猫 Before&After Slider - jQuery冲突解决者
 * 此文件在frontend.js之前加载，创建一个安全的jQuery副本
 */

(function() {
    // 保存全局jQuery引用
    var originalJQuery = window.jQuery;
    var originalDollar = window.$;
    
    // 检查jQuery是否存在
    if (typeof originalJQuery === 'function') {
        // 创建安全副本
        var yukicatJQuery = originalJQuery.noConflict(true);
        
        // 创建命名空间
        window.YukiCatSliderLib = {
            jQuery: yukicatJQuery,
            version: '1.0.5-isolate'
        };
        
        // 恢复全局jQuery
        window.jQuery = originalJQuery;
        window.$ = originalDollar;
        
        // 日志
        console.log('YukiCat Slider: 安全模式启动，使用隔离的jQuery实例');
    } else {
        console.warn('YukiCat Slider: 未能找到jQuery，将尝试使用备用方法初始化');
    }
})();
