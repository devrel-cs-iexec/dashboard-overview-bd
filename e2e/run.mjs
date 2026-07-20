/**
 * E2E entry point.
 *
 * The static routes are prerendered at build time, so the build has to see the
 * same mock backend the tests do — otherwise those pages bake in whatever live
 * RPC happened to return. This starts the mock, builds against it, then hands
 * off to Playwright (which starts its own app server, also pointed at the mock).
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const MOCK_PORT = 42099;
const mockURL = `http://127.0.0.1:${MOCK_PORT}`;

const env = {
  ...process.env,
  PONDER_URL: `${mockURL}/graphql`,
  ARB_SEPOLIA_RPC_URL: `${mockURL}/rpc/arb`,
  ETH_SEPOLIA_RPC_URL: `${mockURL}/rpc/eth`,
};

const run = (cmd, args, opts = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit", env, ...opts });
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${cmd} exited with ${code}`)),
    );
    child.on("error", reject);
  });

async function waitFor(url, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { method: "POST", body: "{}" });
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await sleep(200);
  }
  throw new Error(`mock backend did not start at ${url}`);
}

// The mock is only needed here for the build. Playwright starts its own pair
// (mock + app) afterwards, so this one is stopped first — leaving both running
// makes them contend for the port and the survivor loses its backend mid-run.
const mock = spawn("node", ["e2e/mock-backend.mjs", String(MOCK_PORT)], {
  stdio: "inherit",
  env,
});

let exitCode = 0;
try {
  await waitFor(`${mockURL}/graphql`);
  await run("npx", ["next", "build"]);
} catch (err) {
  console.error(String(err.message ?? err));
  exitCode = 1;
} finally {
  mock.kill();
  // Give the port time to be released before Playwright rebinds it.
  await sleep(300);
}

const args = process.argv.slice(2);
const PROJECTS = ["desktop", "mobile"];

if (exitCode === 0) {
  // One Playwright invocation per project, each with its own fresh app server.
  // A single run shares one server across both projects, and the second
  // project's load on an already-warm server was enough to push tests into
  // their timeouts here. Sequential runs also make a failure attributable to
  // one device profile.
  const projects = args.some((a) => a.startsWith("--project"))
    ? [null]
    : PROJECTS;

  for (const project of projects) {
    const projectArgs = project ? [`--project=${project}`, ...args] : args;
    try {
      await run("npx", ["playwright", "test", ...projectArgs]);
    } catch (err) {
      console.error(String(err.message ?? err));
      exitCode = 1;
    }
  }
}

process.exit(exitCode);
