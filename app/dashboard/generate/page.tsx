'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { INDUSTRIES } from '@/lib/constants';

export default function GeneratePage() {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [industry, setIndustry] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!description.trim()) return;

    // Clear previous errors
    setErrorMessage(null);
    setIsGenerating(true);
    setProgress(5);
    setStatusText('Creating project...');

    try {
      // ── Step 1: Create project ────────────────────────────────────
      console.log('[Generate] Step 1: Creating project...');
      const createRes = await fetch('/api/generate/create-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: description.slice(0, 50),
          description,
          industry: industry || 'general',
        }),
      });

      if (!createRes.ok) {
        const errBody = await createRes.json().catch(() => ({}));
        const errObj = errBody.error;
        const errMsg = typeof errObj === 'string'
          ? errObj
          : errObj?.message || errBody.message || `Request failed: ${createRes.status}`;
        console.error('[Generate] Step 1 FAILED:', errMsg);
        throw new Error(errMsg);
      }

      const createData = await createRes.json();
      const project = createData.data;
      console.log('[Generate] Step 1 OK: projectId=%s', project?.id);

      // ── Step 2: Start AI generation (SSE) ─────────────────────────
      setProgress(15);
      setStatusText('Starting AI generation...');
      console.log('[Generate] Step 2: Starting AI generation...');

      const generateRes = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          description,
          industry: industry || 'general',
          pageType: 'landing',
        }),
      });

      if (!generateRes.ok) {
        const errBody = await generateRes.json().catch(() => ({}));
        const errMsg = errBody.error || errBody.message || 'AI generation request failed';
        console.error('[Generate] Step 2 FAILED:', errMsg);
        throw new Error(errMsg);
      }

      // ── Step 3: Read SSE stream ───────────────────────────────────
      setProgress(20);
      setStatusText('Generating website...');

      const reader = generateRes.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let buffer = '';
        let currentEvent = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('[Generate] SSE stream ended (done=true)');
            break;
          }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEvent = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              let parsed: Record<string, unknown> | null = null;
              try {
                parsed = JSON.parse(line.slice(6));
              } catch {
                // Skip unparseable lines (stream framing noise)
              }

              if (parsed) {
                // Progress updates
                if (parsed.phase) setStatusText((parsed.message as string) || (parsed.phase as string));
                if (typeof parsed.progress === 'number') setProgress(parsed.progress as number);

                // Completion
                if (currentEvent === 'complete' && parsed.status === 'done') {
                  console.log('[Generate] SSE: complete event received');
                  setProgress(100);
                  setStatusText('Done! Redirecting...');
                  router.push(`/editor/${project.id}`);
                  return;
                }

                // Error
                if (currentEvent === 'error') {
                  const errMsg = (parsed.message as string) || 'AI generation failed';
                  console.error('[Generate] SSE error:', errMsg);
                  throw new Error(errMsg);
                }
              }
            }
          }
        }
      }

      // Stream ended without a completion event
      console.error('[Generate] Stream ended without completion event');
      throw new Error('Generation stream ended unexpectedly — the AI may have failed to produce output. Please try again.');
    } catch (err) {
      setIsGenerating(false);
      const msg = err instanceof Error ? err.message : 'Generation failed. Please try again.';
      console.error('[Generate] FAILED:', msg);
      setErrorMessage(msg);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-2 text-2xl font-bold text-neutral-900">AI Website Generator</h1>
      <p className="mb-8 text-sm text-neutral-500">
        Describe your business and let AI create a complete website for you.
      </p>

      {errorMessage && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <strong className="block mb-1">Generation Failed</strong>
          <p className="font-mono text-xs">{errorMessage}</p>
          <button
            onClick={() => setErrorMessage(null)}
            className="mt-2 text-xs font-medium text-red-600 underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              Describe your business
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., I run a boutique coffee shop in downtown Portland called 'Brew & Bean'. We specialize in single-origin pour-overs and homemade pastries. I want a warm, inviting website with our menu, hours, location, and an online ordering section..."
              rows={5}
              disabled={isGenerating}
              className="w-full resize-none rounded-lg border border-neutral-300 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              Industry <span className="text-neutral-400">(optional)</span>
            </label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              disabled={isGenerating}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200 disabled:opacity-50"
            >
              <option value="">Select an industry</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind.value} value={ind.value}>{ind.icon} {ind.label}</option>
              ))}
            </select>
          </div>

          {/* Progress */}
          {isGenerating && (
            <div className="rounded-lg bg-neutral-50 p-4">
              <div className="mb-2 flex justify-between text-xs text-neutral-500">
                <span>{statusText}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-neutral-200">
                <div
                  className="h-full rounded-full bg-neutral-900 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={!description.trim() || isGenerating}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 px-5 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            {isGenerating ? 'Generating...' : 'Generate Website'}
          </button>

          <p className="text-center text-xs text-neutral-400">
            Powered by Claude AI via OpenRouter
          </p>
        </div>
      </div>
    </div>
  );
}
