// Renders the production renderer bundle in headless Chromium, backed by the
// real compiled Studio Service over NDJSON, and captures the retained visual
// evidence the spec's Testing Strategy names for AC-26, AC-35 through AC-38,
// AC-50 and AC-51 — every criterion whose row cites this tool's captures — when
// a headful Electron session is unavailable.
//
// Zero new dependencies: the browser is driven over the Chrome DevTools
// Protocol using Node's global WebSocket.

import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { once } from "node:events";
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { dirname, extname, join, resolve, sep } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const rendererRoot = resolve(repoRoot, "apps/desktop/out/renderer");
const serviceEntry = resolve(repoRoot, "apps/studio-service/dist/service.js");
// Publishing is a whole-directory swap, not an append: a run replaces its
// output directory's retained captures wholesale. There is deliberately **no
// default**. This used to fall back to the walking-skeleton spec's notes, and
// on 2026-09-20 a bare invocation from another slice replaced that Shipped
// spec's 36 retained baselines -- the rule was documented in this comment and
// the destructive default was reachable anyway, so the comment lost. Naming
// the set you are about to replace is now the only way to replace it.
//
// Each root needs its own `.gitignore` entries for the two staging
// directories derived below.
function fail(message) {
  console.error(`visual-evidence: ${message}`);
  process.exit(1);
}

// The only directories this tool may publish into. This is an allowlist, not
// a hint: publishing renames the output directory aside and then deletes the
// retired copy, so an unintended value does not merely write in the wrong
// place, it destroys what was there. An earlier version of this guard only
// checked that the variable was set -- under which `VISUAL_EVIDENCE_ROOT=`
// resolves to the repository root and the swap deletes the whole worktree,
// and a typo of `.../notes` for `.../notes/visual` deletes a directory of
// hand-written notes. Each entry also has to carry its own `.gitignore`
// entries for the two staging directories derived below, which is a second
// reason membership is decided here rather than by the caller.
const KNOWN_ROOTS = [
  "docs/specs/product-development-walking-skeleton/notes/visual",
  "docs/specs/connect-and-orient/notes/visual",
];
const requestedRoot = process.env.VISUAL_EVIDENCE_ROOT;
if (requestedRoot === undefined || requestedRoot.trim() === "") {
  fail(
    "VISUAL_EVIDENCE_ROOT is required, because publishing replaces that " +
      "directory's retained captures wholesale.\n" +
      "  Capture the walking-skeleton surfaces:  pnpm visual-evidence:skeleton\n" +
      "  Capture the connect-and-orient slice:   pnpm visual-evidence:connect",
  );
}
const outputRoot = resolve(repoRoot, requestedRoot);
if (!KNOWN_ROOTS.some((known) => resolve(repoRoot, known) === outputRoot)) {
  fail(
    `VISUAL_EVIDENCE_ROOT resolved to ${outputRoot}, which is not an evidence ` +
      "directory this tool may publish into. Publishing deletes what is " +
      "already there, so only these are accepted:\n" +
      KNOWN_ROOTS.map((known) => `  ${known}`).join("\n") +
      "\nAdding a root means adding it here and adding its .next/.previous " +
      "staging directories to .gitignore.",
  );
}

/**
 * Click a button by its exact label, waiting for it to appear.
 *
 * Every call site used to sleep a fixed 1200-1500 ms and then abort the whole
 * run if the render had not landed, discarding every capture taken so far --
 * on a host where this suite has gone red at load averages of 43 to 62. A
 * deadline poll costs nothing when the render is fast and does not throw away
 * an hour of work when it is slow. A harness failure is reported as itself
 * rather than as a slow page.
 */
const CLICK_DEADLINE_MS = 15_000;
const POLL_INTERVAL_MS = 200;

async function clickWhenOffered(page, label, what) {
  const until = Date.now() + CLICK_DEADLINE_MS;
  for (;;) {
    if (plumbingFailure !== null) throw new Error(plumbingFailure);
    const clicked = await page("Runtime.evaluate", {
      expression: `(() => {
        ${REACHABLE_CONTROLS_JS}
        const el = controls.find(
          (candidate) =>
            candidate.tagName === "BUTTON" &&
            candidate.textContent.trim() === ${JSON.stringify(label)},
        );
        // A disabled button swallows .click() and reports nothing, so treating
        // it as offered would report a click that did not happen and surface
        // the real failure later as an unrelated timeout.
        if (!el || el.disabled) return false;
        el.click();
        return true;
      })()`,
      returnByValue: true,
    });
    if (clicked.result.value === true) return;
    if (Date.now() >= until)
      throw new Error(
        `${what} never offered "${label}" within ${CLICK_DEADLINE_MS / 1000}s`,
      );
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

// The refusal the `connect-rejected` surface must show, read from the module
// that owns the copy rather than hand-copied here. `@agent-ready/protocol` is
// not resolvable from this plain .mjs tool, so the source is read directly and
// a failure to find the key is loud: a silent fallback would turn a copy edit
// into a confusing "showed the wrong refusal" abort at the end of a
// multi-minute run.
const PUBLIC_GITHUB_ONLY_REFUSAL = (() => {
  const vocabulary = resolve(
    repoRoot,
    "packages/protocol/src/state-vocabulary.ts",
  );
  const source = readFileSync(vocabulary, "utf8");
  // Anchored to the exported record, so a key of the same name elsewhere in
  // the file cannot be mistaken for it.
  const record =
    /export const SOURCE_REJECTION_REASONS = \{([\s\S]*?)\n\}/.exec(source);
  const match =
    record === null
      ? null
      : /publicGithubOnly:\s*\n?\s*"([^"]+)"/.exec(record[1]);
  if (match === null)
    fail(
      `could not read SOURCE_REJECTION_REASONS.publicGithubOnly from ${vocabulary}; ` +
        "the connect-rejected surface asserts that exact copy",
    );
  return match[1];
})();

/**
 * Wait until the rendered document stops changing, or the deadline passes.
 *
 * Every surface used to be measured a fixed 1200-1500 ms after the click that
 * navigated to it, with no post-condition. On a host where this suite goes red
 * at load averages of 43 to 62, that publishes a capture of a surface that has
 * not finished rendering -- and the AC-38 name-set comparison then reports a
 * false pass when every scenario is equally early, or a false failure when one
 * is not. Two consecutive identical readings is a weak post-condition, but it
 * is a post-condition, where a sleep is none.
 */
async function readRenderState(page) {
  const reading = await page("Runtime.evaluate", {
    expression: `(() => {
      ${REACHABLE_CONTROLS_JS}
      return document.body.innerHTML.length + ":" + controls.length;
    })()`,
    returnByValue: true,
  });
  return reading.result.value;
}

/**
 * Wait until the surface the last action navigated to is on screen and has
 * stopped changing. Returns null when it settled, or a finding string.
 *
 * `before` must be read **before** the action, because two identical readings
 * alone cannot tell "finished rendering" from "the click's handler is still
 * awaiting IPC and the previous surface is still up". The settle needs the
 * document to have both changed from where it started and then held still.
 *
 * A finding is returned rather than thrown: a late render is still worth
 * capturing and looking at. It is returned rather than merely logged because
 * a capture the tool knows was taken mid-render must not publish with an
 * empty problems list and exit 0 -- that is the false verification record
 * this harness exists to refuse.
 */
