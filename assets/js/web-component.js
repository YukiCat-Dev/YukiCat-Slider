/**
 * YukiCat Slider Web Component
 * Custom Element with Shadow DOM for style encapsulation
 */

(function() {
    'use strict';
    
    // Define the custom element
    class YukiCatSliderElement extends HTMLElement {
        constructor() {
            super();
            
            // Attach shadow DOM
            this.attachShadow({ mode: 'open' });
            
            // Store configuration
            this.config = {
                height: 400,
                orientation: 'horizontal',
                autoSlide: false,
                handleOnly: false,
                hoverMove: false,
                clickMove: true,
                showLabels: true,
                images: [],
                labels: []
            };
            
            // Slider state
            this.sliderInstance = null;
        }
        
        // Observed attributes
        static get observedAttributes() {
            return ['height', 'orientation', 'auto-slide', 'handle-only', 'hover-move', 'click-move', 'show-labels'];
        }
        
        // Called when element is added to DOM
        connectedCallback() {
            // Parse configuration from attributes
            this.parseAttributes();
            
            // Parse images and labels from content
            this.parseContent();
            
            // Render the component
            this.render();
            
            // Initialize the slider
            this.initializeSlider();
        }
        
        // Called when element is removed from DOM
        disconnectedCallback() {
            // Clean up slider instance
            if (this.sliderInstance && typeof this.sliderInstance.destroy === 'function') {
                this.sliderInstance.destroy();
            }
        }
        
        // Called when attributes change
        attributeChangedCallback(name, oldValue, newValue) {
            if (oldValue !== newValue) {
                this.parseAttributes();
                if (this.shadowRoot.innerHTML) {
                    this.render();
                    this.initializeSlider();
                }
            }
        }
        
        // Parse attributes
        parseAttributes() {
            this.config.height = parseInt(this.getAttribute('height') || '400');
            this.config.orientation = this.getAttribute('orientation') || 'horizontal';
            this.config.autoSlide = this.getAttribute('auto-slide') === 'true';
            this.config.handleOnly = this.getAttribute('handle-only') === 'true';
            this.config.hoverMove = this.getAttribute('hover-move') === 'true';
            this.config.clickMove = this.getAttribute('click-move') !== 'false';
            this.config.showLabels = this.getAttribute('show-labels') !== 'false';
        }
        
        // Parse images and labels from light DOM (slot content)
        parseContent() {
            const imageElements = this.querySelectorAll('img');
            this.config.images = [];
            this.config.labels = [];
            
            imageElements.forEach((img, index) => {
                this.config.images.push({
                    url: img.src,
                    alt: img.alt || `Image ${index + 1}`
                });
                
                const label = img.getAttribute('data-label') || img.alt || `Image ${index + 1}`;
                this.config.labels.push(label);
            });
        }
        
        // Render the component
        render() {
            const orientationClass = this.config.orientation === 'vertical' ? ' yukicat-bas-vertical' : '';
            const sliderId = 'yukicat-slider-' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substring(2));
            
            // Inject CSS into shadow DOM
            const styles = this.getStyles();
            
            // Build HTML structure
            let html = `
                <style>${styles}</style>
                <div class="yukicat-bas-container${orientationClass}" 
                     style="height: ${this.config.height}px;" 
                     data-slider-id="${sliderId}"
                     data-orientation="${this.config.orientation}"
                     data-auto-slide="${this.config.autoSlide}"
                     data-handle-only="${this.config.handleOnly}"
                     data-hover-move="${this.config.hoverMove}"
                     data-click-move="${this.config.clickMove}">
            `;
            
            // Add image layers
            this.config.images.forEach((image, index) => {
                const label = this.config.labels[index] || `Image ${index + 1}`;
                let layerClass = 'yukicat-bas-layer';
                let layerType = 'default';
                
                if (this.config.images.length >= 2) {
                    if (index === 0) {
                        layerClass += ' active yukicat-bas-before';
                        layerType = 'before';
                    } else if (index === 1) {
                        layerClass += ' next yukicat-bas-after';
                        layerType = 'after';
                    } else {
                        layerType = `extra-${index - 1}`;
                    }
                }
                
                html += `
                    <div class="${layerClass}" data-index="${index}" data-layer-type="${layerType}">
                        <img src="${image.url}" alt="${image.alt}">
                        ${this.config.showLabels ? `<div class="yukicat-bas-label">${label}</div>` : ''}
                    </div>
                `;
            });
            
            // Add slider handle
            html += `
                <div class="yukicat-bas-handle">
                    <div class="yukicat-bas-handle-button"></div>
                </div>
            `;
            
            // Add progress bar
            html += `
                <div class="yukicat-bas-progress">
                    <div class="yukicat-bas-progress-bar"></div>
                </div>
            `;
            
            // Add indicators for multiple images
            if (this.config.showLabels && this.config.images.length > 2) {
                html += '<div class="yukicat-bas-indicators">';
                this.config.labels.forEach((label, index) => {
                    const activeClass = index === 0 ? ' active' : '';
                    html += `<span class="yukicat-bas-indicator${activeClass}" data-index="${index}">${label}</span>`;
                });
                html += '</div>';
            }
            
            html += '</div>';
            
            this.shadowRoot.innerHTML = html;
        }
        
        // Initialize slider with YukiCatSlider class
        initializeSlider() {
            // Wait for YukiCatSlider to be available
            const initSlider = () => {
                if (window.YukiCatSlider && window.jQuery) {
                    const $ = window.jQuery;
                    const container = this.shadowRoot.querySelector('.yukicat-bas-container');
                    if (container) {
                        // Clean up old instance
                        if (this.sliderInstance && typeof this.sliderInstance.destroy === 'function') {
                            this.sliderInstance.destroy();
                        }
                        
                        // Create new instance with shadow DOM support
                        // Pass the jQuery-wrapped container and shadow root
                        this.sliderInstance = new window.YukiCatSlider($(container), {
                            shadowRoot: this.shadowRoot,
                            orientation: this.config.orientation,
                            autoSlide: this.config.autoSlide,
                            moveWithHandleOnly: this.config.handleOnly,
                            moveSliderOnHover: this.config.hoverMove,
                            clickToMove: this.config.clickMove
                        });
                    }
                } else {
                    // Retry after a short delay
                    setTimeout(initSlider, 100);
                }
            };
            
            initSlider();
        }
        
        // Get CSS styles (copy from frontend.css)
        getStyles() {
            // Return the CSS from frontend.css as a string
            // This ensures styles are encapsulated in shadow DOM
            return `
                /* Embedded styles from frontend.css */
                .yukicat-bas-container {
                    position: relative;
                    width: 100%;
                    max-width: 100%;
                    overflow: hidden;
                    border-radius: 12px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                    cursor: col-resize;
                    user-select: none;
                    background: #f8f9fa;
                    min-height: 200px;
                    box-sizing: border-box;
                }
                
                .yukicat-bas-container.yukicat-bas-vertical {
                    cursor: row-resize;
                }
                
                .yukicat-bas-layer {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    opacity: 0;
                    overflow: hidden;
                    box-sizing: border-box;
                    will-change: clip-path;
                }
                
                .yukicat-bas-layer.yukicat-bas-before,
                .yukicat-bas-layer.yukicat-bas-after {
                    opacity: 1;
                }
                
                .yukicat-bas-layer.next {
                    opacity: 1;
                    z-index: 1;
                    clip-path: none;
                }
                
                .yukicat-bas-layer.active {
                    opacity: 1;
                    z-index: 2;
                }
                
                .yukicat-bas-layer.active.yukicat-bas-before,
                .yukicat-bas-layer.yukicat-bas-before.active {
                    clip-path: inset(0 50% 0 0);
                }
                
                .yukicat-bas-vertical .yukicat-bas-layer.active.yukicat-bas-before,
                .yukicat-bas-vertical .yukicat-bas-layer.yukicat-bas-before.active {
                    clip-path: inset(0 0 50% 0);
                }
                
                .yukicat-bas-layer img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                    max-width: none;
                    max-height: none;
                    margin: 0;
                    padding: 0;
                    pointer-events: none;
                    user-select: none;
                }
                
                .yukicat-bas-label {
                    position: absolute;
                    top: 20px;
                    left: 20px;
                    padding: 8px 16px;
                    background: rgba(0,0,0,0.8);
                    color: white;
                    border-radius: 20px;
                    font-size: 14px;
                    font-weight: 500;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                    backdrop-filter: blur(10px);
                    z-index: 10;
                    opacity: 0.3;
                    transition: opacity 0.3s ease;
                    pointer-events: none;
                }
                
                .yukicat-bas-container:hover .yukicat-bas-label {
                    opacity: 1;
                }
                
                .yukicat-bas-container.dragging .yukicat-bas-label {
                    opacity: 1;
                }
                
                .yukicat-bas-handle {
                    position: absolute;
                    top: 0;
                    left: 50%;
                    width: 4px;
                    height: 100%;
                    background: linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(255,255,255,0.7));
                    z-index: 20;
                    transform: translateX(-50%);
                    cursor: col-resize;
                    box-shadow: 0 0 10px rgba(0,0,0,0.2);
                }
                
                .yukicat-bas-vertical .yukicat-bas-handle {
                    top: 50%;
                    left: 0;
                    width: 100%;
                    height: 4px;
                    transform: translateY(-50%);
                    cursor: row-resize;
                    background: linear-gradient(to right, rgba(255,255,255,0.9), rgba(255,255,255,0.7));
                }
                
                .yukicat-bas-handle-button {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 40px;
                    height: 40px;
                    background: white;
                    border-radius: 50%;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: col-resize;
                    transition: all 0.2s ease;
                }
                
                .yukicat-bas-vertical .yukicat-bas-handle-button {
                    cursor: row-resize;
                }
                
                .yukicat-bas-handle-button:hover {
                    transform: translate(-50%, -50%) scale(1.1);
                    box-shadow: 0 6px 20px rgba(0,0,0,0.4);
                }
                
                .yukicat-bas-handle-button::before,
                .yukicat-bas-handle-button::after {
                    content: '';
                    position: absolute;
                    width: 0;
                    height: 0;
                    border-style: solid;
                }
                
                .yukicat-bas-handle-button::before {
                    left: 12px;
                    border-width: 6px 8px 6px 0;
                    border-color: transparent #333 transparent transparent;
                }
                
                .yukicat-bas-handle-button::after {
                    right: 12px;
                    border-width: 6px 0 6px 8px;
                    border-color: transparent transparent transparent #333;
                }
                
                .yukicat-bas-vertical .yukicat-bas-handle-button::before {
                    left: 50%;
                    top: 12px;
                    transform: translateX(-50%) rotate(-90deg);
                    border-width: 6px 8px 6px 0;
                    border-color: transparent #333 transparent transparent;
                }
                
                .yukicat-bas-vertical .yukicat-bas-handle-button::after {
                    left: 50%;
                    bottom: 12px;
                    right: auto;
                    transform: translateX(-50%) rotate(-90deg);
                    border-width: 6px 0 6px 8px;
                    border-color: transparent transparent transparent #333;
                }
                
                .yukicat-bas-progress {
                    position: absolute;
                    bottom: 20px;
                    left: 20px;
                    right: 20px;
                    height: 4px;
                    background: rgba(255,255,255,0.3);
                    border-radius: 2px;
                    overflow: hidden;
                    z-index: 15;
                }
                
                .yukicat-bas-vertical .yukicat-bas-progress {
                    bottom: 20px;
                    left: 20px;
                    right: auto;
                    top: 20px;
                    width: 4px;
                    height: auto;
                }
                
                .yukicat-bas-progress-bar {
                    width: 50%;
                    height: 100%;
                    background: linear-gradient(90deg, #ff6b6b, #4ecdc4);
                    border-radius: 2px;
                }
                
                .yukicat-bas-vertical .yukicat-bas-progress-bar {
                    width: 100%;
                    height: 50%;
                    background: linear-gradient(180deg, #ff6b6b, #4ecdc4);
                    transition: none;
                }
                
                .yukicat-bas-indicators {
                    position: absolute;
                    bottom: 40px;
                    left: 50%;
                    transform: translateX(-50%);
                    display: flex;
                    gap: 8px;
                    z-index: 15;
                    background: rgba(0,0,0,0.5);
                    padding: 8px 12px;
                    border-radius: 20px;
                    backdrop-filter: blur(10px);
                }
                
                .yukicat-bas-indicator {
                    padding: 4px 12px;
                    background: rgba(255,255,255,0.2);
                    color: white;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .yukicat-bas-indicator:hover {
                    background: rgba(255,255,255,0.3);
                }
                
                .yukicat-bas-indicator.active {
                    background: white;
                    color: #333;
                }
                
                @keyframes pulse {
                    0% { transform: translate(-50%, -50%) scale(1); }
                    50% { transform: translate(-50%, -50%) scale(1.05); }
                    100% { transform: translate(-50%, -50%) scale(1); }
                }
                
                .yukicat-bas-handle-button.active {
                    animation: pulse 2s infinite;
                }
                
                @media (max-width: 768px) {
                    .yukicat-bas-container {
                        border-radius: 8px;
                    }
                    
                    .yukicat-bas-label {
                        top: 10px;
                        left: 10px;
                        padding: 6px 12px;
                        font-size: 12px;
                        opacity: 0.2;
                    }
                    
                    .yukicat-bas-container.dragging .yukicat-bas-label {
                        opacity: 1;
                    }
                    
                    .yukicat-bas-handle-button {
                        width: 35px;
                        height: 35px;
                    }
                }
            `;
        }
    }
    
    // Register the custom element
    if (!customElements.get('yukicat-slider')) {
        customElements.define('yukicat-slider', YukiCatSliderElement);
    }
})();
