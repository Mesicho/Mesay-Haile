import React from 'react';
import { useApp } from '../../context/AppContext';
import { LayoutDashboard, ShoppingCart, Package, Users, MoreHorizontal, CreditCard } from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'sales'
  | 'pos'
  | 'customers'
  | 'debt'
  | 'inventory'
  | 'purchases'
  | 'suppliers'
  | 'expenses'
  | 'employees'
  | 'reports'
  | 'audit'
  | 'settings';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenMoreMenu: () => void;
  onOpenQuickMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenMoreMenu,
  onOpenQuickMenu,
}) => {
  const { language, debts } = useApp();

  const overdueCount = debts.filter((d) => d.status === 'OVERDUE' && d.remainingDebt > 0).length;

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      labelEn: 'Home',
      labelAm: 'ዋና',
      icon: LayoutDashboard,
    },
    {
      id: 'pos' as ActiveTab,
      labelEn: 'Sales',
      labelAm: 'ሽያጭ',
      icon: ShoppingCart,
    },
    {
      id: 'inventory' as ActiveTab,
      labelEn: 'Stock',
      labelAm: 'እቃ',
      icon: Package,
    },
    {
      id: 'debt' as ActiveTab,
      labelEn: 'Debts',
      labelAm: 'ዕዳ/ደንበኛ',
      icon: CreditCard,
      badge: overdueCount > 0 ? overdueCount : undefined,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 shadow-2xl safe-area-pb">
      <div className="grid grid-cols-5 h-16 items-center px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center h-full relative transition active:scale-95 ${
                isActive ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110 text-amber-400' : ''}`} />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2.5 px-1 py-0.2 rounded-full bg-red-600 text-white text-[9px] font-bold">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight truncate max-w-[60px]">
                {language === 'am' ? item.labelAm : item.labelEn}
              </span>
              {isActive && (
                <div className="absolute top-0 w-8 h-1 bg-amber-400 rounded-b-full shadow-sm" />
              )}
            </button>
          );
        })}

        {/* More Menu Trigger */}
        <button
          onClick={onOpenMoreMenu}
          className="flex flex-col items-center justify-center h-full text-slate-400 hover:text-slate-200 active:scale-95 transition"
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">
            {language === 'am' ? 'ሌሎች' : 'More'}
          </span>
        </button>
      </div>
    </nav>
  );
};
