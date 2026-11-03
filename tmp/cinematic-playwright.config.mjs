import { defineConfig } from "../capstone-app/node_modules/@playwright/test/index.mjs";

export default defineConfig({
  testDir: "../capstone-app/tests",
  outputDir: "./cinematic-browser-results",
  reporter: "line",
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3001",
    channel: "msedge",
    headless: true,
    screenshot: "only-on-failure",
  },
});