async function settleRender(
  page,
  what,
  before,
  changeRequired = true,
  deadlineMs = 10_000,
) {
  const until = Date.now() + deadlineMs;
  let previous = null;
  let changed = false;
  for (;;) {
    if (plumbingFailure !== null) throw new Error(plumbingFailure);
    const now = await readRenderState(page);
    if (now !== before) changed = true;
    if ((changed || !changeRequired) && previous !== null && now === previous)
      // Decided from the settled reading against `before`, not from the
      // latched `changed` flag: a surface that flickers and settles back to
      // exactly its pre-click state has not changed, and reporting a stale
      // declaration there would redden the run with a claim this function's
      // own reading contradicts.
      return !changeRequired && now !== before
        ? `${what} was declared a no-op click but settled to a different document, so its clickIsNoop property is stale`
        : null;
    previous = now;
    if (Date.now() >= until)
      return changed || !changeRequired
        ? `${what} was still changing after ${deadlineMs / 1000}s`
        : `${what} never changed within ${deadlineMs / 1000}s, so the capture may show the previous surface`;
    await new Promise((r) => setTimeout(r, 250));
  }
}

// The root font size `tokens.css` owns, as a CSS pixel value. `text-200`
// derives its target from the page's measured baseline, and a baseline read
// before the stylesheet applied would read the UA's 16px and silently
// redefine the target to 32px -- the exact 2.67x miscalibration that check
// was added to catch. Pinning it here means a pre-stylesheet reading fails
// the run instead of moving the goalposts.
const PRODUCT_ROOT_FONT_PX = (() => {
  const tokens = resolve(
    repoRoot,
    "apps/desktop/src/renderer/styles/tokens.css",
  );
  const root = /:root\s*\{([\s\S]*?)\n\}/.exec(readFileSync(tokens, "utf8"));
  const sizes =
    root === null ? [] : [...root[1].matchAll(/font-size:\s*([^;]+);/g)];
  if (sizes.length !== 1)
    fail(
      `expected exactly one \`font-size\` in the :root block of ${tokens}, found ` +
        `${sizes.length}. This value is what every capture is checked against to ` +
        "prove the stylesheet applied, so it must be unambiguous.",
    );
  const declared = sizes[0][1].trim();
  const percent = /^([\d.]+)%$/.exec(declared);
  const pixels = /^([\d.]+)px$/.exec(declared);
  if (percent === null && pixels === null)
    fail(
      `cannot derive a pixel value from \`font-size: ${declared}\` in ${tokens}. ` +
        "Supported forms are a percentage of the 16px UA default, or px.",
    );
  return percent !== null
    ? (16 * Number.parseFloat(percent[1])) / 100
    : Number.parseFloat(pixels[1]);
})();

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

// The `window.studio` shim, served as a same-origin file so the document's own
// `script-src 'self'` admits it without the policy being widened.
//
// What this harness does NOT evidence, stated plainly so no one reads more into
// it: the served document is the built `index.html` with a `studio-stub.js` tag
// injected, which the shipped renderer does not contain, and it is served over
// HTTP with no Content-Security-Policy response header. So the header path
// `applyContentSecurityPolicy` builds in the main process is never exercised
// here, and `connect-src` is carrying an `/rpc` channel production never opens.
// CSP evidence rests on `apps/desktop/src/main/index.test.ts`, not on this tool.
// What this tool evidences is layout, overflow, accessible naming and reduced
// motion on the real renderer bundle against real service data.
const STUB = `
// Mirrors apps/desktop/src/preload/index.ts exactly: same method names, same
// injected parameters, same frozen shape. The renderer is unmodified, so any
// drift here shows up as a refusal from the real service rather than passing
// silently.
globalThis.studio = (() => {
  const call = async (method, params) => {
    const response = await fetch("/rpc", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ method, params }),
    });
    return response.json();
  };
  const optionalWorkspace = (workspaceId) =>
    workspaceId === undefined ? {} : { workspaceId };
  return Object.freeze({
    workspace: Object.freeze({
      create: (input) =>
        call("workspace.create", {
          ...input,
          blueprintId: "product-development",
          blueprintVersion: "1",
        }),
      list: () => call("workspace.list", {}),
      get: (id) => call("workspace.get", { id }),
      home: (workspaceId) => call("home.get", optionalWorkspace(workspaceId)),
      seedDemo: (workspaceId) => call("demo.seed", { workspaceId }),
    }),
    artifact: Object.freeze({
      revise: (input) => call("artifact.revise", input),
    }),
    execution: Object.freeze({
      start: (input) =>
        call("execution.start", {
          ...input,
          transformationId: "strategy.frame-product-intent",
          executorKind: "deterministic",
        }),
    }),
    source: Object.freeze({
      connect: (input) => call("source.connect", input),
      get: (sourceId) => call("source.get", { sourceId }),
      cancel: (sourceId) => call("source.cancel", { sourceId }),
    }),
    review: Object.freeze({
      list: (workspaceId) => call("review.list", optionalWorkspace(workspaceId)),
      get: (id) => call("review.get", { id }),
      resolve: (input) => call("review.resolve", input),
    }),
  });
})();
`;

// Both the overflow probe and the occlusion probe count "reachable controls",
// and the occlusion vacuity guard compares one against the other. Two
// hand-copied predicates would let an edit to one silently stop the guard
// firing, so the definition lives here and is interpolated into both.
const REACHABLE_CONTROLS_JS = `
  const reachable = (el) => {
    if (el.getClientRects().length === 0) return false;
    const style = getComputedStyle(el);
    return style.visibility !== "hidden" && style.display !== "none";
  };
  const controls = [
    ...document.querySelectorAll("button, input, textarea, select, a[href]"),
  ].filter(reachable);
`;

// ---------------------------------------------------------------- service ---

function startService(databasePath) {
  const child = spawn(process.execPath, [serviceEntry], {
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env, STUDIO_DATABASE_PATH: databasePath },
  });
  const pending = new Map();
  createInterface({ input: child.stdout }).on("line", (line) => {
    if (!line.trim()) return;
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      return;
    }
    if (message.id === undefined || message.id === null) return; // notification
    const settle = pending.get(message.id);
    if (!settle) return;
    pending.delete(message.id);
    settle.resolve(message);
  });
  child.stderr.on("data", (chunk) => process.stderr.write(`service: ${chunk}`));

  // A request is only ever answered by a matching stdout line, so nothing
  // settles it if the child dies first — the run would hang with no output.
  // And a write to a dead child's stdin fails with an asynchronous `error`
  // event, which without a listener is an uncaught exception that skips every
  // cleanup path. Both are the transport defect this build already repaired
  // once; neither is acceptable here either.
  const die = (reason) => {
    const waiting = [...pending.values()];
    pending.clear();
    for (const settle of waiting) settle.reject(new Error(reason));
  };
  child.stdin.on("error", (error) =>
    die(`studio service stdin failed: ${error.message}`),
  );
  child.on("exit", (code, signal) =>
    die(`studio service exited (code ${code}, signal ${signal})`),
  );
  child.on("error", (error) =>
    die(`studio service could not start: ${error.message}`),
  );

  const request = (method, params) =>
    new Promise((resolve, reject) => {
      if (child.exitCode !== null || child.signalCode !== null) {
        reject(new Error("studio service is not running"));
        return;
      }
      const id = randomUUID();
      pending.set(id, { resolve, reject });
      child.stdin.write(
        `${JSON.stringify({ jsonrpc: "2.0", id, method, params: params ?? {} })}\n`,
      );
    });
  return { child, request };
}

