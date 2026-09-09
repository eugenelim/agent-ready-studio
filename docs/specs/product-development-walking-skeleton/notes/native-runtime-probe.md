# Native runtime probe

- **Date:** 2026-09-09
- **Purpose:** disconfirm the planned Studio Service process, SQLite driver,
  protocol-channel, persistence, and shutdown assumptions before approval.
- **Disposition:** passed; disposable probe directory removed.

## Versions

- Electron 43.6.0
- Electron-embedded Node 24.20.0
- Local comparison Node 26.7.0
- better-sqlite3 13.0.3
- bundled SQLite 3.53.4
- platform prebuild: Darwin ARM64

## Observations

The service entry was launched with `child_process.spawn` using the Electron
executable, `ELECTRON_RUN_AS_NODE=1`, and piped stdin, stdout, and stderr. It
read one NDJSON request, performed a transactional write and read, returned one
NDJSON response on stdout, and sent diagnostics only to stderr.

The same database was reopened successfully after process exit. The pinned
prebuild loaded under both the local Node runtime and Electron's embedded Node
without `@electron/rebuild`. SIGTERM closed the database and process in 374 ms,
inside the five-second bound.

## Contract consequence

The packaged service entry and native prebuild remain outside ASAR and Electron
main uses `child_process.spawn`, not `utilityProcess.fork`, because the latter
does not support piped stdin. Version bumps to Electron or better-sqlite3 must
repeat this probe before changing the pinned runtime contract.
