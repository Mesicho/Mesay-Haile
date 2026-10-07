import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth, ProtectedRoute } from './context/AuthContext';
import { Header } from './components/common/Header';
import { MobileBottomNav, ActiveTab } from './components/common/MobileBottomNav';
import { DesktopSidebar } from './components/common/DesktopSidebar';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { PosTerminal } from './components/pos/PosTerminal';
import { DebtManagementHub } from './components/debt/DebtManagementHub';
import { InventoryManagement } from './components/inventory/InventoryManagement';
import { CustomersManagement } from './components/customers/CustomersManagement';
import { ExpensesManagement } from './components/expenses/ExpensesManagement';
import { PurchasesManagement } from './components/purchases/PurchasesManagement';
import { ReportsView } from './components/reports/ReportsView';
import { EmployeesManagement } from './components/employees/EmployeesManagement';
import { AuditLogsView } from './components/audit/AuditLogsView';
import { SettingsView } from './components/settings/SettingsView';
import { SalesHistoryView } from './components/sales/SalesHistoryView';
import { BusinessAssistantModal } from './components/assistant/BusinessAssistantModal';
import { RecordPaymentModal } from './components/debt/RecordPaymentModal';
import {
  AddProductModal,
  AddCustomerModal,
  AddExpenseModal,
  RecordPurchaseModal,
  NotificationCenterModal,
} from './components/modals/EntityModals';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { CustomerDebt } from './types';
import {
  X,
  Sparkles,
  ShoppingBag,
  Users,
  TrendingDown,
  Truck,
  Building,
  UserCheck,
  FileBarChart,
  ShieldAlert,
  Settings,
  Plus,
  CreditCard,
  Package,
} from 'lucide-react';