// ----------------------------------------------------------------- server ---

// Set when the harness's own plumbing fails rather than the page under test.
// The scenario loop reads it and throws, so the failure unwinds through the
// single cleanup path instead of terminating the process from a stray
// rejection.
let plumbingFailure = null;

function startServer(request) {
  // Every rejection inside this handler is caught here. Node's default is
  // `--unhandled-rejections=throw`, and nothing awaits an `http` request
  // listener, so an uncaught rejection here would kill the process between
  // `mkdtempSync` and the `finally` — orphaning the browser, the service child
  // and the work directory. The reachable path is not hypothetical: when the
  // service child dies, every pending request is rejected by design.
  const server = createServer((req, res) => {
    void handle(req, res).catch((error) => {
      plumbingFailure ??=
        error instanceof Error ? error.message : String(error);
      if (!res.headersSent)
        res.writeHead(500, { "content-type": "application/json" });
      if (!res.writableEnded)
        res.end(
          JSON.stringify({
            ok: false,
            error: {
              kind: "disconnected",
              message: plumbingFailure,
              code: null,
              data: null,
            },
          }),
        );
    });
  });

  async function handle(req, res) {
    if (req.method === "POST" && req.url === "/rpc") {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const { method, params } = JSON.parse(Buffer.concat(chunks).toString());
      const response = await request(method, params);
      // Mirror the preload's typed outcome shape, including `code` and `data`:
      // `StudioCallFailure` always carries both, and the decision panel keys its
      // AC-13 conflict branch on the code, so dropping them would make that
      // branch silently unreachable under this harness.
      const outcome =
        response.error === undefined
          ? { ok: true, value: response.result }
          : {
              ok: false,
              error: {
                kind:
                  response.error.code === -32001 ? "incompatible" : "service",
                message: response.error.message,
                code: response.error.code ?? null,
                data: response.error.data ?? null,
              },
            };
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(outcome));
      return;
    }
    if (req.url === "/studio-stub.js") {
      res.writeHead(200, { "content-type": MIME[".js"] });
      res.end(STUB);
      return;
    }
    const path = req.url === "/" ? "/index.html" : (req.url ?? "/index.html");
    const file = resolve(rendererRoot, `.${path}`);
    // A directory boundary, not a character prefix. `startsWith(rendererRoot)`
    // alone admits any sibling sharing the prefix — `/../renderer-scratch/x`
    // resolves under the parent, begins with the same characters and passes.
    // Nothing in this harness's threat model exploits that, but confinement is
    // either a boundary or it is decoration.
    if (file !== rendererRoot && !file.startsWith(rendererRoot + sep)) {
      res.writeHead(403).end();
      return;
    }
    let body;
    try {
      body = readFileSync(file);
    } catch {
      res.writeHead(404).end();
      return;
    }
    if (path === "/index.html") {
      body = Buffer.from(
        body
          .toString()
          .replace(
            '<script type="module"',
            '<script src="./studio-stub.js"></script>\n    <script type="module"',
          ),
      );
    }
    res.writeHead(200, {
      "content-type": MIME[extname(file)] ?? "application/octet-stream",
    });
    res.end(body);
  }

  // The same emitter guard the two child processes carry. `once(server,
  // "listening")` installs a temporary error handler and removes it again, so
  // without this any later server error — accept-time fd exhaustion, for
  // instance — is an unhandled `error` event that terminates the process between
  // `mkdtempSync` and the `finally`.
  server.on("error", (error) => {
    plumbingFailure ??= `evidence server failed: ${error.message}`;
  });
  server.listen(0, "127.0.0.1");
  return server;
}

// ---------------------------------------------------------------- browser ---

function findChromium() {
  const cache = join(process.env.HOME ?? "", "Library/Caches/ms-playwright");
  let candidates = [];
  try {
    candidates = readdirSync(cache)
      .filter((entry) => entry.startsWith("chromium-"))
      .sort()
      .reverse()
      .map((entry) =>
        join(
          cache,
          entry,
          "chrome-mac-arm64/Chromium.app/Contents/MacOS/Chromium",
        ),
      );
  } catch {
    /* fall through to the system browser */
  }
  candidates.push(
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  );
  for (const candidate of candidates) {
    try {
      statSync(candidate);
      return candidate;
    } catch {
      /* try the next */
    }
  }
  return null;
}

// Chromium writes the port it actually bound into DevToolsActivePort once the
// endpoint is up, which is how an ephemeral port is discoverable at all.
async function connect(userDataDir) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const activePort = readFileSync(
        join(userDataDir, "DevToolsActivePort"),
        "utf8",
      )
        .split("\n")[0]
        .trim();
      const response = await fetch(
        `http://127.0.0.1:${activePort}/json/version`,
      );
      const { webSocketDebuggerUrl } = await response.json();
      const socket = new WebSocket(webSocketDebuggerUrl);
      await once(socket, "open");
      return socket;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  throw new Error("Chromium did not expose a DevTools endpoint");
}

function cdp(socket) {
  let nextId = 0;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    const settle = pending.get(message.id);
    if (!settle) return;
    pending.delete(message.id);
    settle(message);
  });
  // Without these, a browser that crashes mid-scenario leaves every awaited
  // call pending forever: the run hangs with no output, no exit code, and no
  // cleanup. `WebSocket` here is an EventTarget, so an unlistened `error`
  // reports nothing at all.
  const drop = (reason) => {
    const waiting = [...pending.values()];
    pending.clear();
    for (const settle of waiting) settle({ error: { message: reason } });
  };
  socket.addEventListener("error", () => drop("DevTools socket failed"));
  socket.addEventListener("close", () => drop("DevTools socket closed"));
  return (method, params, sessionId) =>
    new Promise((settle, reject) => {
      nextId += 1;
      const id = nextId;
      pending.set(id, (message) =>
        message.error
          ? reject(new Error(`${method}: ${message.error.message}`))
          : settle(message.result),
      );
      socket.send(
        JSON.stringify({ id, method, params: params ?? {}, sessionId }),
      );
    });
}

// ------------------------------------------------------------------- main ---

const scenarios = [
  // A deliberately fixed evidence viewport, not the shipped default. The window
  // fills the display's work area at launch, which differs per machine, so
  // pinning captures to it would make the retained evidence unreproducible.
  // 1600x1000 is a desktop size the three-region layout is designed for; the
  // narrow and zoom scenarios below carry the criteria's own floors.
  {
    name: "desktop-light",
    width: 1600,
    height: 1000,
    scale: 1,
    scheme: "light",
    motion: "no-preference",
  },
  {
    name: "desktop-dark",
    width: 1600,
    height: 1000,
    scale: 1,
    scheme: "dark",
    motion: "no-preference",
  },
  // AC-0130: the connect-and-orient *Minimum supported window width* is 900
  // CSS pixels, which is narrower than the 1024 below and is the floor that
  // criterion actually names.
  {
    name: "narrow-900",
    width: 900,
    height: 720,
    scale: 1,
    scheme: "light",
    motion: "no-preference",
  },
  // AC-0132's text-resize half. A device scale factor enlarges the layout with
  // the text; this enlarges the text against a fixed layout, which is the case
  // that clips.
  {
    name: "text-200",
    width: 1024,
    height: 768,
    scale: 1,
    scheme: "light",
    motion: "no-preference",
    textScale: 2,
  },
  // AC-37: the criterion's 1024px-wide viewport.
  {
    name: "narrow-1024",
    width: 1024,
    height: 768,
    scale: 1,
    scheme: "light",
    motion: "no-preference",
  },
  // AC-37: 200% zoom is a device scale factor of 2 over half the CSS width.
  {
    name: "zoom-200",
    width: 720,
    height: 640,
    scale: 2,
    scheme: "light",
    motion: "no-preference",
  },
  // AC-38: reduced motion must retain every action.
  {
    name: "reduced-motion",
    width: 1600,
    height: 1000,
    scale: 1,
    scheme: "light",
    motion: "reduce",
  },
  // AC-38 names two input modes, not one. This is the second: a coarse pointer
  // that cannot hover. `input` is a single field precisely so a scenario cannot
  // declare a hover value and a pointer value that disagree — a declared-but-
  // unapplied option is what produced the defect this scenario was added to fix.
  {
    name: "no-hover",
    width: 1600,
    height: 1000,
    scale: 1,
    scheme: "light",
    motion: "no-preference",
    input: "coarse-no-hover",
  },
];

