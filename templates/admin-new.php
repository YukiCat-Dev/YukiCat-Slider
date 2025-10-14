<?php if (!defined("ABSPATH")) exit; ?>
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
</div>