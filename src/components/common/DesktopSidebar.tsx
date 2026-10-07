import React from 'react';
import { useApp } from '../../context/AppContext';
import { ActiveTab } from './MobileBottomNav';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  CreditCard,
  Package,
  Truck,
  TrendingDown,
  UserCheck,
  FileBarChart,
  ShieldAlert,
  Settings,
  Sparkles,
  Receipt,
  Building,
} from 'lucide-react';

interface DesktopSidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAssistant: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAssistant,
}) => {
  const { language, debts, products, currentUser } = useApp();

  const overdueDebts = debts.filter((d) => d.status === 'OVERDUE').length;
  const lowStockCount = products.filter((p) => p.quantity <= p.minStock).length;

  // Role based filtering
  const isAllowed = (tab: ActiveTab) => {
    const role = currentUser.role;
    if (role === 'OWNER') return true;
    if (role === 'MANAGER') return !['audit'].includes(tab);
    if (role === 'CASHIER') return ['dashboard', 'pos', 'sales', 'customers', 'debt'].includes(tab);
    if (role === 'INVENTORY_STAFF') return ['dashboard', 'inventory', 'purchases', 'suppliers'].includes(tab);
    if (role === 'ACCOUNTANT') return ['dashboard', 'debt', 'expenses', 'reports', 'purchases', 'sales'].includes(tab);
    if (role === 'SALESPERSON') return ['dashboard', 'pos', 'customers', 'sales'].includes(tab);
    return true;
  };

  const navItems = [
    { id: 'dashboard' as ActiveTab, labelEn: 'Dashboard', labelAm: 'ዳሽቦርድ', icon: LayoutDashboard },
    { id: 'pos' as ActiveTab, labelEn: 'POS / New Sale', labelAm: 'የሽያጭ ማሽን (POS)', icon: ShoppingCart },
    { id: 'sales' as ActiveTab, labelEn: 'Sales History', labelAm: 'የሽያጭ ታሪክ', icon: Receipt },
    {
      id: 'debt' as ActiveTab,
      labelEn: 'Debt & Credit',
      labelAm: 'የዕዳ መቆጣጠሪያ',
      icon: CreditCard,
      badge: overdueDebts > 0 ? overdueDebts : undefined,
      badgeColor: 'bg-red-600',
    },
    {
      id: 'inventory' as ActiveTab,
      labelEn: 'Inventory',
      labelAm: 'እቃ ክምችት',
      icon: Package,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-amber-600',
    },
    { id: 'customers' as ActiveTab, labelEn: 'Customers', labelAm: 'ደንበኞች', icon: Users },
    { id: 'purchases' as ActiveTab, labelEn: 'Purchases', labelAm: 'ግዢዎች', icon: Truck },
    { id: 'suppliers' as ActiveTab, labelEn: 'Suppliers', labelAm: 'አቅራቢዎች', icon: Building },
    { id: 'expenses' as ActiveTab, labelEn: 'Expenses', labelAm: 'ወጪዎች', icon: TrendingDown },
    { id: 'employees' as ActiveTab, labelEn: 'Employees (RBAC)', labelAm: 'ሰራተኞችና ስልጣን', icon: UserCheck },
    { id: 'reports' as ActiveTab, labelEn: 'Reports & P&L', labelAm: 'ሪፖርቶችና ትርፍ/ኪሳራ', icon: FileBarChart },
    { id: 'audit' as ActiveTab, labelEn: 'Audit Trail', labelAm: 'የእንቅስቃሴ መዝገብ', icon: ShieldAlert },
    { id: 'settings' as ActiveTab, labelEn: 'Settings & Backup', labelAm: 'ቅንብሮችና መጠባበቂያ', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 h-[calc(100vh-60px)] sticky top-[60px] overflow-y-auto">
      {/* AI Assistant Banner */}
      <div className="p-3">
        <button
          onClick={onOpenAssistant}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 hover:from-blue-600 hover:to-indigo-600 text-white shadow-md border border-blue-500/30 transition group text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1">
              <span>{language === 'am' ? 'የንግድ ረዳት (AI)' : 'Business AI Assistant'}</span>
            </div>
            <p className="text-[10px] text-blue-200">
              {language === 'am' ? 'ስለ ዕዳ፣ ሽያጭና ትርፍ ጠይቅ' : 'Ask about debts, sales & profit'}
            </p>
          </div>
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          if (!isAllowed(item.id)) return null;
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{language === 'am' ? item.labelAm : item.labelEn}</span>
              </div>
              {item.badge && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white ${
                    item.badgeColor || 'bg-blue-500'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom slogan info */}
      <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 bg-slate-950/40">
        <p className="text-amber-400/90 font-medium">
          “ንግድዎን በደብተር ሳይሆን በአንድ ስርዓት ያስተዳድሩ!”
        </p>
        <p className="text-[10px] text-slate-500 mt-1">Ethio Business Helper v2.5</p>
      </div>
    </aside>
  );
};