const browserPath = findChromium();
if (!browserPath)
  fail("no Chromium or Chrome found; cannot capture rendered evidence");
try {
  statSync(rendererRoot);
  statSync(serviceEntry);
} catch {
  fail(
    "run `pnpm build` first — the production renderer and service bundles are missing",
  );
}

// Everything from here down runs inside the try/finally below. `fail()` is the
// pre-flight abort only, for the checks above that hold no resources; the
// invariant past this line is stated as a resource rule rather than as a note
// about one function: **no abort after `mkdtempSync` may skip the `finally`.**
// Three review rounds were spent on successive violations of it.
const workDir = mkdtempSync(join(tmpdir(), "studio-visual-"));
const { child, request } = startService(join(workDir, "studio.db"));
const server = startServer(request);
// Deliberately not awaited here. `once(server, "listening")` rejects on the
// server's `error` event, and this line sits after `mkdtempSync` and
// `startService` but before the `try` — so a listen failure (EMFILE under a low
// fd limit, EADDRNOTAVAIL or EACCES on a loopback-restricted host) would
// terminate the process on a top-level rejection with the `finally` never
// running, orphaning the service child and the work directory. The await is
// inside the `try` instead.
const listening = once(server, "listening");
const userDataDir = join(workDir, "chromium");
// Port zero, not a constant: a fixed port collides between concurrent runs and,
// worse, lets a later run attach to a browser an earlier run left behind.
// Chromium writes the port it actually chose into DevToolsActivePort.
const port = 0;
const browser = spawn(
  browserPath,
  [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu",
    "about:blank",
  ],
  { stdio: ["ignore", "ignore", "pipe"] },
);
// Drained, not merely piped: an undrained pipe blocks a chatty browser on write,
// and when `connect` gives up the browser's own explanation is the only thing
// that says why it never started.
browser.stderr.on("data", (chunk) =>
  process.stderr.write(`chromium: ${chunk}`),
);
// The same guard the service child carries, for the same reason: an async spawn
// failure (EACCES, ENOEXEC, EMFILE, or the binary disappearing after the
// `statSync` probe) emits `error` on an emitter with no listener, which Node
// raises as an uncaught exception — after `mkdtempSync` and before the `try`.
browser.on("error", (error) => {
  plumbingFailure ??= `chromium could not start: ${error.message}`;
});

