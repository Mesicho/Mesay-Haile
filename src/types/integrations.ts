export type NotificationType =
  | 'NEW_SALE'
  | 'SALE_COMPLETED'
  | 'SALE_CANCELLED'
  | 'REFUND_COMPLETED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_REVERSED'
  | 'DEBT_CREATED'
  | 'DEBT_PAYMENT_RECEIVED'
  | 'DEBT_DUE_SOON'
  | 'DEBT_DUE_TODAY'
  | 'DEBT_OVERDUE'
  | 'CREDIT_LIMIT_REACHED'
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'STOCK_ADJUSTMENT'
  | 'EXPIRING_PRODUCT'
  | 'EXPIRED_PRODUCT'
  | 'PURCHASE_CREATED'
  | 'SUPPLIER_PAYMENT_DUE'
  | 'SUPPLIER_PAYMENT_OVERDUE'
  | 'LARGE_EXPENSE'
  | 'CASH_SHORTAGE'
  | 'CASH_OVERAGE'
  | 'FINANCIAL_RECONCILIATION_ERROR'
  | 'NEW_DEVICE'
  | 'DEVICE_REVOKED'
  | 'PASSWORD_CHANGED'
  | 'LOGIN_ALERT'
  | 'SYNC_FAILED'
  | 'SYNC_CONFLICT';

export type NotificationChannel =
  | 'IN_APP'
  | 'PUSH'
  | 'SMS'
  | 'EMAIL'
  | 'TELEGRAM'
  | 'WHATSAPP';

export type NotificationStatus =
  | 'PENDING'
  | 'QUEUED'
  | 'SENDING'
  | 'SENT'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED';

export type NotificationPriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';

export interface NotificationLog {
  id: string;
  businessId: string;
  branchId?: string;
  userId?: string;
  customerId?: string;
  customerName?: string;
  recipient: string; // phone number, email, telegramChatId, or push token
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  titleAm: string;
  body: string;
  bodyAm?: string;
  language: 'am' | 'en';
  priority: NotificationPriority;
  status: NotificationStatus;
  provider: string; // e.g. 'EthioTelecomSMS', 'TelegramBot', 'WhatsAppCloud', 'LocalInApp'
  providerMessageId?: string;
  referenceType?: string; // 'SALE', 'DEBT', 'INVENTORY', 'PAYMENT'
  referenceId?: string;
  retryCount: number;
  scheduledAt?: string;
  sentAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  failureReason?: string;
  createdAt: string;
}

export interface NotificationTemplate {
  id: string;
  businessId: string;
  type: NotificationType;
  channel: NotificationChannel;
  language: 'am' | 'en';
  titleTemplate: string;
  bodyTemplate: string;
  variables: string[]; // ['customer_name', 'remaining_balance', 'due_date', etc.]
  isActive: boolean;
  createdAt: string;
}

export interface CustomerContactPreferences {
  customerId: string;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
  telegramEnabled: boolean;
  emailEnabled: boolean;
  marketingEnabled: boolean;
  preferredChannel: NotificationChannel;
  telegramChatId?: string;
}

export type ProviderType =
  | 'SMS_ETHIO_TELECOM'
  | 'SMS_TWILIO'
  | 'TELEGRAM_BOT'
  | 'WHATSAPP_BUSINESS'
  | 'EMAIL_SMTP'
  | 'PUSH_WEB'
  | 'PAYMENT_TELEBIRR'
  | 'PAYMENT_CBE_BIRR'
  | 'PAYMENT_CHAPA'
  | 'PAYMENT_AWASH';

export type ProviderStatus =
  | 'CONNECTED'
  | 'DISCONNECTED'
  | 'ERROR'
  | 'EXPIRED'
  | 'DISABLED'
  | 'PENDING_VERIFICATION';

export interface IntegrationConfig {
  id: string;
  businessId: string;
  providerType: ProviderType;
  name: string;
  nameAm: string;
  category: 'MESSAGING' | 'PAYMENT' | 'EMAIL' | 'PUSH';
  status: ProviderStatus;
  enabled: boolean;
  credentialsMasked: Record<string, string>; // never stores plaintext secrets in frontend
  settings: Record<string, any>;
  lastConnectedAt?: string;
  lastWebhookAt?: string;
  lastError?: string;
  createdAt: string;
}

export interface PaymentTransaction {
  id: string;
  businessId: string;
  branchId: string;
  saleId?: string;
  debtId?: string;
  customerId?: string;
  customerName?: string;
  providerType: ProviderType;
  providerName: string;
  internalReference: string; // e.g. "TXN-2026-00891"
  providerReference?: string; // provider transaction ID from webhook
  amount: number; // Gross payment ETB
  fee: number; // Provider transaction fee
  netAmount: number; // Gross - fee
  currency: 'ETB';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED';
  paymentMethod: 'TELEBIRR' | 'CBE_BIRR' | 'CHAPA' | 'BANK' | 'CASH';
  idempotencyKey: string;
  requestedAt: string;
  completedAt?: string;
  failedAt?: string;
  failureReason?: string;
  accountingJournalId?: string;
}

export interface PaymentWebhookEvent {
  id: string;
  provider: string;
  providerEventId: string;
  businessId: string;
  internalReference: string;
  providerReference: string;
  amount: number;
  currency: string;
  signatureVerified: boolean;
  status: 'RECEIVED' | 'VALIDATING' | 'PROCESSED' | 'DUPLICATE' | 'REJECTED' | 'FAILED';
  receivedAt: string;
  processedAt?: string;
  errorMessage?: string;
}

export interface DebtReminderScheduleSettings {
  beforeDueDays: number[]; // e.g. [7, 3, 1]
  dueOnDay: boolean;
  afterDueDays: number[]; // e.g. [1, 3, 7, 30]
  quietHoursStart: string; // e.g. "21:00"
  quietHoursEnd: string; // e.g. "07:00"
  maxRemindersPerDebt: number;
  minIntervalHours: number;
  autoSendEnabled: boolean;
  defaultChannelPriority: NotificationChannel[]; // ['WHATSAPP', 'SMS', 'TELEGRAM', 'EMAIL']
}

export interface ReceiptVerificationData {
  publicCode: string;
  invoiceNumber: string;
  businessName: string;
  businessAmharicName?: string;
  branchName: string;
  date: string;
  total: number;
  amountPaid: number;
  remainingDebt: number;
  currency: string;
  paymentMethod: string;
  verificationStatus: 'VALID' | 'REVOKED' | 'EXPIRED';
  issuedAt: string;
}
