import { defineConfig } from 'vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig({
  plugins: [
    cssInjectedByJsPlugin()
  ],
  build: {
    // Only build ES modules
    lib: {
      entry: {
        'frontend': './src/frontend.js',
        'admin': './src/admin.js',
        'block': './src/block.js'
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.js`
    },
    // Enable minification
    minify: true,
    terserOptions: {
      compress: {
        drop_console: false
      }
    },
    // Output to assets directory
    outDir: './assets/js',
    emptyOutDir: false,
    sourcemap: true,
    rollupOptions: {
      // Externalize jQuery since it's provided by WordPress
      external: ['jquery'],
      output: {
        globals: {
          jquery: 'jQuery'
        }
      }
    }
  }
});
