// =============================================================================
// Agent 1 — Business Analyst
// =============================================================================
// Understands the user's business: industry, target audience, customer
// problems, products, services, goals, competitors, and unique selling point.
// Output: BusinessStrategy.
// =============================================================================

import { Agent, isNonEmptyArray, isNonEmptyString, isRecord } from '../base';
import type { ProjectContext } from '../context';
import type { BusinessStrategy } from '../types';

const AUDIENCE_BY_INDUSTRY: Record<string, string[]> = {
  restaurant: ['Local diners and food lovers', 'Families seeking reliable quality', 'Office workers near the venue'],
  hospital: ['Patients and their families', 'Referring physicians', 'Health plan administrators'],
  school: ['Parents and guardians', 'Prospective students', 'Community partners'],
  church: ['Congregation members', 'Newcomers seeking community', 'Volunteers'],
  agency: ['Marketing decision-makers', 'Startups needing brand systems', 'Enterprises scaling campaigns'],
  'law-firm': ['Individuals with legal matters', 'Small businesses needing counsel', 'Corporations requiring compliance'],
  fitness: ['Fitness enthusiasts', 'Beginners starting their journey', 'Corporate wellness programs'],
  travel: ['Leisure travelers', 'Business travelers', 'Group organizers'],
  'real-estate': ['Home buyers and sellers', 'Property investors', 'Renters'],
  construction: ['Homeowners planning builds', 'Developers', 'Commercial property owners'],
  beauty: ['Self-care focused clients', 'Bridal and event clients', 'Recurring maintenance clients'],
  finance: ['Savvy savers', 'Small business owners', 'Retirement planners'],
};

export class BusinessAnalystAgent extends Agent {
  readonly id = 'business' as const;
  readonly outputKey = 'business';

  run(context: ProjectContext): BusinessStrategy {
    const req = context.request;
    const industry = req.industry;
    const businessType = req.businessType;

    const audience =
      AUDIENCE_BY_INDUSTRY[industry.toLowerCase()] ?? [
        `Core customers of ${businessType} services`,
        'Prospective clients evaluating providers',
        'Repeat customers seeking ongoing value',
      ];

    return {
      industry,
      audience,
      problems: [
        `Finding a trusted ${businessType} provider without clear quality signals`,
        'Comparing options when every provider sounds the same',
        'Getting responsive, human support when issues matter',
      ],
      products: [businessType, `${businessType} packages`, `${businessType} consulting`],
      services: [
        'Initial consultation and scoping',
        `Ongoing ${businessType} support`,
        `Custom ${businessType} solutions`,
      ],
      goals: [
        'Grow local market share',
        'Build a recognizable, trusted brand',
        'Increase repeat and referral business',
      ],
      competitors: ['Local incumbent providers', 'Online-only alternatives'],
      usp: `Specialized ${industry} expertise delivered with measurable quality and care`,
    };
  }

  validate(output: unknown): boolean {
    if (!isRecord(output)) return false;
    return (
      isNonEmptyString(output.industry) &&
      isNonEmptyArray(output.audience) &&
      isNonEmptyArray(output.problems) &&
      isNonEmptyArray(output.products) &&
      isNonEmptyArray(output.services) &&
      isNonEmptyString(output.usp)
    );
  }

  fallback(context: ProjectContext): BusinessStrategy {
    const req = context.request;
    return {
      industry: req.industry,
      audience: ['Prospective clients', 'Repeat customers'],
      problems: ['Finding a trusted provider', 'Comparing options fairly', 'Getting responsive support'],
      products: [req.businessType],
      services: ['Consultation', 'Ongoing support'],
      goals: ['Grow market share', 'Build a trusted brand'],
      competitors: ['Local incumbents'],
      usp: `${req.industry} expertise with measurable quality`,
    };
  }
}
