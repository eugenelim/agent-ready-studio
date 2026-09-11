import { createElement } from "react";
import { createRoot } from "react-dom/client";
import type { StudioPreloadApi } from "../preload/index.js";

import { App } from "./App.js";

declare global {
  interface Window {
    readonly studio: StudioPreloadApi;
  }
}

const rootElement = document.getElementById("studio-root");
if (!rootElement) throw new Error("Studio root element is missing");
createRoot(rootElement).render(createElement(App));
