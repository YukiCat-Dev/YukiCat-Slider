<?php
/**
 * 雪猫（YukiCat）Before&After Slider - 卸载脚本
 * 
 * 当插件被删除时清理数据库和文件
 */

// 防止直接访问
if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

// 删除数据库表
global $wpdb;

$table_name = $wpdb->prefix . 'yukicat_bas_sliders';

// 删除滑块数据表
$wpdb->query("DROP TABLE IF EXISTS $table_name");

// 删除相关选项
delete_option('yukicat_bas_version');
delete_option('yukicat_bas_settings');

// 删除用户元数据（如果有的话）
$wpdb->query("DELETE FROM $wpdb->usermeta WHERE meta_key LIKE 'yukicat_bas_%'");

// 删除文章元数据（如果有的话）
$wpdb->query("DELETE FROM $wpdb->postmeta WHERE meta_key LIKE 'yukicat_bas_%'");

// 清理缓存
wp_cache_flush();

// 清理临时文件（如果有的话）
$upload_dir = wp_upload_dir();
$yukicat_dir = $upload_dir['basedir'] . '/yukicat-bas/';

if (is_dir($yukicat_dir)) {
    // 递归删除目录
    function yukicat_bas_delete_directory($dir) {
        if (!is_dir($dir)) {
            return false;
        }
        
        $files = array_diff(scandir($dir), array('.', '..'));
        
        foreach ($files as $file) {
            $path = $dir . DIRECTORY_SEPARATOR . $file;
            if (is_dir($path)) {
                yukicat_bas_delete_directory($path);
            } else {
                unlink($path);
            }
        }
        
        return rmdir($dir);
    }
    
    yukicat_bas_delete_directory($yukicat_dir);
}

// 记录卸载日志（可选）
error_log('YukiCat Before&After Slider plugin has been uninstalled and all data cleaned up.');
?>