<?php
/**
 * Frontend functionality for YukiCat Before&After Slider
 */

namespace YukiCat\BeforeAfterSlider;

// 防止直接访问
if (!defined('ABSPATH')) {
    exit;
}

/**
 * 前端功能类
 */
class Frontend {
    
    public function __construct() {
        // 前端脚本
        add_action('wp_enqueue_scripts', array($this, 'enqueue_frontend_scripts'));
        
        // 短代码支持
        add_shortcode('yukicat_slider', array($this, 'shortcode_handler'));
    }
    
    /**
     * 公开方法：加载前端依赖（CSS和JS）
     * 可被其他类复用，例如 Admin 类
     */
    public static function enqueue_frontend_assets() {
        // 总是加载CSS
        wp_enqueue_style('yukicat-bas-frontend', YUKICAT_BAS_PLUGIN_URL . 'assets/css/frontend.css', array(), YUKICAT_BAS_VERSION);
        
        // 加载前端核心脚本（无jQuery依赖）
        wp_enqueue_script('yukicat-bas-frontend', YUKICAT_BAS_PLUGIN_URL . 'assets/js/frontend.js', array(), YUKICAT_BAS_VERSION, true);
        
        // Web component must load after frontend.js
        wp_enqueue_script('yukicat-bas-web-component', YUKICAT_BAS_PLUGIN_URL . 'assets/js/web-component.js', array('yukicat-bas-frontend'), YUKICAT_BAS_VERSION, true);
        
        // 加载初始化脚本
        wp_enqueue_script('yukicat-bas-init', YUKICAT_BAS_PLUGIN_URL . 'assets/js/init.js', array('yukicat-bas-web-component'), YUKICAT_BAS_VERSION, true);
    }
    
    /**
     * 加载前端脚本
     */
    public function enqueue_frontend_scripts() {
        self::enqueue_frontend_assets();
    }
    
    /**
     * 渲染区块
     */
    public function render_block($attributes) {
        if (empty($attributes['images']) || count($attributes['images']) < 2) {
            return '<div class="yukicat-bas-placeholder">请添加至少2张图片</div>';
        }
        
        $height = intval($attributes['height']);
        $show_labels = $attributes['showLabels'];
        
        // 检查是否有方向设置
        $orientation = isset($attributes['orientation']) ? $attributes['orientation'] : 'horizontal';
        
        // 检查是否有自动滑动设置
        $auto_slide = isset($attributes['autoSlide']) && $attributes['autoSlide'] ? 'true' : 'false';
        
        // 检查是否仅通过手柄移动
        $handle_only = isset($attributes['moveWithHandleOnly']) && $attributes['moveWithHandleOnly'] ? 'true' : 'false';
        
        // 检查是否鼠标悬停移动
        $hover_move = isset($attributes['moveSliderOnHover']) && $attributes['moveSliderOnHover'] ? 'true' : 'false';
        
        // 检查是否点击移动
        $click_move = isset($attributes['clickToMove']) && $attributes['clickToMove'] !== false ? 'true' : 'false';
        
        // Use Web Component instead of div
        $output = '<yukicat-slider 
                      height="' . $height . '" 
                      orientation="' . $orientation . '"
                      auto-slide="' . $auto_slide . '"
                      handle-only="' . $handle_only . '"
                      hover-move="' . $hover_move . '"
                      click-move="' . $click_move . '"
                      show-labels="' . ($show_labels ? 'true' : 'false') . '">';
        
        // Add images as light DOM content
        foreach ($attributes['images'] as $index => $image) {
            $label = isset($attributes['labels'][$index]) ? $attributes['labels'][$index] : '图片 ' . ($index + 1);
            
            // Set default labels for first two images
            if ($index === 0 && (empty($label) || $label === '图片 1')) {
                $label = 'Before';
            } else if ($index === 1 && (empty($label) || $label === '图片 2')) {
                $label = 'After';
            }
            
            $output .= '<img src="' . esc_url($image['url']) . '" alt="' . esc_attr($label) . '" data-label="' . esc_attr($label) . '">';
        }
        
        $output .= '</yukicat-slider>';
        
        return $output;
    }
    
    /**
     * 短代码处理
     */
    public function shortcode_handler($atts) {
        $atts = shortcode_atts(array(
            'id' => 0,
            'height' => 400,
            'show_labels' => 'true',
            'orientation' => 'horizontal', // 新增方向参数
            'auto_slide' => 'false',       // 新增自动滑动参数
            'handle_only' => 'false',      // 新增仅手柄移动参数 
            'hover_move' => 'false',       // 新增悬停移动参数
            'click_move' => 'true'         // 新增点击移动参数
        ), $atts);
        
        if (!$atts['id']) {
            return '<!-- 雪猫滑块：请指定滑块ID -->';
        }
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'yukicat_bas_sliders';
        
        $slider = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $atts['id']));
        
        if (!$slider) {
            return '<!-- 雪猫滑块：找不到指定的滑块 -->';
        }
        
        $images = json_decode($slider->images, true);
        $labels = json_decode($slider->labels, true);
        $settings = json_decode($slider->settings, true);
        
        // 合并设置
        $orientation = isset($settings['orientation']) ? $settings['orientation'] : $atts['orientation'];
        $auto_slide = isset($settings['autoSlide']) ? $settings['autoSlide'] : ($atts['auto_slide'] === 'true');
        $handle_only = isset($settings['moveWithHandleOnly']) ? $settings['moveWithHandleOnly'] : ($atts['handle_only'] === 'true');
        $hover_move = isset($settings['moveSliderOnHover']) ? $settings['moveSliderOnHover'] : ($atts['hover_move'] === 'true');
        $click_move = isset($settings['clickToMove']) ? $settings['clickToMove'] : ($atts['click_move'] === 'true');
        
        $block_atts = array(
            'images' => $images,
            'labels' => $labels,
            'height' => intval($atts['height']),
            'showLabels' => $atts['show_labels'] === 'true',
            'orientation' => $orientation,
            'autoSlide' => $auto_slide,
            'moveWithHandleOnly' => $handle_only,
            'moveSliderOnHover' => $hover_move,
            'clickToMove' => $click_move
        );
        
        return $this->render_block($block_atts);
    }
}
