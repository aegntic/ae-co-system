/**
 * Polar.sh Webhook Endpoint
 * Handles incoming webhook events from Polar.sh for commission processing
 * 
 * This would be deployed as a serverless function or API route in production
 */

import { webhookHandlers, WebhookEvent } from '../../services/webhookHandlers';

// This would be used in a Next.js API route, Vercel function, or similar
export async function handlePolarWebhook(request: Request): Promise<Response> {
  try {
    // Verify request method
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Extract webhook signature for validation
    const signature = request.headers.get('polar-signature');
    if (!signature) {
      return new Response('Missing signature', { status: 400 });
    }

    // Get request body
    const body = await request.text();
    
    // Validate webhook signature
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[Webhook] POLAR_WEBHOOK_SECRET not configured');
      return new Response('Server configuration error', { status: 500 });
    }

    const isValid = webhookHandlers.validateWebhookSignature(body, signature, webhookSecret);
    if (!isValid) {
      console.error('[Webhook] Invalid signature');
      return new Response('Invalid signature', { status: 401 });
    }

    // Parse webhook event
    let event: WebhookEvent;
    try {
      event = JSON.parse(body);
    } catch (error) {
      console.error('[Webhook] Invalid JSON payload:', error);
      return new Response('Invalid JSON', { status: 400 });
    }

    // Validate required fields
    if (!event.type || !event.id || !event.data) {
      console.error('[Webhook] Missing required fields in webhook event');
      return new Response('Invalid event structure', { status: 400 });
    }

    console.log(`[Webhook] Received ${event.type} event:`, event.id);

    // Process the webhook event
    await webhookHandlers.processWebhook(event);

    // Return success response
    return new Response(JSON.stringify({ 
      success: true, 
      eventId: event.id,
      processed: true 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error);
    
    // Return error response but don't expose internal details
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Example usage for different deployment environments:

// ================================================================================================
// NEXT.JS API ROUTE (pages/api/webhooks/polar.ts)
// ================================================================================================
/*
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const request = new Request(`http://localhost:3000${req.url}`, {
    method: req.method,
    headers: req.headers as any,
    body: req.method === 'POST' ? JSON.stringify(req.body) : undefined
  });
  
  const response = await handlePolarWebhook(request);
  const result = await response.json();
  
  res.status(response.status).json(result);
}
*/

// ================================================================================================
// VERCEL EDGE FUNCTION (api/webhooks/polar.ts)
// ================================================================================================
/*
export default async function handler(request: Request): Promise<Response> {
  return handlePolarWebhook(request);
}

export const config = {
  runtime: 'edge',
};
*/

// ================================================================================================
// CLOUDFLARE WORKER
// ================================================================================================
/*
addEventListener('fetch', event => {
  if (event.request.url.includes('/api/webhooks/polar')) {
    event.respondWith(handlePolarWebhook(event.request));
  }
});
*/

// ================================================================================================
// EXPRESS.JS ROUTE
// ================================================================================================
/*
import express from 'express';

const app = express();

app.post('/api/webhooks/polar', async (req, res) => {
  const request = new Request(req.url, {
    method: req.method,
    headers: req.headers as any,
    body: JSON.stringify(req.body)
  });
  
  const response = await handlePolarWebhook(request);
  const result = await response.json();
  
  res.status(response.status).json(result);
});
*/

// ================================================================================================
// TESTING HELPER
// ================================================================================================

export function createTestWebhookEvent(type: string, data: any): WebhookEvent {
  return {
    type,
    data,
    timestamp: new Date().toISOString(),
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
}

// Test webhook events for development
export const testEvents = {
  subscriptionCreated: createTestWebhookEvent('subscription.created', {
    id: 'sub_test_123',
    user_id: 'user_test_456',
    user_email: 'test@example.com',
    amount: 29.00,
    currency: 'USD',
    referral_code: 'REF123',
    plan: 'pro'
  }),
  
  commissionEarned: createTestWebhookEvent('commission.earned', {
    id: 'comm_test_789',
    user_id: 'user_test_456',
    user_email: 'referrer@example.com',
    user_name: 'John Doe',
    amount: 7.25,
    currency: 'USD',
    commission_rate: 0.25,
    tier: 'established',
    referral_count: 8,
    referral_id: 'sub_test_123'
  }),
  
  payoutProcessed: createTestWebhookEvent('payout.processed', {
    id: 'payout_test_101',
    user_id: 'user_test_456',
    user_email: 'referrer@example.com',
    user_name: 'John Doe',
    amount: 145.50,
    currency: 'USD',
    transaction_id: 'txn_polar_abc123',
    processed_date: new Date().toISOString().split('T')[0]
  })
};

export default handlePolarWebhook;