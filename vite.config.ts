import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
      dts: 'src/auto-imports.d.ts' // 生成类型声明文件
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: 'src/components.d.ts' // 生成类型声明文件
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  css: {
    preprocessorOptions: {
      stylus: {
        imports: [path.resolve(__dirname, 'src/assets/stylus/variable.styl')]
      }
    }
  },
  server: {
    host: '0.0.0.0', // 监听所有地址
    port: 5173,
    proxy: {
      // 代理所有以 /api 开头的请求到另一个服务器
      '/api': {
        target: 'https://blog.api.bloniea.com/image/v1/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        timeout: 60000, // 增加超时时间（以毫秒为单位），例如 60 秒
        proxyTimeout: 60000, // 增加代理超时时间
        ws: false
      },
      // '/api': {
      //   target: 'http://127.0.0.1:3000/image/v1/',
      //   changeOrigin: true,
      //   rewrite: (path) => path.replace(/^\/api/, ''),
      //   timeout: 60000, // 增加超时时间（以毫秒为单位），例如 60 秒
      //   proxyTimeout: 60000, // 增加代理超时时间
      //   ws: false
      // },
      '/upload': {
        target: 'https://api.github.com/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/upload/, ''),
        timeout: 60000, // 增加超时时间（以毫秒为单位），例如 60 秒
        proxyTimeout: 60000, // 增加代理超时时间
        ws: false
      }
    }
  }
})
