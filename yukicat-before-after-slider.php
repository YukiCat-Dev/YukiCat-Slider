<?php
/**
 * Plugin Name: 雪猫（YukiCat）Before&After Slider
 * Plugin URI: https://www.yukicat.net
 * Description: 一个强大的Before&After滑块插件，支持古腾堡编辑器，可展示最多8张图片的对比效果。支持水平和垂直方向，自适应不同比例的图片。
 * Version: 1.0.4
 * Author: YukiCat
 * Text Domain: yukicat-before-after-slider
 * Domain Path: /languages
 */

// 防止直接访问
if (!defined('ABSPATH')) {
    exit;
}

// 定义插件常量
define('YUKICAT_BAS_VERSION', '1.0.5'); // 版本号升级
define('YUKICAT_BAS_PLUGIN_URL', plugin_dir_url(__FILE__));
define('YUKICAT_BAS_PLUGIN_PATH', plugin_dir_path(__FILE__));

// 确保包含目录存在
if (!file_exists(YUKICAT_BAS_PLUGIN_PATH . 'includes')) {
    mkdir(YUKICAT_BAS_PLUGIN_PATH . 'includes');
}

// 加载防缓存机制
require_once(YUKICAT_BAS_PLUGIN_PATH . 'includes/cache-buster.php');

/**
 * 主插件类
 */
class YukiCat_Before_After_Slider {
    
