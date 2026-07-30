// =============================================================================
// Domain Settings Panel
// =============================================================================
// Custom domain management: input a domain, show DNS instructions for CNAME
// or A-record setup, and display verification status. The domain is stored in
// `Project.customDomain` and the middleware routes requests by hostname.
//
// Domain validation: no protocol (http/https), no paths, no ports — just the
// bare hostname (e.g. "www.example.com" or "example.com").
// =============================================================================

'use client';

import { useState, useCallback } from 'react';
import { useEditorStore } from '@/features/editor/store/editor-store';
import { useSettings } from '../../hooks/use-settings';
import { DeploymentStatus } from './deployment-status';
import { Globe, AlertCircle, CheckCircle, Info } from 'lucide-react';

// ─── Helpers ───────────────────────────────────────────────────────────────

const DOMAIN_REGEX = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.){1,}(?:[a-zA-Z]{2,})$/;

function isValidDomain(value: string): boolean {
  return DOMAIN_REGEX.test(value);
}

// ─── Component ─────────────────────────────────────────────────────────────

export function DomainSettings() {
  const project = useEditorStore((s) => s.project);
  const { updateProject } = useSettings();
  const [inputValue, setInputValue] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);

  if (!project) return null;

  const currentDomain = project.customDomain;

  const handleSave = useCallback(() => {
    const trimmed = inputValue.trim().toLowerCase();
    if (trimmed && isValidDomain(trimmed)) {
      updateProject({ customDomain: trimmed });
      setShowInstructions(true);
    }
  }, [inputValue, updateProject]);

  const handleRemove = useCallback(() => {
    updateProject({ customDomain: null });
    setShowInstructions(false);
    setInputValue('');
  }, [updateProject]);

  const isInputValid = !inputValue.trim() || isValidDomain(inputValue.trim());

  return (
    <div className="flex flex-col gap-5 p-3">
      {/* Current Domain */}
      <section>
        <label className="mb-1 block text-xs font-medium text-neutral-600">
          Custom Domain
        </label>
        <p className="mb-2 text-[10px] text-neutral-400">
          Connect a custom domain to your published site. Your site will also
          remain available at the default <code className="bg-neutral-100 px-0.5 rounded">/site/{project.slug}</code> URL.
        </p>

        {currentDomain ? (
          <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2">
            <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-600" />
            <div className="flex-1">
              <span className="text-sm font-medium text-green-800">
                {currentDomain}
              </span>
            </div>
            <button
              onClick={handleRemove}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="www.example.com"
              className={`flex-1 rounded-md border px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 ${
                inputValue && !isInputValid
                  ? 'border-red-300 focus:border-red-400 focus:ring-red-400'
                  : 'border-neutral-200 focus:border-blue-400 focus:ring-blue-400'
              }`}
            />
            <button
              onClick={handleSave}
              disabled={!inputValue.trim() || !isInputValid}
              className="rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Connect
            </button>
          </div>
        )}

        {inputValue && !isInputValid && (
          <p className="mt-1 flex items-center gap-1 text-[10px] text-red-500">
            <AlertCircle className="h-3 w-3" />
            Enter a valid domain (e.g. www.example.com)
          </p>
        )}
      </section>

      <div className="h-px bg-neutral-200" />

      {/* DNS Instructions */}
      {(currentDomain || showInstructions) && (
        <section>
          <div className="mb-2 flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-xs font-medium text-neutral-700">
              DNS Configuration
            </span>
          </div>
          <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
            <p className="mb-2 text-[10px] text-neutral-500">
              Add a CNAME record for your domain pointing to:
            </p>
            <code className="block rounded bg-white px-2 py-1.5 text-xs text-neutral-800 border border-neutral-100">
              cname.vercel-dns.com
            </code>
            <p className="mt-3 mb-2 text-[10px] text-neutral-500">
              Or add an A record pointing to:
            </p>
            <code className="block rounded bg-white px-2 py-1.5 text-xs text-neutral-800 border border-neutral-100">
              76.76.21.21
            </code>
            <p className="mt-3 text-[10px] text-neutral-400">
              DNS changes may take up to 48 hours to propagate. The site will be
              accessible at your custom domain once DNS is configured and the
              project is published.
            </p>
          </div>
        </section>
      )}

      {/* Current published URL (always shown) */}
      {project.status === 'published' && (
        <section>
          <label className="mb-1 block text-xs font-medium text-neutral-600">
            Published URL
          </label>
          <a
            href={currentDomain ? `https://${currentDomain}` : `/site/${project.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700"
          >
            <Globe className="h-3.5 w-3.5" />
            {currentDomain
              ? `https://${currentDomain}`
              : `/site/${project.slug}`}
          </a>
        </section>
      )}

      <div className="h-px bg-neutral-200" />

      {/* Deployment Status */}
      <DeploymentStatus />
    </div>
  );
}
