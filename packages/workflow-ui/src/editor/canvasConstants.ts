import type { FitViewOptions } from "@xyflow/react";

/** The zoom level the canvas should never exceed automatically (fit view, initial load, reset). */
export const CANVAS_DEFAULT_ZOOM = 1;

export const CANVAS_FIT_VIEW_OPTIONS: FitViewOptions = {
  maxZoom: CANVAS_DEFAULT_ZOOM,
};
