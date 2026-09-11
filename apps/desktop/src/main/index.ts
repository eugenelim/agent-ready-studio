import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  STUDIO_REQUEST_CHANNEL,
  type StudioMethod,
  type StudioRequestParams,
  type StudioResult,
  StudioTransport,
  StudioTransportError,
  validateRequest,
} from "@agent-ready/protocol";
import type {
  BrowserWindowConstructorOptions,
  IpcMain,
  WebContents,
} from "electron";

export const RENDERER_CONTENT_SECURITY_POLICY =
  "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'";

const DEFAULT_REQUEST_TIMEOUT_MS = 5_000;
const DEFAULT_SHUTDOWN_TIMEOUT_MS = 5_000;
const DEFAULT_CONNECTION_ATTEMPTS = 2;

type MainFailureKind =
  | "timeout"
  | "disconnected"
  | "incompatible"
  | "invalid-response"
  | "service";

export type MainCallOutcome<M extends StudioMethod> =
  | { ok: true; value: StudioResult<M> }
  | {
      ok: false;
      error: {
        kind: MainFailureKind;
        message: string;
        code: number | null;
        data: unknown;
      };
    };

export type StudioTransportPort = {
  handshake(client: string): Promise<unknown>;
  request(method: StudioMethod, params: unknown): Promise<unknown>;
  shutdown(): void;
};

export type ManagedStudioConnection = {
  transport: StudioTransportPort;
  exited: Promise<{
    code: number | null;
    signal: NodeJS.Signals | null;
    error: Error | null;
  }>;
  terminate(signal: NodeJS.Signals): boolean;
};

export type StudioConnectionFactory = () => Promise<ManagedStudioConnection>;

/** Used only when the display's work area cannot be read. */
const FALLBACK_WINDOW_SIZE = { width: 1200, height: 800 } as const;

export function createMainWindowOptions(
  preloadPath: string,
  // Required, not optional. With a default here, a call site could omit the
  // display read and silently get the fallback on every machine — which is the
  // owner-session defect, and which survived two attempts to pin it with a
  // test. Requiring the argument makes that call impossible to write.
  workArea: { width: number; height: number },
): BrowserWindowConstructorOptions {
  // Fill the primary display's work area on launch, so the window is spacious
  // without the user having to maximize it. With no width or height at all
  // Electron applies its own 800x600 default, which is narrower than the 1024px
  // breakpoint at which the sidebar collapses into a horizontal band — so the
  // app opened with its chrome stacked above a sliver of content. The minimums
  // below stay small because they bound resizing, not launching; the layout
  // stacks rather than breaks.
  return {
    width: workArea.width,
    height: workArea.height,
    minHeight: 400,
    minWidth: 600,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: preloadPath,
      sandbox: true,
    },
  };
}

/**
 * The options the main window is actually constructed with.
 *
 * `createMainWindowOptions` requires a work area, so a call site cannot omit the
 * display read and quietly get the fallback — the compiler refuses it. Two
 * earlier attempts pinned this with a test instead, and both times the call
 * site could still be rewritten with every test green.
 */
export function mainWindowOptions(
  preloadPath: string,
  screenModule: Parameters<typeof readPrimaryWorkArea>[0],
): BrowserWindowConstructorOptions {
  return createMainWindowOptions(
    preloadPath,
    readPrimaryWorkArea(screenModule),
  );
}

/** The primary display's usable area, or a fixed fallback if it cannot be read. */
export function readPrimaryWorkArea(screenModule: {
  getPrimaryDisplay(): { workAreaSize: { width: number; height: number } };
}): { width: number; height: number } {
  try {
    const { width, height } = screenModule.getPrimaryDisplay().workAreaSize;
    if (width > 0 && height > 0) return { width, height };
  } catch {
    /* `screen` throws before the app is ready, and a headless host may have no
       display at all. Neither is worth failing a launch over. */
  }
  return FALLBACK_WINDOW_SIZE;
}

export function installWindowGuards(
  webContents: Pick<WebContents, "on" | "setWindowOpenHandler">,
): void {
  webContents.on("will-navigate", (event) => {
    event.preventDefault();
  });
  webContents.on("will-frame-navigate", (event) => {
    event.preventDefault();
  });
  webContents.on("will-redirect", (event) => {
    event.preventDefault();
  });
  webContents.setWindowOpenHandler(() => ({ action: "deny" }));
}

export type AppLifecyclePort = {
  on(event: "window-all-closed", listener: () => void): unknown;
  quit(): void;
};

/**
 * Quit when the last window closes, on every platform including macOS.
 *
 * The usual macOS convention keeps a windowless app alive in the Dock. This is a
 * single-window local tool started from a terminal: leaving the process running
 * after the window closes strands the child service and the terminal never
 * returns. Closing the only window is the shutdown request AC-23 bounds.
 */
