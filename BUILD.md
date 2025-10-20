# YukiCat Slider - Build System

This project uses Vite for building and optimizing JavaScript modules.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Build Output

The build process:
- Compiles source files from `./src/` to `./assets/js/`
- Minifies JavaScript using Terser
- Generates ES modules only (modern browsers)
- Externalizes jQuery (provided by WordPress)
- Optimizes and inlines CSS into JavaScript bundles

## Source Structure

- `src/frontend.js` - Core slider functionality
- `src/web-component.js` - Custom element with Shadow DOM
- `src/web-component-styles.css` - Styles for web component
- `src/init.js` - Initialization script
- `src/admin.js` - Admin interface functionality

## Production Build

Run `npm run build` to generate optimized production files in `./assets/js/`:
- `frontend.js` - Minified core slider
- `web-component.js` - Minified custom element with inlined styles
- `init.js` - Minified initialization  
- `admin.js` - Minified admin interface

All output files are ES modules compatible with modern browsers.
