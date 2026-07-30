'use client';

import { useState } from 'react';

export function AIProviderTest() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; error?: string; model?: string; provider?: string } | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setResult(null);

    try {
      const res = await fetch('/api/ai/test-connection', { method: 'POST' });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ success: false, error: err instanceof Error ? err.message : 'Network error' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-neutral-900">AI Configuration</h2>
      <p className="mb-4 text-sm text-neutral-500">
        Verify your AI provider connection. The provider, model, and API key
        are configured via environment variables (<span className="font-mono text-xs">OPENROUTER_API_KEY</span>,{' '}
        <span className="font-mono text-xs">AI_PROVIDER</span>, <span className="font-mono text-xs">AI_MODEL</span>).
      </p>

      <div className="pt-1">
        <button
          onClick={handleTest}
          disabled={testing}
          className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {testing ? 'Testing...' : 'Test AI Connection'}
        </button>
      </div>

      {result && (
        <div className={`mt-3 rounded-lg border p-3 text-sm ${
          result.success
            ? 'border-green-200 bg-green-50 text-green-800'
            : 'border-red-200 bg-red-50 text-red-800'
        }`}>
          {result.success ? (
            <p>✓ Connected — Model: <span className="font-mono">{result.model}</span></p>
          ) : (
            <div>
              <p className="font-medium">✗ Connection Failed</p>
              <p className="mt-1 font-mono text-xs">{result.error}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
