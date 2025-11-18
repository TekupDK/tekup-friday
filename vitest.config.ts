import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  root: path.resolve(import.meta.dirname),
  test: {
    environment: "node",
    include: ["server/**/*.test.ts", "server/**/*.spec.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/build/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      include: ["server/**/*.ts"],
      exclude: [
        "server/**/*.test.ts",
        "server/**/*.spec.ts",
        "server/_core/types/**",
        "server/_core/index.ts", // Main entry point, tested via integration
      ],
      all: true,
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
    globals: true, // Enable global test functions (describe, it, expect)
    setupFiles: ["./server/__tests__/setup.ts"], // Test setup file
    testTimeout: 10000, // 10 seconds per test
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./server"),
      "@tests": path.resolve(import.meta.dirname, "./server/__tests__"),
    },
  },
});
