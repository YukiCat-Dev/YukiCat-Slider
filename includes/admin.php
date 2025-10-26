<?php
/**
 * Admin functionality for YukiCat Before&After Slider
 */

namespace YukiCat\BeforeAfterSlider;

// 防止直接访问
if (!defined('ABSPATH')) {
    exit;
}

/**
 * 管理后台功能类
 */
class Admin {
    
    public function __construct() {
        // 管理菜单
        add_action('admin_menu', array($this, 'add_admin_menu'));
        
        // 管理员脚本
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
        
        // AJAX处理
        add_action('wp_ajax_yukicat_save_slider', array($this, 'ajax_save_slider'));
        add_action('wp_ajax_yukicat_delete_slider', array($this, 'ajax_delete_slider'));
        add_action('wp_ajax_yukicat_get_sliders', array($this, 'ajax_get_sliders'));
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
     * 加载管理员脚本
     */
    public function enqueue_admin_scripts($hook) {
        if (strpos($hook, 'yukicat-bas') !== false) {
            wp_enqueue_media();
            wp_enqueue_style('yukicat-bas-admin', YUKICAT_BAS_PLUGIN_URL . 'assets/css/admin.css', array(), YUKICAT_BAS_VERSION);
            
            // 复用 Frontend 类的公开方法加载前端依赖
            \YukiCat\BeforeAfterSlider\Frontend::enqueue_frontend_assets();
   
            wp_enqueue_script('yukicat-bas-admin', YUKICAT_BAS_PLUGIN_URL . 'assets/js/admin.js', array('jquery', 'media-upload', 'yukicat-bas-frontend'), YUKICAT_BAS_VERSION, true);
            
            wp_localize_script('yukicat-bas-admin', 'yukicat_bas_ajax', array(
                'ajax_url' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('yukicat_bas_nonce')
            ));
        }
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
}