export function installAppLifecycle(app: AppLifecyclePort): void {
  app.on("window-all-closed", () => {
    app.quit();
  });
}

export function applyContentSecurityPolicy(
  responseHeaders: Record<string, string[]> = {},
): Record<string, string[]> {
  return {
    ...responseHeaders,
    "Content-Security-Policy": [RENDERER_CONTENT_SECURITY_POLICY],
  };
}

export class StudioMainClient {
  private connection: ManagedStudioConnection | undefined;
  private connecting: Promise<ManagedStudioConnection> | undefined;
  private stopped = false;

  constructor(
    private readonly connectionFactory: StudioConnectionFactory,
    private readonly connectionAttempts = DEFAULT_CONNECTION_ATTEMPTS,
  ) {
    if (!Number.isInteger(connectionAttempts) || connectionAttempts < 1)
      throw new Error("connectionAttempts must be a positive integer");
  }

  async request<M extends StudioMethod>(
    method: M,
    params: StudioRequestParams<M>,
  ): Promise<MainCallOutcome<M>> {
    if (this.stopped)
      return failureOutcome(
        "disconnected",
        "Studio Service has been shut down",
      );
    let connection: ManagedStudioConnection;
    try {
      connection = await this.ensureConnection();
    } catch (error) {
      return failureFrom(error);
    }
    try {
      const value = await connection.transport.request(method, params);
      return { ok: true, value: value as StudioResult<M> };
    } catch (error) {
      if (isReconnectFailure(error)) this.releaseConnection(connection);
      return failureFrom(error);
    }
  }

  async shutdown(timeoutMs = DEFAULT_SHUTDOWN_TIMEOUT_MS): Promise<void> {
    this.stopped = true;
    const connection = this.connection;
    this.connection = undefined;
    if (!connection) return;
    connection.transport.shutdown();
    const graceful = await settlesWithin(connection.exited, timeoutMs - 250);
    if (graceful) return;
    connection.terminate("SIGTERM");
    await settlesWithin(connection.exited, 250);
  }

  private async ensureConnection(): Promise<ManagedStudioConnection> {
    if (this.connection) return this.connection;
    if (this.connecting) return this.connecting;
    this.connecting = this.connectWithRetry();
    try {
      this.connection = await this.connecting;
      return this.connection;
    } finally {
      this.connecting = undefined;
    }
  }

  private async connectWithRetry(): Promise<ManagedStudioConnection> {
    let lastError: unknown = new StudioTransportError(
      "disconnected",
      "Studio Service did not start",
      null,
      null,
    );
    for (let attempt = 0; attempt < this.connectionAttempts; attempt += 1) {
      let connection: ManagedStudioConnection | undefined;
      try {
        connection = await this.connectionFactory();
        await connection.transport.handshake("studio-desktop");
        if (this.stopped) {
          await closeConnection(connection, 500);
          throw new StudioTransportError(
            "disconnected",
            "Studio Service has been shut down",
            null,
            null,
          );
        }
        return connection;
      } catch (error) {
        lastError = error;
        if (connection) await closeConnection(connection, 500);
        if (this.stopped) throw error;
      }
    }
    throw lastError;
  }

  private releaseConnection(connection: ManagedStudioConnection): void {
    if (this.connection !== connection) return;
    this.connection = undefined;
    connection.transport.shutdown();
  }
}

export function createStudioRequestHandler(
  client: StudioMainClient,
): (request: unknown) => Promise<MainCallOutcome<StudioMethod>> {
  return async (request) => {
    if (!isRecord(request) || typeof request.method !== "string")
      return failureOutcome("invalid-response", "Invalid Studio IPC request");
    const method = request.method;
    const validation = validateRequest({
      jsonrpc: "2.0",
      id: "main-validation",
      method,
      params: request.params,
    });
    if (!validation.ok)
      return failureOutcome(
        "invalid-response",
        "Invalid Studio IPC request",
        null,
        validation.error,
      );
    return client.request(
      method as StudioMethod,
      request.params as StudioRequestParams<StudioMethod>,
    );
  };
}

export function registerStudioIpc(
  ipcMain: Pick<IpcMain, "handle" | "removeHandler">,
  client: StudioMainClient,
): () => void {
  const handler = createStudioRequestHandler(client);
  ipcMain.handle(STUDIO_REQUEST_CHANNEL, (_event, request: unknown) =>
    handler(request),
  );
  return () => ipcMain.removeHandler(STUDIO_REQUEST_CHANNEL);
}

