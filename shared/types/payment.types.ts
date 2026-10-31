export type PaymentMethod = "upi" | "card" | "bank_transfer" | "cash" | "online";

export interface PaymentSummary {
  id: string;
  invoiceId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  paidAt: string;
}
