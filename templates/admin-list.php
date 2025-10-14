<?php if (!defined("ABSPATH")) exit; ?>
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
</div>