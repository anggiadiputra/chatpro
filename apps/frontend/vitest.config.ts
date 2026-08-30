import { defineConfig } from "vitest/config"
import { fileURLToPath } from "url"
import path from "path"

export default defineConfig({
  test: {
    environment: "jsdom",
    // Give jsdom a real origin so window.localStorage is available.
    // An opaque origin makes jsdom throw a SecurityError on localStorage access.
    environmentOptions: {
      jsdom: {
        url: "http://localhost:3000",
      },
    },
    globals: true,
    setupFiles: ["./src/__tests__/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(path.dirname(fileURLToPath(import.meta.url)), "./src"),
    },
  },
})