const results = [];
let failures = 0;
let aborted = null;
let origin = "";
try {
  await listening;
  origin = `http://127.0.0.1:${server.address().port}`;

  // Handshake only. Everything the screenshots show is produced by driving the
  // rendered application itself, below.
  const hello = await request("system.hello", {
    protocolVersion: "1",
    client: "visual-evidence",
  });
  if (hello.error) throw new Error(`handshake refused: ${hello.error.message}`);

  const socket = await connect(userDataDir);
  if (plumbingFailure !== null) throw new Error(plumbingFailure);
  const send = cdp(socket);
  const { targetId } = await send("Target.createTarget", {
    url: "about:blank",
  });
  const { sessionId } = await send("Target.attachToTarget", {
    targetId,
    flatten: true,
  });
  const page = (method, params) => send(method, params, sessionId);
  await page("Page.enable");
  await page("Runtime.enable");

  for (const scenario of scenarios) {
    // `Emulation.setEmulatedMedia` accepts `hover` and `pointer` feature names
    // and silently ignores them — the call succeeds and the media queries stay
    // false. Coarse pointer and hover:none come from mobile device metrics plus
    // touch emulation instead. Verified directly against this browser; the
    // assertion below is what stops that from being trusted rather than checked.
    const coarse = scenario.input === "coarse-no-hover";
    await page("Emulation.setDeviceMetricsOverride", {
      width: scenario.width,
      height: scenario.height,
      deviceScaleFactor: scenario.scale,
      mobile: coarse,
    });
    await page("Emulation.setTouchEmulationEnabled", {
      enabled: coarse,
      maxTouchPoints: 5,
    });
    await page("Emulation.setEmulatedMedia", {
      features: [
        { name: "prefers-color-scheme", value: scenario.scheme },
        { name: "prefers-reduced-motion", value: scenario.motion },
      ],
    });
    await page("Page.navigate", { url: `${origin}/index.html` });
    await new Promise((r) => setTimeout(r, 1500));

    // Text resize against a fixed layout, which is a different failure from a
    // device scale factor: the layout box does not grow with the text, so a
    // column that cannot reflow clips instead.
    //
    // Applied *after* navigation, and probed. An earlier version set it before
    // `Page.navigate`, which discarded it -- three captures came back
    // byte-identical to their unscaled baseline and evidenced nothing. This is
    // the same failure the mode probe below was added for, on a new dimension.
    if (scenario.textScale !== undefined) {
      // 200 percent of the **product's own** root size, not of the UA default.
      // `tokens.css` sets `:root { font-size: 75% }`, so an inline
      // `font-size: 200%` resolves against the UA's 16px and renders 32px --
      // 2.67x the application's 12px base, not the 2x the criterion names.
      // The baseline is measured first and the scale applied as a pixel value
      // derived from it, so the factor is a property of the product rather
      // than of the browser's default.
      const baseline = await page("Runtime.evaluate", {
        expression:
          "Number.parseFloat(getComputedStyle(document.documentElement).fontSize)",
        returnByValue: true,
      });
      const basePx = Number.parseFloat(baseline?.result?.value ?? "0");
      if (!Number.isFinite(basePx) || basePx <= 0)
        throw new Error(
          `${scenario.name}: could not read the baseline root font size`,
        );
      // The baseline has to be the product's, not the UA's. Without this the
      // target is derived from whatever was measured, so a stylesheet that
      // had not applied yet would pass its own wrong value straight through.
      if (Math.abs(basePx - PRODUCT_ROOT_FONT_PX) > 0.5)
        throw new Error(
          `${scenario.name}: root font size is ${basePx}px, but tokens.css owns ` +
            `${PRODUCT_ROOT_FONT_PX}px — the stylesheet had not applied, so the ` +
            "text scale would have been derived from the wrong baseline",
        );
      const expected = basePx * scenario.textScale;
      const applied = await page("Runtime.evaluate", {
        expression: `(() => {
          document.documentElement.style.fontSize = '${expected}px';
          return getComputedStyle(document.documentElement).fontSize;
        })()`,
        returnByValue: true,
      });
      const rendered = Number.parseFloat(applied?.result?.value ?? "0");
      if (!Number.isFinite(rendered) || Math.abs(rendered - expected) > 1) {
        throw new Error(
          `${scenario.name}: text scale did not take effect — root font-size is ${applied?.result?.value}, expected about ${expected}px (${scenario.textScale}x the product's ${basePx}px base)`,
        );
      }
      await new Promise((r) => setTimeout(r, 300));
    }

    // Confirm the page is actually in the mode this scenario claims. Without
    // this the no-hover scenario silently reran the baseline and its AC-38
    // comparison compared the baseline against itself.
    const modeProbe = await page("Runtime.evaluate", {
      expression: `JSON.stringify({
        scheme: matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
        reduce: matchMedia("(prefers-reduced-motion: reduce)").matches,
        hoverNone: matchMedia("(hover: none)").matches,
        pointerCoarse: matchMedia("(pointer: coarse)").matches,
        rootFontSizePx: Number.parseFloat(
          getComputedStyle(document.documentElement).fontSize,
        ),
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
      })`,
      returnByValue: true,
    });
    if (plumbingFailure !== null) throw new Error(plumbingFailure);
    const mode = JSON.parse(modeProbe.result.value);
    const modeErrors = [];
    if (mode.scheme !== scenario.scheme)
      modeErrors.push(
        `prefers-color-scheme is ${mode.scheme}, wanted ${scenario.scheme}`,
      );
    if (mode.reduce !== (scenario.motion === "reduce"))
      modeErrors.push(`prefers-reduced-motion in force: ${mode.reduce}`);
    if (mode.hoverNone !== coarse)
      modeErrors.push(
        `hover: none in force: ${mode.hoverNone}, wanted ${coarse}`,
      );
    if (mode.pointerCoarse !== coarse)
      modeErrors.push(
        `pointer: coarse in force: ${mode.pointerCoarse}, wanted ${coarse}`,
      );
    // Every scenario, not only the scaled one. A stylesheet that had not
    // applied publishes at the UA's 16px with an empty problems list, and
    // that is 56 of the 64 captures if the check lives only in the
    // `textScale` branch.
    const expectedRoot = PRODUCT_ROOT_FONT_PX * (scenario.textScale ?? 1);
    if (Math.abs(mode.rootFontSizePx - expectedRoot) > 0.5)
      modeErrors.push(
        `root font-size is ${mode.rootFontSizePx}px, wanted ${expectedRoot}px ` +
          `(tokens.css owns ${PRODUCT_ROOT_FONT_PX}px at scale ${scenario.textScale ?? 1})`,
      );
    // Thrown rather than `fail()`ed. `fail` exits the process, and every abort
    // inside this `try` must instead unwind through the `finally` below —
    // otherwise the browser, the service child, the HTTP server and the temp
    // directory are all orphaned, and the next run attaches to the leftover
    // browser. There are no `fail()` calls between the `try` and the `finally`.
    if (modeErrors.length > 0)
      throw new Error(
        `scenario ${scenario.name} did not enter the mode it claims: ${modeErrors.join("; ")}`,
      );

    // Drive the real flow through the rendered UI: create a workspace, seed it,
    // run the transformation, then open the review that produces. AC-26 is a
    // claim about a review surface, so an empty Home would not evidence it.
    await page("Runtime.evaluate", {
      expression: `(() => {
        const field = document.querySelector("#workspace-name");
        if (!field) return "no create form";
        const setter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype, "value").set;
        setter.call(field, "Evidence Workspace");
        field.dispatchEvent(new Event("input", { bubbles: true }));
        document.querySelector("form").requestSubmit();
        return "submitted";
      })()`,
      returnByValue: true,
    });
    await new Promise((r) => setTimeout(r, 1500));
    // Setup only. The surfaces themselves are measured one at a time below:
    // visiting a surface is not measuring it, and an earlier version of this
    // harness clicked through Reviews on its way to the Work Item Studio and
    // measured only where it landed.
    for (const label of ["Seed demo workspace", "Run transformation"]) {
      const beforeSetup = await readRenderState(page);
      await clickWhenOffered(page, label, "the rendered application");
      // "Run transformation" is a real round trip to the service child, and
      // the walking-skeleton ledger records its slowness as the "never offered
      // Open review" failure, so this waits on the render rather than on a
      // clock. The floor stays because the round trip can start after the
      // first settle reading.
      await new Promise((r) => setTimeout(r, 1500));
      const setupFinding = await settleRender(
        page,
        `the ${label} step`,
        beforeSetup,
      );
      // Thrown, not `fail()`ed, for the reason stated at the mode check: a
      // `fail()` here exits the process from inside the try, orphaning the
      // browser, the service child, the server and the temp directory.
      if (setupFinding !== null) throw new Error(setupFinding);
    }

    // Every surface the build renders is driven to and measured while it is on
    // screen. AC-37's overflow rule, AC-36's accessible names and the 24px
    // target floor apply per surface, and measuring one while claiming the
    // others is the gap two review rounds were spent closing.
    //
    // Six of the eight blueprint modules render the same `ModuleSurface`
    // component with different text, and "module" drives Research to stand for
    // all six. The other two are measured directly because AC-51 gave each real
    // content read from the workspace, so neither is that component any more:
    // Strategy lists the Product Intent work, and Overview summarises it.
    for (const surface of [
      { name: "home", clicks: [] },
      { name: "overview", clicks: ["Overview"] },
      { name: "module", clicks: ["Research"] },
      { name: "strategy", clicks: ["Strategy"] },
      { name: "reviews", clicks: ["Home", "Reviews"] },
      { name: "studio", clicks: ["Open review"] },
      // The connect-and-orient surfaces. Reachable from global navigation, so
      // one click each, and both render before any repository is connected --
      // which is the state AC-0107 governs and the one a capture can show
      // without contacting a remote.
      { name: "connect", clicks: ["Connect"] },
      // AC-0130's focus-obscuring clause needs a diagnostic surface on screen
      // at the same time as a focused control. A refused URL produces one and
      // reaches no remote -- the refusal is decided before any transport is
      // consulted, which is the property AC-0108 rests on -- so this is the
      // only connect-and-orient state a capture can show with a diagnostic in
      // it while AC-0148 holds.
      {
        name: "connect-rejected",
        clicks: ["Connect"],
        // The loop reaches this surface straight after `connect`, which is
        // also reached by clicking Connect, so this click correctly changes
        // nothing. Stated as its own property rather than inferred from
        // `submit`, so a future driven surface whose click *does* navigate
        // gets the ordinary settle instead of inheriting this one's skip.
        clickIsNoop: true,
        submit: "https://example.com/acme/widgets",
      },
    ]) {
      const settleFindings = [];
      for (const label of surface.clicks) {
        const before = await readRenderState(page);
        await clickWhenOffered(page, label, `the ${surface.name} surface`);
        {
          // Every click is settled, and every finding is kept. `??=` would
          // short-circuit the call itself, so one slow click would leave each
          // later click on the same surface with no wait at all -- `reviews`
          // clicks Home then Reviews -- and the recorded finding would name
          // the wrong one.
          // Every click is settled, including one declared a no-op. The
          // declaration only relaxes the "must have changed" requirement --
          // it does not skip the wait, because a declaration is true of a
          // list order rather than of the click, and reordering the surfaces
          // would otherwise leave a real navigation with no post-condition.
          // A declared no-op that *does* change is reported, so a stale
          // declaration surfaces instead of hiding.
          const finding = await settleRender(
            page,
            `the ${surface.name} surface, after clicking "${label}"`,
            before,
            surface.clickIsNoop !== true,
          );
          if (finding !== null) settleFindings.push(finding);
        }
      }

      let surfaceDiagnostic = null;
      if (surface.submit !== undefined) {
        // The field has to be there before it can be driven. Polled rather
        // than looked at once, so a slow render is waited out instead of
        // aborting the run on the first look. It still throws at the
        // deadline, and that throw does discard the run -- the poll buys
        // time, it does not remove the failure mode.
        const fieldDeadline = Date.now() + CLICK_DEADLINE_MS;
        for (;;) {
          if (plumbingFailure !== null) throw new Error(plumbingFailure);
          const present = await page("Runtime.evaluate", {
            expression: 'document.getElementById("connect-url") !== null',
            returnByValue: true,
          });
          if (present.result.value === true) break;
          if (Date.now() >= fieldDeadline)
            throw new Error(
              `the ${surface.name} surface never offered the URL field within ` +
                `${CLICK_DEADLINE_MS / 1000}s`,
            );
          await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        }
        const submitted = await page("Runtime.evaluate", {
          expression: `(() => {
            const field = document.getElementById("connect-url");
            if (!field) return "no url field";

            const setter = Object.getOwnPropertyDescriptor(
              window.HTMLInputElement.prototype, "value").set;
            setter.call(field, ${JSON.stringify(surface.submit)});
            field.dispatchEvent(new Event("input", { bubbles: true }));
            const button = [...document.querySelectorAll("button")].find(
              (el) => /connect repository/i.test(el.textContent || ""));
            if (!button) return "no submit button";
            button.click();
            return true;
          })()`,
          returnByValue: true,
        });
        if (submitted.result.value !== true)
          throw new Error(
            `the ${surface.name} surface could not be driven to a diagnostic: ${submitted.result.value}`,
          );
        // Poll for the state itself rather than sleeping a fixed span. The
        // submission crosses IPC to the real service, and this surface runs
        // under six scenarios, so one slow render on a loaded host would
        // otherwise discard the whole run's evidence.
        //
        // The marker is the `url-rejected` state the form emits, not a
        // substring of the body: the refusal text is "Studio connects to
        // public github.com repositories only", which shares no word with a
        // generic /cannot|refus/ probe, and the strings that DO match such a
        // probe belong to the Studio-side failure state and the version
        // qualifier -- so a body-text guard would pass on the wrong surface.
        // Wait for the form's own rejection paragraph, then check the text is
        // the refusal this URL should produce. Both halves were wrong before:
        // a document-wide [data-state="url-rejected"] also matches a state
        // badge, and an earlier /cannot|refus/ body probe matched two
        // unrelated states while missing this one, because the refusal shares
        // no word with that pattern.
        const deadline = Date.now() + 15_000;
        let diagnostic = null;
        while (Date.now() < deadline) {
          // A dead harness must be reported as itself. Without this the
          // timeout below would attribute a crashed service child to a slow
          // page and discard the real cause.
          if (plumbingFailure !== null) throw new Error(plumbingFailure);
          const seen = await page("Runtime.evaluate", {
            expression: `(() => {
              const el = document.querySelector(
                '.connect-form__rejection[data-state="url-rejected"]');
              return el === null ? null : (el.textContent || "").trim();
            })()`,
            returnByValue: true,
          });
          if (
            typeof seen.result.value === "string" &&
            seen.result.value !== ""
          ) {
            diagnostic = seen.result.value;
            break;
          }
          await new Promise((r) => setTimeout(r, 250));
        }
        if (diagnostic === null)
          throw new Error(
            `the ${surface.name} surface showed no url-rejected diagnostic ` +
              `within 15s`,
          );
        // Which refusal, not merely that one rendered. A submission that lost
        // its URL would otherwise publish a capture of a different diagnostic
        // and nothing would say so.
        if (diagnostic !== PUBLIC_GITHUB_ONLY_REFUSAL)
          throw new Error(
            `the ${surface.name} surface showed "${diagnostic}", expected ` +
              `"${PUBLIC_GITHUB_ONLY_REFUSAL}"`,
          );
        surfaceDiagnostic = diagnostic;
      }

      // AC-37 assertion: decision controls must stay reachable without
      // two-dimensional page scrolling. Horizontal page overflow is the failure.
      const probe = await page("Runtime.evaluate", {
        expression: `JSON.stringify((() => {
        const root = document.documentElement;
        // Reachable controls only. A control that is in the DOM but hidden or
        // zero-sized in this input mode is not an available action, so counting
        // it would let a hover-gated action pass the AC-38 comparison.
        ${REACHABLE_CONTROLS_JS}
        const accessibleName = (el) =>
          (el.getAttribute("aria-label")
            ?? (el.labels && el.labels[0] && el.labels[0].textContent)
            ?? el.textContent
            ?? "").trim();
        const unnamed = controls.filter((el) => {
          const name = el.getAttribute("aria-label")
            ?? (el.labels && el.labels[0] && el.labels[0].textContent)
            ?? el.textContent;
          return !name || !name.trim();
        }).length;
        // The density pass claims a 24 CSS pixel floor on every interactive
        // control. Measured here rather than asserted in a stylesheet comment,
        // because a comment does not fail when someone changes the base size.
        const undersized = controls
          .filter((el) => {
            const box = el.getBoundingClientRect();
            return box.height < 24 || box.width < 24;
          })
          .map((el) => {
            const box = el.getBoundingClientRect();
            // Concatenation, not a template literal: this whole probe is itself
            // inside one, so a nested placeholder would be interpolated here
            // rather than in the page.
            return (accessibleName(el) || el.tagName) + " " +
              Math.round(box.width) + "x" + Math.round(box.height);
          });
        // The workspace select must be able to show a real workspace name. A
        // select spends roughly 16px on its own horizontal padding and 20px on
        // the chevron, so the box has to clear the widest option by that much
        // or the name is truncated. Measured, because the density pass cut the
        // sidebar to a 166px box for 168px of content and nothing noticed.
        const workspaceSelect = document.querySelector("#workspace-select");
        const selectFit = (() => {
          if (!workspaceSelect) return null;
          const context = document
            .createElement("canvas")
            .getContext("2d");
          const style = getComputedStyle(workspaceSelect);
          context.font =
            style.fontStyle + " " + style.fontWeight + " " +
            style.fontSize + " " + style.fontFamily;
          const widest = Math.max(
            ...[...workspaceSelect.options].map((option) =>
              Math.ceil(context.measureText(option.text).width),
            ),
          );
          return {
            box: Math.round(workspaceSelect.getBoundingClientRect().width),
            needed: widest + 36,
          };
        })();
        return {
          selectFit,
          horizontalOverflow: root.scrollWidth - root.clientWidth,
          controls: controls.length,
          names: controls.map(accessibleName).sort(),
          undersized,
          unnamed,
          overflowingControls: controls.filter((el) => {
            const box = el.getBoundingClientRect();
            return box.right > root.clientWidth + 1 || box.left < -1;
          }).map((el) => (el.textContent || "").trim().slice(0, 40)),
        };
      })())`,
        returnByValue: true,
      });
      const measured = JSON.parse(probe.result.value);

      const shot = await page("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: false,
      });
      // Held in memory, not written yet. Nothing lands in the retained evidence
      // directory until the whole run has succeeded — see the publish step below.
      const bytes = Buffer.from(shot.data, "base64");

      // AC-0130, the focus-obscuring clause. A still capture cannot show this:
      // it records one moment with whatever focus happened to be, and nothing
      // in an image says which element is focused or what is painted over it.
      // So each control is focused in turn and hit-tested at its own centre.
      // If the topmost element there is neither the control nor related to it
      // by containment, something is painted over the focused control.
      //
      // What this check cannot see, stated so the record does not overclaim:
      //   - An overlay with `pointer-events: none` is painted over the control
      //     but skipped by `elementFromPoint`, so it reads as clean.
      //   - Only each control's centre is sampled, so a panel covering a
      //     control's edges, its label or its focus ring while leaving the
      //     middle clear reads as clean.
      //   - A control an overlay prevents from taking focus is recorded as a
      //     skip, not a failure; the vacuity guard below catches the case
      //     where that happens to every control, not where it happens to some.
      // The criterion's evidence is recorded as "centre not obscured by a
      // hit-testable layer", which is what this actually proves.
      //
      // Run after the screenshot so moving focus cannot change what was
      // captured.
      const occlusionProbe = await page("Runtime.evaluate", {
        expression: `JSON.stringify((() => {
        const describe = (el) => {
          if (el === null) return "nothing";
          const tag = el.tagName.toLowerCase();
          const id = el.id ? "#" + el.id : "";
          const cls = typeof el.className === "string" && el.className
            ? "." + el.className.trim().split(/\\s+/).join(".")
            : "";
          return tag + id + cls;
        };
        // textContent is "" rather than null for input and select, so a ??
        // chain never reaches a fallback and the operator gets a message that
        // names nothing. With no CI, that line is the whole failure record.
        const named = (el) => {
          const label = (el.getAttribute("aria-label")
            ?? (el.labels && el.labels[0] && el.labels[0].textContent)
            ?? el.textContent
            ?? "").trim();
          return label === "" ? describe(el) : label.slice(0, 40);
        };
        ${REACHABLE_CONTROLS_JS}
        const restore = document.activeElement;
        const scroll = { x: window.scrollX, y: window.scrollY };
        const obscured = [];
        const skipped = [];
        let tested = 0;
        for (const el of controls) {
          el.focus();
          if (document.activeElement !== el) {
            skipped.push(named(el) + " (would not take focus)");
            continue;
          }
          const box = el.getBoundingClientRect();
          if (box.width === 0 || box.height === 0) {
            skipped.push(named(el) + " (zero-sized)");
            continue;
          }
          const x = box.left + box.width / 2;
          const y = box.top + box.height / 2;
          if (x < 0 || y < 0
            || x >= document.documentElement.clientWidth
            || y >= document.documentElement.clientHeight) {
            skipped.push(named(el) + " (centre outside the viewport after focus)");
            continue;
          }
          const top = document.elementFromPoint(x, y);
          if (top === null) {
            // Nothing hit-testable at the point. That is not an occlusion, and
            // reporting it as one gives the operator a failure with no element
            // to act on.
            skipped.push(named(el) + " (centre is not hit-testable)");
            continue;
          }
          tested += 1;
          if (top === el || el.contains(top) || top.contains(el)) continue;
          obscured.push(named(el) + " obscured by " + describe(top));
        }
        if (restore instanceof HTMLElement) restore.focus({ preventScroll: true });
        else if (document.activeElement instanceof HTMLElement)
          document.activeElement.blur();
        // Window scroll only. Focusing also scrolls inner overflow
        // containers, and those are not restored, so a later surface can be
        // probed from a different internal scroll offset. The capture is
        // already taken by this point, so no published image is affected.
        window.scrollTo(scroll.x, scroll.y);
        return { tested, obscured, skipped };
      })())`,
        returnByValue: true,
      });
      const occlusion = JSON.parse(occlusionProbe.result.value);

      const problems = [];
      if (measured.horizontalOverflow > 1)
        problems.push(
          `horizontal page overflow ${measured.horizontalOverflow}px`,
        );
      if (measured.overflowingControls.length > 0)
        problems.push(
          `controls outside the viewport: ${measured.overflowingControls.join(", ")}`,
        );
      if (
        measured.selectFit &&
        measured.selectFit.box < measured.selectFit.needed
      )
        problems.push(
          `the workspace select truncates: ${measured.selectFit.box}px box for ${measured.selectFit.needed}px of content`,
        );
      if (measured.undersized.length > 0)
        problems.push(
          `control(s) below the 24px target floor: ${measured.undersized.join(", ")}`,
        );
      if (measured.unnamed > 0)
        problems.push(
          `${measured.unnamed} control(s) without an accessible name`,
        );
      if (measured.controls === 0)
        problems.push(
          "no interactive controls rendered — the page did not load",
        );
      if (occlusion.obscured.length > 0)
        problems.push(
          `focused control obscured: ${occlusion.obscured.join("; ")}`,
        );
      for (const finding of settleFindings) problems.push(finding);
      // Without this the check passes on any surface where every control was
      // skipped, which is the vacuous-negative shape this suite has been
      // caught by before. A surface with controls must hit-test at least one.
      if (measured.controls > 0 && occlusion.tested === 0)
        problems.push(
          `no control could be focused and hit-tested, so the obscuring check proved nothing (skipped: ${occlusion.skipped.join("; ") || "none"})`,
        );
      if (problems.length > 0) failures += 1;

      results.push({
        image: bytes,
        scenario: `${scenario.name}-${surface.name}`,
        // Recorded so the retained evidence shows what the obscuring check
        // covered. A surface where every control was skipped would otherwise
        // publish identically to one where all of them were hit-tested.
        occlusionTested: occlusion.tested,
        occlusionSkipped: occlusion.skipped,
        // The diagnostic that was on screen when this capture was taken, so
        // the retained record shows which refusal the occlusion check ran
        // against rather than only that some refusal did.
        ...(surfaceDiagnostic === null
          ? {}
          : { diagnostic: surfaceDiagnostic }),
        surface: surface.name,
        viewport: `${scenario.width}x${scenario.height}@${scenario.scale}x`,
        scheme: scenario.scheme,
        motion: scenario.motion,
        // What the page actually reported for each emulated feature. The
        // declared values alone cannot distinguish a legitimately identical
        // render from the "silently reran the baseline" defect the mode probe
        // was added to catch.
        observed: {
          scheme: mode.scheme,
          reducedMotion: mode.reduce,
          hoverNone: mode.hoverNone,
          pointerCoarse: mode.pointerCoarse,
          rootFontSizePx: mode.rootFontSizePx,
          // narrow-900, narrow-1024 and zoom-200 differ from the baseline by
          // viewport and device pixel ratio alone. Without these two the
          // observed block could not distinguish a dropped metrics override
          // from a legitimately identical render -- the same declared-versus-
          // observed gap this block exists to close.
          innerWidth: mode.innerWidth,
          innerHeight: mode.innerHeight,
          devicePixelRatio: mode.devicePixelRatio,
        },
        // Declared beside its observed effect, like every other dimension:
        // `observed.rootFontSizePx` alone asks the reader to already know the
        // product's base to judge whether the number is right.
        textScale: scenario.textScale ?? 1,
        productRootFontPx: PRODUCT_ROOT_FONT_PX,
        controls: measured.controls,
        names: measured.names,
        horizontalOverflow: measured.horizontalOverflow,
        sha256: createHash("sha256").update(bytes).digest("hex").slice(0, 16),
        problems,
      });
    }
  }
} catch (error) {
  // Caught so the `finally` below runs and nothing is orphaned, then reported in
  // the tool's own voice. `aborted` — not `process.exitCode` — carries the
  // failure past the summary block, whose own `process.exit` would otherwise
  // overwrite it with zero.
  aborted = error instanceof Error ? error.message : String(error);
} finally {
  // SIGTERM then escalate. Observed: a headless Chrome with an attached DevTools
  // session survives SIGTERM, and a leftover browser is exactly what the
  // ephemeral port and the throw-instead-of-exit changes exist to prevent — so
  // cleanup has to actually confirm the child is gone rather than ask nicely.
  await terminate(browser, "chromium");
  await terminate(child, "studio service");
  server.close();
  // Chromium keeps writing its profile for a moment after it exits.
  await new Promise((r) => setTimeout(r, 500));
  rmSync(workDir, {
    recursive: true,
    force: true,
    maxRetries: 10,
    retryDelay: 200,
  });
}

