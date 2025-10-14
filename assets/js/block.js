/**
 * 雪猫 Before&After Slider - 古腾堡区块
 */

(function(blocks, element, components, editor, i18n) {
    const el = element.createElement;
    const { registerBlockType } = blocks;
    const { InspectorControls } = editor;
    const { 
        PanelBody, 
        Button, 
        RangeControl, 
        ToggleControl,
        TextControl,
        Card,
        CardBody
    } = components;
    const { __ } = i18n;

    registerBlockType('yukicat/before-after-slider', {
        title: __('雪猫滑块', 'yukicat-before-after-slider'),
        description: __('创建漂亮的前后对比滑块效果', 'yukicat-before-after-slider'),
        category: 'media',
        icon: el('svg', { 
            width: 24, 
            height: 24, 
            viewBox: '0 0 24 24' 
        }, [
            el('path', { 
                d: 'M21 17H3V7h18v10zm-9-9H3v8h9V8zm9 0h-8v8h8V8zm-9 4.5L10.5 10 9 11.5 10.5 13 12 11.5z',
                fill: 'currentColor'
            })
        ]),
        attributes: {
            images: {
                type: 'array',
                default: []
            },
            labels: {
                type: 'array',
                default: []
            },
            height: {
                type: 'number',
                default: 400
            },
            showLabels: {
                type: 'boolean',
                default: true
            },
            orientation: {
                type: 'string',
                default: 'horizontal'
            },
            autoSlide: {
                type: 'boolean',
                default: false
            },
            moveWithHandleOnly: {
                type: 'boolean',
                default: false
            },
            moveSliderOnHover: {
                type: 'boolean',
                default: false
            },
            clickToMove: {
                type: 'boolean',
                default: true
            }
        },
        
        edit: function(props) {
            const { attributes, setAttributes } = props;
            const { images, labels, height, showLabels } = attributes;

            // 添加图片
            const addImage = function() {
                const frame = wp.media({
                    title: '选择图片',
                    multiple: true,
                    library: { type: 'image' }
                });

                frame.on('select', function() {
                    const selection = frame.state().get('selection');
                    const newImages = [];
                    const newLabels = [];

                    selection.each(function(attachment) {
                        const imageData = attachment.toJSON();
                        newImages.push({
                            id: imageData.id,
                            url: imageData.url,
                            alt: imageData.alt || ''
                        });
                        newLabels.push(imageData.title || '图片 ' + (newImages.length));
                    });

                    setAttributes({
                        images: [...images, ...newImages],
                        labels: [...labels, ...newLabels]
                    });
                });

                frame.open();
            };

            // 删除图片
            const removeImage = function(index) {
                const newImages = [...images];
                const newLabels = [...labels];
                newImages.splice(index, 1);
                newLabels.splice(index, 1);
                setAttributes({
                    images: newImages,
                    labels: newLabels
                });
            };

            // 更新标签
            const updateLabel = function(index, value) {
                const newLabels = [...labels];
                newLabels[index] = value;
                setAttributes({ labels: newLabels });
            };

            // 渲染图片列表
            const renderImageList = function() {
                if (images.length === 0) {
                    return el('div', {
                        className: 'yukicat-bas-placeholder',
                        style: { 
                            padding: '40px', 
                            textAlign: 'center',
                            border: '2px dashed #ddd',
                            borderRadius: '8px',
                            background: '#f9f9f9'
                        }
                    }, [
                        el('p', { style: { margin: '0 0 16px 0', color: '#666' } }, '点击下方按钮添加图片'),
                        el(Button, {
                            isPrimary: true,
                            onClick: addImage
                        }, '添加图片')
                    ]);
                }

                return el('div', { className: 'yukicat-bas-image-list' }, [
                    ...images.map((image, index) => {
                        return el(Card, {
                            key: image.id,
                            style: { marginBottom: '16px' }
                        }, [
                            el(CardBody, {}, [
                                el('div', {
                                    style: {
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '16px'
                                    }
                                }, [
                                    el('img', {
                                        src: image.url,
                                        alt: image.alt,
                                        style: {
                                            width: '80px',
                                            height: '60px',
                                            objectFit: 'cover',
                                            borderRadius: '4px'
                                        }
                                    }),
                                    el('div', {
                                        style: { flex: 1 }
                                    }, [
                                        el(TextControl, {
                                            label: '图片标签',
                                            value: labels[index] || '',
                                            onChange: (value) => updateLabel(index, value),
                                            placeholder: '输入图片标签...'
                                        }),
                                        el('div', {
                                            style: { marginTop: '8px' }
                                        }, [
                                            el(Button, {
                                                isDestructive: true,
                                                isSmall: true,
                                                onClick: () => removeImage(index)
                                            }, '删除')
                                        ])
                                    ])
                                ])
                            ])
                        ]);
                    }),
                    
                    images.length < 8 && el('div', {
                        style: { textAlign: 'center', marginTop: '16px' }
                    }, [
                        el(Button, {
                            isSecondary: true,
                            onClick: addImage
                        }, '添加更多图片'),
                        el('p', {
                            style: { 
                                margin: '8px 0 0 0', 
                                fontSize: '12px', 
                                color: '#666' 
                            }
                        }, `已添加 ${images.length}/8 张图片`)
                    ])
                ]);
            };

            // 渲染预览
            const renderPreview = function() {
                if (images.length < 2) {
                    return el('div', {
                        className: 'yukicat-bas-placeholder',
                        style: { 
                            height: height + 'px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#f8f9fa',
                            border: '2px dashed #dee2e6',
                            borderRadius: '8px',
                            color: '#6c757d'
                        }
                    }, '请添加至少2张图片以查看预览');
                }

                const sliderId = 'yukicat-preview-' + Math.random().toString(36).substr(2, 9);

                // 检查方向并添加类
                const orientationClass = props.attributes.orientation === 'vertical' ? ' yukicat-bas-vertical' : '';
                
                return el('div', {
                    className: 'yukicat-bas-container yukicat-bas-preview yukicat-bas-in-editor' + orientationClass,
                    style: { height: height + 'px' },
                    'data-slider-id': sliderId,
                    'data-orientation': props.attributes.orientation || 'horizontal',
                    ref: function(node) {
                        if (node && typeof jQuery !== 'undefined' && window.YukiCatSlider) {
                            // 确保先前的初始化已完成
                            if (node.dataset.initializing === 'true') {
                                return;
                            }
                            
                            // 标记为正在初始化
                            node.dataset.initializing = 'true';
                            
                            // 先清理旧的实例，确保不会有重复实例
                            try {
                                const $node = jQuery(node);
                                const oldSlider = $node.data('yukicat-slider');
                                if (oldSlider && typeof oldSlider.destroy === 'function') {
                                    oldSlider.destroy();
                                }
                                
                                // 确保清除初始化标记
                                $node.removeData('yukicat-slider-initialized');
                                
                                // 添加特殊标记以便在编辑器中识别
                                $node.addClass('yukicat-bas-in-editor');
                                
                                // 应用固定尺寸确保正确显示
                                $node.css({
                                    'height': height + 'px',
                                    'max-width': '100%',
                                    'overflow': 'hidden',
                                    'display': 'block'
                                });
                                
                                // 确保在图层上应用正确的类名
                                $node.find('.yukicat-bas-layer').each(function(idx, layer) {
                                    const $layer = jQuery(layer);
                                    // 清除旧的类
                                    $layer.removeClass('active next');
                                    // 应用正确的类
                                    if (idx === 0) {
                                        $layer.addClass('active');
                                        $layer.addClass('yukicat-bas-before');
                                    } else if (idx === 1) {
                                        $layer.addClass('next');
                                        $layer.addClass('yukicat-bas-after');
                                    }
                                });
                                
                                // 延迟初始化确保DOM完全渲染
                                setTimeout(() => {
                                    // 无论之前是否初始化过，都重新初始化
                                    try {
                                        const options = {
                                            orientation: props.attributes.orientation || 'horizontal',
                                            moveWithHandleOnly: props.attributes.moveWithHandleOnly !== undefined ? props.attributes.moveWithHandleOnly : true,
                                            moveSliderOnHover: props.attributes.moveSliderOnHover || false,
                                            clickToMove: props.attributes.clickToMove !== false,
                                            autoSlide: false // 在编辑器中禁用自动滑动
                                        };
                                        const slider = new window.YukiCatSlider(node, options);
                                        $node.data('yukicat-slider', slider);
                                        node.dataset.initialized = 'true';
                                        
                                        // 手动设置裁剪和位置
                                        if (slider && slider.setPosition) {
                                            slider.setPosition(50);
                                        }
                                    } catch (e) {
                                        console.error('初始化滑块预览失败:', e);
                                    } finally {
                                        // 取消初始化标记
                                        node.dataset.initializing = 'false';
                                    }
                                }, 200);
                            } catch (e) {
                                console.error('处理滑块预览错误:', e);
                                node.dataset.initializing = 'false';
                            }
                        }
                    }
                }, [
                    // 图片层
                    ...images.map((image, index) => {
                        // 对于2张图片的情况，第一张设为active和before，第二张设为next和after
                        // 对于多张图片的情况，只有第一张设为active
                        let className = 'yukicat-bas-layer';
                        let layerType = '';
                        
                        if (index === 0) {
                            className += ' active yukicat-bas-before';
                            layerType = 'before';
                        } else if (index === 1) {
                            className += ' next yukicat-bas-after';
                            layerType = 'after';
                        } else if (index > 1) {
                            layerType = 'extra-' + (index - 1);
                        }

                        return el('div', {
                            key: image.id,
                            className: className,
                            'data-index': index,
                            'data-layer-type': layerType
                        }, [
                            el('img', {
                                src: image.url,
                                alt: labels[index] || '图片 ' + (index + 1),
                                style: {
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                },
                                onError: (e) => {
                                    // 图片加载失败时的处理
                                    e.target.style.background = '#f0f0f0';
                                    e.target.style.display = 'flex';
                                    e.target.style.alignItems = 'center';
                                    e.target.style.justifyContent = 'center';
                                    e.target.alt = '图片加载失败';
                                }
                            }),
                            showLabels && el('div', {
                                className: 'yukicat-bas-label'
                            }, labels[index] || (index === 0 ? 'Before' : (index === 1 ? 'After' : '图片 ' + (index + 1))))
                        ]);
                    }),

                    // 滑块控制
                    el('div', {
                        className: 'yukicat-bas-handle'
                    }, [
                        el('div', {
                            className: 'yukicat-bas-handle-button'
                        })
                    ]),

                    // 进度条
                    el('div', {
                        className: 'yukicat-bas-progress'
                    }, [
                        el('div', {
                            className: 'yukicat-bas-progress-bar'
                        })
                    ]),

                    // 指示器
                    showLabels && images.length > 2 && el('div', {
                        className: 'yukicat-bas-indicators'
                    }, images.map((image, index) => {
                        const isActive = index === 0;
                        return el('span', {
                            key: image.id,
                            className: 'yukicat-bas-indicator' + (isActive ? ' active' : ''),
                            'data-index': index
                        }, labels[index] || '图片 ' + (index + 1));
                    }))
                ]);
            };

            return el('div', {}, [
                // 侧边栏控制
                el(InspectorControls, {}, [
                    el(PanelBody, {
                        title: '基本设置',
                        initialOpen: true
                    }, [
                        el(RangeControl, {
                            label: '滑块高度',
                            value: height,
                            onChange: (value) => setAttributes({ height: value }),
                            min: 200,
                            max: 800,
                            step: 10
                        }),
                        el(ToggleControl, {
                            label: '显示图片标签',
                            checked: showLabels,
                            onChange: (value) => setAttributes({ showLabels: value })
                        }),
                        el('div', {
                            className: 'yukicat-bas-field',
                            style: { marginBottom: '16px' }
                        }, [
                            el('label', {
                                style: { 
                                    display: 'block', 
                                    marginBottom: '5px',
                                    fontWeight: '500'
                                }
                            }, '方向'),
                            el('div', {
                                className: 'yukicat-bas-options',
                                style: { 
                                    display: 'flex', 
                                    gap: '8px' 
                                }
                            }, [
                                el(Button, {
                                    isPrimary: props.attributes.orientation === 'horizontal',
                                    isSecondary: props.attributes.orientation !== 'horizontal',
                                    onClick: () => {
                                        setAttributes({ orientation: 'horizontal' });
                                    }
                                }, '水平'),
                                el(Button, {
                                    isPrimary: props.attributes.orientation === 'vertical',
                                    isSecondary: props.attributes.orientation !== 'vertical',
                                    onClick: () => {
                                        setAttributes({ orientation: 'vertical' });
                                    }
                                }, '垂直')
                            ])
                        ])
                    ]),
                    
                    el(PanelBody, {
                        title: '交互设置',
                        initialOpen: false
                    }, [
                        el(ToggleControl, {
                            label: '自动滑动',
                            checked: props.attributes.autoSlide || false,
                            onChange: (value) => setAttributes({ autoSlide: value }),
                            help: '启用后，滑块会自动滚动展示所有图片'
                        }),
                        el(ToggleControl, {
                            label: '仅通过滑块把手移动',
                            checked: props.attributes.moveWithHandleOnly || false,
                            onChange: (value) => setAttributes({ moveWithHandleOnly: value }),
                            help: '启用后，只能通过拖动中间的滑块把手移动'
                        }),
                        el(ToggleControl, {
                            label: '悬停时移动滑块',
                            checked: props.attributes.moveSliderOnHover || false,
                            onChange: (value) => setAttributes({ moveSliderOnHover: value }),
                            help: '启用后，鼠标悬停在滑块上时会跟随移动'
                        }),
                        el(ToggleControl, {
                            label: '点击时移动滑块',
                            checked: props.attributes.clickToMove !== false,
                            onChange: (value) => setAttributes({ clickToMove: value }),
                            help: '启用后，点击滑块上的任意位置会移动滑块到该位置'
                        })
                    ]),

                    el(PanelBody, {
                        title: '图片管理',
                        initialOpen: true
                    }, [
                        renderImageList()
                    ])
                ]),

                // 主编辑区域
                el('div', {
                    style: { 
                        padding: '20px',
                        background: '#fff',
                        borderRadius: '8px',
                        border: '1px solid #ddd'
                    }
                }, [
                    el('h4', {
                        style: { 
                            margin: '0 0 16px 0',
                            fontSize: '16px',
                            fontWeight: '600'
                        }
                    }, '雪猫滑块预览'),
                    renderPreview()
                ])
            ]);
        },

        save: function(props) {
            // 返回null，使用PHP渲染
            return null;
        }
    });

})(
    window.wp.blocks,
    window.wp.element,
    window.wp.components,
    window.wp.blockEditor,
    window.wp.i18n
);