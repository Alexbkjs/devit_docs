import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env': '{}',
    'global': 'globalThis'
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/widget.jsx'),
      name: 'MintlifyAssistant',
      fileName: 'assistant-widget',
      formats: ['iife']
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        banner: 'if(typeof process==="undefined"){window.process={env:{NODE_ENV:"production"}};}\n',
      }
    },
    cssCodeSplit: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      }
    }
  }
})
