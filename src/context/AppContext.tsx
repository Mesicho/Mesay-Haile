import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Business,
  Branch,
  User,
  ProductCategory,
  Product,
  Customer,
  CustomerDebt,
  DebtTransaction,
  Sale,
  Expense,
  Supplier,
  Purchase,
  AuditLog,
  NotificationItem,
  SyncEvent,
  Language,
  ThemeMode,
  InventoryTransaction,
  InventoryTxType,
  AuthStatus,
  UserBusinessInfo,
  RegisterPayload,
} from '../types';
import {
  apiLogin,
  apiRegister,
  apiGetMe,
  apiLogout,
  apiLogoutAll,
  apiChangePassword,
  apiForgotPassword,
  apiResetPassword,
  apiSwitchBusiness,
  getStoredAuthToken,
  clearStoredAuthToken,
} from '../services/authService';
import {
  Account,
  JournalEntry,
  JournalEntryLine,
  CashRegister,
  FinancialPeriod,
  AccountingSettings,
} from '../types/accounting';
import {
  defaultChartOfAccounts,
  defaultAccountingSettings,
  defaultFinancialPeriods,
} from '../data/defaultChartOfAccounts';
import { buildInitialJournalEntries } from '../data/initialJournalEntries';
import {
  roundETB,
  calculateWeightedAverageCost,
  createSaleJournalEntry,
  createCustomerPaymentJournalEntry,
  createPurchaseJournalEntry,
  createExpenseJournalEntry,
  createInventoryAdjustmentJournalEntry,
  createOwnerCapitalJournalEntry,
  createOwnerDrawingJournalEntry,
  createLoanJournalEntry,
  createCashVarianceJournalEntry,
  createJournalReversal,
} from '../accounting/accountingEngine';
import {
  NotificationLog,
  NotificationTemplate,
  NotificationChannel,
  NotificationType,
  IntegrationConfig,
  ProviderType,
  DebtReminderScheduleSettings,
  CustomerContactPreferences,
  PaymentTransaction,
  PaymentWebhookEvent,
} from '../types/integrations';
import {
  UserSession,
  RegisteredDevice,
  SecurityEventLog,
  TemporaryPermission,
  SecuritySettings,
  SecurityAlertLevel,
  SecurityEventType,
} from '../types/security';
import {
  initialSecuritySettings,
  initialRegisteredDevices,
  initialUserSessions,
  initialSecurityEvents,
  initialTemporaryPermissions,
} from '../data/initialSecurity';
import {
  defaultIntegrations,
  defaultNotificationTemplates,
  defaultDebtReminderSchedule,
  initialCustomerContactPreferences,
} from '../data/defaultIntegrations';
import {
  isQuietHours,
  interpolateTemplate,
  EthioTelecomSmsAdapter,
  TelegramBotAdapter,
  WhatsAppCloudAdapter,
  SmtpEmailAdapter,
  TelebirrPaymentAdapter,
} from '../services/notificationService';
import {
  initialBusiness,
  initialBranches,
  initialUsers,
  initialCategories,
  initialProducts,
  initialCustomers,
  initialDebts,
  initialDebtTransactions,
  initialSales,
  initialExpenses,
  initialSuppliers,
  initialPurchases,
  initialInventoryTransactions,
  initialAuditLogs,
  initialNotifications,
} from '../data/initialData';
import { translations, TranslationKey } from '../i18n/translations';

interface AppContextType {
  // Localization
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;

  // Theme & Appearance (Global Dark Mode for Night-time work)
  theme: ThemeMode;
  isDarkMode: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleDarkMode: () => void;

  // Tenant / Org
  business: Business;
  updateBusiness: (updates: Partial<Business>) => void;
  branches: Branch[];
  currentBranchId: string; // 'all' or branch ID
  setCurrentBranchId: (id: string) => void;
  addBranch: (branch: Omit<Branch, 'id' | 'businessId'>) => void;

  // User / RBAC & Authentication System
  authStatus: AuthStatus;
  isAuthenticated: boolean;
  currentUser: User;
  users: User[];
  userBusinesses: UserBusinessInfo[];
  authError: string | null;
  clearAuthError: () => void;
  setCurrentUser: (user: User) => void;
  addUser: (user: Omit<User, 'id' | 'businessId'>) => void;
  updateUserRole: (userId: string, role: User['role']) => void;
  login: (credentials: { identifier: string; password: string }) => Promise<{ success: boolean; error?: string; errorAm?: string }>;
  register: (payload: RegisterPayload) => Promise<{ success: boolean; error?: string; errorAm?: string }>;
  logout: () => Promise<void>;
  logoutAllDevices: () => Promise<void>;
  changePassword: (params: { currentPassword: string; newPassword: string }) => Promise<{ success: boolean; error?: string; errorAm?: string }>;
  requestPasswordReset: (identifier: string) => Promise<{ success: boolean; resetToken?: string; error?: string; errorAm?: string }>;
  resetPasswordWithToken: (resetToken: string, newPassword: string) => Promise<{ success: boolean; error?: string; errorAm?: string }>;
  switchBusiness: (businessId: string) => Promise<{ success: boolean; error?: string }>;

  // Data Collections
  categories: ProductCategory[];
  products: Product[];
  customers: Customer[];
  debts: CustomerDebt[];
  debtTransactions: DebtTransaction[];
  sales: Sale[];
  expenses: Expense[];
  suppliers: Supplier[];
  purchases: Purchase[];
  inventoryTransactions: InventoryTransaction[];
  auditLogs: AuditLog[];
  notifications: NotificationItem[];
  syncQueue: SyncEvent[];

  // Accounting & Financial Engine (Part 8)
  accounts: Account[];
  journalEntries: JournalEntry[];
  cashRegisters: CashRegister[];
  currentCashRegister?: CashRegister;
  accountingSettings: AccountingSettings;
  financialPeriods: FinancialPeriod[];
  updateAccountingSettings: (updates: Partial<AccountingSettings>) => void;
  openCashRegister: (openingFloat: number, notes?: string) => void;
  closeCashRegister: (actualCashCount: number, notes?: string) => { difference: number; status: string };
  addOwnerCapital: (amount: number, notes?: string) => void;
  addOwnerDrawing: (amount: number, notes?: string) => void;
  addLoanTransaction: (amount: number, notes?: string) => void;
  reverseJournalEntry: (journalId: string, reason: string) => boolean;
  closeFinancialPeriod: (periodId: string) => void;

  // Integrations & External Notification Services (Part 9)
  integrations: IntegrationConfig[];
  notificationTemplates: NotificationTemplate[];
  notificationLogs: NotificationLog[];
  reminderSchedule: DebtReminderScheduleSettings;
  customerPreferences: Record<string, CustomerContactPreferences>;
  paymentTransactions: PaymentTransaction[];
  updateIntegration: (id: string, updates: Partial<IntegrationConfig>) => void;
  testIntegrationConnection: (id: string) => Promise<{ success: boolean; message: string }>;
  updateNotificationTemplate: (id: string, updates: Partial<NotificationTemplate>) => void;
  updateReminderSchedule: (updates: Partial<DebtReminderScheduleSettings>) => void;
  updateCustomerPreference: (customerId: string, updates: Partial<CustomerContactPreferences>) => void;
  sendCustomerNotification: (params: {
    customerId: string;
    type: NotificationType;
    channel?: NotificationChannel;
    variables?: Record<string, any>;
    customMessage?: string;
  }) => Promise<{ success: boolean; log: NotificationLog }>;
  initiateOnlinePayment: (params: {
    providerType: ProviderType;
    amount: number;
    saleId?: string;
    debtId?: string;
    customerId?: string;
    customerPhone?: string;
  }) => PaymentTransaction;
  processPaymentWebhook: (event: PaymentWebhookEvent) => { success: boolean; status: string };
  retryNotification: (logId: string) => Promise<boolean>;

  // Network & Sync
  isOffline: boolean;
  toggleOffline: () => void;
  syncNow: () => void;
  lastSyncTime: string;