    public function __construct() {
        add_action('init', array($this, 'init'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_frontend_scripts'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
        add_action('enqueue_block_editor_assets', array($this, 'enqueue_block_editor_assets'));
        
        // 激活和停用钩子
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
        
        // 管理菜单
        add_action('admin_menu', array($this, 'add_admin_menu'));
        
        // AJAX处理
        add_action('wp_ajax_yukicat_save_slider', array($this, 'ajax_save_slider'));
        add_action('wp_ajax_yukicat_delete_slider', array($this, 'ajax_delete_slider'));
        add_action('wp_ajax_yukicat_get_sliders', array($this, 'ajax_get_sliders'));
        
        // 短代码支持
        add_shortcode('yukicat_slider', array($this, 'shortcode_handler'));
    }
    
    /**
     * 初始化
     */
    public function init() {
        // 注册古腾堡区块
        $this->register_gutenberg_block();
        
        // 加载文本域
        load_plugin_textdomain('yukicat-before-after-slider', false, dirname(plugin_basename(__FILE__)) . '/languages');
    }
    
    /**
     * 注册古腾堡区块
     */
    public function register_gutenberg_block() {
        if (!function_exists('register_block_type')) {
            return;
        }
        
        register_block_type('yukicat/before-after-slider', array(
            'editor_script' => 'yukicat-bas-block-editor',
            'render_callback' => array($this, 'render_block'),
            'attributes' => array(
                'sliderID' => array(
                    'type' => 'number',
                    'default' => 0
                ),
                'images' => array(
                    'type' => 'array',
                    'default' => array()
                ),
                'labels' => array(
                    'type' => 'array',
                    'default' => array()
                ),
                'height' => array(
                    'type' => 'number',
                    'default' => 400
                ),
                'showLabels' => array(
                    'type' => 'boolean',
                    'default' => true
                ),
                'orientation' => array(
                    'type' => 'string',
                    'default' => 'horizontal'
                ),
                'autoSlide' => array(
                    'type' => 'boolean',
                    'default' => false
                ),
                'moveWithHandleOnly' => array(
                    'type' => 'boolean',
                    'default' => false
                ),
                'moveSliderOnHover' => array(
                    'type' => 'boolean',
                    'default' => false
                ),
                'clickToMove' => array(
                    'type' => 'boolean',
                    'default' => true
                )
            )
        ));
    }
    
    /**
     * 渲染区块
     */
    public function render_block($attributes) {
        if (empty($attributes['images']) || count($attributes['images']) < 2) {
            return '<div class="yukicat-bas-placeholder">请添加至少2张图片</div>';
        }
        
        $slider_id = 'yukicat-slider-' . uniqid();
        $height = intval($attributes['height']);
        $show_labels = $attributes['showLabels'];
        
        // 检查是否有方向设置
        $orientation = isset($attributes['orientation']) ? $attributes['orientation'] : 'horizontal';
        $orientation_class = ($orientation === 'vertical') ? ' yukicat-bas-vertical' : '';
        
        // 检查是否有自动滑动设置
        $auto_slide = isset($attributes['autoSlide']) && $attributes['autoSlide'] ? 'true' : 'false';
        
        // 检查是否仅通过手柄移动
        $handle_only = isset($attributes['moveWithHandleOnly']) && $attributes['moveWithHandleOnly'] ? 'true' : 'false';
        
        // 检查是否鼠标悬停移动
        $hover_move = isset($attributes['moveSliderOnHover']) && $attributes['moveSliderOnHover'] ? 'true' : 'false';
        
        // 检查是否点击移动
        $click_move = isset($attributes['clickToMove']) && $attributes['clickToMove'] !== false ? 'true' : 'false';
        
        $output = '<div class="yukicat-bas-container' . $orientation_class . '" 
                      style="height: ' . $height . 'px;" 
                      data-slider-id="' . $slider_id . '"
                      data-orientation="' . $orientation . '"
                      data-auto-slide="' . $auto_slide . '"
                      data-handle-only="' . $handle_only . '"
                      data-hover-move="' . $hover_move . '"
                      data-click-move="' . $click_move . '">';
        
        // 图片层
        foreach ($attributes['images'] as $index => $image) {
            $label = isset($attributes['labels'][$index]) ? $attributes['labels'][$index] : '图片 ' . ($index + 1);
            
            // 对于2张图片的情况，第一张设为active（顶层）和before，第二张设为next（底层）和after
            // 对于多张图片的情况，只有第一张设为active
            $layer_class = 'yukicat-bas-layer';
            $layer_type = 'default';
            
            if (count($attributes['images']) >= 2) {
                if ($index === 0) {
                    $layer_class .= ' active yukicat-bas-before';
                    $layer_type = 'before';
                } else if ($index === 1) {
                    $layer_class .= ' next yukicat-bas-after';
                    $layer_type = 'after';
                } else {
                    $layer_type = 'extra-' . ($index - 1);
                }
            }
            
            $output .= '<div class="' . $layer_class . '" data-index="' . $index . '" data-layer-type="' . $layer_type . '">';
            $output .= '<img src="' . esc_url($image['url']) . '" alt="' . esc_attr($label) . '">';
            if ($show_labels) {
                // 默认标签设置，如果是before/after，则使用相应的标签
                $display_label = $label;
                if ($index === 0 && (empty($label) || $label === '图片 1')) {
                    $display_label = 'Before';
                } else if ($index === 1 && (empty($label) || $label === '图片 2')) {
                    $display_label = 'After';
                }
                
                $output .= '<div class="yukicat-bas-label">' . esc_html($display_label) . '</div>';
            }
            $output .= '</div>';
        }
        
        // 滑块控制
        $output .= '<div class="yukicat-bas-handle">';
        $output .= '<div class="yukicat-bas-handle-button"></div>';
        $output .= '</div>';
        
        // 进度指示器
        $output .= '<div class="yukicat-bas-progress">';
        $output .= '<div class="yukicat-bas-progress-bar"></div>';
        $output .= '</div>';
        
        // 标签指示器
        if ($show_labels && count($attributes['images']) > 2) {
            $output .= '<div class="yukicat-bas-indicators">';
            foreach ($attributes['labels'] as $index => $label) {
                $active_class = $index === 0 ? ' active' : '';
                $output .= '<span class="yukicat-bas-indicator' . $active_class . '" data-index="' . $index . '">' . esc_html($label) . '</span>';
            }
            $output .= '</div>';
        }
        
        $output .= '</div>';
        
        return $output;
    }
    
    /**
     * 加载前端脚本
     */
    public function enqueue_frontend_scripts() {
        // 添加随机版本号防止缓存问题
        $nocache_ver = YUKICAT_BAS_VERSION . '.' . mt_rand(1000, 9999);
        
        // 移除可能的全局缓存设置
        if (!defined('DONOTCACHEPAGE')) {
            define('DONOTCACHEPAGE', true);
        }
        
        // 总是加载CSS，使用随机版本号防止缓存
        wp_enqueue_style('yukicat-bas-frontend', YUKICAT_BAS_PLUGIN_URL . 'assets/css/frontend.css', array(), $nocache_ver);
        
        // 加载主题兼容性CSS文件 - 修复可能的冲突（优先级高于主题样式），同样使用随机版本号
        wp_enqueue_style('yukicat-bas-theme-compatibility', YUKICAT_BAS_PLUGIN_URL . 'assets/css/theme-compatibility.css', array('yukicat-bas-frontend'), $nocache_ver);
        
        // 标记不要压缩这些文件（对某些缓存插件有效）
        wp_style_add_data('yukicat-bas-frontend', 'do_not_minify', true);
        wp_style_add_data('yukicat-bas-theme-compatibility', 'do_not_minify', true);
        
        // 首先加载jQuery隔离器，用于创建安全的jQuery副本
        wp_enqueue_script('yukicat-bas-jquery-isolator', YUKICAT_BAS_PLUGIN_URL . 'assets/js/jquery-isolator.js', array('jquery'), $nocache_ver, false);
        
        // 确保直接在页面头部输出隔离器，最大程度确保其在其他脚本之前执行
        wp_script_add_data('yukicat-bas-jquery-isolator', 'group', 0);
        
        // 总是加载JS，因为可能有短代码或古腾堡区块
        wp_enqueue_script('yukicat-bas-frontend', YUKICAT_BAS_PLUGIN_URL . 'assets/js/frontend.js', array('yukicat-bas-jquery-isolator'), $nocache_ver, true);
        
        // 加载主题兼容性JS文件 - 处理特定主题的冲突
        wp_enqueue_script('yukicat-bas-theme-compatibility', YUKICAT_BAS_PLUGIN_URL . 'assets/js/theme-compatibility.js', array('yukicat-bas-frontend'), $nocache_ver, true);
        
        // 标记不要压缩这些文件（对某些缓存插件有效）
        wp_script_add_data('yukicat-bas-frontend', 'do_not_minify', true);
        wp_script_add_data('yukicat-bas-theme-compatibility', 'do_not_minify', true);
        
        // 添加增强版内联脚本确保初始化（提高与其他主题和插件的兼容性）
        wp_add_inline_script('yukicat-bas-frontend', '
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
        ');
    }
    
    /**
     * 加载管理员脚本
     */
    public function enqueue_admin_scripts($hook) {
        if (strpos($hook, 'yukicat-bas') !== false) {
            wp_enqueue_media();
            wp_enqueue_style('yukicat-bas-admin', YUKICAT_BAS_PLUGIN_URL . 'assets/css/admin.css', array(), YUKICAT_BAS_VERSION);
            
            // 同时加载前端样式和脚本，以便预览功能正常工作
            wp_enqueue_style('yukicat-bas-frontend', YUKICAT_BAS_PLUGIN_URL . 'assets/css/frontend.css', array(), YUKICAT_BAS_VERSION);
            wp_enqueue_script('yukicat-bas-frontend', YUKICAT_BAS_PLUGIN_URL . 'assets/js/frontend.js', array('jquery'), YUKICAT_BAS_VERSION, true);
            
            wp_enqueue_script('yukicat-bas-admin', YUKICAT_BAS_PLUGIN_URL . 'assets/js/admin.js', array('jquery', 'media-upload', 'yukicat-bas-frontend'), YUKICAT_BAS_VERSION, true);
            
            wp_localize_script('yukicat-bas-admin', 'yukicat_bas_ajax', array(
                'ajax_url' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('yukicat_bas_nonce')
            ));
        }
    }
    
    /**
     * 加载编辑器脚本
     */
    public function enqueue_block_editor_assets() {
        // 加载前端样式和脚本，让古腾堡编辑器中的预览生效
        wp_enqueue_style('yukicat-bas-frontend', YUKICAT_BAS_PLUGIN_URL . 'assets/css/frontend.css', array(), YUKICAT_BAS_VERSION);
        wp_enqueue_script('yukicat-bas-frontend', YUKICAT_BAS_PLUGIN_URL . 'assets/js/frontend.js', array('jquery'), YUKICAT_BAS_VERSION, true);
        
        wp_enqueue_script(
            'yukicat-bas-block-editor',
            YUKICAT_BAS_PLUGIN_URL . 'assets/js/block.js',
            array('wp-blocks', 'wp-i18n', 'wp-element', 'wp-components', 'wp-editor', 'yukicat-bas-frontend'),
            YUKICAT_BAS_VERSION,
            true
        );
        
        wp_enqueue_style(
            'yukicat-bas-block-editor',
            YUKICAT_BAS_PLUGIN_URL . 'assets/css/admin.css',
            array('wp-edit-blocks'),
            YUKICAT_BAS_VERSION
        );
    }
    
    /**
     * 插件激活
     */
    public function activate() {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'yukicat_bas_sliders';
        
        $charset_collate = $wpdb->get_charset_collate();
        
        $sql = "CREATE TABLE $table_name (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            name varchar(255) NOT NULL,
            images longtext NOT NULL,
            labels longtext NOT NULL,
            settings longtext NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }
    
    /**
     * 插件停用
     */
    public function deactivate() {
        // 清理工作
    }
    
    /**
     * 添加管理菜单
     */
    public function add_admin_menu() {
        add_menu_page(
            '雪猫滑块',
            '雪猫滑块',
            'manage_options',
            'yukicat-bas',
            array($this, 'admin_page'),
            'dashicons-images-alt2',
            30
        );
        
        add_submenu_page(
            'yukicat-bas',
            '所有滑块',
            '所有滑块',
            'manage_options',
            'yukicat-bas',
            array($this, 'admin_page')
        );
        
        add_submenu_page(
            'yukicat-bas',
            '新建滑块',
            '新建滑块',
            'manage_options',
            'yukicat-bas-new',
            array($this, 'admin_new_page')
        );
    }
    
    /**
     * 管理页面
     */
    public function admin_page() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'yukicat_bas_sliders';
        
        $sliders = $wpdb->get_results("SELECT * FROM $table_name ORDER BY updated_at DESC");
        
        include YUKICAT_BAS_PLUGIN_PATH . 'templates/admin-list.php';
    }
    
    /**
     * 新建滑块页面
     */
    public function admin_new_page() {
        include YUKICAT_BAS_PLUGIN_PATH . 'templates/admin-new.php';
    }
    
    /**
     * AJAX保存滑块
     */
    public function ajax_save_slider() {
        check_ajax_referer('yukicat_bas_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_die('Permission denied');
        }
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'yukicat_bas_sliders';
        
        $name = sanitize_text_field($_POST['name']);
        $images = json_encode($_POST['images']);
        $labels = json_encode($_POST['labels']);
        $settings = json_encode($_POST['settings']);
        $id = isset($_POST['id']) ? intval($_POST['id']) : 0;
        
        if ($id > 0) {
            // 更新
            $result = $wpdb->update(
                $table_name,
                array(
                    'name' => $name,
                    'images' => $images,
                    'labels' => $labels,
                    'settings' => $settings
                ),
                array('id' => $id)
            );
        } else {
            // 新建
            $result = $wpdb->insert(
                $table_name,
                array(
                    'name' => $name,
                    'images' => $images,
                    'labels' => $labels,
                    'settings' => $settings
                )
            );
            $id = $wpdb->insert_id;
        }
        
        if ($result !== false) {
            wp_send_json_success(array('id' => $id, 'message' => '保存成功'));
        } else {
            wp_send_json_error('保存失败');
        }
    }
    
    /**
     * AJAX删除滑块
     */
    public function ajax_delete_slider() {
        check_ajax_referer('yukicat_bas_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_die('Permission denied');
        }
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'yukicat_bas_sliders';
        
        $id = intval($_POST['id']);
        
        $result = $wpdb->delete($table_name, array('id' => $id));
        
        if ($result !== false) {
            wp_send_json_success('删除成功');
        } else {
            wp_send_json_error('删除失败');
        }
    }
    
    /**
     * AJAX获取滑块列表
     */
    public function ajax_get_sliders() {
        check_ajax_referer('yukicat_bas_nonce', 'nonce');
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'yukicat_bas_sliders';
        
        $sliders = $wpdb->get_results("SELECT * FROM $table_name ORDER BY updated_at DESC");
        
        wp_send_json_success($sliders);
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

// 初始化插件
new YukiCat_Before_After_Slider();

// 模板文件
if (!file_exists(YUKICAT_BAS_PLUGIN_PATH . 'templates/admin-list.php')) {
    add_action('init', function() {
        if (!is_dir(YUKICAT_BAS_PLUGIN_PATH . 'templates')) {
            wp_mkdir_p(YUKICAT_BAS_PLUGIN_PATH . 'templates');
        }
        
        // 创建管理列表模板
        $admin_list_content = '<?php if (!defined("ABSPATH")) exit; ?>
<div class="wrap">
    <h1>雪猫滑块管理</h1>
    <a href="<?php echo admin_url("admin.php?page=yukicat-bas-new"); ?>" class="page-title-action">新建滑块</a>
    
    <div class="yukicat-bas-admin-content">
        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th>名称</th>
                    <th>图片数量</th>
                    <th>短代码</th>
                    <th>创建时间</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($sliders)): ?>
                    <tr>
                        <td colspan="5" style="text-align: center; padding: 50px;">
                            暂无滑块，<a href="<?php echo admin_url("admin.php?page=yukicat-bas-new"); ?>">立即创建</a>
                        </td>
                    </tr>
                <?php else: ?>
                    <?php foreach ($sliders as $slider): ?>
                        <?php
                        $images = json_decode($slider->images, true);
                        $image_count = count($images);
                        ?>
                        <tr>
                            <td><strong><?php echo esc_html($slider->name); ?></strong></td>
                            <td><?php echo $image_count; ?> 张图片</td>
                            <td>
                                <code>[yukicat_slider id="<?php echo $slider->id; ?>"]</code>
                                <button class="copy-shortcode" data-shortcode="[yukicat_slider id=&quot;<?php echo $slider->id; ?>&quot;]">复制</button>
                            </td>
                            <td><?php echo date("Y-m-d H:i", strtotime($slider->created_at)); ?></td>
                            <td>
                                <a href="<?php echo admin_url("admin.php?page=yukicat-bas-new&id=" . $slider->id); ?>" class="button">编辑</a>
                                <button class="button delete-slider" data-id="<?php echo $slider->id; ?>">删除</button>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>';
        
        file_put_contents(YUKICAT_BAS_PLUGIN_PATH . 'templates/admin-list.php', $admin_list_content);
        
        // 创建新建/编辑模板
        $admin_new_content = '<?php if (!defined("ABSPATH")) exit; ?>
<div class="wrap">
    <h1><?php echo isset($_GET["id"]) ? "编辑滑块" : "新建滑块"; ?></h1>
    
    <div class="yukicat-bas-admin-form">
        <form id="yukicat-bas-form">
            <table class="form-table">
                <tr>
                    <th><label for="slider-name">滑块名称</label></th>
                    <td><input type="text" id="slider-name" name="name" class="regular-text" required></td>
                </tr>
                <tr>
                    <th><label>图片管理</label></th>
                    <td>
                        <div id="image-manager">
                            <div class="image-list"></div>
                            <button type="button" id="add-image" class="button">添加图片</button>
                            <p class="description">最多可添加8张图片，最少需要2张图片</p>
                        </div>
                    </td>
                </tr>
                <tr>
                    <th><label for="slider-height">滑块高度</label></th>
                    <td>
                        <input type="number" id="slider-height" name="height" value="400" min="200" max="800" class="small-text">
                        <span>px</span>
                    </td>
                </tr>
                <tr>
                    <th><label>显示标签</label></th>
                    <td>
                        <label>
                            <input type="checkbox" id="show-labels" name="show_labels" checked>
                            在滑块上显示图片标签
                        </label>
                    </td>
                </tr>
            </table>
            
            <p class="submit">
                <button type="submit" class="button-primary">保存滑块</button>
                <a href="<?php echo admin_url("admin.php?page=yukicat-bas"); ?>" class="button">返回列表</a>
            </p>
        </form>
    </div>
    
    <div id="preview-container" style="margin-top: 30px; display: none;">
        <h3>预览</h3>
        <div id="slider-preview"></div>
    </div>
</div>';
        
        file_put_contents(YUKICAT_BAS_PLUGIN_PATH . 'templates/admin-new.php', $admin_new_content);
    });
}
?>