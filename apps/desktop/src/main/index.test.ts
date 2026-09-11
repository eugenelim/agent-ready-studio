import { spawn } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { StudioTransportError } from "@agent-ready/protocol";
import type { BrowserWindowConstructorOptions, WebContents } from "electron";
import { afterEach, describe, expect, it } from "vitest";

import {
  applyContentSecurityPolicy,
  composeElectronMain,
  composeMainWindow,
  createMainWindowOptions,
  createStudioRequestHandler,
  installAppLifecycle,
  installQuitSequence,
  installWindowGuards,
  type ManagedStudioConnection,
  mainWindowOptions,
  RENDERER_CONTENT_SECURITY_POLICY,
  readPrimaryWorkArea,
  registerStudioIpc,
  rendererSource,
  StudioMainClient,
  type StudioTransportPort,
  type StudioWindowPort,
} from "./index.js";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

type NavigationHandler = (
  event: { preventDefault: () => void },
  url: string,
) => void;
type WindowOpenHandler = (details: { url: string }) => {
  action: "allow" | "deny";
};

function captureWindowGuards(): {
  navigationHandler: (event: string) => NavigationHandler;
  windowOpenHandler: () => WindowOpenHandler;
} {
  const navigationHandlers = new Map<string, NavigationHandler>();
  let windowOpenHandler: WindowOpenHandler | undefined;
  const webContents = {
    on: (event: string, handler: NavigationHandler) => {
      navigationHandlers.set(event, handler);
      return webContents;
    },
    setWindowOpenHandler: (handler: WindowOpenHandler) => {
      windowOpenHandler = handler;
    },
  };

  installWindowGuards(
    webContents as unknown as Pick<WebContents, "on" | "setWindowOpenHandler">,
  );

  return {
    navigationHandler: (event: string) => {
      const handler = navigationHandlers.get(event);
      if (handler === undefined) {
        throw new Error(`${event} handler was not registered`);
      }
      return handler;
    },
    windowOpenHandler: () => {
      if (windowOpenHandler === undefined) {
        throw new Error("window.open handler was not registered");
      }
      return windowOpenHandler;
    },
  };
}

