
// Custom types for subscription functionality
export interface SubscriptionStatus {
  subscribed: boolean;
  subscription_tier?: string | null;
  subscription_end?: string | null;
  points_earned_today?: number;
  was_upgraded?: boolean;
}

export interface BaseCheckoutOptions {
  mode: 'payment' | 'subscription';
}

export interface PurchasePointsOptions extends BaseCheckoutOptions {
  mode: 'payment';
  points: number;
}

export interface SubscribeOptions extends BaseCheckoutOptions {
  mode: 'subscription';
}

// Use type union instead of extending incompatible interfaces
export type CheckoutOptions = PurchasePointsOptions | SubscribeOptions;

export interface SessionResponse {
  url: string;
}