// AC-38 names two input modes and requires every action to survive both.
// Comparing the sets of accessible names states the criterion directly, and
// unlike a pixel hash it is not disturbed by the timestamps the surface
// legitimately renders.
for (const [scenarioName, label] of [
  ["reduced-motion", "reduced motion"],
  ["no-hover", "a coarse pointer that cannot hover"],
]) {
  // Driven from the surfaces actually captured, not a hardcoded pair. When two
  // more surfaces were added to the measurement loop this list was left behind,
  // so home's setup actions — which exist on no other surface — were captured
  // and measured but never compared across input modes.
  const capturedSurfaces = [
    ...new Set(results.map((result) => result.surface)),
  ];
  // Skipped when the run aborted: reporting `ok` for whichever surfaces
  // happened to complete, above the error that stopped the rest, reads as a
  // partial pass of a comparison that never ran.
  // `plumbingFailure` is checked here too: `aborted` does not absorb it until
  // after this loop, so a late harness failure would otherwise print `ok`
  // comparison lines above the error that stopped the run.
  const comparable = aborted === null && plumbingFailure === null;
  for (const surface of comparable ? capturedSurfaces : []) {
    // Compared surface by surface. Comparing the studio's action set against the
    // reviews list's would differ for reasons that have nothing to do with the
    // input mode under test.
    const baseline = results.find(
      (r) => r.scenario === `desktop-light-${surface}`,
    );
    const candidate = results.find(
      (r) => r.scenario === `${scenarioName}-${surface}`,
    );
    if (!baseline || !candidate) continue;
    const missing = baseline.names.filter(
      (name) => !candidate.names.includes(name),
    );
    const extra = candidate.names.filter(
      (name) => !baseline.names.includes(name),
    );
    if (missing.length > 0 || extra.length > 0) {
      failures += 1;
      candidate.problems.push(
        `${label} changed the available actions — missing: ${missing.join(", ") || "none"}; extra: ${extra.join(", ") || "none"}`,
      );
    } else {
      console.log(
        `ok   AC-38 ${label} retains all ${candidate.names.length} actions unchanged on ${surface}`,
      );
    }
  }
}

