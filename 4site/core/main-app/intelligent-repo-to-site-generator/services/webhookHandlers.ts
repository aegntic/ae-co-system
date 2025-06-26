/**
 * Webhook Handlers for Polar.sh Integration
 * Processes commission events and triggers email notifications
 */

import { polarService } from './polarService';
import { emailService } from './emailService';

export interface WebhookEvent {
  type: string;
  data: any;
  timestamp: string;
  id: string;
}

export interface SubscriptionCreatedEvent {
  type: 'subscription.created';
  data: {
    id: string;
    user_id: string;
    user_email: string;
    amount: number;
    currency: string;
    referral_code?: string;
    plan: string;
  };
}

export interface CommissionEarnedEvent {
  type: 'commission.earned';
  data: {
    id: string;
    user_id: string;
    user_email: string;
    user_name: string;
    amount: number;
    currency: string;
    commission_rate: number;
    tier: string;
    referral_count: number;
    referral_id: string;
  };
}

export interface PayoutProcessedEvent {
  type: 'payout.processed';
  data: {
    id: string;
    user_id: string;
    user_email: string;
    user_name: string;
    amount: number;
    currency: string;
    transaction_id: string;
    processed_date: string;
  };
}

class WebhookHandlers {
  
  // ================================================================================================
  // MAIN WEBHOOK PROCESSOR
  // ================================================================================================

  async processWebhook(event: WebhookEvent): Promise<void> {
    console.log(`[Webhook] Processing event: ${event.type}`, event.id);
    
    try {
      switch (event.type) {
        case 'subscription.created':
          await this.handleSubscriptionCreated(event as SubscriptionCreatedEvent);
          break;
          
        case 'commission.earned':
          await this.handleCommissionEarned(event as CommissionEarnedEvent);
          break;
          
        case 'payout.processed':
          await this.handlePayoutProcessed(event as PayoutProcessedEvent);
          break;
          
        case 'referral.milestone':
          await this.handleReferralMilestone(event);
          break;
          
        default:
          console.log(`[Webhook] Unknown event type: ${event.type}`);
      }
    } catch (error) {
      console.error(`[Webhook] Error processing ${event.type}:`, error);
      throw error;
    }
  }

  // ================================================================================================
  // SUBSCRIPTION EVENTS
  // ================================================================================================

  private async handleSubscriptionCreated(event: SubscriptionCreatedEvent): Promise<void> {
    const { data } = event;
    console.log(`[Webhook] New subscription created:`, data.id);
    
    // Check if this subscription has a referral code
    if (data.referral_code) {
      await this.processReferralCommission(data);
    }
    
    // Track subscription in analytics
    console.log(`[Webhook] Tracking subscription for user ${data.user_id}`);
    
    // Could trigger welcome email, onboarding flow, etc.
  }

  private async processReferralCommission(subscriptionData: SubscriptionCreatedEvent['data']): Promise<void> {
    console.log(`[Webhook] Processing referral commission for code: ${subscriptionData.referral_code}`);
    
    try {
      // In a real implementation, this would:
      // 1. Look up the referrer by referral code
      // 2. Calculate commission based on their tier
      // 3. Create commission record
      // 4. Trigger commission earned notification
      
      // Mock referrer data for demonstration
      const mockReferrer = {
        id: 'user_123',
        email: 'referrer@example.com',
        name: 'John Doe',
        referralCount: 8, // This would come from database
      };
      
      // Calculate commission tier and rate
      const tier = mockReferrer.referralCount >= 15 ? 'legacy' : 
                   mockReferrer.referralCount >= 5 ? 'established' : 'new';
      const rate = tier === 'legacy' ? 0.40 : tier === 'established' ? 0.25 : 0.20;
      const commissionAmount = subscriptionData.amount * rate;
      
      // Create commission record via Polar.sh
      const commission = await polarService.createCommissionPayout({
        userId: mockReferrer.id,
        amount: commissionAmount,
        currency: subscriptionData.currency,
        description: `Referral commission for subscription ${subscriptionData.id}`,
        tier,
        commissionRate: rate,
        referralId: subscriptionData.id,
        scheduledDate: this.getNextPayoutDate()
      });
      
      console.log(`[Webhook] Commission created:`, commission);
      
      // Send commission earned notification
      await emailService.sendCommissionEarnedNotification({
        userId: mockReferrer.id,
        userEmail: mockReferrer.email,
        userName: mockReferrer.name,
        amount: commissionAmount,
        currency: subscriptionData.currency,
        commissionRate: rate,
        referralCount: mockReferrer.referralCount + 1,
        tier,
        payoutDate: this.getNextPayoutDate(),
        dashboardUrl: `${process.env.VITE_APP_URL || 'https://4site.pro'}/dashboard`
      });
      
    } catch (error) {
      console.error('[Webhook] Error processing referral commission:', error);
      throw error;
    }
  }

