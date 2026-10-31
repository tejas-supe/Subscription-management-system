export type SubscriptionStatus =
  | "draft"
  | "quotation"
  | "confirmed"
  | "active"
  | "paused"
  | "closed"
  | "cancelled";

export interface SubscriptionSummary {
  id: string;
  customerId: string;
  planId: string;
  status: SubscriptionStatus;
  nextBillingDate: string | null;
}
