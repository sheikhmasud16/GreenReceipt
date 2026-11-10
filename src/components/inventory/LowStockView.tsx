import React from 'react';
import { AlertTriangle, Plus, Package, ShoppingBag } from 'lucide-react';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatCurrency } from '../../utils/formatters';

interface LowStockViewProps {
  onNavigate: (view: string) => void;
}

export const LowStockView: React.FC<LowStockViewProps> = ({ onNavigate }) => {
  const { products } = useBusinessData();
  const { t, language } = useLanguage();

  const lowStockProducts = products.filter(
    (p) => p.currentStock <= (p.minimumStock || 5)
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-[#E2EAE4] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-bold text-[#105C35]">{t.nav.lowStock}</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {language === 'bn'
              ? 'যে সকল পণ্যের স্টক সর্বনিম্ন সীমার নিচে নেমে গেছে বা স্টক শেষ হয়ে গেছে।'
              : 'Products that have reached minimum stock threshold or are completely out of stock.'}
          </p>
        </div>

        <button
          onClick={() => onNavigate('purchases')}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#16834A] hover:bg-[#105C35] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>{language === 'bn' ? '+ নতুন স্টক ক্রয় করুন' : '+ Purchase Stock'}</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E2EAE4] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#F7FAF8] border-b border-[#E2EAE4] text-gray-600 font-semibold">
              <tr>
                <th className="py-3 px-4">{t.inventory.productName}</th>
                <th className="py-3 px-4">{t.inventory.category}</th>
                <th className="py-3 px-4 text-center">{t.inventory.currentStock}</th>
                <th className="py-3 px-4 text-center">{t.inventory.minimumStockAlert}</th>
                <th className="py-3 px-4 text-right">{t.inventory.purchasePrice}</th>
                <th className="py-3 px-4 text-center">{t.inventory.stockStatus}</th>
                <th className="py-3 px-4 text-center">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lowStockProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    {language === 'bn'
                      ? 'অভিনন্দন! কোনো পণ্যের স্টক কম নেই।'
                      : 'Great news! All products are well stocked.'}
                  </td>
                </tr>
              ) : (
                lowStockProducts.map((p) => {
                  const isOutOfStock = p.currentStock <= 0;
                  return (
                    <tr key={p.id} className="hover:bg-red-50/40">
                      <td className="py-3 px-4">
                        <p className="font-bold text-gray-900">{p.name}</p>
                        <span className="text-xs text-gray-400 font-mono">SKU: {p.sku || '-'}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{p.category || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-red-600 text-sm">
                          {p.currentStock} {p.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-gray-500">
                        {p.minimumStock} {p.unit}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-700">
                        {formatCurrency(p.purchasePrice, language)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            isOutOfStock
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isOutOfStock ? t.inventory.outOfStock : t.inventory.lowStock}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onNavigate('purchases')}
                          className="px-3 py-1 bg-[#16834A] text-white hover:bg-[#105C35] rounded-lg text-xs font-semibold shadow-2xs"
                        >
                          {t.dashboard.restock}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
