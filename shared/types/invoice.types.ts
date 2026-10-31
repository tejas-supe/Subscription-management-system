export type InvoiceStatus = "draft" | "posted" | "paid" | "overdue" | "cancelled";

export interface InvoiceSummary {
  id: string;
  customerId: string;
  status: InvoiceStatus;
  total: number;
  currency: string;
  dueDate: string;
}
