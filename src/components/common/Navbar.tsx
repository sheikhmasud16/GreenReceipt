import React, { useState } from 'react';
import {
  Menu,
  Globe,
  PlusCircle,
  Bell,
  Store,
  ChevronDown,
  LogOut,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useBusinessData } from '../../context/BusinessDataContext';

interface NavbarProps {
  onToggleSidebar: () => void;
  onNavigate: (view: string) => void;
  activeView: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, onNavigate }) => {
  const { profile, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { products } = useBusinessData();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showBellMenu, setShowBellMenu] = useState(false);

  // Compute low stock items
  const lowStockItems = products.filter(
    (p) => p.currentStock <= (p.minimumStock || 5) && p.currentStock >= 0
  );

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white border-b border-[#E2EAE4] shadow-xs no-print">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-gray-600 hover:text-[#16834A] hover:bg-[#EAF7EF] lg:hidden"
          aria-label="Toggle Menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate('dashboard')}>
          {profile?.logoUrl ? (
            <img
              src={profile.logoUrl}
              alt={profile.businessName}
              className="w-9 h-9 rounded-lg object-contain border border-[#E2EAE4]"
            />
          ) : (
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#16834A] text-white font-bold shadow-xs">
              <Store className="w-5 h-5" />
            </div>
          )}
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#105C35] leading-tight line-clamp-1">
              {profile?.businessName || t.appName}
            </h1>
            <p className="text-xs text-gray-500 hidden sm:block">
              {profile?.mobile ? `${profile.mobile}` : t.appTagline}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick New Sale Button */}
        <button
          onClick={() => onNavigate('createReceipt')}
          className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-[#16834A] hover:bg-[#105C35] rounded-lg shadow-sm transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="hidden sm:inline">{t.dashboard.quickSale}</span>
          <span className="sm:hidden">{language === 'bn' ? 'বিক্রয়' : 'Sale'}</span>
        </button>

        {/* Language Switcher */}
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5 border border-gray-200 text-xs font-semibold">
          <button
            onClick={() => setLanguage('bn')}
            className={`px-2 py-1 rounded-md transition-colors ${
              language === 'bn' ? 'bg-[#16834A] text-white shadow-xs' : 'text-gray-600 hover:text-black'
            }`}
          >
            বাংলা
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-2 py-1 rounded-md transition-colors ${
              language === 'en' ? 'bg-[#16834A] text-white shadow-xs' : 'text-gray-600 hover:text-black'
            }`}
          >
            EN
          </button>
        </div>

        {/* Low Stock Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowBellMenu(!showBellMenu);
              setShowUserMenu(false);
            }}
            className="p-2 text-gray-500 hover:text-[#16834A] hover:bg-[#EAF7EF] rounded-lg transition-colors relative"
            title={t.dashboard.lowStockAlerts}
          >
            <Bell className="w-5 h-5" />
            {lowStockItems.length > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-amber-600 rounded-full">
                {lowStockItems.length}
              </span>
            )}
          </button>

          {showBellMenu && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in">
              <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  {t.dashboard.lowStockAlerts}
                </span>
                <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                  {lowStockItems.length}
                </span>
              </div>
              <div className="max-h-60 overflow-y-auto divide-y divide-gray-50">
                {lowStockItems.length === 0 ? (
                  <p className="p-4 text-xs text-center text-gray-500">
                    {language === 'bn' ? 'সব পণ্যের পর্যাপ্ত স্টক আছে' : 'All items are well stocked'}
                  </p>
                ) : (
                  lowStockItems.map((p) => (
                    <div
                      key={p.id}
                      className="px-4 py-2.5 hover:bg-[#F7FAF8] cursor-pointer flex items-center justify-between text-xs"
                      onClick={() => {
                        onNavigate('products');
                        setShowBellMenu(false);
                      }}
                    >
                      <div>
                        <p className="font-semibold text-gray-800">{p.name}</p>
                        <p className="text-gray-500">SKU: {p.sku || '-'}</p>
                      </div>
                      <span className="font-bold text-red-600 bg-red-50 px-2 py-1 rounded">
                        {p.currentStock} {p.unit}
                      </span>
                    </div>
                  ))
                )}
              </div>
              {lowStockItems.length > 0 && (
                <div className="p-2 border-t border-gray-100 text-center">
                  <button
                    onClick={() => {
                      onNavigate('lowStock');
                      setShowBellMenu(false);
                    }}
                    className="text-xs font-semibold text-[#16834A] hover:underline"
                  >
                    {t.dashboard.viewAll}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowBellMenu(false);
            }}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#16834A]/10 text-[#16834A] flex items-center justify-center font-bold text-sm">
              {profile?.businessName ? profile.businessName.charAt(0).toUpperCase() : 'B'}
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800 line-clamp-1">{profile?.businessName}</p>
                <p className="text-xs text-gray-500 line-clamp-1">{profile?.email}</p>
              </div>
              <button
                onClick={() => {
                  onNavigate('businessProfile');
                  setShowUserMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[#EAF7EF] hover:text-[#16834A] flex items-center gap-2"
              >
                <Store className="w-4 h-4" />
                {t.nav.businessProfile}
              </button>
              <button
                onClick={() => {
                  onNavigate('settings');
                  setShowUserMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[#EAF7EF] hover:text-[#16834A] flex items-center gap-2"
              >
                <Globe className="w-4 h-4" />
                {t.nav.settings}
              </button>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={() => {
                  logout();
                  setShowUserMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                {t.nav.logout}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