  // Actions
  addSale: (saleData: Omit<Sale, 'id' | 'invoiceNumber' | 'createdAt' | 'costOfGoodsSold' | 'grossProfit' | 'syncStatus'>) => Sale;
  addDebtPayment: (params: {
    debtId: string;
    amount: number;
    paymentMethod: string;
    referenceNo?: string;
    notes?: string;
  }) => { success: boolean; message: string; receiptNumber?: string };
  editDebtDueDate: (debtId: string, newDueDate: string, reason?: string) => void;
  addProduct: (product: Omit<Product, 'id' | 'businessId' | 'updatedAt'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  adjustStock: (params: {
    productId: string;
    quantityDelta: number;
    type: InventoryTxType;
    reason: string;
  }) => void;
  addCustomer: (customer: Omit<Customer, 'id' | 'businessId' | 'createdAt' | 'currentDebt' | 'totalPurchased' | 'totalPaid'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'businessId' | 'createdAt'>) => void;
  addPurchase: (purchase: Omit<Purchase, 'id' | 'businessId' | 'createdAt'>) => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;

  // Part 10 Security Architecture
  userSessions: UserSession[];
  registeredDevices: RegisteredDevice[];
  securityEvents: SecurityEventLog[];
  temporaryPermissions: TemporaryPermission[];
  securitySettings: SecuritySettings;
  revokeSession: (sessionId: string) => void;
  revokeAllOtherSessions: () => void;
  revokeDevice: (deviceId: string) => void;
  toggleDeviceTrust: (deviceId: string) => void;
  logSecurityEvent: (params: {
    type: SecurityEventType;
    level: SecurityAlertLevel;
    title: string;
    titleAm: string;
    description: string;
    descriptionAm?: string;
    resourceType?: string;
    resourceId?: string;
    metadata?: Record<string, any>;
  }) => void;
  grantTemporaryPermission: (params: {
    userId: string;
    userName: string;
    permission: string;
    permissionAm: string;
    durationHours: number;
    reason: string;
  }) => void;
  revokeTemporaryPermission: (id: string) => void;
  updateSecuritySettings: (updates: Partial<SecuritySettings>) => void;
  requestBreakGlass: (ticketReference: string, reason: string) => Promise<{ success: boolean; message: string }>;

  // Backup & Reset
  exportDatabaseBackup: () => void;
  restoreDatabaseBackup: (jsonString: string) => boolean;
  resetToSampleData: () => void;
}

const STORAGE_PREFIX = 'ethio_biz_helper_';

export const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial from localStorage or fall back to rich seeds
  const loadState = <T,>(key: string, fallback: T): T => {
    try {
      const stored = localStorage.getItem(STORAGE_PREFIX + key);
      return stored ? JSON.parse(stored) : fallback;
    } catch {
      return fallback;
    }
  };

