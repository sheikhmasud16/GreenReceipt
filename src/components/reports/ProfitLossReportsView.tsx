import React, { useState } from 'react';
import {
  TrendingUp,
  FileSpreadsheet,
  Printer,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  AlertCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
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

export const ProfitLossReportsView: React.FC = () => {
  const { receipts, expenses } = useBusinessData();
  const { t, language } = useLanguage();

  const [timeframe, setTimeframe] = useState<string>('month');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7);

  // Active receipts only (cancelled receipts excluded)
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

  const filteredExpenses = expenses.filter((e) => {
    if (timeframe === 'today') return e.date === todayStr;
    if (timeframe === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      return e.date >= weekAgo.toISOString().split('T')[0] && e.date <= todayStr;
    }
    if (timeframe === 'month') return e.date.startsWith(currentMonthStr);
    if (timeframe === 'year') return e.date.startsWith(todayStr.substring(0, 4));
    if (timeframe === 'custom') {
      if (customStart && e.date < customStart) return false;
      if (customEnd && e.date > customEnd) return false;
      return true;
    }
    return true;
  });

  // Financial Calculations
  const revenue = filteredReceipts.reduce((sum, r) => sum + r.grandTotal, 0);

  // Cost of Goods Sold (COGS) = Sum of (costPriceAtSale * quantity) for all items in completed receipts
  const cogs = filteredReceipts.reduce((sum, r) => {
    const receiptCost = r.items.reduce(
      (iSum, item) => iSum + (item.costPriceAtSale || 0) * item.quantity,
      0
    );
    return sum + receiptCost;
  }, 0);

  const grossProfit = revenue - cogs;
  const operatingExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - operatingExpenses;
  const profitMarginPercent = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : '0';

  // Chart data
  const comparisonData = [
    {
      name: language === 'bn' ? 'আয় ও ব্যয়' : 'Overview',
      Revenue: revenue,
      COGS: cogs,
      Expenses: operatingExpenses,
      NetProfit: netProfit,
    },
  ];

  const handleExportCSV = () => {
    const rows = [
      ['Statement', 'Profit & Loss Statement'],
      ['Timeframe', timeframe],
      ['Date Generated', todayStr],
      ['', ''],
      ['Total Sales Revenue (BDT)', revenue],
      ['Cost of Goods Sold - COGS (BDT)', cogs],
      ['Gross Profit (BDT)', grossProfit],
      ['Operating Expenses (BDT)', operatingExpenses],
      ['Net Profit (BDT)', netProfit],
      ['Profit Margin %', `${profitMarginPercent}%`],
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Profit_Loss_Report_${timeframe}_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-[#E2EAE4] shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-[#105C35]">{t.reports.profitLossTitle}</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {language === 'bn'
              ? 'বিক্রয়কালীন ক্রয়মূল্যের (COGS) ভিত্তিতে নিখুঁত মোট ও নীট লাভ প্রতিবেদন।'
              : 'Accrual gross & net profit accounting with product cost-price snapshots.'}
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

      {/* Main Financial KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Revenue */}
        <div className="bg-white p-4 rounded-2xl border border-[#E2EAE4] shadow-2xs">
          <span className="text-[11px] font-semibold text-gray-500">{t.reports.revenue}</span>
          <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(revenue, language)}</p>
        </div>

        {/* COGS */}
        <div className="bg-white p-4 rounded-2xl border border-[#E2EAE4] shadow-2xs">
          <span className="text-[11px] font-semibold text-gray-500">{t.reports.cogs}</span>
          <p className="text-lg font-bold text-gray-700 mt-1">{formatCurrency(cogs, language)}</p>
        </div>

        {/* Gross Profit */}
        <div className="bg-white p-4 rounded-2xl border border-[#E2EAE4] shadow-2xs">
          <span className="text-[11px] font-semibold text-gray-500">{t.reports.grossProfit}</span>
          <p className="text-lg font-bold text-emerald-700 mt-1">
            {formatCurrency(grossProfit, language)}
          </p>
        </div>

        {/* Operating Expenses */}
        <div className="bg-white p-4 rounded-2xl border border-[#E2EAE4] shadow-2xs">
          <span className="text-[11px] font-semibold text-gray-500">
            {t.reports.operatingExpenses}
          </span>
          <p className="text-lg font-bold text-red-600 mt-1">
            {formatCurrency(operatingExpenses, language)}
          </p>
        </div>

        {/* Net Profit */}
        <div
          className={`p-4 rounded-2xl border shadow-2xs ${
            netProfit >= 0 ? 'bg-[#EAF7EF] border-[#16834A]/30' : 'bg-red-50 border-red-200'
          }`}
        >
          <span className="text-[11px] font-bold text-[#105C35]">{t.reports.netProfit}</span>
          <p
            className={`text-xl font-bold mt-1 ${
              netProfit >= 0 ? 'text-[#105C35]' : 'text-red-700'
            }`}
          >
            {formatCurrency(netProfit, language)}
          </p>
        </div>

        {/* Profit Margin */}
        <div className="bg-white p-4 rounded-2xl border border-[#E2EAE4] shadow-2xs">
          <span className="text-[11px] font-semibold text-gray-500">{t.reports.profitMargin}</span>
          <p className="text-lg font-bold text-[#16834A] mt-1">{profitMarginPercent}%</p>
        </div>
      </div>

      {/* Accounting Invariant Notice */}
      <div className="flex items-start gap-2.5 p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
        <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">{language === 'bn' ? 'হিসাববিজ্ঞান নীতি:' : 'Accounting Standard:'}</p>
          <p className="mt-0.5">{t.reports.accrualNote}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-5 rounded-2xl border border-[#E2EAE4] shadow-xs">
        <h3 className="text-sm font-bold text-gray-800 mb-4">
          {language === 'bn' ? 'আয়, ব্যয় ও লাভের আর্থিক তুলনা' : 'Revenue, COGS, Expenses & Net Profit'}
        </h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip formatter={(value: any) => [`৳${Number(value).toLocaleString()}`]} />
              <Legend />
              <Bar dataKey="Revenue" fill="#2563EB" name={t.reports.revenue} radius={[6, 6, 0, 0]} />
              <Bar dataKey="COGS" fill="#6B7280" name={t.reports.cogs} radius={[6, 6, 0, 0]} />
              <Bar
                dataKey="Expenses"
                fill="#DC2626"
                name={t.reports.operatingExpenses}
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="NetProfit"
                fill="#16834A"
                name={t.reports.netProfit}
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
