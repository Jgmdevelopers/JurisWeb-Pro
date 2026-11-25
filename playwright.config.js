const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests/e2e",

  fullyParallel: true,

  forbidOnly: !!process.env.CI,

  retries: process.env.CI ? 2 : 0,

  workers: 2,

  timeout: 30000,

  reporter: [["list"], ["html", { open: "never" }]],

  use: {
    browserName: "chromium",

    baseURL: "http://127.0.0.1:8765",

    locale: "es-AR",

    timezoneId: "America/Argentina/Ushuaia",

    screenshot: "only-on-failure",

    video: "retain-on-failure",

    trace: "retain-on-failure",
  },

  projects: [
    {
      name: "escritorio-1920",
      use: {
        viewport: { width: 1920, height: 1080 },
      },
    },

    {
      name: "escritorio-1440",
      use: {
        viewport: { width: 1440, height: 900 },
      },
    },

    {
      name: "tablet-horizontal",
      use: {
        viewport: { width: 1024, height: 768 },
        hasTouch: true,
      },
    },

    {
      name: "tablet-vertical",
      use: {
        viewport: { width: 768, height: 1024 },
        hasTouch: true,
      },
    },

    {
      name: "movil-390",
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },

    {
      name: "movil-320",
      use: {
        viewport: { width: 320, height: 568 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],

  webServer: {
    command: "npm run serve:test",
    url: "http://127.0.0.1:8765",
    reuseExistingServer: false,
    timeout: 15000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
