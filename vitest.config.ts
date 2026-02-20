import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // jsdom provides localStorage + browser globals (needed by config.ts at import time)
        environment: 'jsdom',
        include: ['src/**/*.test.ts'],
    },
});
