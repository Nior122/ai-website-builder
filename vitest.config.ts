import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    include: ['__tests__/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next'],
    setupFiles: ['./vitest.setup.ts'],
    // Mock environment variables for all tests
    env: {
      NODE_ENV: 'test',
    },
    coverage: {
      // Use the V8 provider — bundled-level integration with Vitest and fast
      // for Next.js App Router code (no per-file transform required).
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      // Repo code only — exclude generated/infra/config wiring so the
      // numbers reflect the product surface that tests actually exercise.
      include: ['app/**/*.{ts,tsx}', 'lib/**/*.{ts,tsx}', 'features/**/*.{ts,tsx}'],
      exclude: [
        // App Router boilerplate that carries no logic
        'app/**/layout.tsx',
        'app/**/loading.tsx',
        'app/**/error.tsx',
        'app/**/not-found.tsx',
        'app/**/global-error.tsx',
        // Type/config-only modules
        '**/*.d.ts',
        '**/types/**',
        // Generated Prisma client + seed scripts
        'prisma/**',
        // Test fixtures themselves
        '__tests__/**',
      ],
      // Per-file coverage thresholds. Wired loosely for now so CI doesn't
      // turn red on marginal fluctuations; tighten as the suite grows.
      thresholds: {
        lines: 60,
        functions: 60,
        statements: 60,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
    },
  },
});
