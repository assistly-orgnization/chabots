import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    'react-markdown',
    'remark-gfm',
    'lucide-react',
    '@dicebear/collection',
    '@dicebear/core',
    'clsx',
    'tailwind-merge',
    'class-variance-authority',
    '@radix-ui/react-label',
    '@radix-ui/react-slot',
    'react-hook-form',
    '@hookform/resolvers',
    'zod',
  ],
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
});
