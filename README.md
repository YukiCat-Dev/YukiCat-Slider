# 雪猫（YukiCat）Before&After Slider

一个强大的 WordPress 插件，支持古腾堡编辑器的 Before&After 滑块，可展示最多8张图片的对比效果。

## 功能特点

- 🎨 支持水平和垂直滑动方向
- 📱 自适应不同比例的图片
- 🔲 支持古腾堡（Gutenberg）区块编辑器
- 📝 支持传统短代码（Shortcode）
- 🎯 最多支持8张图片对比
- ⚙️ 丰富的配置选项（自动滑动、点击移动、悬停移动等）
- 🌐 支持国际化（i18n）
- 💾 内置缓存破坏机制
- 🎭 主题兼容性优化

## 文件结构说明

本项目遵循 [WordPress 插件开发规范](https://developer.wordpress.org/plugins/plugin-basics/)，以下是详细的文件结构说明：

```
yukicat-before-after-slider/
├── LICENSE                           # 许可证文件 (GPL v3)
├── README.md                         # 项目说明文档（本文件）
├── yukicat-before-after-slider.php  # 主插件文件（必需）
├── uninstall.php                     # 插件卸载脚本（可选）
├── assets/                           # 静态资源目录
│   ├── css/                          # 样式文件目录
│   │   ├── admin.css                 # 管理后台样式
│   │   ├── frontend.css              # 前端样式
│   │   └── theme-compatibility.css   # 主题兼容性样式
│   └── js/                           # JavaScript 文件目录
│       ├── admin.js                  # 管理后台脚本
│       ├── block.js                  # 古腾堡区块脚本
│       ├── frontend.js               # 前端滑块核心脚本
│       ├── jquery-isolator.js        # jQuery 隔离器
│       ├── theme-compatibility.js    # 主题兼容性脚本
│       ├── frontend.js.bak           # 冗余文件 - 备份文件
│       └── frontend.js.new           # 冗余文件 - 临时文件
├── includes/                         # PHP 类和函数库目录
│   └── cache-buster.php              # 缓存破坏机制
├── languages/                        # 国际化语言文件目录
│   └── yukicat-before-after-slider.pot  # 翻译模板文件
└── templates/                        # 模板文件目录
    ├── admin-list.php                # 管理页面 - 滑块列表
    └── admin-new.php                 # 管理页面 - 新建/编辑滑块
```

## 核心文件说明

### 根目录文件

#### `yukicat-before-after-slider.php` - 主插件文件
**WordPress 文档参考**: [Plugin Header Requirements](https://developer.wordpress.org/plugins/plugin-basics/header-requirements/)

这是插件的入口文件，包含以下核心功能：

1. **插件头部信息** ([Header Requirements](https://developer.wordpress.org/plugins/plugin-basics/header-requirements/))
   - Plugin Name, Description, Version, Author 等必需字段
   - Text Domain 和 Domain Path 用于国际化

2. **插件常量定义** ([Determining Plugin and Content Directories](https://developer.wordpress.org/plugins/plugin-basics/determining-plugin-and-content-directories/))
   - `YUKICAT_BAS_VERSION`: 版本号
   - `YUKICAT_BAS_PLUGIN_URL`: 插件 URL
   - `YUKICAT_BAS_PLUGIN_PATH`: 插件路径

3. **主插件类 `YukiCat_Before_After_Slider`**
   - 注册 WordPress 钩子 ([Actions](https://developer.wordpress.org/plugins/hooks/actions/) 和 [Filters](https://developer.wordpress.org/plugins/hooks/filters/))
   - 加载脚本和样式 ([Enqueuing Scripts and Styles](https://developer.wordpress.org/plugins/javascript/enqueuing/))
   - 注册古腾堡区块 ([Block Registration](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-registration/))
   - 数据库操作 ([Creating Tables](https://developer.wordpress.org/plugins/creating-tables-with-plugins/))
   - 管理菜单 ([Administration Menus](https://developer.wordpress.org/plugins/administration-menus/))
   - AJAX 处理 ([AJAX in Plugins](https://developer.wordpress.org/plugins/javascript/ajax/))
   - 短代码处理 ([Shortcode API](https://developer.wordpress.org/plugins/shortcodes/))

4. **激活和停用钩子** ([Activation/Deactivation Hooks](https://developer.wordpress.org/plugins/plugin-basics/activation-deactivation-hooks/))
   - `register_activation_hook()`: 创建数据库表
   - `register_deactivation_hook()`: 清理工作

#### `uninstall.php` - 卸载脚本
**WordPress 文档参考**: [Uninstall Methods](https://developer.wordpress.org/plugins/plugin-basics/uninstall-methods/)

当用户从 WordPress 后台删除插件时自动执行，负责：
- 删除数据库表
- 删除插件选项
- 删除用户和文章元数据
- 清理上传的临时文件

**注意**: 使用 `WP_UNINSTALL_PLUGIN` 常量验证，符合 [WordPress 卸载最佳实践](https://developer.wordpress.org/plugins/plugin-basics/best-practices/#uninstall-script)

#### `LICENSE` - 许可证文件
**WordPress 文档参考**: [GPL Compatibility](https://developer.wordpress.org/plugins/wordpress-org/detailed-plugin-guidelines/#1-plugins-must-be-compatible-with-the-gnu-general-public-license)

GNU General Public License v3.0，符合 WordPress.org 插件目录的 [许可证要求](https://developer.wordpress.org/plugins/wordpress-org/detailed-plugin-guidelines/#1-plugins-must-be-compatible-with-the-gnu-general-public-license)。

### assets/ - 静态资源目录
**WordPress 文档参考**: [Best Practices for File Organization](https://developer.wordpress.org/plugins/plugin-basics/best-practices/#folder-structure)

#### assets/css/ - 样式文件

##### `frontend.css` - 前端样式
包含滑块在网站前端显示的所有样式：
- 滑块容器布局
- 图片层叠效果
- 滑动手柄样式
- 标签和指示器样式
- 响应式设计

**加载方式**: 通过 `wp_enqueue_style()` - [Enqueuing Styles](https://developer.wordpress.org/plugins/javascript/enqueuing/#stylesheets)

##### `admin.css` - 管理后台样式
后台管理界面的样式：
- 滑块列表页面样式
- 新建/编辑滑块表单样式
- 图片管理器界面
- 预览容器样式

**加载时机**: 仅在插件管理页面加载 - [Conditional Loading](https://developer.wordpress.org/plugins/javascript/enqueuing/#load-only-on-a-plugin-page)

##### `theme-compatibility.css` - 主题兼容性样式
用于解决与某些 WordPress 主题的样式冲突：
- 重置主题可能影响滑块的 CSS 规则
- 确保滑块在各种主题下正常显示

**优先级**: 在 `frontend.css` 之后加载，以覆盖可能的冲突样式

#### assets/js/ - JavaScript 文件

##### `frontend.js` - 前端核心脚本
**WordPress 文档参考**: [JavaScript Best Practices](https://developer.wordpress.org/plugins/javascript/best-practices/)

滑块的核心功能实现：
- `YukiCatSlider` 类：滑块主类
- 拖动和滑动逻辑
- 触摸事件支持（移动设备）
- 自动播放功能
- 键盘导航支持
- 图片层切换动画

**依赖**: jQuery（通过 `jquery-isolator.js` 隔离）
**加载方式**: `wp_enqueue_script()` 在 footer - [Enqueuing Scripts](https://developer.wordpress.org/plugins/javascript/enqueuing/#enqueue-script)

##### `admin.js` - 管理后台脚本
**WordPress 文档参考**: [Using Media Uploader](https://developer.wordpress.org/plugins/javascript/media-uploader/)

管理界面功能：
- 媒体库上传器集成 ([Media JavaScript Guide](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-media-utils/))
- 图片拖放排序
- 实时预览更新
- AJAX 表单提交 ([AJAX in Plugins](https://developer.wordpress.org/plugins/javascript/ajax/))
- 短代码复制功能

**使用 API**: 
- `wp.media()` - WordPress 媒体上传框架
- `wp_localize_script()` - 传递 PHP 变量到 JavaScript

##### `block.js` - 古腾堡区块脚本
**WordPress 文档参考**: [Block Editor Handbook](https://developer.wordpress.org/block-editor/)

实现古腾堡编辑器区块：
- 区块注册 ([Block Registration](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-registration/))
- 区块属性定义 ([Block Attributes](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-attributes/))
- Inspector Controls（侧边栏设置）- [Inspector Controls](https://developer.wordpress.org/block-editor/how-to-guides/block-tutorial/block-controls-toolbar-and-sidebar/)
- 编辑器预览渲染 ([Edit and Save](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/))

**使用的包**:
- `@wordpress/blocks` - 区块注册
- `@wordpress/element` - React 元素
- `@wordpress/components` - UI 组件库
- `@wordpress/editor` (deprecated) / `@wordpress/block-editor` - 编辑器组件
- `@wordpress/i18n` - 国际化

##### `jquery-isolator.js` - jQuery 隔离器
自定义脚本，用于避免 jQuery 版本冲突：
- 创建插件专用的 jQuery 副本
- 防止与主题或其他插件的 jQuery 版本冲突
- 保存到 `window.YukiCatSliderLib.jQuery`

**最佳实践**: 符合 [JavaScript Best Practices - No Conflicts](https://developer.wordpress.org/plugins/javascript/best-practices/#use-the-wp-object)

##### `theme-compatibility.js` - 主题兼容性脚本
处理特定主题可能导致的 JavaScript 冲突：
- 监听特定主题的自定义事件
- 重新初始化滑块
- 处理 AJAX 加载内容

##### `frontend.js.bak` - **冗余文件**
**标记**: 🔴 冗余文件

这是 `frontend.js` 的备份文件，未被任何文件引用。应当删除或移至版本控制之外。

##### `frontend.js.new` - **冗余文件**
**标记**: 🔴 冗余文件

这是临时或测试文件，未被任何文件引用。应当删除或移至版本控制之外。

### includes/ - PHP 包含文件目录
**WordPress 文档参考**: [Best Practices for File Organization](https://developer.wordpress.org/plugins/plugin-basics/best-practices/#folder-structure)

#### `cache-buster.php` - 缓存破坏机制
自定义类 `YukiCat_BAS_Cache_Buster`，用于防止缓存问题：
- 添加无缓存 HTTP 头 ([HTTP Headers](https://developer.wordpress.org/apis/))
- 为资源添加动态版本号
- 检测页面是否包含滑块
- 提供未缓存的资源响应

**相关 WordPress API**:
- `add_action('wp_headers')` - 修改 HTTP 头
- `add_filter()` - 过滤器钩子

### languages/ - 国际化语言文件
**WordPress 文档参考**: [Internationalization](https://developer.wordpress.org/plugins/internationalization/)

#### `yukicat-before-after-slider.pot` - POT 模板文件
**WordPress 文档参考**: [POT Files](https://developer.wordpress.org/plugins/internationalization/localization/#pot-files)

Portable Object Template，包含所有可翻译字符串的模板：
- 用于创建其他语言的 `.po` 和 `.mo` 文件
- 由 `load_plugin_textdomain()` 函数使用
- 文本域: `yukicat-before-after-slider`

**生成工具**: 可使用 [WP-CLI i18n](https://developer.wordpress.org/cli/commands/i18n/) 或 [Poedit](https://poedit.net/) 生成和编辑

### templates/ - 模板文件目录
**WordPress 文档参考**: [Plugin Templates](https://developer.wordpress.org/plugins/administration-menus/admin-ui-best-practices/)

#### `admin-list.php` - 滑块列表页面
管理后台的滑块列表视图：
- 显示所有已创建的滑块
- 展示滑块名称、图片数量、创建时间
- 提供短代码复制功能
- 编辑和删除操作

**安全检查**: 使用 `if (!defined("ABSPATH")) exit;` 防止直接访问 - [Security Best Practices](https://developer.wordpress.org/plugins/security/checking-user-capabilities/)

#### `admin-new.php` - 新建/编辑滑块页面
创建或编辑滑块的表单页面：
- 滑块名称输入
- 图片上传和管理
- 高度设置
- 标签显示选项
- 实时预览功能

**使用的 WordPress UI**:
- `.wrap` 类 - WordPress 标准管理页面容器
- `.form-table` 类 - WordPress 标准表单表格
- `.button`, `.button-primary` - WordPress 按钮样式

## 数据库结构

插件创建一个自定义数据库表：`{$wpdb->prefix}yukicat_bas_sliders`

**WordPress 文档参考**: [Creating Tables](https://developer.wordpress.org/plugins/creating-tables-with-plugins/)

表结构：
```sql
CREATE TABLE {prefix}yukicat_bas_sliders (
    id mediumint(9) NOT NULL AUTO_INCREMENT,
    name varchar(255) NOT NULL,
    images longtext NOT NULL,
    labels longtext NOT NULL,
    settings longtext NOT NULL,
    created_at datetime DEFAULT CURRENT_TIMESTAMP,
    updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);
```

## WordPress 集成功能

### 1. 古腾堡区块
**文档**: [Block Editor Handbook](https://developer.wordpress.org/block-editor/)

- **区块名称**: `yukicat/before-after-slider`
- **分类**: `media`
- **注册函数**: `register_block_type()` - [Block Registration](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-registration/)
- **渲染回调**: `render_callback` - [Dynamic Blocks](https://developer.wordpress.org/block-editor/how-to-guides/block-tutorial/creating-dynamic-blocks/)

### 2. 短代码
**文档**: [Shortcode API](https://developer.wordpress.org/plugins/shortcodes/)

使用方法：
```
[yukicat_slider id="1" height="400" show_labels="true" orientation="horizontal"]
```

注册函数：`add_shortcode('yukicat_slider', ...)`

### 3. 管理菜单
**文档**: [Administration Menus](https://developer.wordpress.org/plugins/administration-menus/)

- **顶级菜单**: `add_menu_page()` - [Top-Level Menus](https://developer.wordpress.org/plugins/administration-menus/top-level-menus/)
- **子菜单**: `add_submenu_page()` - [Sub-Menus](https://developer.wordpress.org/plugins/administration-menus/sub-menus/)
- **图标**: 使用 Dashicons - [Dashicons](https://developer.wordpress.org/resource/dashicons/)

### 4. AJAX 处理
**文档**: [AJAX in Plugins](https://developer.wordpress.org/plugins/javascript/ajax/)

实现的 AJAX 操作：
- `wp_ajax_yukicat_save_slider` - 保存滑块
- `wp_ajax_yukicat_delete_slider` - 删除滑块
- `wp_ajax_yukicat_get_sliders` - 获取滑块列表

安全措施：
- `check_ajax_referer()` - [Nonces](https://developer.wordpress.org/plugins/security/nonces/)
- `current_user_can()` - [Checking User Capabilities](https://developer.wordpress.org/plugins/security/checking-user-capabilities/)

### 5. 脚本和样式加载
**文档**: [Enqueuing Scripts and Styles](https://developer.wordpress.org/plugins/javascript/enqueuing/)

使用的钩子：
- `wp_enqueue_scripts` - 前端脚本和样式 - [Frontend](https://developer.wordpress.org/reference/hooks/wp_enqueue_scripts/)
- `admin_enqueue_scripts` - 管理后台脚本和样式 - [Admin](https://developer.wordpress.org/reference/hooks/admin_enqueue_scripts/)
- `enqueue_block_editor_assets` - 区块编辑器资源 - [Block Editor](https://developer.wordpress.org/reference/hooks/enqueue_block_editor_assets/)

## 安装和使用

### 安装方法

#### 方法一：通过 WordPress 后台
1. 登录 WordPress 管理后台
2. 进入「插件」→「安装插件」
3. 点击「上传插件」
4. 选择插件 ZIP 文件
5. 点击「现在安装」
6. 安装完成后点击「启用插件」

#### 方法二：手动安装
1. 将插件文件夹上传到 `/wp-content/plugins/` 目录
2. 在 WordPress 后台「插件」页面启用插件

**参考**: [Managing Plugins](https://developer.wordpress.org/advanced-administration/plugins/managing-plugins/)

### 使用方法

#### 使用古腾堡区块
1. 在文章或页面编辑器中，点击「+」添加区块
2. 搜索「雪猫滑块」
3. 添加图片并配置选项
4. 发布页面

#### 使用短代码
1. 在后台进入「雪猫滑块」菜单
2. 创建新滑块并添加图片
3. 复制生成的短代码，如：`[yukicat_slider id="1"]`
4. 将短代码粘贴到文章或页面中

## 开发信息

### 系统要求
- **WordPress**: 5.0 或更高版本（支持古腾堡）
- **PHP**: 7.0 或更高版本
- **MySQL**: 5.6 或更高版本

### 版本历史
- **v1.0.5**: 当前版本
  - 改进缓存破坏机制
  - 增强主题兼容性
  - jQuery 冲突隔离

### 技术栈
- **后端**: PHP (WordPress Plugin API)
- **前端**: JavaScript (ES6+), jQuery
- **区块编辑器**: React (通过 WordPress Blocks API)
- **样式**: CSS3
- **数据库**: MySQL (通过 wpdb)

### 遵循的 WordPress 标准
- ✅ [Plugin API](https://developer.wordpress.org/plugins/plugin-api/)
- ✅ [Coding Standards](https://developer.wordpress.org/coding-standards/wordpress-coding-standards/)
- ✅ [Block Editor](https://developer.wordpress.org/block-editor/)
- ✅ [Security Best Practices](https://developer.wordpress.org/plugins/security/)
- ✅ [Internationalization](https://developer.wordpress.org/plugins/internationalization/)

## 需要改进的地方

### 冗余文件清理
以下文件应该被删除或移至版本控制之外：
- ❌ `assets/js/frontend.js.bak` - 备份文件，未被引用
- ❌ `assets/js/frontend.js.new` - 临时文件，未被引用

建议将这些文件添加到 `.gitignore` 文件中：
```gitignore
*.bak
*.new
*.tmp
```

### 建议的改进
1. **添加单元测试**: 使用 [PHPUnit for WordPress](https://developer.wordpress.org/plugins/testing/automated-testing/)
2. **添加 REST API 支持**: 使用 [WordPress REST API](https://developer.wordpress.org/rest-api/)
3. **性能优化**: 实现图片懒加载
4. **增强文档**: 添加更多代码注释
5. **添加 `.gitignore`**: 排除备份和临时文件

## 许可证
本插件使用 GNU General Public License v3.0 许可证。详见 [LICENSE](./LICENSE) 文件。

## 相关链接
- [WordPress Plugin Developer Handbook](https://developer.wordpress.org/plugins/)
- [Block Editor Handbook](https://developer.wordpress.org/block-editor/)
- [WordPress Coding Standards](https://developer.wordpress.org/coding-standards/)
- [Plugin Security](https://developer.wordpress.org/plugins/security/)
- [Internationalization](https://developer.wordpress.org/plugins/internationalization/)

## 作者
YukiCat - [https://www.yukicat.net](https://www.yukicat.net)

---

**注意**: 本文档基于 WordPress 插件开发规范和古腾堡编辑器参考手册创建，所有链接指向 WordPress 官方开发者文档。