  // ================================================================================================
  // COMMISSION EVENTS
  // ================================================================================================

  private async handleCommissionEarned(event: CommissionEarnedEvent): Promise<void> {
    const { data } = event;
    console.log(`[Webhook] Commission earned: $${data.amount} for user ${data.user_id}`);
    
    // Send email notification
    await emailService.sendCommissionEarnedNotification({
      userId: data.user_id,
      userEmail: data.user_email,
      userName: data.user_name,
      amount: data.amount,
      currency: data.currency,
      commissionRate: data.commission_rate,
      referralCount: data.referral_count,
      tier: data.tier,
      payoutDate: this.getNextPayoutDate(),
      dashboardUrl: `${process.env.VITE_APP_URL || 'https://4site.pro'}/dashboard`
    });
    
    // Check for tier upgrades
    await this.checkTierUpgrade(data);
  }

  private async handlePayoutProcessed(event: PayoutProcessedEvent): Promise<void> {
    const { data } = event;
    console.log(`[Webhook] Payout processed: $${data.amount} for user ${data.user_id}`);
    
    // Send payout confirmation email
    await emailService.sendPayoutProcessedNotification({
      userEmail: data.user_email,
      userName: data.user_name,
      amount: data.amount,
      currency: data.currency,
      processedDate: data.processed_date,
      transactionId: data.transaction_id,
      dashboardUrl: `${process.env.VITE_APP_URL || 'https://4site.pro'}/dashboard`
    });
  }

  // ================================================================================================
  // MILESTONE EVENTS
  // ================================================================================================

  private async handleReferralMilestone(event: WebhookEvent): Promise<void> {
    const { data } = event;
    console.log(`[Webhook] Referral milestone reached:`, data);
    
    // Check if user qualifies for free Pro benefits
    const milestones = [5, 10, 15, 25, 50]; // Referral counts that unlock benefits
    const freePeriods = [3, 6, 12, 24, 36]; // Months of free Pro
    
    const milestoneIndex = milestones.indexOf(data.referral_count);
    if (milestoneIndex !== -1) {
      const freePeriod = freePeriods[milestoneIndex];
      const expirationDate = new Date();
      expirationDate.setMonth(expirationDate.getMonth() + freePeriod);
      
      // Send milestone notification
      await emailService.sendReferralMilestoneNotification({
        userEmail: data.user_email,
        userName: data.user_name,
        referralCount: data.referral_count,
        freePeriod,
        expirationDate: expirationDate.toISOString().split('T')[0],
        dashboardUrl: `${process.env.VITE_APP_URL || 'https://4site.pro'}/dashboard`
      });
    }
  }

  private async checkTierUpgrade(commissionData: CommissionEarnedEvent['data']): Promise<void> {
    const previousTier = this.calculateTier(commissionData.referral_count - 1);
    const currentTier = this.calculateTier(commissionData.referral_count);
    
    if (previousTier !== currentTier) {
      console.log(`[Webhook] Tier upgrade detected: ${previousTier} → ${currentTier}`);
      
      // Could send tier upgrade notification email here
      // await emailService.sendTierUpgradeNotification({...});
    }
  }

  // ================================================================================================
  // UTILITY METHODS
  // ================================================================================================

  private calculateTier(referralCount: number): string {
    if (referralCount >= 15) return 'legacy';
    if (referralCount >= 5) return 'established';
    return 'new';
  }

  private getNextPayoutDate(): string {
    // Payouts processed on the 1st of each month
    const now = new Date();
    const nextPayout = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextPayout.toISOString().split('T')[0];
  }

  // ================================================================================================
  // WEBHOOK VALIDATION
  // ================================================================================================

  validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
    // In a real implementation, this would validate the webhook signature
    // using HMAC-SHA256 or similar cryptographic verification
    console.log('[Webhook] Validating signature (placeholder implementation)');
    return true; // Placeholder
  }

  // ================================================================================================
  // ERROR HANDLING
  // ================================================================================================

  async handleWebhookError(event: WebhookEvent, error: Error): Promise<void> {
    console.error(`[Webhook] Failed to process ${event.type}:`, error);
    
    // In production, this would:
    // 1. Log to error tracking service (Sentry, Bugsnag, etc.)
    // 2. Queue for retry with exponential backoff
    // 3. Send alert to admin team for critical failures
    // 4. Update webhook status in database
    
    // For now, just log the error
    console.error(`[Webhook] Event ${event.id} failed:`, {
      type: event.type,
      timestamp: event.timestamp,
      error: error.message,
      stack: error.stack
    });
  }
}

// ================================================================================================
// SINGLETON INSTANCE
// ================================================================================================

export const webhookHandlers = new WebhookHandlers();
export default WebhookHandlers;