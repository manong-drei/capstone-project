import config from '../capstone-app/playwright.config.js';
import { fileURLToPath } from 'node:url';

export default {
  ...config,
  testDir: fileURLToPath(new URL('../capstone-app/tests', import.meta.url)),
  outputDir: fileURLToPath(new URL('./queue-browser-verified', import.meta.url)),
  webServer: undefined,
  use: { ...config.use, baseURL: 'http://127.0.0.1:3015' },
  globalTimeout: 120_000,
  reporter: [['line'], ['json', { outputFile: fileURLToPath(new URL('./queue-browser-verified.json', import.meta.url)) }]],
};