const MainContent: React.FC = () => {
  const { language, business, currentUser, setCurrentUser, updateBusiness } = useApp();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Keep currentUser and business synced with active auth user
  useEffect(() => {
    if (user) {
      if (currentUser.id !== user.id || currentUser.name !== user.fullName || currentUser.role !== user.role) {
        setCurrentUser({
          id: user.id,
          businessId: business.id,
          branchId: 'br-1',
          name: user.fullName,
          phone: user.phone || '0911234567',
          email: user.email,
          role: user.role,
          active: true,
          status: 'ACTIVE',
        });
      }
      if (user.businessName && business.name !== user.businessName) {
        updateBusiness({
          name: user.businessName,
          businessType: (user.businessType as any) || business.businessType,
          address: user.businessAddress || business.address,
        });
      }
    }
  }, [user]);

  // Modals state
  const [showAssistant, setShowAssistant] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showRecordPurchase, setShowRecordPurchase] = useState(false);
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [selectedDebtForPayment, setSelectedDebtForPayment] = useState<CustomerDebt | null>(null);
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const [showQuickFabMenu, setShowQuickFabMenu] = useState(false);

  const handleOpenRecordPayment = (debt?: CustomerDebt) => {
    setSelectedDebtForPayment(debt || null);
    setShowRecordPayment(true);
  };

  const moreMenuItems = [
    { id: 'sales' as ActiveTab, labelEn: 'Sales History', labelAm: 'የሽያጭ ታሪክ', icon: ShoppingBag },
    { id: 'customers' as ActiveTab, labelEn: 'Customers', labelAm: 'ደንበኞች', icon: Users },
    { id: 'expenses' as ActiveTab, labelEn: 'Expenses', labelAm: 'ወጪዎች', icon: TrendingDown },
    { id: 'purchases' as ActiveTab, labelEn: 'Purchases', labelAm: 'ግዢዎች', icon: Truck },
    { id: 'suppliers' as ActiveTab, labelEn: 'Suppliers', labelAm: 'አቅራቢዎች', icon: Building },
    { id: 'employees' as ActiveTab, labelEn: 'Employees (RBAC)', labelAm: 'ሰራተኞች', icon: UserCheck },
    { id: 'reports' as ActiveTab, labelEn: 'Reports & P&L', labelAm: 'ሪፖርቶችና ትርፍ', icon: FileBarChart },
    { id: 'audit' as ActiveTab, labelEn: 'Audit Logs', labelAm: 'የእንቅስቃሴ መዝገብ', icon: ShieldAlert },
    { id: 'settings' as ActiveTab, labelEn: 'Settings & Backup', labelAm: 'ቅንብሮች', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col font-sans antialiased text-slate-900 dark:text-slate-100 selection:bg-blue-600 selection:text-white transition-colors duration-200">
      {/* Universal Top Header */}
      <Header
        onOpenAssistant={() => setShowAssistant(true)}
        onOpenNotifications={() => setShowNotifications(true)}
      />

      {/* Main Layout Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <DesktopSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenAssistant={() => setShowAssistant(true)}
        />

        {/* Dynamic Screen View */}
        <main className="flex-1 p-3 sm:p-6 overflow-y-auto min-w-0">
          {activeTab === 'dashboard' && (
            <DashboardOverview
              setActiveTab={setActiveTab}
              onOpenQuickSale={() => setActiveTab('pos')}
              onOpenAddCustomer={() => setShowAddCustomer(true)}
              onOpenRecordPayment={handleOpenRecordPayment}
              onOpenAddProduct={() => setShowAddProduct(true)}
              onOpenAddExpense={() => setShowAddExpense(true)}
              onOpenRecordPurchase={() => setShowRecordPurchase(true)}
              onOpenAssistant={() => setShowAssistant(true)}
            />
          )}

          {activeTab === 'pos' && (
            <PosTerminal onOpenAddCustomer={() => setShowAddCustomer(true)} />
          )}

          {activeTab === 'sales' && <SalesHistoryView />}

          {activeTab === 'debt' && (
            <DebtManagementHub onOpenRecordPayment={handleOpenRecordPayment} />
          )}

          {activeTab === 'inventory' && (
            <InventoryManagement
              onOpenAddProduct={() => setShowAddProduct(true)}
              onOpenRecordPurchase={() => setShowRecordPurchase(true)}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersManagement
              onOpenAddCustomer={() => setShowAddCustomer(true)}
              onOpenRecordPayment={handleOpenRecordPayment}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesManagement onOpenAddExpense={() => setShowAddExpense(true)} />
          )}

          {activeTab === 'purchases' && (
            <PurchasesManagement
              onOpenRecordPurchase={() => setShowRecordPurchase(true)}
            />
          )}

          {activeTab === 'suppliers' && (
            <PurchasesManagement
              onOpenRecordPurchase={() => setShowRecordPurchase(true)}
            />
          )}

          {activeTab === 'employees' && <EmployeesManagement />}

          {activeTab === 'reports' && <ReportsView />}

          {activeTab === 'audit' && <AuditLogsView />}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Mobile Sticky Bottom Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenMoreMenu={() => setShowMoreSheet(true)}
        onOpenQuickMenu={() => setShowQuickFabMenu(true)}
      />

      {/* Floating Action Button on Mobile (+ አዲስ Quick Action Menu) */}
      <button
        onClick={() => setShowQuickFabMenu(true)}
        className="md:hidden fixed bottom-20 right-4 z-30 px-4 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl flex items-center gap-1.5 active:scale-95 transition font-bold text-xs"
        title="Quick Actions (+ አዲስ)"
      >
        <Plus className="w-5 h-5" />
        <span>{language === 'am' ? 'አዲስ' : 'New'}</span>
      </button>

      {/* Quick Action FAB Bottom Sheet Modal */}
      {showQuickFabMenu && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl p-5 space-y-3 max-h-[75vh] overflow-y-auto shadow-2xl border-t border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {language === 'am' ? 'ፈጣን ተግባር መምረጫ (+ አዲስ)' : 'Quick Action Menu'}
              </h3>
              <button
                onClick={() => setShowQuickFabMenu(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <button
                onClick={() => {
                  setShowQuickFabMenu(false);
                  setActiveTab('pos');
                }}
                className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 font-bold text-left flex items-center gap-2.5 active:scale-95"
              >
                <ShoppingBag className="w-4 h-4 text-blue-600" />
                <span>{language === 'am' ? '+ አዲስ ሽያጭ' : '+ New Sale'}</span>
              </button>

              <button
                onClick={() => {
                  setShowQuickFabMenu(false);
                  setShowAddCustomer(true);
                }}
                className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-left flex items-center gap-2.5 active:scale-95"
              >
                <Users className="w-4 h-4 text-emerald-600" />
                <span>{language === 'am' ? '+ አዲስ ደንበኛ' : '+ New Customer'}</span>
              </button>

              <button
                onClick={() => {
                  setShowQuickFabMenu(false);
                  handleOpenRecordPayment();
                }}
                className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-bold text-left flex items-center gap-2.5 active:scale-95"
              >
                <CreditCard className="w-4 h-4 text-amber-600" />
                <span>{language === 'am' ? '+ የዕዳ ክፍያ' : '+ Debt Payment'}</span>
              </button>

              <button
                onClick={() => {
                  setShowQuickFabMenu(false);
                  setShowAddProduct(true);
                }}
                className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 font-bold text-left flex items-center gap-2.5 active:scale-95"
              >
                <Package className="w-4 h-4 text-purple-600" />
                <span>{language === 'am' ? '+ አዲስ እቃ' : '+ Add Product'}</span>
              </button>

              <button
                onClick={() => {
                  setShowQuickFabMenu(false);
                  setShowAddExpense(true);
                }}
                className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 font-bold text-left flex items-center gap-2.5 active:scale-95"
              >
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span>{language === 'am' ? '+ አዲስ ወጪ' : '+ Add Expense'}</span>
              </button>

              <button
                onClick={() => {
                  setShowQuickFabMenu(false);
                  setShowRecordPurchase(true);
                }}
                className="p-3.5 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-900 font-bold text-left flex items-center gap-2.5 active:scale-95"
              >
                <Truck className="w-4 h-4 text-cyan-600" />
                <span>{language === 'am' ? '+ አዲስ ግዢ' : '+ Record Purchase'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile "More" Full Screen / Bottom Sheet */}
      {showMoreSheet && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-slate-900 border-t border-slate-800 text-white rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-base text-white">
                  {language === 'am' ? 'ተጨማሪ አገልግሎቶች' : 'All App Modules'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {language === 'am' ? 'የንግድዎን ሁሉንም ክፍሎች እዚህ ያግኙ' : 'Navigate all sections of your store'}
                </p>
              </div>
              <button
                onClick={() => setShowMoreSheet(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {moreMenuItems.map((item) => {
                const Icon = item.icon;
                const isCurrent = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setShowMoreSheet(false);
                    }}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-2 transition active:scale-95 ${
                      isCurrent
                        ? 'bg-blue-600/30 border-blue-500 text-white font-bold'
                        : 'bg-slate-800/80 border-slate-700/60 text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isCurrent ? 'text-amber-400' : 'text-blue-400'}`} />
                    <span className="text-xs">{language === 'am' ? item.labelAm : item.labelEn}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Button to Launch AI Business Assistant */}
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setShowMoreSheet(false);
                  setShowAssistant(true);
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{language === 'am' ? 'ብልህ የንግድ ረዳት (AI)' : 'AI Business Assistant'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ALL MODALS */}
      {showAssistant && (
        <BusinessAssistantModal onClose={() => setShowAssistant(false)} />
      )}

      {showNotifications && (
        <NotificationCenterModal onClose={() => setShowNotifications(false)} />
      )}

      {showOnboarding && (
        <OnboardingWizard onClose={() => setShowOnboarding(false)} />
      )}

      {showAddProduct && (
        <AddProductModal onClose={() => setShowAddProduct(false)} />
      )}

      {showAddCustomer && (
        <AddCustomerModal onClose={() => setShowAddCustomer(false)} />
      )}

      {showAddExpense && (
        <AddExpenseModal onClose={() => setShowAddExpense(false)} />
      )}

      {showRecordPurchase && (
        <RecordPurchaseModal onClose={() => setShowRecordPurchase(false)} />
      )}

      {showRecordPayment && (
        <RecordPaymentModal
          initialDebt={selectedDebtForPayment}
          onClose={() => {
            setShowRecordPayment(false);
            setSelectedDebtForPayment(null);
          }}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <ProtectedRoute>
          <MainContent />
        </ProtectedRoute>
      </AuthProvider>
    </AppProvider>
  );
}
