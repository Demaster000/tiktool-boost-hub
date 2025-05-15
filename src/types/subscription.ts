
export interface SubscriptionStatus {
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
  points_earned_today: number;
  was_upgraded: boolean;
}
