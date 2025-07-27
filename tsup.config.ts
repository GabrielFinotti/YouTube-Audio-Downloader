import { defineConfig } from 'tsup';
import path from 'path';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node18',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  minify: true,
  dts: false,
  splitting: false,
  bundle: true,
  treeshake: true,
  shims: true,
  external: ['fluent-ffmpeg', 'node-ffmpeg-installer'],
  esbuildOptions: options => {
    options.alias = {
      '@domain': path.resolve(__dirname, 'src/domain'),
      '@infrastructure': path.resolve(__dirname, 'src/infrastructure'),
      '@application': path.resolve(__dirname, 'src/application'),
      '@types': path.resolve(__dirname, 'src/types'),
    };
  },
  onSuccess: async () => {
    console.log('✅ Build concluído com sucesso!');
  },
});
