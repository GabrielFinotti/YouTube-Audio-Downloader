import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node18',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  minify: true,
  dts: false, // Não precisamos de .d.ts para API
  splitting: false,
  bundle: true,
  treeshake: true,
  shims: true, // Para compatibilidade ESM/CJS
  external: [
    'fluent-ffmpeg',
    'node-ffmpeg-installer'
  ],
  onSuccess: async () => {
    console.log('✅ Build concluído com sucesso!')
  }
})
