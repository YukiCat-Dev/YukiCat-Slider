/**
 * 雪猫 Before&After Slider - 管理员脚本
 */

(function($) {
    'use strict';

    class YukiCatAdmin {
        constructor() {
            this.images = [];
            this.labels = [];
            this.currentSliderID = 0;
            
            this.init();
        }

        init() {
            this.bindEvents();
            this.loadExistingSlider();
            this.setupSortable();
        }

        bindEvents() {
            // 添加图片按钮
            $('#add-image').on('click', this.openMediaUploader.bind(this));
            
            // 表单提交
            $('#yukicat-bas-form').on('submit', this.saveSlider.bind(this));
            
            // 删除滑块
            $('.delete-slider').on('click', this.deleteSlider.bind(this));
            
            // 复制短代码
            $('.copy-shortcode').on('click', this.copyShortcode.bind(this));
            
            // 预览更新
            $('#slider-height, #show-labels').on('change', this.updatePreview.bind(this));
        }

        openMediaUploader() {
            const frame = wp.media({
                title: '选择图片',
                multiple: true,
                library: { type: 'image' },
                button: { text: '添加到滑块' }
            });

            frame.on('select', () => {
                const selection = frame.state().get('selection');
                
                selection.each((attachment) => {
                    const imageData = attachment.toJSON();
                    
                    if (this.images.length < 8) {
                        this.addImageToList({
                            id: imageData.id,
                            url: imageData.url,
                            alt: imageData.alt || '',
                            title: imageData.title || ''
                        });
                    }
                });
                
                this.updatePreview();
            });

            frame.open();
        }

        addImageToList(imageData) {
            const index = this.images.length;
            const defaultLabel = imageData.title || `图片 ${index + 1}`;
            
            this.images.push(imageData);
            this.labels.push(defaultLabel);

            const imageItem = $(`
                <div class="image-item" data-index="${index}">
                    <div class="drag-handle"></div>
                    <div class="image-preview">
                        <img src="${imageData.url}" alt="${imageData.alt}">
                    </div>
                    <div class="image-controls">
                        <input type="text" class="image-label" value="${defaultLabel}" placeholder="输入图片标签...">
                        <div class="button-group">
                            <button type="button" class="button remove-image">删除</button>
                        </div>
                    </div>
                </div>
            `);

            $('.image-list').append(imageItem);

            // 绑定事件
            imageItem.find('.remove-image').on('click', () => {
                this.removeImage(index);
            });

            imageItem.find('.image-label').on('input', (e) => {
                this.updateLabel(index, e.target.value);
            });

            this.updateAddButton();
        }

        removeImage(index) {
            this.images.splice(index, 1);
            this.labels.splice(index, 1);
            
            this.rebuildImageList();
            this.updatePreview();
        }

        updateLabel(index, value) {
            if (this.labels[index] !== undefined) {
                this.labels[index] = value;
                this.updatePreview();
            }
        }

        rebuildImageList() {
            $('.image-list').empty();
            
            this.images.forEach((imageData, index) => {
                const imageItem = $(`
                    <div class="image-item" data-index="${index}">
                        <div class="drag-handle"></div>
                        <div class="image-preview">
                            <img src="${imageData.url}" alt="${imageData.alt}">
                        </div>
                        <div class="image-controls">
                            <input type="text" class="image-label" value="${this.labels[index] || ''}" placeholder="输入图片标签...">
                            <div class="button-group">
                                <button type="button" class="button remove-image">删除</button>
                            </div>
                        </div>
                    </div>
                `);

                $('.image-list').append(imageItem);

                // 重新绑定事件
                imageItem.find('.remove-image').on('click', () => {
                    this.removeImage(index);
                });

                imageItem.find('.image-label').on('input', (e) => {
                    this.updateLabel(index, e.target.value);
                });
            });

            this.updateAddButton();
            this.setupSortable();
        }

        updateAddButton() {
            const $addButton = $('#add-image');
            if (this.images.length >= 8) {
                $addButton.prop('disabled', true).text('已达到最大数量 (8张)');
            } else {
                $addButton.prop('disabled', false).text(`添加图片 (${this.images.length}/8)`);
            }
        }

        setupSortable() {
            if (typeof Sortable === 'undefined') return;

            const imageList = document.querySelector('.image-list');
            if (!imageList) return;

            new Sortable(imageList, {
                handle: '.drag-handle',
                animation: 150,
                onEnd: (evt) => {
                    const oldIndex = evt.oldIndex;
                    const newIndex = evt.newIndex;
                    
                    // 重新排序数组
                    const movedImage = this.images.splice(oldIndex, 1)[0];
                    const movedLabel = this.labels.splice(oldIndex, 1)[0];
                    
                    this.images.splice(newIndex, 0, movedImage);
                    this.labels.splice(newIndex, 0, movedLabel);
                    
                    this.rebuildImageList();
                    this.updatePreview();
                }
            });
        }

        updatePreview() {
            if (this.images.length < 2) {
                $('#preview-container').hide();
                return;
            }

            const height = parseInt($('#slider-height').val()) || 400;
            const showLabels = $('#show-labels').is(':checked');

            let previewHTML = `<div class="yukicat-bas-container" style="height: ${height}px;">`;

            // 添加图片层
            this.images.forEach((image, index) => {
                const label = this.labels[index] || `图片 ${index + 1}`;
                
                // 对于2张图片的情况，第一张设为active（顶层），第二张设为next（底层）
                // 对于多张图片的情况，只有第一张设为active
                let activeClass = '';
                if (this.images.length === 2) {
                    activeClass = index === 0 ? ' active' : ' next';
                } else {
                    activeClass = index === 0 ? ' active' : '';
                }
                
                previewHTML += `
                    <div class="yukicat-bas-layer${activeClass}" data-index="${index}">
                        <img src="${image.url}" alt="${label}" style="width: 100%; height: 100%; object-fit: cover;">
                        ${showLabels ? `<div class="yukicat-bas-label">${label}</div>` : ''}
                    </div>
                `;
            });

            // 添加控制元素
            previewHTML += `
                <div class="yukicat-bas-handle">
                    <div class="yukicat-bas-handle-button"></div>
                </div>
                <div class="yukicat-bas-progress">
                    <div class="yukicat-bas-progress-bar"></div>
                </div>
            `;

            // 添加指示器
            if (showLabels && this.images.length > 2) {
                previewHTML += '<div class="yukicat-bas-indicators">';
                this.labels.forEach((label, index) => {
                    const activeClass = index === 0 ? ' active' : '';
                    previewHTML += `<span class="yukicat-bas-indicator${activeClass}" data-index="${index}">${label}</span>`;
                });
                previewHTML += '</div>';
            }

            previewHTML += '</div>';

            $('#slider-preview').html(previewHTML);
            $('#preview-container').show();

            // 销毁之前的滑块实例
            const existingSlider = $('#slider-preview .yukicat-bas-container').data('yukicat-slider');
            if (existingSlider && existingSlider.destroy) {
                existingSlider.destroy();
            }

            // 初始化预览滑块功能
            setTimeout(() => {
                const container = $('#slider-preview .yukicat-bas-container')[0];
                if (container && window.YukiCatSlider) {
                    const slider = new window.YukiCatSlider(container);
                    $(container).data('yukicat-slider', slider);
                }
            }, 100);
        }

        saveSlider(e) {
            e.preventDefault();

            if (this.images.length < 2) {
                this.showMessage('请至少添加2张图片', 'error');
                return;
            }

            const data = {
                action: 'yukicat_save_slider',
                nonce: yukicat_bas_ajax.nonce,
                name: $('#slider-name').val(),
                images: this.images,
                labels: this.labels,
                settings: {
                    height: parseInt($('#slider-height').val()) || 400,
                    showLabels: $('#show-labels').is(':checked')
                }
            };

            if (this.currentSliderID > 0) {
                data.id = this.currentSliderID;
            }

            $.ajax({
                url: yukicat_bas_ajax.ajax_url,
                type: 'POST',
                data: data,
                beforeSend: () => {
                    $('button[type="submit"]').prop('disabled', true).text('保存中...');
                },
                success: (response) => {
                    if (response.success) {
                        this.showMessage('滑块保存成功！', 'success');
                        if (!this.currentSliderID) {
                            // 新建的情况下，更新URL和ID
                            this.currentSliderID = response.data.id;
                            const newUrl = window.location.href + '&id=' + response.data.id;
                            window.history.replaceState({}, '', newUrl);
                        }
                    } else {
                        this.showMessage('保存失败：' + response.data, 'error');
                    }
                },
                error: () => {
                    this.showMessage('保存失败，请重试', 'error');
                },
                complete: () => {
                    $('button[type="submit"]').prop('disabled', false).text('保存滑块');
                }
            });
        }

        deleteSlider(e) {
            e.preventDefault();
            
            if (!confirm('确定要删除这个滑块吗？此操作不可恢复。')) {
                return;
            }

            const sliderID = $(e.currentTarget).data('id');

            $.ajax({
                url: yukicat_bas_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'yukicat_delete_slider',
                    nonce: yukicat_bas_ajax.nonce,
                    id: sliderID
                },
                beforeSend: () => {
                    $(e.currentTarget).prop('disabled', true).text('删除中...');
                },
                success: (response) => {
                    if (response.success) {
                        $(e.currentTarget).closest('tr').fadeOut(300, function() {
                            $(this).remove();
                        });
                        this.showMessage('滑块删除成功', 'success');
                    } else {
                        this.showMessage('删除失败：' + response.data, 'error');
                    }
                },
                error: () => {
                    this.showMessage('删除失败，请重试', 'error');
                },
                complete: () => {
                    $(e.currentTarget).prop('disabled', false).text('删除');
                }
            });
        }

        copyShortcode(e) {
            e.preventDefault();
            
            const shortcode = $(e.currentTarget).data('shortcode');
            
            // 创建临时文本区域
            const $temp = $('<textarea>');
            $('body').append($temp);
            $temp.val(shortcode).select();
            document.execCommand('copy');
            $temp.remove();

            // 显示复制成功状态
            const $button = $(e.currentTarget);
            const originalText = $button.text();
            
            $button.addClass('shortcode-copied').text('已复制！');
            
            setTimeout(() => {
                $button.removeClass('shortcode-copied').text(originalText);
            }, 2000);
        }

        loadExistingSlider() {
            const urlParams = new URLSearchParams(window.location.search);
            const sliderID = urlParams.get('id');
            
            if (!sliderID) return;

            $.ajax({
                url: yukicat_bas_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'yukicat_get_sliders',
                    nonce: yukicat_bas_ajax.nonce
                },
                success: (response) => {
                    if (response.success) {
                        const slider = response.data.find(s => s.id == sliderID);
                        if (slider) {
                            this.loadSliderData(slider);
                        }
                    }
                }
            });
        }

        loadSliderData(slider) {
            this.currentSliderID = slider.id;
            this.images = JSON.parse(slider.images || '[]');
            this.labels = JSON.parse(slider.labels || '[]');
            
            const settings = JSON.parse(slider.settings || '{}');
            
            // 填充表单
            $('#slider-name').val(slider.name);
            $('#slider-height').val(settings.height || 400);
            $('#show-labels').prop('checked', settings.showLabels !== false);
            
            // 重建图片列表
            this.rebuildImageList();
            this.updatePreview();
        }

        showMessage(message, type = 'info') {
            const $message = $(`
                <div class="yukicat-bas-message ${type}">
                    ${message}
                </div>
            `);
            
            $('.wrap h1').after($message);
            
            setTimeout(() => {
                $message.fadeOut(300, function() {
                    $(this).remove();
                });
            }, 5000);
        }
    }

    // 初始化
    $(document).ready(function() {
        if ($('body').hasClass('admin_page_yukicat-bas-new') || $('#yukicat-bas-form').length) {
            new YukiCatAdmin();
        }
    });

})(jQuery);