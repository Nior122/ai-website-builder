// =============================================================================
// Website Builder — Preview Service
// =============================================================================
// Live preview: desktop/laptop/tablet/mobile switching, zoom, dark/light mode,
// fullscreen, and refresh. The preview iframe consumes these settings.
// =============================================================================

import type { PreviewDevice, PreviewState } from './types';

export const PREVIEW_DEVICES: Record<PreviewDevice, { label: string; width: number; height: number }> = {
  desktop: { label: 'Desktop', width: 1440, height: 900 },
  laptop: { label: 'Laptop', width: 1280, height: 800 },
  tablet: { label: 'Tablet', width: 768, height: 1024 },
  mobile: { label: 'Mobile', width: 390, height: 844 },
};

export function defaultPreviewState(): PreviewState {
  return {
    device: 'desktop',
    zoom: 1,
    mode: 'light',
    fullscreen: false,
    refreshKey: 0,
  };
}

export function updatePreviewState(state: PreviewState, patch: Partial<PreviewState>): PreviewState {
  return { ...state, ...patch };
}

export function setPreviewDevice(state: PreviewState, device: PreviewDevice): PreviewState {
  return updatePreviewState(state, { device });
}

export function setPreviewZoom(state: PreviewState, zoom: number): PreviewState {
  const clamped = Math.min(2, Math.max(0.25, zoom));
  return updatePreviewState(state, { zoom: clamped });
}

export function togglePreviewMode(state: PreviewState): PreviewState {
  return updatePreviewState(state, { mode: state.mode === 'light' ? 'dark' : 'light' });
}

export function toggleFullscreen(state: PreviewState): PreviewState {
  return updatePreviewState(state, { fullscreen: !state.fullscreen });
}

export function refreshPreview(state: PreviewState): PreviewState {
  return updatePreviewState(state, { refreshKey: state.refreshKey + 1 });
}

export function deviceWidth(device: PreviewDevice): number {
  return PREVIEW_DEVICES[device].width;
}

export function deviceHeight(device: PreviewDevice): number {
  return PREVIEW_DEVICES[device].height;
}

/** Iframe URL with preview settings applied. */
export function previewUrl(slug: string, state: PreviewState): string {
  const params = new URLSearchParams({
    device: state.device,
    mode: state.mode,
    preview: '1',
  });
  return `/preview/${slug}?${params.toString()}`;
}
