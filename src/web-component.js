/**
 * YukiCat Slider Web Component
 * Custom Element with Shadow DOM for style encapsulation
 */

import styles from './web-component-styles.css?inline';

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
                if (window.YukiCatSlider) {
                    const container = this.shadowRoot.querySelector('.yukicat-bas-container');
                    if (container) {
                        // Clean up old instance
                        if (this.sliderInstance && typeof this.sliderInstance.destroy === 'function') {
                            this.sliderInstance.destroy();
                        }
                        
                        // Create new instance with shadow DOM support
                        // YukiCatSlider now accepts DOM element directly (no jQuery needed)
                        this.sliderInstance = new window.YukiCatSlider(container, {
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
        
        // Get CSS styles (imported and will be minified by Vite)
        getStyles() {
            return styles;
        }
    }
    
    // Register the custom element
    if (!customElements.get('yukicat-slider')) {
        customElements.define('yukicat-slider', YukiCatSliderElement);
    }
})();