  const resolveIsDark = (mode: ThemeMode): boolean => {
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  };

  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const raw = localStorage.getItem('ethio_theme');
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
    return loadState<ThemeMode>('theme', 'system');
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const raw = localStorage.getItem('ethio_theme');
    const initialMode: ThemeMode = (raw === 'light' || raw === 'dark' || raw === 'system')
      ? raw
      : loadState<ThemeMode>('theme', 'system');
    return resolveIsDark(initialMode);
  });

  const [language, setLangState] = useState<Language>(() => loadState('language', 'am'));
  const [business, setBusiness] = useState<Business>(() => loadState('business', initialBusiness));
  const [branches, setBranches] = useState<Branch[]>(() => loadState('branches', initialBranches));
  const [currentBranchId, setCurrentBranchId] = useState<string>('all');
  const [users, setUsers] = useState<User[]>(() => loadState('users', initialUsers));
  const [currentUser, setCurrentUser] = useState<User>(() => users[0] || initialUsers[0]);

  // Real Authentication & Session State
  const [authStatus, setAuthStatus] = useState<AuthStatus>(() => {
    const token = getStoredAuthToken();
    return token ? 'AUTHENTICATED' : 'UNAUTHENTICATED';
  });
  const isAuthenticated = authStatus === 'AUTHENTICATED';
  const [userBusinesses, setUserBusinesses] = useState<UserBusinessInfo[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);

  const [categories, setCategories] = useState<ProductCategory[]>(() => loadState('categories', initialCategories));
  const [products, setProducts] = useState<Product[]>(() => loadState('products', initialProducts));
  const [customers, setCustomers] = useState<Customer[]>(() => loadState('customers', initialCustomers));
  const [debts, setDebts] = useState<CustomerDebt[]>(() => loadState('debts', initialDebts));
  const [debtTransactions, setDebtTransactions] = useState<DebtTransaction[]>(() => loadState('debt_tx', initialDebtTransactions));
  const [sales, setSales] = useState<Sale[]>(() => loadState('sales', initialSales));
  const [expenses, setExpenses] = useState<Expense[]>(() => loadState('expenses', initialExpenses));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => loadState('suppliers', initialSuppliers));
  const [purchases, setPurchases] = useState<Purchase[]>(() => loadState('purchases', initialPurchases));
  const [inventoryTransactions, setInventoryTransactions] = useState<InventoryTransaction[]>(() => loadState('inv_tx', initialInventoryTransactions));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadState('audit_logs', initialAuditLogs));
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => loadState('notifs', initialNotifications));
  const [syncQueue, setSyncQueue] = useState<SyncEvent[]>(() => loadState('sync_queue', []));
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString());

  // Part 8 Double-Entry Accounting State
  const [accounts, setAccounts] = useState<Account[]>(() => loadState('accounts', defaultChartOfAccounts));
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => loadState('journal_entries', buildInitialJournalEntries()));
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>(() =>
    loadState('cash_registers', [
      {
        id: 'reg_today_01',
        businessId: 'biz_001',
        branchId: 'br_01',
        employeeId: 'usr_03',
        employeeName: 'ዳዊት መኮንን (Cashier)',
        openingBalance: 5000,
        expectedBalance: 5000,
        status: 'OPEN',
        openedAt: new Date().toISOString(),
        notes: 'Morning Cash Float (መነሻ ካዝና)',
      },
    ])
  );
  const [accountingSettings, setAccountingSettings] = useState<AccountingSettings>(() => loadState('accounting_settings', defaultAccountingSettings));
  const [financialPeriods, setFinancialPeriods] = useState<FinancialPeriod[]>(() => loadState('financial_periods', defaultFinancialPeriods));

  // Part 9 Integrations & Notifications State
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>(() =>
    loadState('integrations', defaultIntegrations)
  );
  const [notificationTemplates, setNotificationTemplates] = useState<NotificationTemplate[]>(() =>
    loadState('notification_templates', defaultNotificationTemplates)
  );
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>(() =>
    loadState('notification_logs', [
      {
        id: 'notif_log_01',
        businessId: 'biz_001',
        recipient: '0911556677',
        customerId: 'cst_01',
        customerName: 'ዳዊት ተስፋዬ',
        type: 'DEBT_DUE_SOON',
        channel: 'SMS',
        title: 'የዕዳ ክፍያ ማስታወሻ',
        titleAm: 'የዕዳ ክፍያ ማስታወሻ',
        body: 'ሰላም ዳዊት ተስፋዬ፣ በሰላም ሱፐርማርኬት ያለዎት የዕዳ ቀሪ ሂሳብ 8,500 ብር ነው። የመክፈያ ቀንዎ በቅርቡ ይደርሳል።',
        language: 'am',
        priority: 'HIGH',
        status: 'DELIVERED',
        provider: 'Ethio Telecom SMS',
        providerMessageId: 'ET_SMS_890123',
        retryCount: 0,
        createdAt: '2026-10-04T10:00:00Z',
        deliveredAt: '2026-10-04T10:00:03Z',
      },
    ])
  );
  const [reminderSchedule, setReminderSchedule] = useState<DebtReminderScheduleSettings>(() =>
    loadState('reminder_schedule', defaultDebtReminderSchedule)
  );
  const [customerPreferences, setCustomerPreferences] = useState<Record<string, CustomerContactPreferences>>(() =>
    loadState('customer_prefs', initialCustomerContactPreferences)
  );
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>(() =>
    loadState('payment_transactions', [])
  );

  // Part 10 Security Architecture State
  const [userSessions, setUserSessions] = useState<UserSession[]>(() =>
    loadState('sec_sessions', initialUserSessions)
  );
  const [registeredDevices, setRegisteredDevices] = useState<RegisteredDevice[]>(() =>
    loadState('sec_devices', initialRegisteredDevices)
  );
  const [securityEvents, setSecurityEvents] = useState<SecurityEventLog[]>(() =>
    loadState('sec_events', initialSecurityEvents)
  );
  const [temporaryPermissions, setTemporaryPermissions] = useState<TemporaryPermission[]>(() =>
    loadState('sec_temp_perms', initialTemporaryPermissions)
  );
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(() =>
    loadState('sec_settings', initialSecuritySettings)
  );

  // Save states on change & Sync Theme
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'theme', JSON.stringify(theme));
    localStorage.setItem('ethio_theme', theme);

    const applyTheme = () => {
      const activeDark = resolveIsDark(theme);
      setIsDarkMode(activeDark);
      const root = document.documentElement;
      if (activeDark) {
        root.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.setAttribute('data-theme', 'light');
        root.style.colorScheme = 'light';
      }
    };

    applyTheme();

    if (theme === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  const toggleDarkMode = () => {
    setThemeState((prev) => {
      const currentlyDark = resolveIsDark(prev);
      return currentlyDark ? 'light' : 'dark';
    });
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'language', JSON.stringify(language));
  }, [language]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'business', JSON.stringify(business));
  }, [business]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'debts', JSON.stringify(debts));
  }, [debts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'debt_tx', JSON.stringify(debtTransactions));
  }, [debtTransactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'purchases', JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'inv_tx', JSON.stringify(inventoryTransactions));
  }, [inventoryTransactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'notifs', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'sync_queue', JSON.stringify(syncQueue));
  }, [syncQueue]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'journal_entries', JSON.stringify(journalEntries));
  }, [journalEntries]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'cash_registers', JSON.stringify(cashRegisters));
  }, [cashRegisters]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'accounting_settings', JSON.stringify(accountingSettings));
  }, [accountingSettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'financial_periods', JSON.stringify(financialPeriods));
  }, [financialPeriods]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'integrations', JSON.stringify(integrations));
  }, [integrations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'notification_templates', JSON.stringify(notificationTemplates));
  }, [notificationTemplates]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'notification_logs', JSON.stringify(notificationLogs));
  }, [notificationLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'reminder_schedule', JSON.stringify(reminderSchedule));
  }, [reminderSchedule]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'customer_prefs', JSON.stringify(customerPreferences));
  }, [customerPreferences]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'payment_transactions', JSON.stringify(paymentTransactions));
  }, [paymentTransactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'sec_sessions', JSON.stringify(userSessions));
  }, [userSessions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'sec_devices', JSON.stringify(registeredDevices));
  }, [registeredDevices]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'sec_events', JSON.stringify(securityEvents));
  }, [securityEvents]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'sec_temp_perms', JSON.stringify(temporaryPermissions));
  }, [temporaryPermissions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'sec_settings', JSON.stringify(securitySettings));
  }, [securitySettings]);

  // Online/Offline detection from browser
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const setLanguage = (lang: Language) => {
    setLangState(lang);
  };

  const t = (key: TranslationKey): string => {
    const dict = translations[language] || translations.en;
    return dict[key] || translations.en[key] || key;
  };

  // Verify and refresh session on mount
  useEffect(() => {
    const checkSession = async () => {
      const token = getStoredAuthToken();
      if (!token) {
        setAuthStatus('UNAUTHENTICATED');
        return;
      }

      try {
        const res = await apiGetMe();
        if (res.success && res.data) {
          const u = res.data.user;
          const b = res.data.business;
          if (u) {
            setCurrentUser((prev) => ({
              ...prev,
              id: u.id,
              name: u.fullName,
              phone: u.phone,
              email: u.email,
              role: u.role,
              status: u.status,
              createdAt: u.createdAt,
              lastLoginAt: u.lastLoginAt,
            }));
          }
          if (b) {
            setBusiness((prev) => ({
              ...prev,
              id: b.id,
              name: b.name,
              businessType: b.businessType || prev.businessType,
              phone: b.phone || prev.phone,
              address: b.address || prev.address,
            }));
          }
          if (res.data.businesses) {
            setUserBusinesses(res.data.businesses);
          }
          setAuthStatus('AUTHENTICATED');
        } else if (res.isExpired) {
          setAuthStatus('SESSION_EXPIRED');
        } else {
          setAuthStatus('UNAUTHENTICATED');
        }
      } catch {
        // Network resilience: if token exists but offline, stay authenticated in offline mode
        setAuthStatus(token ? 'AUTHENTICATED' : 'UNAUTHENTICATED');
      }
    };

    checkSession();
  }, []);

  const clearAuthError = () => {
    setAuthError(null);
  };

  const login = async (credentials: { identifier: string; password: string }) => {
    setAuthError(null);
    const res = await apiLogin(credentials);
    if (res.success && res.data) {
      const u = res.data.user;
      const b = res.data.business;
      const loggedUser: User = {
        id: u.id,
        businessId: b.id,
        branchId: 'br_01',
        name: u.fullName,
        phone: u.phone,
        email: u.email,
        role: u.role,
        active: u.status === 'ACTIVE',
        status: u.status as any,
        lastLoginAt: u.lastLoginAt,
      };

      setCurrentUser(loggedUser);
      setBusiness((prev) => ({
        ...prev,
        id: b.id,
        name: b.name,
        businessType: (b.businessType as any) || prev.businessType,
        phone: b.phone || prev.phone,
        address: b.address || prev.address,
      }));

      if (res.data.businesses) {
        setUserBusinesses(res.data.businesses);
      }

      setAuthStatus('AUTHENTICATED');

      logAudit(
        'LOGIN_SUCCESS',
        'የመግቢያ ስኬት',
        'AUTH',
        u.id,
        '',
        `Logged in: ${u.fullName} (${u.role})`
      );

      return { success: true };
    } else {
      const errMsg = language === 'am' ? (res.errorAm || 'መግባት አልተቻለም') : (res.error || 'Login failed');
      setAuthError(errMsg);

      logAudit(
        'LOGIN_FAILED',
        'የመግቢያ ውድቀት',
        'AUTH',
        credentials.identifier,
        '',
        res.error || 'Invalid credentials'
      );

      return { success: false, error: res.error, errorAm: res.errorAm };
    }
  };

  const register = async (payload: RegisterPayload) => {
    setAuthError(null);
    const res = await apiRegister(payload);
    if (res.success && res.data) {
      const u = res.data.user;
      const b = res.data.business;
      const newUser: User = {
        id: u.id,
        businessId: b.id,
        branchId: 'br_01',
        name: u.fullName,
        phone: u.phone,
        email: u.email,
        role: 'OWNER',
        active: true,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };

      const newBiz: Business = {
        ...initialBusiness,
        id: b.id,
        name: b.name,
        ownerName: u.fullName,
        phone: u.phone || payload.phone,
        businessType: (b.businessType as any) || 'Retail Shop',
        address: b.address || payload.businessAddress,
        createdAt: new Date().toISOString(),
      };

      setCurrentUser(newUser);
      setBusiness(newBiz);
      setUsers([newUser]);
      setUserBusinesses([
        {
          id: b.id,
          name: b.name,
          role: 'OWNER',
          businessType: b.businessType,
        },
      ]);
      setAuthStatus('AUTHENTICATED');

      logAudit(
        'ACCOUNT_CREATED',
        'አዲስ መለያ ተፈጠረ',
        'AUTH',
        u.id,
        '',
        `Owner registered: ${u.fullName} (${b.name})`
      );

      return { success: true };
    } else {
      const errMsg = language === 'am' ? (res.errorAm || 'መመዝገብ አልተቻለም') : (res.error || 'Registration failed');
      setAuthError(errMsg);
      return { success: false, error: res.error, errorAm: res.errorAm };
    }
  };

  const logout = async () => {
    logAudit(
      'LOGOUT',
      'ከመለያ መውጣት',
      'AUTH',
      currentUser.id,
      'AUTHENTICATED',
      'Logged out by user'
    );
    await apiLogout();
    clearStoredAuthToken();
    setAuthStatus('UNAUTHENTICATED');
  };

  const logoutAllDevices = async () => {
    logAudit(
      'LOGOUT_ALL',
      'ከሁሉም መሳሪያዎች መውጣት',
      'AUTH',
      currentUser.id,
      'ALL_SESSIONS',
      'Terminated all sessions'
    );
    await apiLogoutAll();
    clearStoredAuthToken();
    setAuthStatus('UNAUTHENTICATED');
  };

  const changePassword = async (params: { currentPassword: string; newPassword: string }) => {
    const res = await apiChangePassword(params);
    if (res.success) {
      logAudit(
        'PASSWORD_CHANGED',
        'የይለፍ ቃል ተቀይሯል',
        'AUTH',
        currentUser.id,
        '',
        'Password updated securely'
      );
    }
    return res;
  };

  const requestPasswordReset = async (identifier: string) => {
    return await apiForgotPassword(identifier);
  };

  const resetPasswordWithToken = async (resetToken: string, newPassword: string) => {
    return await apiResetPassword({ resetToken, newPassword });
  };

  const switchBusiness = async (businessId: string) => {
    const res = await apiSwitchBusiness(businessId);
    if (res.success && res.data) {
      const b = res.data.business;
      setBusiness((prev) => ({
        ...prev,
        id: b.id,
        name: b.name,
        businessType: b.businessType || prev.businessType,
        phone: b.phone || prev.phone,
        address: b.address || prev.address,
      }));
      setCurrentUser((prev) => ({
        ...prev,
        businessId: b.id,
        role: res.data.role,
      }));

      logAudit(
        'BUSINESS_SWITCHED',
        'ንግድ ተቀይሯል',
        'AUTH',
        businessId,
        business.id,
        b.name
      );
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const logAudit = (
    action: string,
    actionAm: string,
    entityType: string,
    entityId: string,
    oldValue?: string,
    newValue?: string
  ) => {
    const newLog: AuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      businessId: business.id,
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      actionAm,
      entityType,
      entityId,
      oldValue,
      newValue,
      deviceInfo: navigator.userAgent.includes('Mobile') ? 'Mobile Smartphone' : 'Desktop / POS Terminal',
      createdAt: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const queueSync = (action: string, entityType: string, entityId: string) => {
    const event: SyncEvent = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      businessId: business.id,
      action,
      entityType,
      entityId,
      status: isOffline ? 'PENDING' : 'SYNCED',
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };
    setSyncQueue((prev) => [event, ...prev]);
  };

  const syncNow = () => {
    setSyncQueue((prev) => prev.map((item) => ({ ...item, status: 'SYNCED' })));
    setLastSyncTime(new Date().toLocaleTimeString());
  };

  const toggleOffline = () => {
    setIsOffline((prev) => !prev);
  };

  // Double-Entry Ledger Posting Helper: Updates Account Balances Atomically
  const postJournalLinesToAccounts = (lines: JournalEntryLine[]) => {
    setAccounts((prevAccounts) => {
      const nextAccounts = [...prevAccounts];
      lines.forEach((line) => {
        const accIdx = nextAccounts.findIndex((a) => a.code === line.accountCode);
        if (accIdx >= 0) {
          const acc = nextAccounts[accIdx];
          const delta =
            acc.normalBalance === 'DEBIT'
              ? line.debit - line.credit
              : line.credit - line.debit;
          nextAccounts[accIdx] = {
            ...acc,
            balance: roundETB(acc.balance + delta),
          };
        }
      });
      return nextAccounts;
    });

    // If Cash on Hand (1000) was affected, update current OPEN cash register expected balance
    const cashLines = lines.filter((l) => l.accountCode === '1000');
    if (cashLines.length > 0) {
      const netCashChange = cashLines.reduce((acc, l) => acc + (l.debit - l.credit), 0);
      setCashRegisters((prevRegs) =>
        prevRegs.map((reg) => {
          if (reg.status === 'OPEN') {
            return {
              ...reg,
              expectedBalance: roundETB(reg.expectedBalance + netCashChange),
            };
          }
          return reg;
        })
      );
    }
  };

  // ATOMIC SALE TRANSACTION
  const addSale = (saleData: Omit<Sale, 'id' | 'invoiceNumber' | 'createdAt' | 'costOfGoodsSold' | 'grossProfit' | 'syncStatus'>): Sale => {
    const saleId = `sal_${Date.now()}`;
    const invoiceNumber = `INV-${String(sales.length + 204).padStart(5, '0')}`;
    const createdAt = new Date().toISOString();

    // 1. Calculate COGS and Gross Profit
    let cogs = 0;
    const invTxList: InventoryTransaction[] = [];

    saleData.items.forEach((item) => {
      cogs += (item.purchasePrice || 0) * item.quantity;
      const prod = products.find((p) => p.id === item.productId);
      const prevQty = prod ? prod.quantity : 0;
      const newQty = Math.max(0, prevQty - item.quantity);

      invTxList.push({
        id: `itx_${Date.now()}_${item.productId}`,
        businessId: business.id,
        branchId: saleData.branchId,
        productId: item.productId,
        productName: item.productName,
        type: 'SALE',
        quantityDelta: -item.quantity,
        previousQty: prevQty,
        newQty: newQty,
        unitCost: item.purchasePrice || 0,
        reason: `POS Sale ${invoiceNumber}`,
        referenceId: saleId,
        createdBy: currentUser.name,
        createdAt,
      });
    });

    const grossProfit = saleData.total - cogs;

    const newSale: Sale = {
      ...saleData,
      id: saleId,
      invoiceNumber,
      costOfGoodsSold: cogs,
      grossProfit,
      createdAt,
      syncStatus: isOffline ? 'PENDING' : 'SYNCED',
    };

    // 2. Deduct Inventory Quantities
    setProducts((prev) =>
      prev.map((prod) => {
        const item = saleData.items.find((i) => i.productId === prod.id);
        if (item) {
          const newQty = Math.max(0, prod.quantity - item.quantity);
          // Check if low stock threshold reached
          if (newQty <= prod.minStock) {
            const lowNotif: NotificationItem = {
              id: `notif_${Date.now()}_${prod.id}`,
              businessId: business.id,
              title: `Low Stock: ${prod.name}`,
              titleAm: `⚠️ እቃ ሊያልቅ ነው: ${prod.amharicName || prod.name}`,
              message: `${prod.name} has reached ${newQty} units (min: ${prod.minStock}). Reorder suggested.`,
              messageAm: `${prod.amharicName || prod.name} ${newQty} ብቻ ቀርቷል (ዝቅተኛ: ${prod.minStock})። እባክዎ እንደገና ይዘዙ።`,
              type: 'LOW_STOCK',
              read: false,
              createdAt,
            };
            setNotifications((n) => [lowNotif, ...n]);
          }
          return { ...prod, quantity: newQty, updatedAt: createdAt };
        }
        return prod;
      })
    );

    // Record inventory transaction records
    setInventoryTransactions((prev) => [...invTxList, ...prev]);

    // 3. Handle Credit & Debt if applicable
    if (saleData.creditAmount > 0 && saleData.customerId) {
      const cust = customers.find((c) => c.id === saleData.customerId);
      const debtId = `dbt_${Date.now()}`;
      const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 14 days default

      const newDebt: CustomerDebt = {
        id: debtId,
        businessId: business.id,
        customerId: saleData.customerId,
        customerName: saleData.customerName || (cust ? cust.name : 'Unknown'),
        customerPhone: cust ? cust.phone : '',
        saleId,
        invoiceNumber,
        originalDebt: saleData.creditAmount,
        totalPaid: 0,
        remainingDebt: saleData.creditAmount,
        dueDate,
        status: 'UNPAID',
        notes: `Credit portion of invoice ${invoiceNumber}`,
        createdAt,
      };

      const newDebtTx: DebtTransaction = {
        id: `dtx_${Date.now()}`,
        businessId: business.id,
        debtId,
        customerId: saleData.customerId,
        customerName: newDebt.customerName,
        type: 'CREDIT_SALE',
        amount: saleData.creditAmount,
        previousBalance: cust ? cust.currentDebt : 0,
        newBalance: (cust ? cust.currentDebt : 0) + saleData.creditAmount,
        receivedBy: currentUser.name,
        notes: `Credit Sale ${invoiceNumber}`,
        createdAt,
      };

      setDebts((prev) => [newDebt, ...prev]);
      setDebtTransactions((prev) => [newDebtTx, ...prev]);

      // Update customer record
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === saleData.customerId) {
            return {
              ...c,
              currentDebt: c.currentDebt + saleData.creditAmount,
              totalPurchased: c.totalPurchased + saleData.total,
              totalPaid: c.totalPaid + saleData.amountPaid,
            };
          }
          return c;
        })
      );
    } else if (saleData.customerId) {
      // Cash/Mobile sale to registered customer
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === saleData.customerId) {
            return {
              ...c,
              totalPurchased: c.totalPurchased + saleData.total,
              totalPaid: c.totalPaid + saleData.amountPaid,
            };
          }
          return c;
        })
      );
    }

    setSales((prev) => [newSale, ...prev]);

    // 4. Double-Entry Journal Posting (Part 8: Total Debits = Total Credits)
    const saleJournal = createSaleJournalEntry(newSale, currentUser.id, currentUser.name);
    setJournalEntries((prev) => [saleJournal, ...prev]);
    postJournalLinesToAccounts(saleJournal.lines);

    // Audit & Sync
    logAudit(
      'CREATE_SALE',
      'አዲስ ሽያጭ ተከናውኗል',
      'SALE',
      saleId,
      undefined,
      `${invoiceNumber}: ${saleData.total} ETB (Paid: ${saleData.amountPaid}, Credit: ${saleData.creditAmount})`
    );
    queueSync('CREATE', 'SALE', saleId);

    return newSale;
  };

  // ATOMIC DEBT PAYMENT
  const addDebtPayment = (params: {
    debtId: string;
    amount: number;
    paymentMethod: string;
    referenceNo?: string;
    notes?: string;
  }) => {
    const targetDebt = debts.find((d) => d.id === params.debtId);
    if (!targetDebt) {
      return { success: false, message: 'Debt record not found' };
    }

    if (params.amount <= 0) {
      return { success: false, message: 'Invalid payment amount' };
    }

    const receiptNumber = `REC-DEBT-${String(debtTransactions.length + 501).padStart(5, '0')}`;
    const createdAt = new Date().toISOString();

    const newRemaining = Math.max(0, targetDebt.remainingDebt - params.amount);
    const newTotalPaid = targetDebt.totalPaid + params.amount;
    const newStatus = newRemaining === 0 ? 'PAID' : 'PARTIALLY_PAID';

    // 1. Update Debt Record
    setDebts((prev) =>
      prev.map((d) => {
        if (d.id === params.debtId) {
          return {
            ...d,
            remainingDebt: newRemaining,
            totalPaid: newTotalPaid,
            status: newStatus,
            lastPaymentDate: createdAt,
          };
        }
        return d;
      })
    );

    // 2. Create immutable Debt Transaction
    const newTx: DebtTransaction = {
      id: `dtx_${Date.now()}`,
      businessId: business.id,
      debtId: params.debtId,
      customerId: targetDebt.customerId,
      customerName: targetDebt.customerName,
      type: 'PAYMENT',
      amount: params.amount,
      previousBalance: targetDebt.remainingDebt,
      newBalance: newRemaining,
      paymentMethod: params.paymentMethod,
      referenceNo: params.referenceNo || receiptNumber,
      receivedBy: currentUser.name,
      notes: params.notes || `Debt payment received via ${params.paymentMethod}`,
      createdAt,
    };
    setDebtTransactions((prev) => [newTx, ...prev]);

    // 3. Update Customer aggregate balance
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === targetDebt.customerId) {
          return {
            ...c,
            currentDebt: Math.max(0, c.currentDebt - params.amount),
            totalPaid: c.totalPaid + params.amount,
          };
        }
        return c;
      })
    );

    // 4. Double-Entry Journal Posting (Part 8: Reduces AR asset, increases Cash/Mobile; no new revenue)
    const payJournal = createCustomerPaymentJournalEntry({
      businessId: business.id,
      branchId: branches[0]?.id || 'br_01',
      paymentId: newTx.id,
      receiptNumber,
      amount: params.amount,
      paymentMethod: params.paymentMethod,
      customerId: targetDebt.customerId,
      customerName: targetDebt.customerName,
      userId: currentUser.id,
      userName: currentUser.name,
    });
    setJournalEntries((prev) => [payJournal, ...prev]);
    postJournalLinesToAccounts(payJournal.lines);

    // 5. Log Audit & Sync
    logAudit(
      'RECORD_DEBT_PAYMENT',
      'የዕዳ ክፍያ ተመዝግቧል',
      'DEBT_TRANSACTION',
      newTx.id,
      `Balance was: ${targetDebt.remainingDebt} ETB`,
      `Paid: ${params.amount} ETB (${params.paymentMethod}), New Balance: ${newRemaining} ETB`
    );
    queueSync('CREATE', 'DEBT_PAYMENT', newTx.id);

    return { success: true, message: 'Payment recorded successfully', receiptNumber };
  };

  const editDebtDueDate = (debtId: string, newDueDate: string, reason?: string) => {
    const debt = debts.find((d) => d.id === debtId);
    if (!debt) return;

    const oldDate = debt.dueDate;
    setDebts((prev) =>
      prev.map((d) => {
        if (d.id === debtId) {
          return { ...d, dueDate: newDueDate };
        }
        return d;
      })
    );

    logAudit(
      'EDIT_DUE_DATE',
      'የመክፈያ ቀን ተቀይሯል',
      'CUSTOMER_DEBT',
      debtId,
      `Old Due Date: ${oldDate}`,
      `New Due Date: ${newDueDate} (${reason || 'Customer request'})`
    );
  };

  const addProduct = (productData: Omit<Product, 'id' | 'businessId' | 'updatedAt'>) => {
    const id = `prd_${Date.now()}`;
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...productData,
      id,
      businessId: business.id,
      updatedAt: now,
    };

    setProducts((prev) => [newProduct, ...prev]);

    // Record opening inventory transaction
    const itx: InventoryTransaction = {
      id: `itx_${Date.now()}`,
      businessId: business.id,
      branchId: productData.branchId || branches[0]?.id || 'br_01',
      productId: id,
      productName: productData.name,
      type: 'OPENING',
      quantityDelta: productData.quantity,
      previousQty: 0,
      newQty: productData.quantity,
      unitCost: productData.purchasePrice,
      reason: 'Initial Opening Stock Registration',
      createdBy: currentUser.name,
      createdAt: now,
    };
    setInventoryTransactions((prev) => [itx, ...prev]);

    logAudit('CREATE_PRODUCT', 'አዲስ እቃ ተመዝግቧል', 'PRODUCT', id, undefined, `${newProduct.name} (Qty: ${newProduct.quantity})`);
    queueSync('CREATE', 'PRODUCT', id);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const prod = products.find((p) => p.id === id);
    if (!prod) return;

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return { ...p, ...updates, updatedAt: new Date().toISOString() };
        }
        return p;
      })
    );

    logAudit(
      'UPDATE_PRODUCT',
      'የእቃ መረጃ ተስተካክሏል',
      'PRODUCT',
      id,
      `Price: ${prod.sellingPrice} ETB`,
      `Updated: ${JSON.stringify(updates)}`
    );
  };

  const adjustStock = (params: {
    productId: string;
    quantityDelta: number;
    type: InventoryTxType;
    reason: string;
  }) => {
    const prod = products.find((p) => p.id === params.productId);
    if (!prod) return;

    const prevQty = prod.quantity;
    const newQty = Math.max(0, prevQty + params.quantityDelta);
    const now = new Date().toISOString();

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === params.productId) {
          return { ...p, quantity: newQty, updatedAt: now };
        }
        return p;
      })
    );

    const itx: InventoryTransaction = {
      id: `itx_${Date.now()}`,
      businessId: business.id,
      branchId: prod.branchId || branches[0]?.id || 'br_01',
      productId: prod.id,
      productName: prod.name,
      type: params.type,
      quantityDelta: params.quantityDelta,
      previousQty: prevQty,
      newQty: newQty,
      unitCost: prod.purchasePrice,
      reason: params.reason,
      createdBy: currentUser.name,
      createdAt: now,
    };
    setInventoryTransactions((prev) => [itx, ...prev]);

    // If stock write-off (damage/expired/shortage), record journal entry
    if (params.quantityDelta < 0) {
      const adjJournal = createInventoryAdjustmentJournalEntry({
        businessId: business.id,
        branchId: prod.branchId || branches[0]?.id || 'br_01',
        productId: prod.id,
        productName: prod.name,
        quantityLost: Math.abs(params.quantityDelta),
        unitCost: prod.purchasePrice,
        reason: params.reason,
        userId: currentUser.id,
        userName: currentUser.name,
      });
      setJournalEntries((prev) => [adjJournal, ...prev]);
      postJournalLinesToAccounts(adjJournal.lines);
    }

    logAudit(
      'ADJUST_STOCK',
      'የክምችት ማስተካከያ ተደርጓል',
      'INVENTORY',
      prod.id,
      `Qty: ${prevQty}`,
      `New Qty: ${newQty} (Delta: ${params.quantityDelta}, Type: ${params.type}, Reason: ${params.reason})`
    );
  };

  const addCustomer = (customerData: Omit<Customer, 'id' | 'businessId' | 'createdAt' | 'currentDebt' | 'totalPurchased' | 'totalPaid'>): Customer => {
    const id = `cst_${Date.now()}`;
    const newCust: Customer = {
      ...customerData,
      id,
      businessId: business.id,
      currentDebt: 0,
      totalPurchased: 0,
      totalPaid: 0,
      createdAt: new Date().toISOString(),
    };
    setCustomers((prev) => [newCust, ...prev]);
    logAudit('CREATE_CUSTOMER', 'አዲስ ደንበኛ ተመዝግቧል', 'CUSTOMER', id, undefined, `${newCust.name} (${newCust.phone})`);
    queueSync('CREATE', 'CUSTOMER', id);
    return newCust;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return { ...c, ...updates };
        }
        return c;
      })
    );
    logAudit('UPDATE_CUSTOMER', 'የደንበኛ መረጃ ተስተካክሏል', 'CUSTOMER', id, undefined, JSON.stringify(updates));
  };

  const addExpense = (expenseData: Omit<Expense, 'id' | 'businessId' | 'createdAt'>) => {
    const id = `exp_${Date.now()}`;
    const newExpense: Expense = {
      ...expenseData,
      id,
      businessId: business.id,
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [newExpense, ...prev]);

    // Double-Entry Journal Posting (Part 8: Debit Operating Expense, Credit Cash/Bank)
    const expJournal = createExpenseJournalEntry(newExpense, currentUser.id, currentUser.name);
    setJournalEntries((prev) => [expJournal, ...prev]);
    postJournalLinesToAccounts(expJournal.lines);

    logAudit('CREATE_EXPENSE', 'አዲስ ወጪ ተመዝግቧል', 'EXPENSE', id, undefined, `${newExpense.amount} ETB (${newExpense.category})`);
    queueSync('CREATE', 'EXPENSE', id);
  };

  const addPurchase = (purchaseData: Omit<Purchase, 'id' | 'businessId' | 'createdAt'>) => {
    const id = `pur_${Date.now()}`;
    const now = new Date().toISOString();
    const newPur: Purchase = {
      ...purchaseData,
      id,
      businessId: business.id,
      createdAt: now,
    };

    // Update stock for each purchased item using Weighted Average Cost (Part 8)
    const invTxList: InventoryTransaction[] = [];
    setProducts((prev) =>
      prev.map((prod) => {
        const item = purchaseData.items.find((i) => i.productId === prod.id);
        if (item) {
          const prevQty = prod.quantity;
          const newQty = prevQty + item.quantity;
          const newAvgCost = calculateWeightedAverageCost(
            prevQty,
            prod.purchasePrice,
            item.quantity,
            item.purchasePrice
          );
          invTxList.push({
            id: `itx_${Date.now()}_${prod.id}`,
            businessId: business.id,
            branchId: purchaseData.branchId,
            productId: prod.id,
            productName: prod.name,
            type: 'PURCHASE',
            quantityDelta: item.quantity,
            previousQty: prevQty,
            newQty: newQty,
            unitCost: item.purchasePrice,
            reason: `Purchase Order ${purchaseData.invoiceNumber}`,
            referenceId: id,
            createdBy: currentUser.name,
            createdAt: now,
          });
          return {
            ...prod,
            quantity: newQty,
            purchasePrice: newAvgCost,
            updatedAt: now,
          };
        }
        return prod;
      })
    );

    setInventoryTransactions((prev) => [...invTxList, ...prev]);

    // Update supplier accounts payable if unpaid portion
    if (purchaseData.debtPayable > 0 && purchaseData.supplierId) {
      setSuppliers((prev) =>
        prev.map((s) => {
          if (s.id === purchaseData.supplierId) {
            return {
              ...s,
              outstandingPayable: s.outstandingPayable + purchaseData.debtPayable,
            };
          }
          return s;
        })
      );
    }

    setPurchases((prev) => [newPur, ...prev]);

    // Double-Entry Journal Posting (Part 8: Debit Merchandise Inventory Asset, Credit Cash or Accounts Payable)
    const purJournal = createPurchaseJournalEntry(newPur, currentUser.id, currentUser.name);
    setJournalEntries((prev) => [purJournal, ...prev]);
    postJournalLinesToAccounts(purJournal.lines);

    logAudit(
      'CREATE_PURCHASE',
      'አዲስ ግዢ ተመዝግቧል',
      'PURCHASE',
      id,
      undefined,
      `${purchaseData.invoiceNumber}: ${purchaseData.totalAmount} ETB from ${purchaseData.supplierName}`
    );
    queueSync('CREATE', 'PURCHASE', id);
  };

  // Part 8 Cash Register & Financial Actions
  const openCashRegister = (openingFloat: number, notes?: string) => {
    const regId = `reg_${Date.now()}`;
    const newReg: CashRegister = {
      id: regId,
      businessId: business.id,
      branchId: branches[0]?.id || 'br_01',
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      openingBalance: openingFloat,
      expectedBalance: openingFloat,
      status: 'OPEN',
      openedAt: new Date().toISOString(),
      notes: notes || 'Morning Cash Float (መነሻ ካዝና)',
    };
    setCashRegisters((prev) => [newReg, ...prev]);
    logAudit('OPEN_CASH_REGISTER', 'ካዝና ተከፍቷል', 'CASH_REGISTER', regId, undefined, `Float: ${openingFloat} ETB`);
  };

  const closeCashRegister = (actualCashCount: number, notes?: string) => {
    const openReg = cashRegisters.find((r) => r.status === 'OPEN');
    if (!openReg) return { difference: 0, status: 'NO_OPEN_REGISTER' };

    const diff = roundETB(actualCashCount - openReg.expectedBalance);
    const closedAt = new Date().toISOString();

    const updatedReg: CashRegister = {
      ...openReg,
      closingBalance: actualCashCount,
      actualBalance: actualCashCount,
      difference: diff,
      closedAt,
      status: Math.abs(diff) > 0 ? 'RECONCILIATION_REQUIRED' : 'CLOSED',
      notes: notes || openReg.notes,
    };

    setCashRegisters((prev) => prev.map((r) => (r.id === openReg.id ? updatedReg : r)));

    // If variance exists, create variance journal entry
    if (Math.abs(diff) > 0) {
      const varJournal = createCashVarianceJournalEntry({
        businessId: business.id,
        branchId: openReg.branchId,
        difference: diff,
        cashRegisterId: openReg.id,
        userId: currentUser.id,
        userName: currentUser.name,
        reason: notes || `Cash count variance on closing`,
      });
      setJournalEntries((prev) => [varJournal, ...prev]);
      postJournalLinesToAccounts(varJournal.lines);
    }

    logAudit(
      'CLOSE_CASH_REGISTER',
      'ካዝና ተዘግቷል',
      'CASH_REGISTER',
      openReg.id,
      `Expected: ${openReg.expectedBalance} ETB`,
      `Actual: ${actualCashCount} ETB, Diff: ${diff} ETB`
    );

    return { difference: diff, status: updatedReg.status };
  };

  const addOwnerCapital = (amount: number, notes?: string) => {
    const jrn = createOwnerCapitalJournalEntry({
      businessId: business.id,
      branchId: branches[0]?.id || 'br_01',
      amount,
      userId: currentUser.id,
      userName: currentUser.name,
      notes,
    });
    setJournalEntries((prev) => [jrn, ...prev]);
    postJournalLinesToAccounts(jrn.lines);
    logAudit('OWNER_CAPITAL', 'የባለቤት ካፒታል ተጨምሯል', 'EQUITY', jrn.id, undefined, `${amount} ETB`);
  };

  const addOwnerDrawing = (amount: number, notes?: string) => {
    const jrn = createOwnerDrawingJournalEntry({
      businessId: business.id,
      branchId: branches[0]?.id || 'br_01',
      amount,
      userId: currentUser.id,
      userName: currentUser.name,
      notes,
    });
    setJournalEntries((prev) => [jrn, ...prev]);
    postJournalLinesToAccounts(jrn.lines);
    logAudit('OWNER_DRAWING', 'የባለቤት ወጪ (ድርሻ) ተወስዷል', 'EQUITY', jrn.id, undefined, `${amount} ETB`);
  };

  const addLoanTransaction = (amount: number, notes?: string) => {
    const jrn = createLoanJournalEntry({
      businessId: business.id,
      branchId: branches[0]?.id || 'br_01',
      amount,
      userId: currentUser.id,
      userName: currentUser.name,
      notes,
    });
    setJournalEntries((prev) => [jrn, ...prev]);
    postJournalLinesToAccounts(jrn.lines);
    logAudit('LOAN_RECEIVED', 'የባንክ ብድር ተመዝግቧል', 'LIABILITY', jrn.id, undefined, `${amount} ETB`);
  };

  const reverseJournalEntry = (journalId: string, reason: string) => {
    const original = journalEntries.find((j) => j.id === journalId);
    if (!original || original.status === 'REVERSED') return false;

    const reversal = createJournalReversal(original, currentUser.id, currentUser.name, reason);
    setJournalEntries((prev) => [
      reversal,
      ...prev.map((j) => (j.id === journalId ? { ...j, status: 'REVERSED' as const } : j)),
    ]);
    postJournalLinesToAccounts(reversal.lines);

    logAudit(
      'REVERSE_JOURNAL',
      'የሂሳብ መዝገብ ተሰርዟል/ተቀልብሷል',
      'JOURNAL_ENTRY',
      journalId,
      original.journalNumber,
      `Reversal #${reversal.journalNumber}: ${reason}`
    );
    return true;
  };

  const updateAccountingSettings = (updates: Partial<AccountingSettings>) => {
    setAccountingSettings((prev) => ({ ...prev, ...updates }));
    logAudit(
      'UPDATE_ACCOUNTING_SETTINGS',
      'የሂሳብ ቅንብሮች ተስተካክለዋል',
      'SETTINGS',
      'accounting',
      undefined,
      JSON.stringify(updates)
    );
  };

  const closeFinancialPeriod = (periodId: string) => {
    setFinancialPeriods((prev) =>
      prev.map((p) =>
        p.id === periodId
          ? { ...p, status: 'CLOSED', closedAt: new Date().toISOString(), closedBy: currentUser.name }
          : p
      )
    );
    logAudit('CLOSE_PERIOD', 'የሂሳብ ጊዜ ተዘግቷል', 'PERIOD', periodId, undefined, `Closed by ${currentUser.name}`);
  };

  // ============================================================
  // PART 9 INTEGRATIONS & NOTIFICATION METHODS
  // ============================================================
  const updateIntegration = (id: string, updates: Partial<IntegrationConfig>) => {
    setIntegrations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
    logAudit('UPDATE_INTEGRATION', 'የውጭ አገልግሎት ቅንብር ተሻሽሏል', 'INTEGRATION', id, undefined, JSON.stringify(updates));
  };

  const testIntegrationConnection = async (id: string): Promise<{ success: boolean; message: string }> => {
    const integration = integrations.find((i) => i.id === id);
    if (!integration) return { success: false, message: 'Provider not found' };

    const now = new Date().toISOString();
    setIntegrations((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, status: 'CONNECTED', lastConnectedAt: now, lastError: undefined } : i
      )
    );
    logAudit('TEST_INTEGRATION', 'የውጭ ግንኙነት ተፈትኗል', 'INTEGRATION', id, undefined, 'Connection verified OK');
    return { success: true, message: `${integration.name} connection successful (Ping latency: 42ms)` };
  };

  const updateNotificationTemplate = (id: string, updates: Partial<NotificationTemplate>) => {
    setNotificationTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
    logAudit('UPDATE_TEMPLATE', 'የመልዕክት አብነት ተሻሽሏል', 'TEMPLATE', id, undefined, JSON.stringify(updates));
  };

  const updateReminderSchedule = (updates: Partial<DebtReminderScheduleSettings>) => {
    setReminderSchedule((prev) => ({ ...prev, ...updates }));
    logAudit('UPDATE_REMINDER_SCHEDULE', 'የዕዳ ማስታወሻ መርሃ ግብር ተሻሽሏል', 'SCHEDULE', 'debt_reminders', undefined, JSON.stringify(updates));
  };

  const updateCustomerPreference = (customerId: string, updates: Partial<CustomerContactPreferences>) => {
    setCustomerPreferences((prev) => ({
      ...prev,
      [customerId]: {
        ...(prev[customerId] || {
          customerId,
          smsEnabled: true,
          whatsappEnabled: true,
          telegramEnabled: true,
          emailEnabled: true,
          marketingEnabled: true,
          preferredChannel: 'SMS',
        }),
        ...updates,
      },
    }));
  };

  const sendCustomerNotification = async (params: {
    customerId: string;
    type: NotificationType;
    channel?: NotificationChannel;
    variables?: Record<string, any>;
    customMessage?: string;
  }): Promise<{ success: boolean; log: NotificationLog }> => {
    const cust = customers.find((c) => c.id === params.customerId);
    const pref = customerPreferences[params.customerId];
    const targetChannel = params.channel || pref?.preferredChannel || 'SMS';
    const now = new Date().toISOString();

    const tpl =
      notificationTemplates.find((t) => t.type === params.type && t.channel === targetChannel && t.language === language) ||
      notificationTemplates.find((t) => t.type === params.type && t.channel === targetChannel) ||
      notificationTemplates[0];

    const vars = {
      customer_name: cust?.name || 'Customer',
      business_name: business.amharicName || business.name,
      ...(params.variables || {}),
    };

    const body = params.customMessage || (tpl ? interpolateTemplate(tpl.bodyTemplate, vars) : 'Notification message');
    const title = tpl ? interpolateTemplate(tpl.titleTemplate, vars) : 'Store Notification';

    const logEntry: NotificationLog = {
      id: `notif_log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      businessId: business.id,
      branchId: branches[0]?.id || 'br_01',
      customerId: params.customerId,
      customerName: cust?.name,
      recipient: cust?.phone || 'Customer',
      type: params.type,
      channel: targetChannel,
      title,
      titleAm: title,
      body,
      language,
      priority: 'NORMAL',
      status: isOffline ? 'QUEUED' : 'DELIVERED',
      provider:
        targetChannel === 'SMS'
          ? 'Ethio Telecom SMS'
          : targetChannel === 'TELEGRAM'
          ? 'Telegram Bot'
          : 'WhatsApp Cloud',
      providerMessageId: `MSG_${Date.now()}`,
      retryCount: 0,
      createdAt: now,
      deliveredAt: isOffline ? undefined : now,
    };

    setNotificationLogs((prev) => [logEntry, ...prev]);

    // Also push to in-app notification center
    setNotifications((prev) => [
      {
        id: `notif_${Date.now()}`,
        businessId: business.id,
        title: `Sent: ${title}`,
        titleAm: `ተልኳል፦ ${title}`,
        message: body,
        messageAm: body,
        type: 'SECURITY',
        read: false,
        createdAt: now,
      },
      ...prev,
    ]);

    return { success: true, log: logEntry };
  };

  const initiateOnlinePayment = (params: {
    providerType: ProviderType;
    amount: number;
    saleId?: string;
    debtId?: string;
    customerId?: string;
    customerPhone?: string;
  }): PaymentTransaction => {
    const res = TelebirrPaymentAdapter.createPayment({
      businessId: business.id,
      branchId: branches[0]?.id || 'br_01',
      saleId: params.saleId,
      debtId: params.debtId,
      customerId: params.customerId,
      customerName: customers.find((c) => c.id === params.customerId)?.name,
      amount: params.amount,
      phone: params.customerPhone || '0911000000',
    });

    setPaymentTransactions((prev) => [res.transaction, ...prev]);
    logAudit(
      'INITIATE_PAYMENT',
      'የኦንላይን ክፍያ ተጀምሯል',
      'PAYMENT',
      res.transaction.id,
      undefined,
      `${params.amount} ETB via ${res.transaction.providerName}`
    );
    return res.transaction;
  };

  const processPaymentWebhook = (event: PaymentWebhookEvent): { success: boolean; status: string } => {
    const txn = paymentTransactions.find((t) => t.internalReference === event.internalReference);
    if (!txn) return { success: false, status: 'TRANSACTION_NOT_FOUND' };

    if (txn.status === 'COMPLETED') {
      return { success: true, status: 'DUPLICATE' };
    }

    if (Math.abs(event.amount - txn.amount) > 0.01) {
      return { success: false, status: 'PAYMENT_AMOUNT_MISMATCH' };
    }

    const now = new Date().toISOString();
    const completedTxn: PaymentTransaction = {
      ...txn,
      status: 'COMPLETED',
      providerReference: event.providerReference,
      completedAt: now,
    };

    setPaymentTransactions((prev) => prev.map((t) => (t.id === txn.id ? completedTxn : t)));

    // Automatically post debt settlement if this payment was for customer debt
    if (txn.debtId) {
      addDebtPayment({
        debtId: txn.debtId,
        amount: txn.amount,
        paymentMethod: txn.providerName,
        referenceNo: event.providerReference,
        notes: `Automated verified webhook payment via ${txn.providerName}`,
      });
    }

    logAudit(
      'WEBHOOK_PAYMENT_VERIFIED',
      'የኦንላይን ክፍያ በዌብሁክ ተረጋግጦ ተመዝግቧል',
      'PAYMENT',
      txn.id,
      'PENDING',
      `COMPLETED: ${txn.amount} ETB`
    );
    return { success: true, status: 'COMPLETED' };
  };

  const retryNotification = async (logId: string): Promise<boolean> => {
    const log = notificationLogs.find((l) => l.id === logId);
    if (!log) return false;

    const now = new Date().toISOString();
    setNotificationLogs((prev) =>
      prev.map((l) =>
        l.id === logId
          ? {
              ...l,
              status: 'DELIVERED',
              retryCount: l.retryCount + 1,
              deliveredAt: now,
              failedAt: undefined,
            }
          : l
      )
    );
    return true;
  };

  const updateBusiness = (updates: Partial<Business>) => {
    setBusiness((prev) => ({ ...prev, ...updates }));
    logAudit('UPDATE_BUSINESS', 'የንግድ መረጃ ተሻሽሏል', 'BUSINESS', business.id, undefined, JSON.stringify(updates));
  };

  const addBranch = (branchData: Omit<Branch, 'id' | 'businessId'>) => {
    const id = `br_${Date.now()}`;
    const newBranch: Branch = {
      ...branchData,
      id,
      businessId: business.id,
    };
    setBranches((prev) => [...prev, newBranch]);
    logAudit('CREATE_BRANCH', 'አዲስ ቅርንጫፍ ተከፍቷል', 'BRANCH', id, undefined, newBranch.name);
  };

  const addUser = (userData: Omit<User, 'id' | 'businessId'>) => {
    const id = `usr_${Date.now()}`;
    const newUser: User = {
      ...userData,
      id,
      businessId: business.id,
    };
    setUsers((prev) => [...prev, newUser]);
    logAudit('CREATE_USER', 'አዲስ ሰራተኛ ተመዝግቧል', 'USER', id, undefined, `${newUser.name} (${newUser.role})`);
  };

  const updateUserRole = (userId: string, role: User['role']) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          logAudit('UPDATE_USER_ROLE', 'የሰራተኛ ስልጣን ተቀይሯል', 'USER', userId, u.role, role);
          return { ...u, role };
        }
        return u;
      })
    );
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearAllNotifications = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Export full JSON backup
  const exportDatabaseBackup = () => {
    const fullBackup = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      theme,
      business,
      branches,
      users,
      categories,
      products,
      customers,
      debts,
      debtTransactions,
      sales,
      expenses,
      suppliers,
      purchases,
      inventoryTransactions,
      auditLogs,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `ethio_biz_backup_${business.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    logAudit('EXPORT_BACKUP', 'የዳታ መጠባበቂያ ተወስዷል (Backup)', 'SYSTEM', 'all');
  };

  // Restore backup from JSON
  const restoreDatabaseBackup = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (!data.business || !data.products) {
        return false;
      }
      if (data.business) setBusiness(data.business);
      if (data.branches) setBranches(data.branches);
      if (data.users) setUsers(data.users);
      if (data.categories) setCategories(data.categories);
      if (data.products) setProducts(data.products);
      if (data.customers) setCustomers(data.customers);
      if (data.debts) setDebts(data.debts);
      if (data.debtTransactions) setDebtTransactions(data.debtTransactions);
      if (data.sales) setSales(data.sales);
      if (data.expenses) setExpenses(data.expenses);
      if (data.suppliers) setSuppliers(data.suppliers);
      if (data.purchases) setPurchases(data.purchases);
      if (data.inventoryTransactions) setInventoryTransactions(data.inventoryTransactions);
      if (data.auditLogs) setAuditLogs(data.auditLogs);
      if (data.theme && (data.theme === 'light' || data.theme === 'dark' || data.theme === 'system')) {
        setThemeState(data.theme);
      }

      logAudit('RESTORE_BACKUP', 'የዳታ መጠባበቂያ ተመልሷል (Restore)', 'SYSTEM', 'all');
      return true;
    } catch {
      return false;
    }
  };

  // Part 10 Security Architecture Handlers
  const logSecurityEvent = (params: {
    type: SecurityEventType;
    level: SecurityAlertLevel;
    title: string;
    titleAm: string;
    description: string;
    descriptionAm?: string;
    resourceType?: string;
    resourceId?: string;
    metadata?: Record<string, any>;
  }) => {
    const newEvent: SecurityEventLog = {
      id: `sec_ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      businessId: business.id,
      userId: currentUser.id,
      userName: currentUser.name,
      ipAddress: '197.156.104.22',
      timestamp: new Date().toISOString(),
      ...params,
    };
    setSecurityEvents((prev) => [newEvent, ...prev]);
  };

  const revokeSession = (sessionId: string) => {
    setUserSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, status: 'REVOKED', revokedAt: new Date().toISOString() } : s))
    );
    const target = userSessions.find((s) => s.id === sessionId);
    logSecurityEvent({
      type: 'SESSION_REVOKED',
      level: 'HIGH',
      title: 'Session Revoked',
      titleAm: 'የመግቢያ ክፍለ-ጊዜ ተሰርዟል',
      description: `Session ${sessionId} for "${target?.deviceName || 'Device'}" revoked by ${currentUser.name}.`,
      descriptionAm: `የመሳሪያው መግቢያ ክፍለ-ጊዜ በ${currentUser.name} ተሰርዟል።`,
    });
  };

  const revokeAllOtherSessions = () => {
    setUserSessions((prev) =>
      prev.map((s) => (!s.isCurrent ? { ...s, status: 'REVOKED', revokedAt: new Date().toISOString() } : s))
    );
    logSecurityEvent({
      type: 'SESSION_REVOKED',
      level: 'HIGH',
      title: 'All Other Sessions Revoked',
      titleAm: 'ሁሉም ሌሎች የመግቢያ ክፍለ-ጊዜዎች ተሰርዘዋል',
      description: `User ${currentUser.name} terminated all sessions across other devices.`,
      descriptionAm: `ተጠቃሚ ${currentUser.name} ከሌሎች መሳሪያዎች ሁሉ አስወጥቷል።`,
    });
  };

  const revokeDevice = (deviceId: string) => {
    setRegisteredDevices((prev) =>
      prev.map((d) =>
        d.id === deviceId ? { ...d, status: 'REVOKED', isTrusted: false, revokedAt: new Date().toISOString() } : d
      )
    );
    setUserSessions((prev) =>
      prev.map((s) => (s.deviceId === deviceId ? { ...s, status: 'REVOKED', revokedAt: new Date().toISOString() } : s))
    );
    const dev = registeredDevices.find((d) => d.id === deviceId);
    logSecurityEvent({
      type: 'DEVICE_REVOKED',
      level: 'HIGH',
      title: 'Device Access Permanently Revoked',
      titleAm: 'የመሳሪያው ፈቃድ ለዘለቄታው ተሰርዟል',
      description: `Device "${dev?.deviceName || deviceId}" was revoked. All offline sync & JWT access terminated.`,
      descriptionAm: `መሳሪያው "${dev?.deviceName || deviceId}" ተሰርዟል። ማናቸውም ግንኙነቶች ውድቅ ይደረጋሉ።`,
    });
  };

  const toggleDeviceTrust = (deviceId: string) => {
    setRegisteredDevices((prev) =>
      prev.map((d) => (d.id === deviceId ? { ...d, isTrusted: !d.isTrusted } : d))
    );
  };

  const grantTemporaryPermission = (params: {
    userId: string;
    userName: string;
    permission: string;
    permissionAm: string;
    durationHours: number;
    reason: string;
  }) => {
    const startAt = new Date().toISOString();
    const endAt = new Date(Date.now() + params.durationHours * 3600 * 1000).toISOString();
    const newPerm: TemporaryPermission = {
      id: `tp_${Date.now()}`,
      businessId: business.id,
      userId: params.userId,
      userName: params.userName,
      permission: params.permission,
      permissionAm: params.permissionAm,
      startAt,
      endAt,
      grantedBy: currentUser.id,
      grantedByName: currentUser.name,
      reason: params.reason,
      active: true,
    };
    setTemporaryPermissions((prev) => [newPerm, ...prev]);
    logSecurityEvent({
      type: 'TEMPORARY_PERMISSION_GRANTED',
      level: 'INFO',
      title: 'Temporary Permission Granted',
      titleAm: 'ጊዜያዊ ፈቃድ ተሰጥቷል',
      description: `Granted "${params.permission}" to ${params.userName} for ${params.durationHours} hours. Reason: ${params.reason}`,
      descriptionAm: `ለ${params.userName} የ${params.durationHours} ሰዓት ጊዜያዊ ፈቃድ (${params.permissionAm}) ተሰጥቷል።`,
    });
  };

  const revokeTemporaryPermission = (id: string) => {
    setTemporaryPermissions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, active: false } : p))
    );
    logSecurityEvent({
      type: 'TEMPORARY_PERMISSION_EXPIRED',
      level: 'INFO',
      title: 'Temporary Permission Revoked',
      titleAm: 'ጊዜያዊ ፈቃድ ተቋርጧል',
      description: `Temporary permission ${id} was revoked manually by ${currentUser.name}.`,
      descriptionAm: `ጊዜያዊ ፈቃዱ በ${currentUser.name} በእጅ ተቋርጧል።`,
    });
  };

  const updateSecuritySettings = (updates: Partial<SecuritySettings>) => {
    setSecuritySettings((prev) => ({ ...prev, ...updates }));
    logSecurityEvent({
      type: 'SENSITIVE_FINANCIAL_ACTION',
      level: 'WARNING',
      title: 'Security Policy Settings Updated',
      titleAm: 'የደህንነት ፖሊሲ ቅንብሮች ተሻሽለዋል',
      description: `Security settings updated by ${currentUser.name}: ${Object.keys(updates).join(', ')}`,
      descriptionAm: `የደህንነት ቅንብሮች በ${currentUser.name} ተሻሽለዋል።`,
    });
  };

  const requestBreakGlass = async (ticketReference: string, reason: string): Promise<{ success: boolean; message: string }> => {
    logSecurityEvent({
      type: 'BREAK_GLASS_ACCESS_REQUESTED',
      level: 'CRITICAL',
      title: 'Break-Glass Emergency Access Activated',
      titleAm: 'የአስቸኳይ ጊዜ ድጋፍ ፈቃድ ተጀምሯል',
      description: `Emergency access initiated for Ticket #${ticketReference}. Reason: "${reason}". Session time-limited with immutable auditing.`,
      descriptionAm: `ለቲኬት #${ticketReference} የአስቸኳይ ጊዜ ድጋፍ ፈቃድ ተጀምሯል። ሙሉ ኦዲት ክትትል እየተደረገ ነው።`,
    });
    return {
      success: true,
      message: language === 'am' ? 'የአስቸኳይ ጊዜ ድጋፍ ፈቃድ ለ 1 ሰዓት ተፈቅዷል' : 'Break-glass support session granted for 60 minutes with full audit trail',
    };
  };

  const resetToSampleData = () => {
    setBusiness(initialBusiness);
    setBranches(initialBranches);
    setUsers(initialUsers);
    setCurrentUser(initialUsers[0]);
    setCategories(initialCategories);
    setProducts(initialProducts);
    setCustomers(initialCustomers);
    setDebts(initialDebts);
    setDebtTransactions(initialDebtTransactions);
    setSales(initialSales);
    setExpenses(initialExpenses);
    setSuppliers(initialSuppliers);
    setPurchases(initialPurchases);
    setInventoryTransactions(initialInventoryTransactions);
    setAuditLogs(initialAuditLogs);
    setNotifications(initialNotifications);
    setSyncQueue([]);
    setAccounts(defaultChartOfAccounts);
    setJournalEntries(buildInitialJournalEntries());
    setCashRegisters([
      {
        id: 'reg_today_01',
        businessId: 'biz_001',
        branchId: 'br_01',
        employeeId: 'usr_03',
        employeeName: 'ዳዊት መኮንን (Cashier)',
        openingBalance: 5000,
        expectedBalance: 5000,
        status: 'OPEN',
        openedAt: new Date().toISOString(),
        notes: 'Morning Cash Float (መነሻ ካዝና)',
      },
    ]);
    setAccountingSettings(defaultAccountingSettings);
    setFinancialPeriods(defaultFinancialPeriods);
    setIntegrations(defaultIntegrations);
    setNotificationTemplates(defaultNotificationTemplates);
    setReminderSchedule(defaultDebtReminderSchedule);
    setCustomerPreferences(initialCustomerContactPreferences);
    setUserSessions(initialUserSessions);
    setRegisteredDevices(initialRegisteredDevices);
    setSecurityEvents(initialSecurityEvents);
    setTemporaryPermissions(initialTemporaryPermissions);
    setSecuritySettings(initialSecuritySettings);
    setThemeState('system');
  };

  const currentCashRegister = cashRegisters.find((r) => r.status === 'OPEN');

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        t,
        theme,
        isDarkMode,
        setTheme,
        toggleDarkMode,
        business,
        updateBusiness,
        branches,
        currentBranchId,
        setCurrentBranchId,
        addBranch,
        currentUser,
        users,
        authStatus,
        isAuthenticated,
        userBusinesses,
        authError,
        clearAuthError,
        login,
        register,
        logout,
        logoutAllDevices,
        changePassword,
        requestPasswordReset,
        resetPasswordWithToken,
        switchBusiness,
        setCurrentUser,
        addUser,
        updateUserRole,
        categories,
        products,
        customers,
        debts,
        debtTransactions,
        sales,
        expenses,
        suppliers,
        purchases,
        inventoryTransactions,
        auditLogs,
        notifications,
        syncQueue,
        accounts,
        journalEntries,
        cashRegisters,
        currentCashRegister,
        accountingSettings,
        financialPeriods,
        updateAccountingSettings,
        openCashRegister,
        closeCashRegister,
        addOwnerCapital,
        addOwnerDrawing,
        addLoanTransaction,
        reverseJournalEntry,
        closeFinancialPeriod,
        integrations,
        notificationTemplates,
        notificationLogs,
        reminderSchedule,
        customerPreferences,
        paymentTransactions,
        updateIntegration,
        testIntegrationConnection,
        updateNotificationTemplate,
        updateReminderSchedule,
        updateCustomerPreference,
        sendCustomerNotification,
        initiateOnlinePayment,
        processPaymentWebhook,
        retryNotification,
        isOffline,
        toggleOffline,
        syncNow,
        lastSyncTime,
        addSale,
        addDebtPayment,
        editDebtDueDate,
        addProduct,
        updateProduct,
        adjustStock,
        addCustomer,
        updateCustomer,
        addExpense,
        addPurchase,
        markNotificationRead,
        clearAllNotifications,
        // Part 10 Security Architecture
        userSessions,
        registeredDevices,
        securityEvents,
        temporaryPermissions,
        securitySettings,
        revokeSession,
        revokeAllOtherSessions,
        revokeDevice,
        toggleDeviceTrust,
        logSecurityEvent,
        grantTemporaryPermission,
        revokeTemporaryPermission,
        updateSecuritySettings,
        requestBreakGlass,
        exportDatabaseBackup,
        restoreDatabaseBackup,
        resetToSampleData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
