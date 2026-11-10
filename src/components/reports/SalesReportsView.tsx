import React, { useState } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  FileSpreadsheet,
  DollarSign,
  Receipt,
  Package,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const SalesReportsView: React.FC = () => {
  const { receipts } = useBusinessData();
  const { t, language } = useLanguage();

  const [timeframe, setTimeframe] = useState<string>('month');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7);

  // Filter receipts by timeframe & exclude cancelled
  const activeReceipts = receipts.filter((r) => r.status !== 'cancelled');

  const filteredReceipts = activeReceipts.filter((r) => {
    if (timeframe === 'today') return r.date === todayStr;
    if (timeframe === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      return r.date >= weekAgo.toISOString().split('T')[0] && r.date <= todayStr;
    }
    if (timeframe === 'month') return r.date.startsWith(currentMonthStr);
    if (timeframe === 'year') return r.date.startsWith(todayStr.substring(0, 4));
    if (timeframe === 'custom') {
      if (customStart && r.date < customStart) return false;
      if (customEnd && r.date > customEnd) return false;
      return true;
    }
    return true;
  });

  // Aggregations
  const totalSales = filteredReceipts.reduce((sum, r) => sum + r.grandTotal, 0);
  const totalReceiptsCount = filteredReceipts.length;
  const totalItemsSold = filteredReceipts.reduce(
    (sum, r) => sum + r.items.reduce((iSum, item) => iSum + item.quantity, 0),
    0
  );
  const totalDiscount = filteredReceipts.reduce(
    (sum, r) => sum + (r.overallDiscount || 0) + (r.itemDiscount || 0),
    0
  );
  const totalPaid = filteredReceipts.reduce((sum, r) => sum + r.paidAmount, 0);
  const totalDue = filteredReceipts.reduce((sum, r) => sum + r.dueAmount, 0);
  const averageSalesValue = totalReceiptsCount > 0 ? totalSales / totalReceiptsCount : 0;

  // Payment methods breakdown
  const paymentBreakdownMap = new Map<string, number>();
  filteredReceipts.forEach((r) => {
    paymentBreakdownMap.set(
      r.paymentMethod,
      (paymentBreakdownMap.get(r.paymentMethod) || 0) + r.grandTotal
    );
  });
  const paymentChartData = Array.from(paymentBreakdownMap.entries()).map(([method, total]) => ({
    name: t.receipt.paymentMethods[method as keyof typeof t.receipt.paymentMethods] || method,
    total,
  }));
  const PIE_COLORS = ['#16834A', '#2563EB', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6'];

  // Export to CSV / Excel
  const handleExportCSV = () => {
    const headers = ['Receipt #', 'Date', 'Customer', 'Items Count', 'Total (BDT)', 'Paid', 'Due', 'Status'];
    const rows = filteredReceipts.map((r) => [
      r.receiptNumber,
      r.date,
      `"${r.customerName}"`,
      r.items.length,
      r.grandTotal,
      r.paidAmount,
      r.dueAmount,
      r.paymentStatus,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sales_Report_${timeframe}_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-[#E2EAE4] shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-[#105C35]">{t.reports.salesTitle}</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {language === 'bn'
              ? 'বিক্রয় পরিসংখ্যান, দৈনিক ও মাসিক আয় ও পেমেন্ট মাধ্যমের বিশ্লেষণ।'
              : 'Sales volume, total revenue, average order value, and payment method statistics.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe selector */}
          <div className="flex bg-gray-100 rounded-xl p-1 text-xs font-semibold border border-gray-200">
            <button
              onClick={() => setTimeframe('today')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                timeframe === 'today' ? 'bg-[#16834A] text-white shadow-xs' : 'text-gray-600'
              }`}
            >
              {t.reports.today}
            </button>
            <button
              onClick={() => setTimeframe('week')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                timeframe === 'week' ? 'bg-[#16834A] text-white shadow-xs' : 'text-gray-600'
              }`}
            >
              {t.reports.thisWeek}
            </button>
            <button
              onClick={() => setTimeframe('month')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                timeframe === 'month' ? 'bg-[#16834A] text-white shadow-xs' : 'text-gray-600'
              }`}
            >
              {t.reports.thisMonth}
            </button>
            <button
              onClick={() => setTimeframe('year')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                timeframe === 'year' ? 'bg-[#16834A] text-white shadow-xs' : 'text-gray-600'
              }`}
            >
              {t.reports.thisYear}
            </button>
            <button
              onClick={() => setTimeframe('custom')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                timeframe === 'custom' ? 'bg-[#16834A] text-white shadow-xs' : 'text-gray-600'
              }`}
            >
              {t.reports.customRange}
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-gray-300 rounded-xl hover:bg-gray-50 text-gray-700"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>{t.reports.exportExcel}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-[#16834A] text-white rounded-xl hover:bg-[#105C35]"
          >
            <Printer className="w-4 h-4" />
            <span>{t.common.print}</span>
          </button>
        </div>
      </div>

      {/* Custom Date Pickers */}
      {timeframe === 'custom' && (
        <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-[#E2EAE4] shadow-xs text-xs">
          <span className="font-semibold text-gray-700">{t.reports.customRange}:</span>
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="px-3 py-1.5 border rounded-lg"
          />
          <span className="text-gray-400">-</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="px-3 py-1.5 border rounded-lg"
          />
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#E2EAE4] shadow-2xs">
          <span className="text-[11px] font-semibold text-gray-500">{t.reports.revenue}</span>
          <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(totalSales, language)}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E2EAE4] shadow-2xs">
          <span className="text-[11px] font-semibold text-gray-500">{t.dashboard.totalReceipts}</span>
          <p className="text-xl font-bold text-gray-900 mt-1">{totalReceiptsCount}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E2EAE4] shadow-2xs">
          <span className="text-[11px] font-semibold text-gray-500">
            {language === 'bn' ? 'মোট বিক্রিত পণ্য (পরিমাণ)' : 'Items Sold'}
          </span>
          <p className="text-xl font-bold text-gray-900 mt-1">{totalItemsSold}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E2EAE4] shadow-2xs">
          <span className="text-[11px] font-semibold text-gray-500">
            {language === 'bn' ? 'গড় বিক্রয় মান' : 'Avg. Sales Value'}
          </span>
          <p className="text-xl font-bold text-emerald-700 mt-1">
            {formatCurrency(averageSalesValue, language)}
          </p>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#E2EAE4] shadow-2xs">
          <span className="text-[11px] font-semibold text-gray-500">{t.common.paid}</span>
          <p className="text-lg font-bold text-green-700 mt-0.5">{formatCurrency(totalPaid, language)}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#E2EAE4] shadow-2xs">
          <span className="text-[11px] font-semibold text-gray-500">{t.common.due}</span>
          <p className="text-lg font-bold text-red-600 mt-0.5">{formatCurrency(totalDue, language)}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#E2EAE4] shadow-2xs">
          <span className="text-[11px] font-semibold text-gray-500">{t.common.discount}</span>
          <p className="text-lg font-bold text-gray-700 mt-0.5">{formatCurrency(totalDiscount, language)}</p>
        </div>
      </div>

      {/* Payment Methods Chart */}
      <div className="bg-white p-5 rounded-2xl border border-[#E2EAE4] shadow-xs">
        <h3 className="text-sm font-bold text-gray-800 mb-4">
          {language === 'bn' ? 'পেমেন্ট মাধ্যম অনুসারে বিক্রয়' : 'Sales by Payment Method'}
        </h3>
        <div className="h-64 w-full">
          {paymentChartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-gray-400">
              {t.common.noDataFound}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(value: any) => [`৳${Number(value).toLocaleString()}`, t.common.total]} />
                <Bar dataKey="total" fill="#16834A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
