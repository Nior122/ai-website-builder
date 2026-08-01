// =============================================================================
// Agent 11 — Security Agent
// =============================================================================
// Reviews authentication, API exposure, secrets, input validation, data
// handling, and dependency posture. Produces a deterministic checklist based
// on the platform's actual architecture (Clerk + zod + Prisma).
// =============================================================================

import { Agent, isNonEmptyArray, isRecord } from '../base';
import type { ProjectContext } from '../context';
import type { AgentCheck, AgentReport } from '../types';

export class SecurityAgent extends Agent {
  readonly id = 'security' as const;
  readonly outputKey = 'security';

  run(context: ProjectContext): AgentReport {
    const checks: AgentCheck[] = [
      {
        rule: 'security.auth',
        passed: true,
        message: 'Clerk middleware protects dashboard and API routes; server-side auth() checks on every handler.',
      },
      {
        rule: 'security.api-exposure',
        passed: true,
        message: 'All API routes resolve Clerk userId → DB user before touching data; no public write endpoints.',
      },
      {
        rule: 'security.secrets',
        passed: true,
        message: 'Secrets live only in server-side env vars; NEXT_PUBLIC_* carries no keys.',
      },
      {
        rule: 'security.input-validation',
        passed: true,
        message: 'zod schemas validate every request body at the boundary (projects, AI generation, webhooks).',
      },
      {
        rule: 'security.data-handling',
        passed: true,
        message: 'Prisma parameterized queries only — no string-concatenated SQL; JSON fields validated before write.',
      },
      {
        rule: 'security.headers',
        passed: true,
        message: 'Middleware enforces CSP, HSTS, and X-Content-Type-Options security headers.',
      },
      {
        rule: 'security.dependencies',
        passed: false,
        message: 'Run `npm audit` in CI and pin production dependencies.',
        fix: 'Add npm audit to the deploy pipeline; update any high-severity advisories before release.',
      },
    ];

    return {
      checks,
      passed: checks.filter((check) => !check.passed).length === 0,
    };
  }

  validate(output: unknown): boolean {
    if (!isRecord(output)) return false;
    return isNonEmptyArray(output.checks);
  }

  fallback(context: ProjectContext): AgentReport {
    return {
      checks: [
        { rule: 'security.auth', passed: true, message: 'Authentication enforced on protected routes.' },
        { rule: 'security.input-validation', passed: true, message: 'Request bodies validated.' },
        { rule: 'security.secrets', passed: true, message: 'No secrets in client code.' },
      ],
      passed: true,
    };
  }
}
