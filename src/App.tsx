import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { BusinessDataProvider } from './context/BusinessDataContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { AuthView } from './components/auth/AuthView';
import { DashboardView } from './components/dashboard/DashboardView';
import { CreateReceiptView } from './components/receipts/CreateReceiptView';
import { AllSalesView } from './components/receipts/AllSalesView';
import { InventoryView } from './components/inventory/InventoryView';
import { LowStockView } from './components/inventory/LowStockView';
import { StockPurchasesView } from './components/purchases/StockPurchasesView';
import { CustomersView } from './components/customers/CustomersView';
import { SuppliersView } from './components/suppliers/SuppliersView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { SalesReportsView } from './components/reports/SalesReportsView';
import { ProfitLossReportsView } from './components/reports/ProfitLossReportsView';
import { BusinessProfileView } from './components/profile/BusinessProfileView';
import { Receipt } from './types';

const MainAppContent: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const { t } = useLanguage();

  const [activeView, setActiveView] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [duplicateReceipt, setDuplicateReceipt] = useState<Receipt | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7FAF8]">
        <div className="w-12 h-12 rounded-2xl bg-[#16834A] text-white flex items-center justify-center font-bold text-2xl shadow-md animate-bounce mb-3">
          ৳
        </div>
        <p className="text-sm font-semibold text-[#105C35]">{t.common.loading}</p>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthView />;
  }

  const handleDuplicate = (receipt: Receipt) => {
    setDuplicateReceipt(receipt);
    setActiveView('createReceipt');
  };

  const handleReceiptSaved = () => {
    setDuplicateReceipt(null);
  };

  return (
    <div className="min-h-screen bg-[#F7FAF8] flex flex-col text-[#202B25]">
      {/* Navbar */}
      <Navbar
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onNavigate={(view) => setActiveView(view)}
        activeView={activeView}
      />

      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeView={activeView}
          onNavigate={(view) => {
            if (view !== 'createReceipt') setDuplicateReceipt(null);
            setActiveView(view);
          }}
        />

        {/* Main Content Area */}
        <main className="flex-1 lg:pl-64 p-4 sm:p-6 lg:p-8 min-w-0 transition-all">
          {activeView === 'dashboard' && <DashboardView onNavigate={(view) => setActiveView(view)} />}
          {activeView === 'createReceipt' && (
            <CreateReceiptView
              onSaved={handleReceiptSaved}
              duplicateReceipt={duplicateReceipt}
            />
          )}
          {activeView === 'allSales' && <AllSalesView onDuplicate={handleDuplicate} />}
          {activeView === 'products' && <InventoryView />}
          {activeView === 'lowStock' && <LowStockView onNavigate={(view) => setActiveView(view)} />}
          {activeView === 'purchases' && <StockPurchasesView />}
          {activeView === 'customers' && <CustomersView />}
          {activeView === 'suppliers' && <SuppliersView />}
          {activeView === 'expenses' && <ExpensesView />}
          {activeView === 'salesReports' && <SalesReportsView />}
          {activeView === 'profitLossReports' && <ProfitLossReportsView />}
          {(activeView === 'businessProfile' || activeView === 'settings') && <BusinessProfileView />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <BusinessDataProvider>
          <MainAppContent />
        </BusinessDataProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
