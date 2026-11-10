import React from 'react';
import {
  LayoutDashboard,
  FilePlus,
  Receipt,
  Package,
  ShoppingBag,
  Users,
  CreditCard,
  BarChart3,
  TrendingUp,
  Store,
  Settings,
  LogOut,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useBusinessData } from '../../context/BusinessDataContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: string;
  onNavigate: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeView,
  onNavigate,
}) => {
  const { t } = useLanguage();
  const { logout } = useAuth();
  const { products } = useBusinessData();

  const lowStockCount = products.filter(
    (p) => p.currentStock <= (p.minimumStock || 5) && p.currentStock >= 0
  ).length;

  const navItems = [
    { id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { id: 'createReceipt', label: t.nav.createReceipt, icon: FilePlus, highlight: true },
    { id: 'allSales', label: t.nav.allSales, icon: Receipt },
    { id: 'products', label: t.nav.products, icon: Package },
    { id: 'lowStock', label: t.nav.lowStock, icon: AlertTriangle, badge: lowStockCount },
    { id: 'purchases', label: t.nav.purchases, icon: ShoppingBag },
    { id: 'customers', label: t.nav.customers, icon: Users },
    { id: 'expenses', label: t.nav.expenses, icon: CreditCard },
    { id: 'salesReports', label: t.nav.salesReports, icon: BarChart3 },
    { id: 'profitLossReports', label: t.nav.profitLossReports, icon: TrendingUp },
    { id: 'businessProfile', label: t.nav.businessProfile, icon: Store },
    { id: 'settings', label: t.nav.settings, icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-2xs lg:hidden no-print"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-[#E2EAE4] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } no-print`}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-[#E2EAE4] lg:hidden">
          <span className="text-base font-bold text-[#105C35]">{t.appName}</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Brand Header for Desktop */}
        <div className="hidden lg:flex items-center gap-3 h-16 px-5 border-b border-[#E2EAE4]">
          <div className="w-8 h-8 rounded-lg bg-[#16834A] text-white flex items-center justify-center font-bold text-lg shadow-sm">
            ৳
          </div>
          <div>
            <div className="text-sm font-bold text-[#105C35]">Smart Manager</div>
            <div className="text-[11px] text-gray-400">Bangladesh Edition</div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#16834A] text-white shadow-xs font-semibold'
                    : item.highlight
                    ? 'bg-[#EAF7EF] text-[#16834A] hover:bg-[#d8f2e2]'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-black'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : item.highlight ? 'text-[#16834A]' : 'text-gray-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                      isActive ? 'bg-white text-[#16834A]' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Logout */}
        <div className="p-3 border-t border-[#E2EAE4]">
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>{t.nav.logout}</span>
          </button>
        </div>
      </aside>
    </>
  );
};
