/**
 * The Electron IPC channel the renderer's preload bridge invokes and Electron
 * main answers on.
 *
 * It lives in the protocol package, and is imported by both sides, because the
 * two ends have no other way to disagree safely: a channel name declared twice
 * can be renamed on one side and leave a build in which every request rejects at
 * runtime while the type-checker, the linter and the whole suite stay green.
 */
export const STUDIO_REQUEST_CHANNEL = "studio:request";
