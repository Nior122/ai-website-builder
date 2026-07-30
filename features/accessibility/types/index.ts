// =============================================================================
// Accessibility (a11y) Audit Types
// =============================================================================
// Shape of the audit result produced by `auditAccessibility` and surfaced via
// the /api/projects/[id]/accessibility route. Modeled after the SEO audit
// result so the dashboard "SEO & Accessibility" tab can render both with the
// same issue/suggestion card components.
// =============================================================================

export type WCAGLevel = 'A' | 'AA' | 'AAA';

export type Category =
  | 'images'
  | 'headings'
  | 'forms'
  | 'color'
  | 'links'
  | 'structure'
  | 'contrast';

export type Severity = 'error' | 'warning' | 'info';

export interface A11yIssue {
  /** error = WCAG failure / blocker; warning = should fix; info = enhancement */
  severity: Severity;
  /** Which WCAG category the failure belongs to */
  category: Category;
  /** Human-readable explanation of the problem */
  message: string;
  /** Which WCAG success criterion it maps to, e.g. "1.1.1" */
  criterion?: string;
  /** Conformance level the criterion sits at */
  level?: WCAGLevel;
  /** Page/section location the issue was found at, for the UI to link to it */
  location?: {
    pageSlug?: string;
    sectionId?: string;
    sectionType?: string;
  };
  /** JSON path within the section content, for precise editor highlighting */
  field?: string;
  /** Suggested fix the editor can apply */
  fix?: string;
}

export interface A11ySuggestion {
  category: Category;
  impact: 'high' | 'medium' | 'low';
  description: string;
}

export interface AccessibilityAuditResult {
  /** 0–100 overall score (100 = no errors/warnings) */
  score: number;
  /** Letter grade derived from the score, matches SEO grading */
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  /** Count of errors (blockers) — must be 0 for WCAG A/AA conformance */
  errorCount: number;
  /** Count of warnings */
  warningCount: number;
  issues: A11yIssue[];
  suggestions: A11ySuggestion[];
  /** Per-category pass/fail summary for the dashboard cards */
  byCategory: Record<Category, { passed: boolean; issueCount: number }>;
}
