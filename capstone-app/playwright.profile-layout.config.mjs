import config from "./playwright.config.js";
const url = "http://127.0.0.1:4312";
export default {
  ...config,
  use: { ...config.use, baseURL: url },
  webServer: {
    command: "node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4312 --strictPort",
    url,
    reuseExistingServer: false,
    stdout: "pipe",
  },
};
