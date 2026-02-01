import { defineConfig } from '@lsst/pik-core';

export default defineConfig({
  select: {
    include: ['test-files/**/*.ts', 'test-files/**/.env*'],
    profiles: {
      dev: {
        'Env': 'Development',
        'Database': 'SQLite',
        'Environment': 'DEV',
        'Theme': 'dark',
      },
      prod: {
        'Env': 'Production',
        'Database': 'Postgres',
        'Environment': 'DEV',
        'Theme': 'light',
      },
    },
  },
  worktree: {},
  killport: {
    defaultPort: 3000,
  },
});
