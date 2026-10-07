import {
  NotificationLog,
  NotificationTemplate,
  NotificationChannel,
  NotificationType,
  IntegrationConfig,
  DebtReminderScheduleSettings,
  PaymentTransaction,
  PaymentWebhookEvent,
} from '../types/integrations';
import { Customer, CustomerDebt, Sale } from '../types';

/**
 * Validates whether the current local time falls into quiet hours (e.g. 21:00 - 07:00)
 */
export const isQuietHours = (schedule: DebtReminderScheduleSettings): boolean => {
  try {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = schedule.quietHoursStart.split(':').map(Number);
    const [endH, endM] = schedule.quietHoursEnd.split(':').map(Number);

    const startMinutes = startH * 60 + (startM || 0);
    const endMinutes = endH * 60 + (endM || 0);

    if (startMinutes > endMinutes) {
      // Crosses midnight, e.g. 21:00 to 07:00
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } catch {
    return false;
  }
};

/**
 * Interpolates variables such as {{customer_name}}, {{remaining_balance}}, {{due_date}}
 */
export const interpolateTemplate = (
  template: string,
  variables: Record<string, string | number>
): string => {
  let result = template;
  for (const [key, val] of Object.entries(variables)) {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(placeholder, String(val));
  }
  return result;
};

// ============================================================
// PROVIDER ADAPTERS (Pluggable, decoupled from core business logic)
// ============================================================

export interface ProviderSendResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
  retryable?: boolean;
}

export const EthioTelecomSmsAdapter = {
  send: async (
    recipientPhone: string,
    message: string,
    config?: IntegrationConfig
  ): Promise<ProviderSendResult> => {
    // Validate Ethiopian phone number (e.g. 09..., 07..., +2519...)
    const cleanPhone = recipientPhone.replace(/\s+/g, '');
    const isValid = /^(09|07|\+2519|\+2517)\d{8}$/.test(cleanPhone);
    if (!isValid) {
      return {
        success: false,
        error: 'INVALID_ETHIO_PHONE_NUMBER',
        retryable: false,
      };
    }

    if (config && !config.enabled) {
      return {
        success: false,
        error: 'INTEGRATION_DISABLED',
        retryable: false,
      };
    }

    // Simulate reliable gateway dispatch
    const providerMessageId = `ET_SMS_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    return {
      success: true,
      providerMessageId,
    };
  },
};

export const TelegramBotAdapter = {
  sendMessage: async (
    chatId: string,
    message: string,
    config?: IntegrationConfig
  ): Promise<ProviderSendResult> => {
    if (!chatId) {
      return { success: false, error: 'MISSING_TELEGRAM_CHAT_ID', retryable: false };
    }
    const providerMessageId = `TG_MSG_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    return {
      success: true,
      providerMessageId,
    };
  },
};

export const WhatsAppCloudAdapter = {
  sendTemplateMessage: async (
    recipientPhone: string,
    templateName: string,
    variables: string[],
    config?: IntegrationConfig
  ): Promise<ProviderSendResult> => {
    if (config?.status !== 'CONNECTED' && config?.status !== 'PENDING_VERIFICATION') {
      return { success: false, error: 'WHATSAPP_NOT_CONFIGURED', retryable: false };
    }
    const providerMessageId = `WA_MSG_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    return {
      success: true,
      providerMessageId,
    };
  },
};

export const SmtpEmailAdapter = {
  sendEmail: async (
    recipientEmail: string,
    subject: string,
    body: string,
    config?: IntegrationConfig
  ): Promise<ProviderSendResult> => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      return { success: false, error: 'INVALID_EMAIL_RECIPIENT', retryable: false };
    }
    const providerMessageId = `MAIL_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    return {
      success: true,
      providerMessageId,
    };
  },
};

// ============================================================
// PAYMENT PROVIDER ADAPTERS
// ============================================================

export interface PaymentInitiationResult {
  success: boolean;
  transaction: PaymentTransaction;
  checkoutUrl?: string;
  qrCodeData?: string;
  errorMessage?: string;
}

export const TelebirrPaymentAdapter = {
  createPayment: (params: {
    businessId: string;
    branchId: string;
    saleId?: string;
    debtId?: string;
    customerId?: string;
    customerName?: string;
    amount: number;
    phone: string;
  }): PaymentInitiationResult => {
    const internalRef = `TB-TXN-${Date.now().toString().slice(-8)}`;
    const fee = Math.round(params.amount * 0.015 * 100) / 100; // 1.5% fee
    const netAmount = Math.round((params.amount - fee) * 100) / 100;

    const txn: PaymentTransaction = {
      id: `ptx_${Date.now()}`,
      businessId: params.businessId,
      branchId: params.branchId,
      saleId: params.saleId,
      debtId: params.debtId,
      customerId: params.customerId,
      customerName: params.customerName,
      providerType: 'PAYMENT_TELEBIRR',
      providerName: 'Telebirr SuperApp',
      internalReference: internalRef,
      amount: params.amount,
      fee,
      netAmount,
      currency: 'ETB',
      status: 'PENDING',
      paymentMethod: 'TELEBIRR',
      idempotencyKey: `idem_tb_${params.saleId || params.debtId || Date.now()}`,
      requestedAt: new Date().toISOString(),
    };

    return {
      success: true,
      transaction: txn,
      checkoutUrl: `https://telebirr.ethiotelecom.et/pay?ref=${internalRef}`,
      qrCodeData: `telebirr://pay?to=100891&amount=${params.amount}&ref=${internalRef}`,
    };
  },

  verifyWebhook: (
    event: PaymentWebhookEvent,
    expectedTxn: PaymentTransaction
  ): { valid: boolean; error?: string } => {
    // 1. Signature check
    if (!event.signatureVerified) {
      return { valid: false, error: 'WEBHOOK_SIGNATURE_INVALID' };
    }
    // 2. Amount verification (Section 109 Acceptance Test 4)
    if (Math.abs(event.amount - expectedTxn.amount) > 0.01) {
      return { valid: false, error: 'PAYMENT_AMOUNT_MISMATCH' };
    }
    // 3. Currency check
    if (event.currency !== 'ETB') {
      return { valid: false, error: 'PAYMENT_CURRENCY_MISMATCH' };
    }
    // 4. Tenant isolation check
    if (event.businessId !== expectedTxn.businessId) {
      return { valid: false, error: 'TENANT_MISMATCH' };
    }

    return { valid: true };
  },
};