// Read after the loop as well as inside it. A failure during the final
// scenario's click sequence, probe or screenshot is answered to the page as a
// typed disconnected outcome the renderer absorbs, so without this check the run
// would publish evidence captured while the harness was broken and exit 0 — the
// false verification record this whole guard exists to prevent.
aborted ??= plumbingFailure;

if (aborted !== null) {
  console.error(`visual-evidence: ${aborted}`);
  // Nothing is published. Captures are held in memory until the run completes,
  // so `notes/visual/` still describes the last run that finished — rather than
  // a mix of this run's PNGs and that run's manifest, which would be a retained
  // artifact asserting a run that never happened.
  process.exit(1);
}

for (const result of results) {
  const status = result.problems.length === 0 ? "ok  " : "FAIL";
  console.log(
    `${status} ${result.scenario.padEnd(16)} ${result.viewport.padEnd(14)} ` +
      `scheme=${result.scheme.padEnd(5)} motion=${result.motion.padEnd(13)} ` +
      `controls=${String(result.controls).padStart(3)} overflow=${result.horizontalOverflow}px ` +
      `sha256=${result.sha256}`,
  );
  for (const problem of result.problems) console.log(`     - ${problem}`);
}
// Publish by directory swap rather than in place. Writing into the retained
// directory means any failure partway — or a second run interleaving — leaves
// PNGs with no manifest, or a manifest whose hashes do not match the files beside
// it. The complete previous set therefore has to survive until the complete new
// set exists: build the new directory alongside, then swap, then discard the old.
const publishDir = `${outputRoot}.next`;
const retiredDir = `${outputRoot}.previous`;
rmSync(publishDir, { recursive: true, force: true });
// A `visual.previous/` left by an interrupted swap is the only complete set that
// survived it. Recover it rather than deleting it, and only clear it once the
// evidence path is populated again.
try {
  statSync(retiredDir);
  try {
    statSync(outputRoot);
    rmSync(retiredDir, { recursive: true, force: true });
  } catch {
    renameSync(retiredDir, outputRoot);
    console.error(
      "visual-evidence: recovered the evidence set stranded by an interrupted publish",
    );
  }
} catch {
  /* no stranded set */
}
mkdirSync(publishDir, { recursive: true });
for (const result of results)
  writeFileSync(join(publishDir, `${result.scenario}.png`), result.image);