describe("Electron main security boundary", () => {
  it("AC-24 configures secure BrowserWindow preferences", () => {
    const options = createMainWindowOptions("/app/preload/index.js", {
      width: 1440,
      height: 900,
    });

    expect(options.webPreferences).toMatchObject({
      contextIsolation: true,
      nodeIntegration: false,
      preload: "/app/preload/index.js",
      sandbox: true,
    });
  });

  it("AC-45 sets a renderer CSP without inline scripts or remote origins", () => {
    expect(RENDERER_CONTENT_SECURITY_POLICY).toBe(
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
    );
    expect(RENDERER_CONTENT_SECURITY_POLICY).not.toContain("'unsafe-inline'");
    expect(RENDERER_CONTENT_SECURITY_POLICY).not.toMatch(/https?:/u);
    expect(applyContentSecurityPolicy()["Content-Security-Policy"]).toEqual([
      RENDERER_CONTENT_SECURITY_POLICY,
    ]);
    const rendererDocument = readFileSync(
      new URL("../renderer/index.html", import.meta.url),
      "utf8",
    );
    expect(rendererDocument).toContain(
      `content="${RENDERER_CONTENT_SECURITY_POLICY}"`,
    );
  });

  it("AC-45 denies renderer navigation by default", () => {
    const guards = captureWindowGuards();
    const preventedEvents: string[] = [];
    const navigationEvents = [
      "will-navigate",
      "will-frame-navigate",
      "will-redirect",
    ];

    for (const event of navigationEvents)
      guards.navigationHandler(event)(
        {
          preventDefault: () => {
            preventedEvents.push(event);
          },
        },
        "https://example.com",
      );

    expect(preventedEvents).toEqual(navigationEvents);
  });

  it("opens filling the display work area, and never at Electron's own default", () => {
    // The defect this pins: with no width or height Electron opens 800x600,
    // which is below the 1024px breakpoint, so the sidebar collapses into a
    // horizontal band and the body is a sliver.
    const options = createMainWindowOptions("/preload.cjs", {
      width: 1728,
      height: 1079,
    });

    expect(options.width).toBe(1728);
    expect(options.height).toBe(1079);
    expect(options.minWidth).toBeLessThanOrEqual(options.width ?? 0);
    expect(options.minHeight).toBeLessThanOrEqual(options.height ?? 0);
  });

  it("hands the display work area to the options the window is built with", () => {
    // The composition the production call site uses, asserted as one unit.
    // Testing the two functions separately could not see the call site, so
    // dropping the display read there left every test green while every window
    // opened at the fallback size.
    const options = mainWindowOptions("/preload.cjs", {
      getPrimaryDisplay: () => ({
        workAreaSize: { width: 1728, height: 1079 },
      }),
    });

    expect(options.width).toBe(1728);
    expect(options.height).toBe(1079);
    expect(options.webPreferences?.preload).toBe("/preload.cjs");
  });

  it("fills the readable display work area", () => {
    // The success path, which the two failure-path assertions below do not
    // reach: with this unpinned, a `readPrimaryWorkArea` that always returned
    // undefined would silently open every window at the fallback size, which
    // is the whole content of the repair it exists for.
    const workArea = readPrimaryWorkArea({
      getPrimaryDisplay: () => ({
        workAreaSize: { width: 1728, height: 1079 },
      }),
    });

    expect(workArea).toEqual({ width: 1728, height: 1079 });
    const options = createMainWindowOptions("/preload.cjs", workArea);
    expect(options.width).toBe(1728);
    expect(options.height).toBe(1079);
  });

  it("falls back to a fixed size when the display work area cannot be read", () => {
    const thrown = readPrimaryWorkArea({
      getPrimaryDisplay: () => {
        throw new Error("screen module used before the app was ready");
      },
    });
    const empty = readPrimaryWorkArea({
      getPrimaryDisplay: () => ({ workAreaSize: { width: 0, height: 0 } }),
    });
    // The read yields the fallback itself, so no caller can be handed
    // `undefined` and quietly construct a window without a size.
    expect(thrown).toEqual({ width: 1200, height: 800 });
    expect(empty).toEqual({ width: 1200, height: 800 });

    const options = createMainWindowOptions("/preload.cjs", thrown);
    expect(options.width).toBe(1200);
    expect(options.height).toBe(800);
  });

  it("AC-24 and AC-45 install the guards and the CSP on the window it builds", () => {
    // The gap this closes: `installWindowGuards` and `applyContentSecurityPolicy`
    // were each proven in isolation, and neither test would have noticed the call
    // site being deleted. This asserts the composition, so the controls have to be
    // reached rather than merely to exist.
    const guarded: string[] = [];
    let windowOpenHandlerSet = false;
    let headers: Record<string, string[]> | null = null;
    let shown = false;
    const loaded: string[] = [];
    const readyToShow: (() => void)[] = [];
    type HeadersListener = (
      details: { responseHeaders?: Record<string, string[]> },
      callback: (response: {
        responseHeaders: Record<string, string[]>;
      }) => void,
    ) => void;
    const webContents = {
      on: (event: string) => {
        guarded.push(event);
        return webContents;
      },
      setWindowOpenHandler: () => {
        windowOpenHandlerSet = true;
      },
      session: {
        webRequest: {
          onHeadersReceived: (listener: HeadersListener) => {
            listener({ responseHeaders: { "X-Existing": ["kept"] } }, (r) => {
              headers = r.responseHeaders;
            });
          },
        },
      },
    };
    const window: StudioWindowPort = {
      webContents: webContents as unknown as StudioWindowPort["webContents"],
      once: (_event, listener) => readyToShow.push(listener),
      show: () => {
        shown = true;
      },
      loadURL: (url) => loaded.push(`url:${url}`),
      loadFile: (path) => loaded.push(`file:${path}`),
    };

    composeMainWindow(window, { kind: "file", path: "/renderer/index.html" });

    expect(guarded).toEqual([
      "will-navigate",
      "will-frame-navigate",
      "will-redirect",
    ]);
    expect(windowOpenHandlerSet).toBe(true);
    expect(headers).toEqual({
      "X-Existing": ["kept"],
      "Content-Security-Policy": [RENDERER_CONTENT_SECURITY_POLICY],
    });
    expect(loaded).toEqual(["file:/renderer/index.html"]);

    // Deferred show: the window must not appear before it has content.
    expect(shown).toBe(false);
    for (const listener of readyToShow) listener();
    expect(shown).toBe(true);
  });

  it("loads the dev server only when one is configured", () => {
    expect(rendererSource("http://localhost:5173", "/built.html")).toEqual({
      kind: "url",
      url: "http://localhost:5173",
    });
    expect(rendererSource(undefined, "/built.html")).toEqual({
      kind: "file",
      path: "/built.html",
    });
    expect(rendererSource("", "/built.html")).toEqual({
      kind: "file",
      path: "/built.html",
    });
  });

  it("AC-23, AC-24 and AC-45 compose the whole main process, not just its pieces", async () => {
    // The gap this closes: every piece below was already pinned in isolation, and
    // the root that calls them could still be emptied with the suite green — no
    // window, no guards, no CSP, no bounded shutdown. Extracting the pieces
    // without pinning the root moved the seam up one level instead of closing it.
    const guarded: string[] = [];
    let cspInstalled = false;
    let windowOpenHandlerSet = false;
    const constructed: BrowserWindowConstructorOptions[] = [];
    const appEvents: string[] = [];
    const handledChannels: string[] = [];

    const webContents = {
      on: (event: string) => {
        guarded.push(event);
        return webContents;
      },
      setWindowOpenHandler: () => {
        windowOpenHandlerSet = true;
      },
      session: {
        webRequest: {
          onHeadersReceived: () => {
            cspInstalled = true;
          },
        },
      },
    };
    class FakeBrowserWindow {
      webContents = webContents;
      constructor(options: BrowserWindowConstructorOptions) {
        constructed.push(options);
      }
      once() {
        return this;
      }
      show() {}
      loadURL() {}
      loadFile() {}
    }

    const { unregisterIpc } = await composeElectronMain(
      {
        app: {
          on: (event: string) => {
            appEvents.push(event);
            return undefined as never;
          },
          quit: () => undefined,
          whenReady: () => Promise.resolve(),
          getPath: () => "/userData",
        } as unknown as Parameters<typeof composeElectronMain>[0]["app"],
        BrowserWindow: FakeBrowserWindow as unknown as Parameters<
          typeof composeElectronMain
        >[0]["BrowserWindow"],
        ipcMain: {
          handle: (channel: string) => {
            handledChannels.push(channel);
          },
          removeHandler: () => undefined,
        },
        screen: {
          getPrimaryDisplay: () => ({
            workAreaSize: { width: 1600, height: 1000 },
          }),
        },
      },
      {
        preloadPath: "/preload.cjs",
        rendererFilePath: "/renderer/index.html",
        rendererDevelopmentUrl: undefined,
        databasePath: "/userData/studio.db",
        serviceEntry: "/service.js",
      },
    );

    // A window was built, from the display work area rather than Electron's default.
    expect(constructed).toHaveLength(1);
    expect(constructed[0]?.webPreferences?.preload).toBe("/preload.cjs");
    expect(constructed[0]?.width).toBe(1600);
    expect(constructed[0]?.height).toBe(1000);
    // Its navigation guards, window-open deny handler and CSP are installed.
    expect(guarded).toEqual([
      "will-navigate",
      "will-frame-navigate",
      "will-redirect",
    ]);
    expect(windowOpenHandlerSet).toBe(true);
    expect(cspInstalled).toBe(true);
    // The renderer can reach main, and both lifecycle handlers are installed.
    expect(handledChannels).toEqual(["studio:request"]);
    expect(appEvents).toEqual(["window-all-closed", "before-quit"]);
    unregisterIpc();
  });

  it("AC-23 closes the service before quitting, and quits exactly once", async () => {
    const listeners: ((event: { preventDefault(): void }) => void)[] = [];
    let quits = 0;
    let prevented = 0;
    let unregistered = 0;
    let shutdowns = 0;
    let releaseShutdown = (): void => undefined;
    const shutdownFinished = new Promise<void>((resolve) => {
      releaseShutdown = resolve;
    });
    installQuitSequence(
      {
        on: (_event, listener) => listeners.push(listener),
        quit: () => {
          quits += 1;
        },
      },
      {
        unregisterIpc: () => {
          unregistered += 1;
        },
        shutdown: async () => {
          shutdowns += 1;
          await shutdownFinished;
        },
      },
    );
    expect(listeners).toHaveLength(1);
    const quitRequest = { preventDefault: () => (prevented += 1) };

    // First quit request: deferred, with the IPC handler torn down first.
    listeners[0]?.(quitRequest);
    expect(prevented).toBe(1);
    expect(unregistered).toBe(1);
    expect(shutdowns).toBe(1);
    expect(quits).toBe(0);

    // A second request while the shutdown is in flight must not defer again.
    // Without the latch this is the terminal that never returns.
    listeners[0]?.(quitRequest);
    expect(prevented).toBe(1);
    expect(shutdowns).toBe(1);

    releaseShutdown();
    await shutdownFinished;
    await Promise.resolve();
    expect(quits).toBe(1);
  });

  it("answers on the very channel string the preload bridge invokes", () => {
    // The literal is spelled out here on purpose. Both sides now import one
    // exported constant, so asserting against that constant would be a
    // tautology — it would agree with itself after a rename that broke nothing
    // in this repository but everything in a build where the two ends were
    // versioned apart. `preload/index.test.ts` pins the sending half against the
    // same literal; this is the receiving half, which had no pin at all.
    const handlers = new Map<string, unknown>();
    const removed: string[] = [];
    const unregister = registerStudioIpc(
      {
        handle: (channel, listener) => handlers.set(channel, listener),
        removeHandler: (channel) => removed.push(channel),
      },
      new StudioMainClient(() => {
        throw new Error("no connection needed for channel registration");
      }),
    );
    expect([...handlers.keys()]).toEqual(["studio:request"]);
    unregister();
    expect(removed).toEqual(["studio:request"]);
  });

  it("AC-23 quits when the last window closes, on every platform", () => {
    // Registered rather than asserted on `process.platform`: the decision under
    // test is that there is no platform on which the process outlives its only
    // window, stranding the child service and never returning the terminal.
    const listeners = new Map<string, () => void>();
    let quits = 0;
    installAppLifecycle({
      on: (event, listener) => listeners.set(event, listener),
      quit: () => {
        quits += 1;
      },
    });

    const onAllClosed = listeners.get("window-all-closed");
    expect(onAllClosed).toBeDefined();
    onAllClosed?.();
    expect(quits).toBe(1);
  });

  it("AC-45 denies renderer window.open requests by default", () => {
    const guards = captureWindowGuards();

    expect(guards.windowOpenHandler()({ url: "https://example.com" })).toEqual({
      action: "deny",
    });
  });
});

