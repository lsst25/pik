import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@lsst25/pik',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    reporters: ['default'],
  },
});
