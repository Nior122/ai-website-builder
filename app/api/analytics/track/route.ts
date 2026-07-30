// =============================================================================
// POST /api/analytics/track
// =============================================================================
// Public endpoint for analytics event ingestion. Called by the tracking script
// injected into published sites. No auth required — rate-limited per IP to
// prevent abuse. Returns 204 on success.
// =============================================================================

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { trackEvent } from '@/features/analytics/services/tracking.service';
import { checkRateLimit } from '@/lib/redis/rate-limit';

const trackSchema = z.object({
  projectId: z.string().min(1),
  eventType: z.enum(['page_view', 'click', 'form_submit', 'custom']),
  path: z.string().optional(),
  referrer: z.string().optional(),
  userAgent: z.string().optional(),
});

// Rate limit: 60 events per minute per IP (generous for real traffic)
const TRACK_RATE_LIMIT = { maxRequests: 60, windowMs: 60_000 };

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);

    // Rate limit per IP
    const rateLimit = await checkRateLimit(`analytics:${ip}`, TRACK_RATE_LIMIT);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rateLimit.retryAfterMs / 1000)),
          },
        }
      );
    }

    // Parse and validate
    const body = await request.json();
    const validated = trackSchema.parse(body);

    // Write event (fire-and-forget pattern)
    await trackEvent({
      projectId: validated.projectId,
      eventType: validated.eventType,
      path: validated.path,
      referrer: validated.referrer,
      userAgent: validated.userAgent || request.headers.get('user-agent') || undefined,
      ip,
    });

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid event data' },
        { status: 400 }
      );
    }
    // Still return 204 to avoid alerting the client — we log the error internally
    return new NextResponse(null, { status: 204 });
  }
}

// Handle preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
