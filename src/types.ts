import type { Timestamp } from "firebase/firestore";

export interface Envelope {
  id: string;
  name: string;
  total: number;
  spent: number;
  order?: number;
}

export interface Payment {
  id: string;
  name: string;
  amount: number;
  dueDate: Timestamp;
  interval: Interval;
  paidDates?: Timestamp[]; // for tracking payments that span multiple intervals (ie WEEKLY | BIWEEKLY | SPLIT)
  paidAmounts?: Record<string, number>; // for DEBT: key = occurrence timestamp string, value = amount applied (so we can reverse on unmark)
  type: "DEBT" | "BILL" | "FUND" | undefined;
  isInInterval?: boolean;
  total?: number; // Running Total Remaining
  originalTotal?: number; // Original Amount due when added to budget
  interestRate?: number;
  recurring?: boolean; // For SPLIT: true = monthly recurring (like rent), false = Fund (planned expense to save toward)
  paymentsLeft?: number;
  payOffDate?: string;
}

export type ViewContent = "NVELOPES" | "PAYMENTS";

export type NvelopesTransactionType =
  | "DELETE"
  | "EDIT"
  | "SPEND"
  | "CASH"
  | "NEW"
  | "TAKE"
  | "GIVE"
  | "RESET"
  | "FILL"
  | "EXTRA"
  | "SNOWBALL"
  | "PAID"
  | "PAID_OFF";

export interface NvelopesTransaction {
  id: string;
  type: NvelopesTransactionType;
  createdAt: Timestamp;
  createdBy: string;
  amount?: number;
  description?: string;
  modifiedAt?: Timestamp;
  nvelopeOrPaymentId?: string;
}

export type InviteStatus = "pending" | "consumed" | "expired" | "revoked";

export interface Invite {
  budgetId: string;
  budgetName: string;
  invitedByUid: string;
  invitedByName: string;
  invitedEmail: string;
  status: InviteStatus;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  consumedByUid: string | null;
  consumedAt: Timestamp | null;
}

export type PaymentType = "BILL" | "DEBT" | "FUND";

export interface OneTimeAmount {
  id: string;
  name: string;
  amount: number;
  date: Timestamp;
}

// PreviousIntervalDetails removed - see FUTURE FEATURE comment in editData.ts

export type Interval =
  | "WEEKLY"
  | "BIWEEKLY"
  | "MONTHLY"
  | "YEARLY"
  | "SPLIT"
  | undefined;

export type IntervalDates = {
  start: Date;
  end: Date;
};

export type BackupData = {
  backupTimeStamp: Timestamp;
  cash?: OneTimeAmount[];
  expenses?: OneTimeAmount[];
  nvelopes: Envelope[];
  payDate: Timestamp;
  payPeriodInterval: Interval;
  payments: Payment[];
  shouldReset: Timestamp;
  snowballTargetPaymentId?: string | null;
  totalSpendingBudget: number;
};

export type Backup = {
  backupTimeStamp: Timestamp;
  data: BackupData[];
};

// Multi-budget: budget metadata (budgets/{budgetId})
export interface Budget {
  name: string;
  ownerId: string;
  memberIds: string[];
  /** uid -> email for display; set on create and when user accepts invite */
  memberEmails?: Record<string, string>;
  createdAt?: Timestamp;
}

// User's reference to a budget (users/{userId}/budgets/{budgetId})
export interface UserBudgetRef {
  name: string;
  budgetId: string;
}

// Single doc under budgets/{budgetId}/data/main - same shape as old user doc
export type BudgetDataDoc = {
  envelopes: Envelope[];
  payments: Payment[];
  payDate: Timestamp | null;
  payPeriodInterval: Interval;
  totalSpendingBudget: number;
  snowballTargetPaymentId: string | null;
  isNewUser: boolean;
  backups: Backup | null;
};