export function spawnStudioConnection(input: {
  databasePath: string;
  serviceEntry: string;
  runtimePath?: string;
  requestTimeoutMs?: number;
  diagnostic?: (message: string) => void;
}): Promise<ManagedStudioConnection> {
  const child = spawn(
    input.runtimePath ?? process.execPath,
    [input.serviceEntry],
    {
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: "1",
        STUDIO_DATABASE_PATH: input.databasePath,
      },
      stdio: ["pipe", "pipe", "pipe"],
    },
  );
  child.stderr.on("data", (chunk) => {
    const message = String(chunk);
    if (input.diagnostic) input.diagnostic(message);
    else process.stderr.write(message);
  });
  const transport = new StudioTransport(
    { readable: child.stdout, writable: child.stdin },
    input.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS,
  );
  return Promise.resolve({
    transport: adaptTransport(transport),
    exited: childExit(child),
    terminate: (signal) => child.kill(signal),
  });
}

export function resolveServiceEntry(): string {
  const configured = process.env.STUDIO_SERVICE_ENTRY;
  if (configured) return configured;
  return fileURLToPath(
    new URL("../../../studio-service/dist/service.js", import.meta.url),
  );
}

function adaptTransport(transport: StudioTransport): StudioTransportPort {
  return {
    handshake: (client) => transport.handshake(client),
    request: (method, params) =>
      transport.request(method, params as StudioRequestParams<typeof method>),
    shutdown: () => transport.shutdown(),
  };
}

function childExit(
  child: ChildProcessWithoutNullStreams,
): ManagedStudioConnection["exited"] {
  return new Promise((resolve) => {
    child.once("exit", (code, signal) =>
      resolve({ code, signal, error: null }),
    );
    child.once("error", (error) =>
      resolve({ code: null, signal: null, error }),
    );
  });
}

async function closeConnection(
  connection: ManagedStudioConnection,
  timeoutMs: number,
): Promise<void> {
  connection.transport.shutdown();
  if (await settlesWithin(connection.exited, timeoutMs)) return;
  connection.terminate("SIGTERM");
}

async function settlesWithin(
  promise: Promise<unknown>,
  timeoutMs: number,
): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<false>((resolve) => {
    timer = setTimeout(() => resolve(false), Math.max(0, timeoutMs));
  });
  const settled = promise.then(() => true);
  const result = await Promise.race([settled, timeout]);
  if (timer) clearTimeout(timer);
  return result;
}

function isReconnectFailure(error: unknown): boolean {
  return (
    error instanceof StudioTransportError &&
    (error.kind === "disconnected" || error.kind === "incompatible")
  );
}

function failureFrom<M extends StudioMethod>(
  error: unknown,
): MainCallOutcome<M> {
  if (error instanceof StudioTransportError)
    return failureOutcome(error.kind, error.message, error.code, error.data);
  return failureOutcome("disconnected", "Studio Service is unavailable");
}