describe("Electron main service connection", () => {
  it("AC-34 refuses invalid IPC requests before service dispatch", async () => {
    let connectionCount = 0;
    const client = new StudioMainClient(async () => {
      connectionCount += 1;
      return managedConnection({
        handshake: async () => undefined,
        request: async () => undefined,
        shutdown: () => undefined,
      });
    });
    const handler = createStudioRequestHandler(client);

    await expect(
      handler({ method: "workspace.list", params: { unexpected: true } }),
    ).resolves.toMatchObject({
      ok: false,
      error: { kind: "invalid-response" },
    });
    expect(connectionCount).toBe(0);
  });

  it("AC-33 retries within a bound and handshakes before dispatch", async () => {
    const calls: string[] = [];
    let connectionCount = 0;
    const client = new StudioMainClient(async () => {
      connectionCount += 1;
      const current = connectionCount;
      return managedConnection({
        handshake: async () => {
          calls.push(`handshake-${current}`);
          if (current === 1)
            throw new StudioTransportError(
              "disconnected",
              "Service exited during handshake",
              "1",
              "system.hello",
            );
        },
        request: async () => {
          calls.push(`request-${current}`);
          return { kind: "health", status: "ok", protocolVersion: "1" };
        },
        shutdown: () => undefined,
      });
    }, 2);

    await expect(client.request("health.get", {})).resolves.toEqual({
      ok: true,
      value: { kind: "health", status: "ok", protocolVersion: "1" },
    });
    expect(connectionCount).toBe(2);
    expect(calls).toEqual(["handshake-1", "handshake-2", "request-2"]);
    await client.shutdown();
  });

  it("AC-33 reports incompatible after the bounded retry without dispatch", async () => {
    let handshakeCount = 0;
    let dispatchCount = 0;
    const client = new StudioMainClient(
      async () =>
        managedConnection({
          handshake: async () => {
            handshakeCount += 1;
            throw new StudioTransportError(
              "incompatible",
              "Incompatible protocol version",
              "1",
              "system.hello",
              -32001,
              { kind: "protocol-version", expected: "1", received: "2" },
            );
          },
          request: async () => {
            dispatchCount += 1;
          },
          shutdown: () => undefined,
        }),
      2,
    );

    await expect(client.request("health.get", {})).resolves.toMatchObject({
      ok: false,
      error: { kind: "incompatible", code: -32001 },
    });
    expect(handshakeCount).toBe(2);
    expect(dispatchCount).toBe(0);
  });

  it("AC-33 reports disconnect and re-handshakes on the next dispatch", async () => {
    const calls: string[] = [];
    let connectionCount = 0;
    const client = new StudioMainClient(async () => {
      connectionCount += 1;
      const current = connectionCount;
      return managedConnection({
        handshake: async () => {
          calls.push(`handshake-${current}`);
        },
        request: async () => {
          calls.push(`request-${current}`);
          if (current === 1)
            throw new StudioTransportError(
              "disconnected",
              "Studio Service connection closed",
              "2",
              "health.get",
            );
          return { kind: "health", status: "ok", protocolVersion: "1" };
        },
        shutdown: () => undefined,
      });
    });

    await expect(client.request("health.get", {})).resolves.toMatchObject({
      ok: false,
      error: { kind: "disconnected" },
    });
    await expect(client.request("health.get", {})).resolves.toMatchObject({
      ok: true,
      value: { kind: "health" },
    });
    expect(calls).toEqual([
      "handshake-1",
      "request-1",
      "handshake-2",
      "request-2",
    ]);
    await client.shutdown();
  });

  it("AC-23/27 runs the production-built desktop path against Electron Node", async () => {
    const directory = mkdtempSync(join(tmpdir(), "agent-ready-desktop-"));
    temporaryDirectories.push(directory);
    const databasePath = join(directory, "studio.db");
    const desktopEntry = fileURLToPath(
      new URL("../../out/main/index.js", import.meta.url),
    );
    const serviceEntry = fileURLToPath(
      new URL("../../../studio-service/dist/service.js", import.meta.url),
    );
    const require = createRequire(import.meta.url);
    const electronPath = require("electron") as string;
    expect(existsSync(desktopEntry)).toBe(true);
    expect(existsSync(serviceEntry)).toBe(true);

    const startedAt = Date.now();
    const child = spawn(electronPath, [desktopEntry], {
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: "1",
        STUDIO_DATABASE_PATH: databasePath,
        STUDIO_DESKTOP_SMOKE: "1",
        STUDIO_SERVICE_ENTRY: serviceEntry,
      },
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    const exit = await waitForExit(child, 5_000);
    expect(Date.now() - startedAt).toBeLessThan(5_000);
    expect(exit).toEqual({ code: 0, signal: null });
    expect(JSON.parse(stdout.trim())).toEqual({
      ok: true,
      value: { kind: "health", status: "ok", protocolVersion: "1" },
    });
    expect(stderr).not.toContain("failed");
    expect(statSync(databasePath).size).toBeGreaterThan(0);
    const database = new DatabaseSync(databasePath, { readOnly: true });
    const appliedVersions = database
      .prepare("SELECT version FROM schema_migrations ORDER BY version")
      .all()
      .map((row) => row.version);
    expect(appliedVersions).toEqual([1, 2]);
    database.close();
  });
});

function managedConnection(
  transport: StudioTransportPort,
): ManagedStudioConnection {
  return {
    transport,
    exited: Promise.resolve({ code: 0, signal: null, error: null }),
    terminate: () => true,
  };
}

function waitForExit(
  child: ReturnType<typeof spawn>,
  timeoutMs: number,
): Promise<{ code: number | null; signal: NodeJS.Signals | null }> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`Desktop did not exit within ${timeoutMs} ms`));
    }, timeoutMs);
    child.once("exit", (code, signal) => {
      clearTimeout(timeout);
      resolve({ code, signal });
    });
    child.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}
