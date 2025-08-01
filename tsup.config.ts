import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'es2022',
  platform: 'node',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  minify: process.env.NODE_ENV === 'production',
  splitting: false,
  dts: true,
  external: [
    // External dependencies que não devem ser bundled
    'redis',
    'ioredis',
    'bullmq',
    'express',
    'socket.io',
    'fluent-ffmpeg',
    '@distube/ytdl-core',
    'yt-dlp-wrap',
  ],
  esbuildOptions(options) {
    options.packages = 'external';
  },
  onSuccess: async () => {
    console.log('✅ Build completed successfully!');
  },
});