function failureOutcome<M extends StudioMethod>(
  kind: MainFailureKind,
  message: string,
  code: number | null = null,
  data: unknown = null,
): MainCallOutcome<M> {
  return { ok: false, error: { kind, message, code, data } };
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

async function runProductionSmoke(): Promise<void> {
  const databasePath = process.env.STUDIO_DATABASE_PATH;
  if (!databasePath) throw new Error("STUDIO_DATABASE_PATH is required");
  mkdirSync(dirname(databasePath), { recursive: true });
  const client = new StudioMainClient(() =>
    spawnStudioConnection({
      databasePath,
      serviceEntry: resolveServiceEntry(),
    }),
  );
  try {
    const outcome = await client.request("health.get", {});
    process.stdout.write(`${JSON.stringify(outcome)}\n`);
    if (!outcome.ok) process.exitCode = 1;
  } finally {
    await client.shutdown();
  }
}

/**
 * The window surface `composeMainWindow` drives. Structural rather than
 * Electron's own type so a test can supply a double: the point of extracting
 * this is that the composition — guards, CSP, deferred show, renderer load —
 * becomes assertable, and it cannot be if it needs a real BrowserWindow.
 */
export type StudioWindowPort = {
  webContents: Pick<WebContents, "on" | "setWindowOpenHandler"> & {
    session: {
      webRequest: {
        onHeadersReceived(
          listener: (
            details: { responseHeaders?: Record<string, string[]> },
            callback: (response: {
              responseHeaders: Record<string, string[]>;
            }) => void,
          ) => void,
        ): void;
      };
    };
  };
  once(event: "ready-to-show", listener: () => void): unknown;
  show(): void;
  loadURL(url: string): unknown;
  loadFile(path: string): unknown;
};

/**
 * Everything that must happen to a newly constructed main window.
 *
 * Extracted from `startElectronMain` so it can be asserted. Each call below is a
 * security or usability control that this repository has already shipped and
 * tested in isolation — `installWindowGuards`, `applyContentSecurityPolicy` — and
 * an isolated test proves only that the piece works, never that anyone calls it.
 * Dropping any line here previously left the whole suite green.
 */
export function composeMainWindow(
  window: StudioWindowPort,
  rendererSource: { kind: "url"; url: string } | { kind: "file"; path: string },
): void {
  installWindowGuards(window.webContents);
  window.webContents.session.webRequest.onHeadersReceived(
    (details, callback) => {
      callback({
        responseHeaders: applyContentSecurityPolicy(details.responseHeaders),
      });
    },
  );
  window.once("ready-to-show", () => window.show());
  if (rendererSource.kind === "url") void window.loadURL(rendererSource.url);
  else void window.loadFile(rendererSource.path);
}

/** Where the renderer is loaded from: the dev server if set, else the built file. */
export function rendererSource(
  developmentUrl: string | undefined,
  filePath: string,
): { kind: "url"; url: string } | { kind: "file"; path: string } {
  return developmentUrl
    ? { kind: "url", url: developmentUrl }
    : { kind: "file", path: filePath };
}

export type QuitPort = {
  on(
    event: "before-quit",
    listener: (event: { preventDefault(): void }) => void,
  ): unknown;
  quit(): void;
};

/**
 * AC-23's shutdown: the first quit request is deferred until the child service
 * and its SQLite handle are closed, and every later one is ignored.
 *
 * The re-entrancy guard is the subtle half. `client.shutdown()` ends by calling
 * `app.quit()`, which re-enters this listener; without the latch that second
 * pass would `preventDefault()` again and the application would never exit —
 * the failure the owner already hit once, as a terminal that never returned.
 */
export function installQuitSequence(
  app: QuitPort,
  input: { unregisterIpc: () => void; shutdown: () => Promise<void> },
): void {
  let shutdownStarted = false;
  app.on("before-quit", (event) => {
    if (shutdownStarted) return;
    shutdownStarted = true;
    event.preventDefault();
    input.unregisterIpc();
    void input.shutdown().finally(() => app.quit());
  });
}

/**
 * Everything Electron main composes at startup, over injected ports.
 *
 * Round 30 extracted `composeMainWindow` and `installQuitSequence` so each could
 * be pinned, and each was — but the root that calls them stayed module-private
 * and Electron-gated, so its whole body could be emptied with the suite green:
 * no window, no guards, no CSP, no bounded shutdown. Pinning the pieces and
 * leaving the root unreachable is the same defect one level up, which is why the
 * root is now a function taking ports rather than importing `electron` itself.
 */
export type ElectronPorts = {
  app: AppLifecyclePort &
    QuitPort & {
      whenReady(): Promise<unknown>;
      getPath(name: "userData"): string;
    };
  BrowserWindow: new (options: BrowserWindowConstructorOptions) => unknown;
  ipcMain: Pick<IpcMain, "handle" | "removeHandler">;
  screen: Parameters<typeof readPrimaryWorkArea>[0];
};

export async function composeElectronMain(
  ports: ElectronPorts,
  paths: {
    preloadPath: string;
    rendererFilePath: string;
    rendererDevelopmentUrl: string | undefined;
    databasePath: string;
    serviceEntry: string;
  },
): Promise<{ client: StudioMainClient; unregisterIpc: () => void }> {
  const client = new StudioMainClient(() =>
    spawnStudioConnection({
      databasePath: paths.databasePath,
      serviceEntry: paths.serviceEntry,
    }),
  );
  const unregisterIpc = registerStudioIpc(ports.ipcMain, client);
  composeMainWindow(
    new ports.BrowserWindow(
      mainWindowOptions(paths.preloadPath, ports.screen),
    ) as StudioWindowPort,
    rendererSource(paths.rendererDevelopmentUrl, paths.rendererFilePath),
  );
  installAppLifecycle(ports.app);
  installQuitSequence(ports.app, {
    unregisterIpc,
    shutdown: () => client.shutdown(),
  });
  return { client, unregisterIpc };
}

async function startElectronMain(): Promise<void> {
  const { app, BrowserWindow, ipcMain, screen } = await import("electron");
  await app.whenReady();
  await composeElectronMain(
    { app, BrowserWindow, ipcMain, screen },
    {
      preloadPath: fileURLToPath(
        new URL("../preload/index.cjs", import.meta.url),
      ),
      rendererFilePath: fileURLToPath(
        new URL("../renderer/index.html", import.meta.url),
      ),
      rendererDevelopmentUrl: process.env.ELECTRON_RENDERER_URL,
      databasePath: join(app.getPath("userData"), "studio.db"),
      serviceEntry: resolveServiceEntry(),
    },
  );
}

if (process.env.STUDIO_DESKTOP_SMOKE === "1")
  void runProductionSmoke().catch((error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : "Desktop smoke failed"}\n`,
    );
    process.exitCode = 1;
  });
else if (process.versions.electron && process.env.ELECTRON_RUN_AS_NODE !== "1")
  void startElectronMain().catch((error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : "Desktop main failed"}\n`,
    );
    process.exitCode = 1;
  });
