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

// 加载管理后台功能
require_once(YUKICAT_BAS_PLUGIN_PATH . 'includes/admin.php');

// 加载前端功能
require_once(YUKICAT_BAS_PLUGIN_PATH . 'includes/frontend.php');

/**
 * 主插件类
 */
class YukiCat_Before_After_Slider {
    
    private $admin;
    private $frontend;
    
    public function __construct() {
        add_action('init', array($this, 'init'));
        add_action('enqueue_block_editor_assets', array($this, 'enqueue_block_editor_assets'));
        
        // 激活和停用钩子
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
        
        // 初始化管理后台和前端功能
        $this->admin = new YukiCat_BAS_Admin();
        $this->frontend = new YukiCat_BAS_Frontend();
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
        return $this->frontend->render_block($attributes);
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
}

// 初始化插件
new YukiCat_Before_After_Slider();
?>