writeFileSync(
  join(publishDir, "manifest.json"),
  `${JSON.stringify(
    {
      capturedAt: new Date().toISOString(),
      results: results.map(({ image: _image, ...rest }) => rest),
    },
    null,
    2,
  )}\n`,
);
// Two renames, so the retained path holds a complete set at every instant except
// the moment between them — and a rollback, because if the second rename fails
// the first has already moved the only complete set out of the way and the
// evidence path would be left missing entirely.
let hadPrevious = false;
try {
  statSync(outputRoot);
  hadPrevious = true;
} catch {
  /* first run: nothing to retire */
}
try {
  if (hadPrevious) renameSync(outputRoot, retiredDir);
  renameSync(publishDir, outputRoot);
} catch (error) {
  if (hadPrevious) {
    try {
      statSync(outputRoot);
    } catch {
      renameSync(retiredDir, outputRoot);
    }
  }
  rmSync(publishDir, { recursive: true, force: true });
  console.error(
    `visual-evidence: publishing the evidence set failed, previous set restored: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
  process.exit(1);
}
rmSync(retiredDir, { recursive: true, force: true });
console.log(`\n${results.length} scenario(s) captured into ${outputRoot}`);
process.exit(failures === 0 ? 0 : 1);

async function terminate(process_, label) {
  if (process_.exitCode !== null || process_.signalCode !== null) return;
  process_.kill("SIGTERM");
  const exited = await Promise.race([
    once(process_, "exit").then(() => true),
    new Promise((resolve) => setTimeout(() => resolve(false), 2_000)),
  ]);
  if (exited) return;
  console.error(`visual-evidence: ${label} ignored SIGTERM; sending SIGKILL`);
  process_.kill("SIGKILL");
  await Promise.race([
    once(process_, "exit"),
    new Promise((resolve) => setTimeout(resolve, 2_000)),
  ]);
}
