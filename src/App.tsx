import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ShopProvider, useShop } from './context/ShopContext';
import { Header } from './components/Header';
import { DesktopSidebar, NavigationTab } from './components/DesktopSidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { QuickActionModal } from './components/QuickActionModal';

// Pages
import { Dashboard } from './pages/Dashboard';
import { Repairs } from './pages/Repairs';
import { POSSales } from './pages/POSSales';
import { Inventory } from './pages/Inventory';
import { StockLedger } from './pages/StockLedger';
import { Customers } from './pages/Customers';
import { CustomerDues } from './pages/CustomerDues';
import { Suppliers } from './pages/Suppliers';
import { Purchases } from './pages/Purchases';
import { StaffManagement } from './pages/Staff';
import { Expenses } from './pages/Expenses';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { AuditLogs } from './pages/AuditLogs';

const MainAppContent: React.FC = () => {
  const { toasts, removeToast, isLoading, error } = useShop();
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [tabMeta, setTabMeta] = useState<any>(null);

  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showQuickAction, setShowQuickAction] = useState(false);

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowGlobalSearch((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigate = (tab: NavigationTab, meta?: any) => {
    setCurrentTab(tab);
    setTabMeta(meta || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickAction = (actionKey: string, targetTab: NavigationTab) => {
    let meta: any = null;
    if (actionKey === 'new_repair') meta = { openNewModal: true };
    else if (actionKey === 'stock_in') meta = { openAddModal: true };
    else if (actionKey === 'new_purchase') meta = { openNewPurchase: true };
    else if (actionKey === 'shop_expense') meta = { openAddExpense: true };
    handleNavigate(targetTab, meta);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <Header
        onOpenGlobalSearch={() => setShowGlobalSearch(true)}
        onOpenQuickAction={() => setShowQuickAction(true)}
        onOpenNotifications={() => {}}
      />

      {/* Main Layout Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* Desktop Left Sidebar */}
        <DesktopSidebar
          currentTab={currentTab}
          onSelectTab={(tab) => handleNavigate(tab)}
        />

        {/* Dynamic Main Workspace Content */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 pb-24 lg:pb-12 max-w-full overflow-x-hidden">
          {isLoading ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-300">
                Loading Sumaiya Telecom records...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-950/60 border border-red-800 rounded-2xl text-red-200 text-sm">
              <p className="font-bold">Database connection notice:</p>
              <p className="mt-1">{error}</p>
            </div>
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <Dashboard
                  onNavigate={handleNavigate}
                  onOpenQuickAction={() => setShowQuickAction(true)}
                />
              )}

              {currentTab === 'repairs' && (
                <Repairs
                  key={tabMeta?.selectedRepairId || 'repairs-main'}
                  initialRepairId={tabMeta?.selectedRepairId}
                  initialOpenNewModal={Boolean(tabMeta?.openNewModal)}
                />
              )}

              {currentTab === 'pos' && <POSSales />}

              {currentTab === 'inventory' && (
                <Inventory
                  key={tabMeta?.selectedProductId || 'inventory-main'}
                  initialProductId={tabMeta?.selectedProductId}
                  initialOpenAddModal={Boolean(tabMeta?.openAddModal)}
                />
              )}

              {currentTab === 'stock-ledger' && <StockLedger />}

              {currentTab === 'customers' && (
                <Customers
                  key={tabMeta?.selectedCustomerId || 'customers-main'}
                  initialCustomerId={tabMeta?.selectedCustomerId}
                />
              )}

              {currentTab === 'dues' && <CustomerDues />}

              {currentTab === 'suppliers' && <Suppliers />}

              {currentTab === 'purchases' && (
                <Purchases initialOpenNewPurchase={Boolean(tabMeta?.openNewPurchase)} />
              )}

              {currentTab === 'staff' && <StaffManagement />}

              {currentTab === 'expenses' && (
                <Expenses initialOpenAddExpense={Boolean(tabMeta?.openAddExpense)} />
              )}

              {currentTab === 'reports' && <Reports />}

              {currentTab === 'settings' && <Settings />}

              {currentTab === 'audit' && <AuditLogs />}
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => handleNavigate(tab)}
      />

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
        onNavigate={handleNavigate}
      />

      {/* Quick Action Hub Modal */}
      <QuickActionModal
        isOpen={showQuickAction}
        onClose={() => setShowQuickAction(false)}
        onSelectAction={handleQuickAction}
      />

      {/* Floating Toast Notifications */}
      <div className="fixed bottom-20 lg:bottom-6 right-4 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={`pointer-events-auto px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center justify-between space-x-3 transition transform duration-200 animate-in slide-in-from-bottom-2 ${
              toast.type === 'error'
                ? 'bg-red-600 text-white'
                : toast.type === 'info'
                ? 'bg-blue-600 text-white'
                : 'bg-emerald-600 text-white'
            }`}
          >
            <span>{toast.message}</span>
            <button className="text-white/80 hover:text-white ml-2 text-sm font-bold">
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ShopProvider>
        <MainAppContent />
      </ShopProvider>
    </AuthProvider>
  );
}
