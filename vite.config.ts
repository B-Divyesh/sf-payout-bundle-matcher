import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'es2022',
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/app-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts']
  }
})
