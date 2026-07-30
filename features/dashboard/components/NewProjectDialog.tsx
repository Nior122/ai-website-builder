// =============================================================================
// New Project Dialog
// =============================================================================
// Modal dialog for creating a new project. Two-step flow:
// 1. Enter project details (name, business description, industry)
// 2. AI generates the website in the background
// =============================================================================

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { INDUSTRIES } from '@/lib/constants';

interface NewProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'details' | 'generating' | 'complete';

export function NewProjectDialog({ isOpen, onClose }: NewProjectDialogProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('details');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [industry, setIndustry] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setStep('details');
      setName('');
      setDescription('');
      setIndustry('');
      setProgress(0);
      setStatusText('');
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && step !== 'generating') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, step, onClose]);

  const handleCreate = useCallback(async () => {
    if (!name.trim() || !description.trim()) return;

    setIsCreating(true);
    setStep('generating');
    setProgress(10);
    setStatusText('Creating project...');

    abortRef.current = new AbortController();

    try {
      // Step 1: Create the project
      const projectRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, industry: industry || 'general' }),
        signal: abortRef.current.signal,
      });

      if (!projectRes.ok) {
        const errBody = await projectRes.json().catch(() => ({}));
        // API error format: { error: { code, message, details } } or { error: "string" }
        const errObj = errBody?.error;
        const errMsg = typeof errObj === 'string'
          ? errObj
          : errObj?.message || errBody?.message || `Project creation failed (${projectRes.status})`;
        throw new Error(errMsg);
      }
      const { data: project } = await projectRes.json();

      setProgress(20);
      setStatusText('Project created. Starting AI generation...');

      // Step 2: Start AI generation via SSE
      const generateRes = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          description,
          industry: industry || 'general',
          businessType: industry || 'business',
          pages: ['home', 'about', 'services', 'contact'],
        }),
        signal: abortRef.current.signal,
      });

      if (!generateRes.ok) {
        const errBody = await generateRes.json().catch(() => ({}));
        const errObj = errBody?.error;
        const errMsg = typeof errObj === 'string'
          ? errObj
          : errObj?.message || errBody?.message || `AI generation failed (${generateRes.status})`;
        throw new Error(errMsg);
      }

      // Read SSE stream
      const reader = generateRes.body?.getReader();
      const decoder = new TextDecoder();
      let generationError: string | null = null;

      if (reader) {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event = JSON.parse(line.slice(6));
                // Check for error events from the server
                if (event.phase === 'error' || (event.message && !event.phase && !event.progress)) {
                  generationError = typeof event.message === 'string'
                    ? event.message
                    : JSON.stringify(event.message) || 'Generation failed';
                  break;
                }
                if (event.phase) setStatusText(event.message || event.phase);
                if (event.progress) setProgress(event.progress);
                if (event.done || event.phase === 'complete') {
                  setProgress(100);
                  setStep('complete');
                  setTimeout(() => {
                    onClose();
                    router.push(`/editor/${project.id}`);
                  }, 800);
                  return;
                }
              } catch {
                // Skip malformed events
              }
            }
          }
          if (generationError) break;
        }
        reader.releaseLock();
      }

      if (generationError) {
        throw new Error(generationError);
      }

      // If we reach here without SSE events, still redirect
      setProgress(100);
      setStep('complete');
      setTimeout(() => {
        onClose();
        router.push(`/editor/${project.id}`);
      }, 800);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setStep('details');
        setIsCreating(false);
        alert(`Generation failed: ${msg}`);
      }
    }
  }, [name, description, industry, onClose, router]);

  const handleClose = () => {
    if (step === 'generating') {
      abortRef.current?.abort();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Dialog */}
      <div className="relative mx-4 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Close Button */}
        {step !== 'generating' && (
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Step 1: Details */}
        {step === 'details' && (
          <div className="p-6">
            <h2 className="mb-1 text-lg font-semibold text-neutral-900">Create New Project</h2>
            <p className="mb-6 text-sm text-neutral-500">
              Describe your business and the AI will generate a complete website.
            </p>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Project Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., My Coffee Shop"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Business Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your business, what you do, and what kind of website you want..."
                  rows={4}
                  className="w-full resize-none rounded-lg border border-neutral-300 px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Industry <span className="text-neutral-400">(optional)</span>
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200"
                >
                  <option value="">Select an industry</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind.value} value={ind.value}>
                      {ind.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={handleClose}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!name.trim() || !description.trim() || isCreating}
                className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                Generate Website
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Generating */}
        {step === 'generating' && (
          <div className="p-8 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 text-3xl">
              ✨
            </div>
            <h2 className="mb-2 text-lg font-semibold text-neutral-900">
              Generating Your Website
            </h2>
            <p className="mb-6 text-sm text-neutral-500">{statusText}</p>

            {/* Progress Bar */}
            <div className="mx-auto max-w-xs">
              <div className="mb-2 flex justify-between text-xs text-neutral-500">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-neutral-200">
                <div
                  className="h-full rounded-full bg-neutral-900 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <p className="mt-6 text-xs text-neutral-400">
              This usually takes 15-30 seconds. Don't close this window.
            </p>
          </div>
        )}

        {/* Step 3: Complete */}
        {step === 'complete' && (
          <div className="p-8 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-3xl">
              ✅
            </div>
            <h2 className="mb-2 text-lg font-semibold text-neutral-900">
              Website Generated!
            </h2>
            <p className="text-sm text-neutral-500">
              Redirecting you to the editor...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
