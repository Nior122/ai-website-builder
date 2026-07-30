// =============================================================================
// useExport Hook
// =============================================================================
// Handles the export workflow: configure, trigger, track progress, download.
// =============================================================================

'use client';

import { useState, useCallback } from 'react';
import type { ExportFormat } from '@/types';
import type { ExportConfig, ExportResult } from '../types';

export function useExport(projectId: string) {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const exportProject = useCallback(
    async (config: ExportConfig) => {
      setIsExporting(true);
      setProgress(0);
      setError(null);
      setResult(null);

      try {
        const response = await fetch(`/api/projects/${projectId}/export`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error?.message || 'Export failed');
        }

        const data: ExportResult = await response.json();
        setResult(data);
        setProgress(100);
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Export failed';
        setError(message);
        return null;
      } finally {
        setIsExporting(false);
      }
    },
    [projectId]
  );

  const downloadExport = useCallback(async (exportId: string) => {
    const response = await fetch(`/api/exports/${exportId}/download`);
    if (!response.ok) throw new Error('Download failed');

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export-${exportId}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setProgress(0);
  }, []);

  return {
    exportProject,
    downloadExport,
    isExporting,
    progress,
    result,
    error,
    reset,
  };
}
