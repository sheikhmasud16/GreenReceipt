import React from 'react';
import {
  DollarSign,
  TrendingUp,
  Package,
  Users,
  FileText,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Eye,
  PlusCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface DashboardViewProps {
  onNavigate: (view: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { products, receipts, customers, expenses } = useBusinessData();
  const { t, language } = useLanguage();

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM

  // Exclude cancelled receipts
  const activeReceipts = receipts.filter((r) => r.status !== 'cancelled');

  // Today's Sales & Profit
  const todayReceipts = activeReceipts.filter((r) => r.date === todayStr);
  const todaySales = todayReceipts.reduce((sum, r) => sum + r.grandTotal, 0);

  // Profit Calculation helper:
  // For each receipt item: Product Profit = (Selling Price - Cost Price at Sale) * Quantity
  // Gross Profit = Sum of item profits - overall discount
  const calculateReceiptProfit = (receipt: (typeof activeReceipts)[0]) => {
    const itemProfits = receipt.items.reduce((sum, item) => {
      const margin = (item.sellingPrice - (item.costPriceAtSale || 0)) * item.quantity - (item.discount || 0);
      return sum + margin;
    }, 0);
    return itemProfits - (receipt.overallDiscount || 0);
  };

  const todayProfit = todayReceipts.reduce((sum, r) => sum + calculateReceiptProfit(r), 0);

  // This Month's Sales & Profit
  const monthReceipts = activeReceipts.filter((r) => r.date.startsWith(currentMonthStr));
  const monthSales = monthReceipts.reduce((sum, r) => sum + r.grandTotal, 0);
  const monthGrossProfit = monthReceipts.reduce((sum, r) => sum + calculateReceiptProfit(r), 0);

  // This Month's Expenses
  const monthExpenses = expenses
    .filter((e) => e.date.startsWith(currentMonthStr))
    .reduce((sum, e) => sum + e.amount, 0);
  const monthNetProfit = monthGrossProfit - monthExpenses;

  // Inventory Totals
  const totalStockValue = products.reduce((sum, p) => sum + p.currentStock * p.purchasePrice, 0);
  const lowStockItems = products.filter(
    (p) => p.currentStock <= (p.minimumStock || 5) && p.currentStock >= 0
  );

  // Total Outstanding Customer Due
  const totalOutstandingDue = customers.reduce((sum, c) => sum + (c.totalDue || 0), 0);

  // --- Chart 1: Last 7 Days Sales Trend ---
  const last7Days: { date: string; label: string; sales: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
      weekday: 'short',
    });
    const dayTotal = activeReceipts
      .filter((r) => r.date === dStr)
      .reduce((sum, r) => sum + r.grandTotal, 0);

    last7Days.push({
      date: dStr,
      label: dayLabel,
      sales: dayTotal,
    });
  }

  // --- Chart 2: Top Selling Products ---
  const productSalesMap = new Map<string, { name: string; qty: number; revenue: number }>();
  activeReceipts.forEach((r) => {
    r.items.forEach((item) => {
      const existing = productSalesMap.get(item.productId) || {
        name: item.productName,
        qty: 0,
        revenue: 0,
      };
      existing.qty += item.quantity;
      existing.revenue += item.lineTotal;
      productSalesMap.set(item.productId, existing);
    });
  });
  const topProducts = Array.from(productSalesMap.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // --- Chart 3: Expense Category Breakdown ---
  const expenseCatMap = new Map<string, number>();
  expenses
    .filter((e) => e.date.startsWith(currentMonthStr))
    .forEach((e) => {
      expenseCatMap.set(e.category, (expenseCatMap.get(e.category) || 0) + e.amount);
    });
  const expensePieData = Array.from(expenseCatMap.entries()).map(([cat, amount]) => ({
    name: t.expenses.categories[cat as keyof typeof t.expenses.categories] || cat,
    value: amount,
  }));
  const PIE_COLORS = ['#16834A', '#2563EB', '#F59E0B', '#DC2626', '#8B5CF6', '#EC4899', '#14B8A6'];

  // Stat Cards Configuration
  const stats = [
    {
      title: t.dashboard.todaySales,
      value: formatCurrency(todaySales, language),
      icon: DollarSign,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      badge: `${todayReceipts.length} ${t.nav.allSales}`,
    },
    {
      title: t.dashboard.todayProfit,
      value: formatCurrency(todayProfit, language),
      icon: TrendingUp,
      color: 'bg-green-50 text-green-700 border-green-200',
      badge: language === 'bn' ? 'দৈনিক লাভ' : 'Daily Margin',
    },
    {
      title: t.dashboard.monthSales,
      value: formatCurrency(monthSales, language),
      icon: DollarSign,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      badge: `${monthReceipts.length} ${language === 'bn' ? 'বিক্রয়' : 'Sales'}`,
    },
    {
      title: t.dashboard.monthProfit,
      value: formatCurrency(monthNetProfit, language),
      icon: TrendingUp,
      color: 'bg-teal-50 text-teal-700 border-teal-200',
      badge: language === 'bn' ? 'নীট লাভ' : 'Net Profit',
    },
    {
      title: t.dashboard.stockValue,
      value: formatCurrency(totalStockValue, language),
      icon: Package,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      badge: `${products.length} ${t.nav.products}`,
    },
    {
      title: t.dashboard.totalDue,
      value: formatCurrency(totalOutstandingDue, language),
      icon: ArrowDownRight,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      badge: `${customers.length} ${t.nav.customers}`,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-[#16834A] to-[#105C35] text-white p-6 rounded-2xl shadow-sm">
        <div>
          <span className="inline-block px-2.5 py-0.5 bg-white/20 rounded-full text-xs font-semibold mb-2">
            {language === 'bn' ? 'ব্যবসায়িক পরিস্থিতি নিয়ন্ত্রণ' : 'Business Overview'}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold">{t.appName}</h2>
          <p className="text-xs sm:text-sm text-green-100 mt-1">
            {language === 'bn'
              ? 'আজকের লাইভ বিক্রয়, লাভ ও ইনভেন্টরির হালনাগাদ তথ্য।'
              : 'Real-time sales, profits, and inventory analytics for your business.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('createReceipt')}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#105C35] hover:bg-green-50 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-[#16834A]" />
            <span>{t.dashboard.quickSale}</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={idx}
              className="bg-white p-4 rounded-2xl border border-[#E2EAE4] shadow-2xs hover:shadow-sm transition-shadow flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-gray-500 line-clamp-1">{s.title}</span>
                <div className={`p-1.5 rounded-lg border ${s.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
                  {s.value}
                </h3>
                <span className="inline-block mt-1 text-[10px] font-medium text-gray-400">
                  {s.badge}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Sales Trend Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-[#E2EAE4] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-800">{t.dashboard.dailySalesTrend}</h3>
              <p className="text-xs text-gray-400">
                {language === 'bn' ? 'গত ৭ দিনের দৈনিক বিক্রয় প্রবাহ' : 'Last 7 days sales revenue'}
              </p>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last7Days}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16834A" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#16834A" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" stroke="#888" fontSize={11} />
                <YAxis stroke="#888" fontSize={11} />
                <Tooltip
                  formatter={(value: any) => [`৳${Number(value).toLocaleString()}`, t.common.total]}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#16834A"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#salesGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Breakdown Pie (1 col) */}
        <div className="bg-white p-5 rounded-2xl border border-[#E2EAE4] shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-800">{t.dashboard.expenseBreakdown}</h3>
            <p className="text-xs text-gray-400">
              {language === 'bn' ? 'চলতি মাসের বিভিন্ন খাতের খরচ' : 'Current month expense categories'}
            </p>
          </div>

          <div className="h-56 w-full my-auto">
            {expensePieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                {language === 'bn' ? 'চলতি মাসে কোনো খরচ নেই' : 'No expenses recorded this month'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {expensePieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`৳${Number(value).toLocaleString()}`]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-xs">
            <span className="text-gray-500">{t.expenses.totalExpensesThisMonth}:</span>
            <span className="font-bold text-gray-900">{formatCurrency(monthExpenses, language)}</span>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Sales & Low Stock Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E2EAE4] shadow-xs p-5">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
            <h3 className="text-sm font-bold text-gray-800">{t.dashboard.recentSales}</h3>
            <button
              onClick={() => onNavigate('allSales')}
              className="text-xs font-semibold text-[#16834A] hover:underline"
            >
              {t.dashboard.viewAll} →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">{t.receipt.receiptNumber}</th>
                  <th className="py-2.5 px-3">{t.receipt.customerName}</th>
                  <th className="py-2.5 px-3 text-right">{t.common.total}</th>
                  <th className="py-2.5 px-3 text-right">{t.common.paid}</th>
                  <th className="py-2.5 px-3 text-center">{t.common.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeReceipts.slice(0, 5).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-400">
                      {language === 'bn' ? 'কোনো বিক্রয় পাওয়া যায়নি' : 'No sales yet'}
                    </td>
                  </tr>
                ) : (
                  activeReceipts.slice(0, 5).map((r) => (
                    <tr key={r.id} className="hover:bg-[#F7FAF8]">
                      <td className="py-2.5 px-3 font-mono font-bold text-gray-900">{r.receiptNumber}</td>
                      <td className="py-2.5 px-3 font-medium text-gray-800">{r.customerName}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-gray-900">
                        {formatCurrency(r.grandTotal, language)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-green-700 font-medium">
                        {formatCurrency(r.paidAmount, language)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.paymentStatus === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : r.paymentStatus === 'partial'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {r.paymentStatus === 'paid'
                            ? t.receipt.paymentStatus.paid
                            : r.paymentStatus === 'partial'
                            ? t.receipt.paymentStatus.partial
                            : t.receipt.paymentStatus.unpaid}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts (1 col) */}
        <div className="bg-white rounded-2xl border border-[#E2EAE4] shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-gray-800">{t.dashboard.lowStockItems}</h3>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                {lowStockItems.length}
              </span>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {lowStockItems.length === 0 ? (
                <p className="text-xs text-center text-gray-400 py-6">
                  {language === 'bn' ? 'সব পণ্য পর্যাপ্ত পরিমাণে স্টকে আছে।' : 'All products have adequate stock.'}
                </p>
              ) : (
                lowStockItems.slice(0, 6).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{p.name}</p>
                      <span className="text-[10px] text-gray-400">SKU: {p.sku || '-'}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-red-600 block">
                        {p.currentStock} {p.unit}
                      </span>
                      <span className="text-[10px] text-gray-400">Min: {p.minimumStock}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 text-center">
            <button
              onClick={() => onNavigate('purchases')}
              className="w-full py-2 text-xs font-bold text-white bg-[#16834A] hover:bg-[#105C35] rounded-xl transition-colors shadow-xs"
            >
              {language === 'bn' ? '+ নতুন স্টক ক্রয় করুন' : '+ Purchase New Stock'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
