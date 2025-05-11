
// Custom types for subscription functionality
export interface SubscriptionStatus {
  subscribed: boolean;
  subscription_tier?: string | null;
  subscription_end?: string | null;
  points_earned_today?: number;
}

export interface PurchasePointsOptions {
  mode: 'payment';
  points: number;
}

export interface SubscribeOptions {
  mode: 'subscription';
}

export interface CheckoutOptions extends Partial<PurchasePointsOptions>, Partial<SubscribeOptions> {
  mode: 'payment' | 'subscription';
}

export interface SessionResponse {
  url: string;
}
