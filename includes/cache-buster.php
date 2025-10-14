<?php
/**
 * 防止WordPress缓存插件缓存滑块资源
 * 这个文件应该被包含在滑块插件的主PHP文件中
 */

// 如果直接访问则退出
if (!defined('ABSPATH')) {
    exit;
}

/**
 * 添加缓存破坏机制
 */
class YukiCat_BAS_Cache_Buster {
    
    /**
     * 初始化类
     */
    public static function init() {
        // 确保在WordPress初始化后运行
        add_action('init', array(__CLASS__, 'register_hooks'));
    }
    
    /**
     * 注册所有钩子
     */
    public static function register_hooks() {
        // 添加HTTP头以防止缓存
        add_action('wp_headers', array(__CLASS__, 'add_no_cache_headers'));
        
        // 向滑块容器添加唯一标识符以防止DOM缓存问题
        add_filter('yukicat_bas_container_attrs', array(__CLASS__, 'add_unique_container_id'));
        
        // 动态处理CSS/JS文件请求以防止缓存
        add_action('wp_enqueue_scripts', array(__CLASS__, 'maybe_handle_resource_request'), 9999);
    }
    
    /**
     * 添加无缓存HTTP头
     */
    public static function add_no_cache_headers($headers) {
        // 仅当页面包含我们的滑块短代码或区块时
        if (self::page_has_slider()) {
            $headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0';
            $headers['Pragma'] = 'no-cache';
            $headers['Expires'] = 'Wed, 11 Jan 1984 05:00:00 GMT';
        }
        return $headers;
    }
    
    /**
     * 向滑块容器添加唯一ID
     */
    public static function add_unique_container_id($attrs) {
        $unique_id = 'yukicat-slider-' . uniqid();
        if (isset($attrs['class'])) {
            $attrs['class'] .= ' ' . $unique_id;
        } else {
            $attrs['class'] = $unique_id;
        }
        $attrs['data-cache-buster'] = time();
        return $attrs;
    }
    
    /**
     * 可能处理资源请求
     */
    public static function maybe_handle_resource_request() {
        // 如果是我们的资源请求
        if (isset($_GET['yukicat_nocache'])) {
            $resource_type = isset($_GET['type']) ? $_GET['type'] : '';
            $resource_file = isset($_GET['file']) ? $_GET['file'] : '';
            
            if (!empty($resource_type) && !empty($resource_file) && in_array($resource_type, array('css', 'js'))) {
                self::serve_uncached_resource($resource_type, $resource_file);
            }
        }
    }
    
    /**
     * 提供未缓存的资源
     */
    private static function serve_uncached_resource($type, $file) {
        $valid_files = array(
            'css' => array('frontend.css', 'theme-compatibility.css'),
            'js' => array('frontend.js', 'theme-compatibility.js')
        );
        
        // 安全检查
        if (!in_array($file, $valid_files[$type])) {
            return;
        }
        
        // 文件路径
        $file_path = YUKICAT_BAS_PLUGIN_PATH . 'assets/' . $type . '/' . $file;
        
        // 如果文件存在，则提供
        if (file_exists($file_path)) {
            // 设置内容类型
            if ($type === 'css') {
                header('Content-Type: text/css');
            } elseif ($type === 'js') {
                header('Content-Type: application/javascript');
            }
            
            // 设置无缓存头
            header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
            header('Pragma: no-cache');
            header('Expires: Wed, 11 Jan 1984 05:00:00 GMT');
            
            // 输出文件内容
            readfile($file_path);
            exit;
        }
    }
    
    /**
     * 检查页面是否包含滑块
     */
    private static function page_has_slider() {
        global $post;
        
        // 检查是否存在全局$post变量
        if (!is_object($post)) {
            return false;
        }
        
        // 检查内容中是否有短代码
        $has_shortcode = strpos($post->post_content, '[yukicat_slider') !== false;
        
        // 检查内容中是否有区块
        $has_block = strpos($post->post_content, 'wp:yukicat/before-after-slider') !== false;
        
        return $has_shortcode || $has_block;
    }
}

// 初始化类
YukiCat_BAS_Cache_Buster::init();
