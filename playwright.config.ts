import { defineConfig, devices } from "@playwright/test";

const PORT = 3199;
const MOCK_PORT = 42099;
const baseURL = `http://127.0.0.1:${PORT}`;
const mockURL = `http://127.0.0.1:${MOCK_PORT}`;

/**
 * The app under test is pointed at e2e/mock-backend.mjs rather than at live
 * Sepolia RPC and a running Ponder instance, so the suite is deterministic,
 * offline, and able to assert on table contents.
 */
const backendEnv = {
  PONDER_URL: `${mockURL}/graphql`,
  ARB_SEPOLIA_RPC_URL: `${mockURL}/rpc/arb`,
  ETH_SEPOLIA_RPC_URL: `${mockURL}/rpc/eth`,
};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // Every worker hits one shared app server, so the default (a worker per
  // couple of cores) just queues requests behind each other and pushes tests
  // into their timeouts. Two keeps the suite parallel without swamping it.
  workers: 2,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : [["list"]],

  use: {
    baseURL,
    trace: "on-first-retry",
  },

  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],

  webServer: [
    {
      command: `node e2e/mock-backend.mjs ${MOCK_PORT}`,
      url: `${mockURL}/graphql`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      // Production build: the /tvs redirect and the static/dynamic split only
      // exist under `next start`.
      command: `npx next start -p ${PORT}`,
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: backendEnv,
      stdout: "pipe",
      stderr: "pipe",
    },
  ],
});
