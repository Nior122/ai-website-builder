// =============================================================================
// POST /api/webhooks/clerk
// =============================================================================
// Receives Clerk webhook events and syncs user data to the database.
// Verifies webhook signature for security.
// =============================================================================

import { type NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { syncUser, deleteUser } from '@/features/auth/services/user-sync.service';
import { logger } from '@/lib/logger';
import { getServerEnv } from '@/lib/env';

// Webhook must never be statically rendered or prerendered — it is a runtime
// receiver for Clerk events. `force-dynamic` plus resolving the env lazily
// inside the handler keeps this module importable during `next build`'s
// page-data collection without requiring env vars at build time.
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const env = getServerEnv();
    // Verify webhook signature
    const payload = await request.text();
    const headerPayload = request.headers;

    const svixId = headerPayload.get('svix-id');
    const svixTimestamp = headerPayload.get('svix-timestamp');
    const svixSignature = headerPayload.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
    }

    const wh = new Webhook(env.CLERK_WEBHOOK_SECRET);
    let event: { type: string; data: Record<string, unknown> };

    try {
      event = wh.verify(payload, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as { type: string; data: Record<string, unknown> };
    } catch (err) {
      logger.error('Webhook signature verification failed', { error: String(err) });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Handle events
    switch (event.type) {
      case 'user.created':
      case 'user.updated': {
        const userData = event.data as {
          id: string;
          email_addresses?: Array<{ email_address: string }>;
          first_name?: string;
          last_name?: string;
          image_url?: string;
          created_at?: number;
        };

        await syncUser({
          id: userData.id,
          emailAddresses: (userData.email_addresses || []).map((e) => ({
            emailAddress: e.email_address,
          })),
          firstName: userData.first_name,
          lastName: userData.last_name,
          imageUrl: userData.image_url,
          createdAt: userData.created_at,
        });
        break;
      }

      case 'user.deleted': {
        const userData = event.data as { id: string };
        await deleteUser(userData.id);
        break;
      }

      case 'organization.created':
      case 'organization.updated': {
        // Organization sync handled separately
        logger.info(`Organization event: ${event.type}`, { data: event.data });
        break;
      }

      default:
        // Unhandled event type — not an error
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Webhook handler failed', { error: String(error) });
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
