export type UserRole = 'ADMIN' | 'STAFF' | 'CUSTOMER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  customerId?: string;
  avatar?: string;
}

export interface Customer {
  _id: string;
  customerNumber: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  billingAddress: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  gstNumber?: string;
  currency: string;
  status: 'Active' | 'Inactive';
  notes?: string;
  tags?: string[];
  activeSubscriptionsCount?: number;
  totalRevenueInPaise?: number;
  totalOutstandingInPaise?: number;
  createdAt: string;
}

export interface Product {
  _id: string;
  name: string;
  code: string;
  category: string;
  description: string;
  status: 'Active' | 'Archived';
  features: string[];
  plansCount?: number;
  activeSubscribersCount?: number;
  createdAt: string;
}

export interface ComparisonBullet {
  feature: string;
  included: boolean;
  detail?: string;
}

export interface Plan {
  _id: string;
  productId: string | { _id: string; name: string; code: string; category: string };
  name: string;
  code: string;
  description: string;
  billingInterval: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  intervalCount: number;
  priceInPaise: number;
  trialPeriodDays: number;
  setupFeeInPaise: number;
  isOneTime: boolean;
  status: 'Active' | 'Inactive';
  features: string[];
  comparisonBullets?: ComparisonBullet[];
  defaultTaxRate: number;
  activeSubscribersCount?: number;
  createdAt: string;
}

export interface QuotationLineItem {
  productId: string | { _id: string; name: string; code: string };
  planId: string | { _id: string; name: string; priceInPaise: number; billingInterval: string };
  description: string;
  quantity: number;
  unitPriceInPaise: number;
  discountPercent: number;
  taxRate: number;
  subtotalInPaise: number;
  discountAmountInPaise: number;
  taxAmountInPaise: number;
  totalAmountInPaise: number;
}

export interface Quotation {
  _id: string;
  quotationNumber: string;
  customerId: Customer;
  lineItems: QuotationLineItem[];
  subtotalInPaise: number;
  discountTotalInPaise: number;
  couponCode?: string;
  taxTotalInPaise: number;
  grandTotalInPaise: number;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Converted';
  expiryDate: string;
  notes?: string;
  terms?: string;
  sentAt?: string;
  sentToEmail?: string;
  convertedSubscriptionId?: string;
  convertedAt?: string;
  createdAt: string;
}

export interface SubscriptionTimelineItem {
  action: string;
  timestamp: string;
  description: string;
  performedBy: string;
  metadata?: Record<string, any>;
}

export interface Subscription {
  _id: string;
  subscriptionNumber: string;
  customerId: Customer;
  productId: Product;
  planId: Plan;
  quotationId?: string;
  status: 'Draft' | 'Trial' | 'Active' | 'Paused' | 'Past Due' | 'Cancelled' | 'Expired';
  billingInterval: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  intervalCount: number;
  quantity: number;
  unitPriceInPaise: number;
  discountPercent: number;
  taxRate: number;
  startDate: string;
  trialStartDate?: string;
  trialEndDate?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextBillingDate: string;
  pausedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  autoRenew: boolean;
  timeline: SubscriptionTimelineItem[];
  createdAt: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPriceInPaise: number;
  discountPercent: number;
  discountAmountInPaise: number;
  taxRate: number;
  taxAmountInPaise: number;
  subtotalInPaise: number;
  totalAmountInPaise: number;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  customerId: Customer;
  subscriptionId?: Subscription | { _id: string; subscriptionNumber: string };
  quotationId?: string;
  lineItems: InvoiceLineItem[];
  subtotalInPaise: number;
  discountTotalInPaise: number;
  taxTotalInPaise: number;
  totalAmountInPaise: number;
  paidAmountInPaise: number;
  outstandingAmountInPaise: number;
  status: 'Draft' | 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Void';
  issueDate: string;
  dueDate: string;
  paidAt?: string;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  notes?: string;
  paymentTerms?: string;
  createdAt: string;
}

export interface Payment {
  _id: string;
  paymentNumber: string;
  invoiceId: Invoice | { _id: string; invoiceNumber: string; totalAmountInPaise: number; status: string };
  customerId: Customer;
  amountInPaise: number;
  method: 'UPI' | 'Card' | 'Bank Transfer' | 'Cash' | 'Other';
  referenceNumber: string;
  status: 'Success' | 'Pending' | 'Failed' | 'Refunded';
  paymentDate: string;
  notes?: string;
  isSimulated: boolean;
  reconciled: boolean;
  refundReason?: string;
  refundedAt?: string;
  createdAt: string;
}

export interface Discount {
  _id: string;
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchaseInPaise: number;
  maxDiscountInPaise?: number;
  validFrom: string;
  validUntil: string;
  maxRedemptions: number;
  currentRedemptions: number;
  perCustomerLimit: number;
  status: 'Active' | 'Inactive';
}

export interface TaxRule {
  _id: string;
  name: string;
  rate: number;
  description: string;
  jurisdiction: string;
  isDefault: boolean;
  status: 'Active' | 'Inactive';
}

export interface AuditLog {
  _id: string;
  userId?: string;
  userName: string;
  userRole: string;
  action: string;
  entity: string;
  entityId?: string;
  details: Record<string, any>;
  ipAddress: string;
  createdAt: string;
}

export interface FinancialKPIs {
  mrrInPaise: number;
  arrInPaise: number;
  activeSubscriptions: number;
  totalCustomers: number;
  churnRate: number;
  outstandingInPaise: number;
  totalCollectedInPaise: number;
  grossInvoicedInPaise: number;
  ltvInPaise: number;
  collectionRate: number;
  trends: {
    mrrChange: string;
    arrChange: string;
    activeSubsChange: string;
    churnChange: string;
    outstandingChange: string;
  };
}
