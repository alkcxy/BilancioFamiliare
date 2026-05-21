import { defineConfig, loadEnv } from 'vite'
import RubyPlugin from 'vite-plugin-ruby'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    define: {
      __AUTHELIA_ENABLED__: env.AUTHELIA_ENABLED === 'true',
    },
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
  }
})
