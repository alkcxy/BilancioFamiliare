import { defineConfig } from 'vite'
import RubyPlugin from 'vite-plugin-ruby'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  css: {
    postcss: {}, // avoid picking up .postcssrc.yml from shakapacker
  },
  plugins: [
    RubyPlugin(),
    vue(),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
