import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@lsst/pik',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    reporters: ['default'],
    passWithNoTests: true,
  },
});
