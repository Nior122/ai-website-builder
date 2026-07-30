// =============================================================================
// useGeneration Hook — Enhanced
// =============================================================================
// Manages the AI generation lifecycle: initiate, track progress via SSE,
// handle completion, errors, and cancellation.
// =============================================================================

'use client';

import { useState, useCallback, useRef } from 'react';
import type { GenerateRequest } from '@/types';
import type { GenerationProgress, AIGenerationResult } from '../types';

export function useGeneration() {
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [result, setResult] = useState<AIGenerationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Start a new generation. Streams progress updates via SSE.
   */
  const generate = useCallback(async (request: GenerateRequest) => {
    setIsGenerating(true);
    setError(null);
    setResult(null);
    setProgress({
      phase: 'analyzing',
      message: 'Starting generation...',
      progress: 0,
      pagesGenerated: 0,
      totalPages: request.pages?.length || 5,
      currentSection: null,
    });

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errObj = errorData?.error;
        const errMsg = typeof errObj === 'string'
          ? errObj
          : errObj?.message || errorData?.message || `Generation failed (${response.status})`;
        throw new Error(errMsg);
      }

      if (!response.body) {
        throw new Error('No response body — server did not return a stream');
      }

      // Parse the SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          // SSE format: "event: <type>\ndata: <json>\n\n"
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              // Handle different event shapes
              if (data.phase) {
                // Progress event: { phase, message, progress, ... }
                setProgress({
                  phase: data.phase,
                  message: data.message || data.phase,
                  progress: data.progress || 0,
                  pagesGenerated: data.pagesGenerated || 0,
                  totalPages: data.totalPages || request.pages?.length || 5,
                  currentSection: data.currentSection || null,
                });
              } else if (data.done || data.status === 'done') {
                // Completion event
                if (data.result) {
                  setResult(data.result);
                }
                setProgress((prev) =>
                  prev ? { ...prev, phase: 'complete', progress: 100 } : prev
                );
              } else if (data.error || data.status === 'error') {
                const e = data.error;
                const eMsg = typeof e === 'string'
                  ? e
                  : e?.message || data.message || 'Generation error';
                throw new Error(eMsg);
              } else if (data.projectId) {
                // Direct result object (no wrapper)
                setResult(data as unknown as AIGenerationResult);
                setProgress((prev) =>
                  prev ? { ...prev, phase: 'complete', progress: 100 } : prev
                );
              }
            } catch (parseErr) {
              // Skip malformed JSON lines but log them
              if (parseErr instanceof SyntaxError) continue;
              throw parseErr; // Re-throw non-parse errors
            }
          } else if (line.startsWith('event: error')) {
            // Explicit error event line
            const nextLine = lines[lines.indexOf(line) + 1];
            if (nextLine?.startsWith('data: ')) {
              try {
                const errData = JSON.parse(nextLine.slice(6));
                throw new Error(errData.message || 'Generation error');
              } catch (e) {
                if (e instanceof SyntaxError) continue;
                throw e;
              }
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // User cancelled — reset without error
        setProgress(null);
        setError(null);
      } else {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        setProgress((prev) =>
          prev ? { ...prev, phase: 'error', message } : null
        );
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * Cancel an in-progress generation.
   */
  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsGenerating(false);
    setProgress(null);
  }, []);

  /**
   * Reset all state.
   */
  const reset = useCallback(() => {
    cancel();
    setResult(null);
    setError(null);
    setProgress(null);
  }, [cancel]);

  return {
    generate,
    cancel,
    reset,
    progress,
    result,
    isGenerating,
    error,
  };
}
