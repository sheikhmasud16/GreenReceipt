import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  SlidersHorizontal,
  History,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useLanguage } from '../../context/LanguageContext';
import { Product, TransactionType } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Modal } from '../common/Modal';

export const InventoryView: React.FC = () => {
  const { products, createProduct, updateProduct, deleteProduct, adjustStock, transactions } =
    useBusinessData();
  const { t, language } = useLanguage();

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<string>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<Product | null>(null);

  // Selected Product
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: '',
    description: '',
    purchasePrice: 0,
    sellingPrice: 0,
    openingStock: 0,
    currentStock: 0,
    minimumStock: 5,
    unit: 'পিস (Pcs)',
    imageUrl: '',
  });

  // Adjust Stock Form
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustType, setAdjustType] = useState<TransactionType>('adjustment');
  const [adjustNotes, setAdjustNotes] = useState<string>('');
  const [isAdjusting, setIsAdjusting] = useState<boolean>(false);

  // Categories list
  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      p.name.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.toLowerCase().includes(q));

    const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;

    let matchStock = true;
    if (stockStatusFilter === 'inStock') matchStock = p.currentStock > (p.minimumStock || 5);
    else if (stockStatusFilter === 'lowStock')
      matchStock = p.currentStock > 0 && p.currentStock <= (p.minimumStock || 5);
    else if (stockStatusFilter === 'outOfStock') matchStock = p.currentStock <= 0;

    return matchSearch && matchCategory && matchStock;
  });

  // Inventory Totals
  const totalStockUnits = products.reduce((sum, p) => sum + p.currentStock, 0);
  const totalPurchaseValue = products.reduce((sum, p) => sum + p.currentStock * p.purchasePrice, 0);
  const totalPotentialSales = products.reduce((sum, p) => sum + p.currentStock * p.sellingPrice, 0);
  const lowStockCount = products.filter(
    (p) => p.currentStock <= (p.minimumStock || 5) && p.currentStock >= 0
  ).length;

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      barcode: '',
      category: categories[0] || (language === 'bn' ? 'সাধারণ' : 'General'),
      description: '',
      purchasePrice: 0,
      sellingPrice: 0,
      openingStock: 0,
      currentStock: 0,
      minimumStock: 5,
      unit: language === 'bn' ? 'পিস' : 'Pcs',
      imageUrl: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setSelectedProduct(prod);
    setFormData({
      name: prod.name,
      sku: prod.sku || '',
      barcode: prod.barcode || '',
      category: prod.category || '',
      description: prod.description || '',
      purchasePrice: prod.purchasePrice,
      sellingPrice: prod.sellingPrice,
      openingStock: prod.openingStock,
      currentStock: prod.currentStock,
      minimumStock: prod.minimumStock,
      unit: prod.unit,
      imageUrl: prod.imageUrl || '',
    });
    setIsEditModalOpen(true);
  };

  const handleOpenAdjust = (prod: Product) => {
    setSelectedProduct(prod);
    setAdjustQty(1);
    setAdjustType('adjustment');
    setAdjustNotes('');
    setIsAdjustModalOpen(true);
  };

  const handleOpenHistory = (prod: Product) => {
    setSelectedProduct(prod);
    setIsHistoryModalOpen(true);
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      await createProduct({
        ...formData,
        currentStock: formData.openingStock,
      });
      setIsAddModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save product');
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !formData.name) return;

    try {
      await updateProduct(selectedProduct.id, {
        name: formData.name,
        sku: formData.sku,
        barcode: formData.barcode,
        category: formData.category,
        description: formData.description,
        purchasePrice: Number(formData.purchasePrice) || 0,
        sellingPrice: Number(formData.sellingPrice) || 0,
        minimumStock: Number(formData.minimumStock) || 0,
        unit: formData.unit,
        imageUrl: formData.imageUrl,
      });
      setIsEditModalOpen(false);
      setSelectedProduct(null);
    } catch (err) {
      console.error(err);
      alert('Failed to update product');
    }
  };

  const handleConfirmAdjust = async () => {
    if (!selectedProduct) return;
    setIsAdjusting(true);
    try {
      // Calculate delta: if damage or return (out), it's negative
      let delta = adjustQty;
      if (adjustType === 'damage') {
        delta = -Math.abs(adjustQty);
      } else if (adjustType === 'adjustment') {
        delta = adjustQty; // can be positive or negative
      }

      await adjustStock(selectedProduct.id, delta, adjustType, adjustNotes);
      setIsAdjustModalOpen(false);
      setSelectedProduct(null);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Stock adjustment failed');
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmProduct) return;
    try {
      await deleteProduct(deleteConfirmProduct.id);
      setDeleteConfirmProduct(null);
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    }
  };

  // Get transactions for selected product in history modal
  const productTransactions = selectedProduct
    ? transactions.filter((t) => t.productId === selectedProduct.id)
    : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-[#E2EAE4] shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-[#105C35]">{t.inventory.title}</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {language === 'bn'
              ? 'সকল পণ্য, বিক্রয় ও ক্রয়মূল্য, বর্তমান স্টক ও সতর্কতা নিয়ন্ত্রণ করুন।'
              : 'Manage inventory items, SKUs, barcodes, selling prices, and stock adjustments.'}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#16834A] hover:bg-[#105C35] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{t.inventory.addProduct}</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#E2EAE4] shadow-2xs">
          <span className="text-[11px] font-semibold text-gray-500">{t.dashboard.totalProducts}</span>
          <p className="text-xl font-bold text-gray-900 mt-1">{products.length}</p>
          <span className="text-[10px] text-gray-400">
            {categories.length} {language === 'bn' ? 'ক্যাটাগরি' : 'Categories'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E2EAE4] shadow-2xs">
          <span className="text-[11px] font-semibold text-gray-500">{t.inventory.totalUnits}</span>
          <p className="text-xl font-bold text-gray-900 mt-1">{totalStockUnits}</p>
          <span className="text-[10px] text-gray-400">
            {language === 'bn' ? 'মোট মজুত পরিমাণ' : 'Total quantity in stock'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E2EAE4] shadow-2xs">
          <span className="text-[11px] font-semibold text-gray-500">{t.inventory.inventoryValue}</span>
          <p className="text-xl font-bold text-emerald-700 mt-1">
            {formatCurrency(totalPurchaseValue, language)}
          </p>
          <span className="text-[10px] text-gray-400">
            {language === 'bn' ? 'ক্রয়মূল্য অনুসারে' : 'At purchase cost'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E2EAE4] shadow-2xs">
          <span className="text-[11px] font-semibold text-gray-500">{t.inventory.potentialSalesValue}</span>
          <p className="text-xl font-bold text-[#16834A] mt-1">
            {formatCurrency(totalPotentialSales, language)}
          </p>
          <span className="text-[10px] text-gray-400">
            {language === 'bn' ? 'বিক্রয়মূল্য অনুসারে' : 'At retail selling price'}
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E2EAE4] shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={language === 'bn' ? 'পণ্যের নাম, SKU বা বারকোড...' : 'Search by Name, SKU or Barcode...'}
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16834A]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#16834A]"
          >
            <option value="all">{language === 'bn' ? 'সকল ক্যাটাগরি' : 'All Categories'}</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Stock Status Filter */}
          <select
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#16834A]"
          >
            <option value="all">{language === 'bn' ? 'সকল স্টক অবস্থা' : 'All Stock Status'}</option>
            <option value="inStock">{t.inventory.inStock}</option>
            <option value="lowStock">{t.inventory.lowStock}</option>
            <option value="outOfStock">{t.inventory.outOfStock}</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-[#E2EAE4] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#F7FAF8] border-b border-[#E2EAE4] text-gray-600 font-semibold">
              <tr>
                <th className="py-3 px-4">{t.inventory.productName}</th>
                <th className="py-3 px-4">{t.inventory.category}</th>
                <th className="py-3 px-4 text-right">{t.inventory.purchasePrice}</th>
                <th className="py-3 px-4 text-right">{t.inventory.sellingPrice}</th>
                <th className="py-3 px-4 text-center">{t.inventory.currentStock}</th>
                <th className="py-3 px-4 text-center">{t.inventory.stockStatus}</th>
                <th className="py-3 px-4 text-center">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 text-sm">
                    {t.common.noDataFound}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isOutOfStock = p.currentStock <= 0;
                  const isLowStock = p.currentStock > 0 && p.currentStock <= (p.minimumStock || 5);

                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="w-9 h-9 rounded-lg object-cover border border-gray-200 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-xs shrink-0">
                              <Package className="w-4 h-4" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-gray-900">{p.name}</p>
                            <span className="text-xs text-gray-400 font-mono">
                              SKU: {p.sku || '-'} {p.barcode ? `| Barcode: ${p.barcode}` : ''}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-xs font-medium">
                          {p.category || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600 font-medium">
                        {formatCurrency(p.purchasePrice, language)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900 font-bold">
                        {formatCurrency(p.sellingPrice, language)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-sm">
                          {p.currentStock} {p.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isOutOfStock ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                            {t.inventory.outOfStock}
                          </span>
                        ) : isLowStock ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center justify-center gap-1 mx-auto w-max">
                            <AlertTriangle className="w-3 h-3" />
                            {t.inventory.lowStock}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                            {t.inventory.inStock}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Stock Adjust */}
                          <button
                            onClick={() => handleOpenAdjust(p)}
                            className="p-1.5 text-gray-500 hover:text-[#16834A] hover:bg-[#EAF7EF] rounded-lg transition-colors"
                            title={t.inventory.adjustStock}
                          >
                            <SlidersHorizontal className="w-4 h-4" />
                          </button>

                          {/* Stock History */}
                          <button
                            onClick={() => handleOpenHistory(p)}
                            className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title={t.inventory.stockHistory}
                          >
                            <History className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title={t.common.edit}
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeleteConfirmProduct(p)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title={t.common.delete}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title={t.inventory.addProduct}
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleSubmitAdd} className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {t.inventory.productName} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                  placeholder="e.g. Miniket Rice 50kg"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {t.inventory.category}
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                  placeholder="e.g. Grocery"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {t.inventory.sku}
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {t.inventory.barcode} {t.common.optional}
                </label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-mono"
                  placeholder="Scan or type barcode"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {t.inventory.purchasePrice} (৳) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={formData.purchasePrice}
                  onChange={(e) =>
                    setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {t.inventory.sellingPrice} (৳) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={formData.sellingPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {t.inventory.openingStock}
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.openingStock}
                  onChange={(e) =>
                    setFormData({ ...formData, openingStock: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">{t.inventory.unit}</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-white"
                >
                  <option value="পিস">পিস (Pcs)</option>
                  <option value="কেজি">কেজি (Kg)</option>
                  <option value="গ্রাম">গ্রাম (Gm)</option>
                  <option value="লিটার">লিটার (Ltr)</option>
                  <option value="বক্স">বক্স (Box)</option>
                  <option value="প্যাকেট">প্যাকেট (Pkt)</option>
                  <option value="ডজন">ডজন (Dzn)</option>
                  <option value="মিটার">মিটার (Mtr)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {t.inventory.minimumStockAlert}
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.minimumStock}
                  onChange={(e) =>
                    setFormData({ ...formData, minimumStock: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {t.inventory.imageUrl} {t.common.optional}
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 border rounded-xl hover:bg-gray-100"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-bold text-white bg-[#16834A] hover:bg-[#105C35] rounded-xl shadow-xs"
              >
                {t.common.save}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Product Modal */}
      {isEditModalOpen && selectedProduct && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`${t.inventory.editProduct} - ${selectedProduct.name}`}
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleSubmitEdit} className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {t.inventory.productName} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {t.inventory.category}
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">{t.inventory.sku}</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {t.inventory.barcode}
                </label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {t.inventory.purchasePrice} (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.purchasePrice}
                  onChange={(e) =>
                    setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {t.inventory.sellingPrice} (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.sellingPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">{t.inventory.unit}</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-white"
                >
                  <option value="পিস">পিস (Pcs)</option>
                  <option value="কেজি">কেজি (Kg)</option>
                  <option value="গ্রাম">গ্রাম (Gm)</option>
                  <option value="লিটার">লিটার (Ltr)</option>
                  <option value="বক্স">বক্স (Box)</option>
                  <option value="প্যাকেট">প্যাকেট (Pkt)</option>
                  <option value="ডজন">ডজন (Dzn)</option>
                  <option value="মিটার">মিটার (Mtr)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {t.inventory.minimumStockAlert}
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.minimumStock}
                  onChange={(e) =>
                    setFormData({ ...formData, minimumStock: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border rounded-xl hover:bg-gray-100"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-bold text-white bg-[#16834A] hover:bg-[#105C35] rounded-xl shadow-xs"
              >
                {t.common.save}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Adjust Stock Modal */}
      {isAdjustModalOpen && selectedProduct && (
        <Modal
          isOpen={isAdjustModalOpen}
          onClose={() => setIsAdjustModalOpen(false)}
          title={`${t.inventory.adjustStock} - ${selectedProduct.name}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="p-3 bg-gray-50 rounded-xl flex justify-between items-center">
              <span>{t.inventory.currentStock}:</span>
              <span className="font-bold text-base text-gray-900">
                {selectedProduct.currentStock} {selectedProduct.unit}
              </span>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                {language === 'bn' ? 'সমন্বয়ের ধরন:' : 'Adjustment Type:'}
              </label>
              <select
                value={adjustType}
                onChange={(e) => setAdjustType(e.target.value as TransactionType)}
                className="w-full px-3 py-2 border rounded-xl bg-white"
              >
                <option value="adjustment">{t.inventory.movementTypes.adjustment} (+/-)</option>
                <option value="damage">{t.inventory.movementTypes.damage} (-)</option>
                <option value="return">{t.inventory.movementTypes.return} (+)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                {language === 'bn' ? 'পরিমাণ (Quantity):' : 'Quantity Change:'}
              </label>
              <input
                type="number"
                value={adjustQty}
                onChange={(e) => setAdjustQty(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-xl font-bold"
              />
              <span className="text-[11px] text-gray-500 mt-0.5 block">
                {adjustType === 'damage'
                  ? language === 'bn'
                    ? 'নষ্ট পণ্য স্বয়ংক্রিয়ভাবে স্টক থেকে বিয়োগ হবে।'
                    : 'Damaged stock will be subtracted from current inventory.'
                  : language === 'bn'
                  ? 'বৃদ্ধি করতে ধনাত্মক সংখ্যা, হ্রাস করতে ঋণাত্মক সংখ্যা লিখুন।'
                  : 'Enter positive number to add, or negative to reduce.'}
              </span>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">{t.common.notes}:</label>
              <textarea
                rows={2}
                value={adjustNotes}
                onChange={(e) => setAdjustNotes(e.target.value)}
                placeholder="e.g. Expired product or counted variance"
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsAdjustModalOpen(false)}
                className="px-4 py-2 border rounded-xl hover:bg-gray-100"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmAdjust}
                disabled={isAdjusting}
                className="px-5 py-2 font-bold text-white bg-[#16834A] hover:bg-[#105C35] rounded-xl shadow-xs"
              >
                {isAdjusting ? t.common.loading : t.common.save}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Stock History Audit Modal */}
      {isHistoryModalOpen && selectedProduct && (
        <Modal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          title={`${t.inventory.stockHistory} - ${selectedProduct.name}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
                  <tr>
                    <th className="py-2.5 px-3">{t.common.date}</th>
                    <th className="py-2.5 px-3">{language === 'bn' ? 'ধরন' : 'Type'}</th>
                    <th className="py-2.5 px-3 text-center">{language === 'bn' ? 'পূর্ববর্তী' : 'Prev'}</th>
                    <th className="py-2.5 px-3 text-center">{language === 'bn' ? 'পরিবর্তন' : 'Change'}</th>
                    <th className="py-2.5 px-3 text-center">{language === 'bn' ? 'নতুন স্টক' : 'New'}</th>
                    <th className="py-2.5 px-3">{t.common.notes}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {productTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400">
                        {language === 'bn' ? 'কোনো লেনদেন রেকর্ড নেই' : 'No movements recorded'}
                      </td>
                    </tr>
                  ) : (
                    productTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="py-2 px-3 text-gray-500 whitespace-nowrap">{tx.date}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              tx.transactionType === 'sale'
                                ? 'bg-blue-100 text-blue-800'
                                : tx.transactionType === 'purchase'
                                ? 'bg-green-100 text-green-800'
                                : tx.transactionType === 'damage'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {t.inventory.movementTypes[tx.transactionType] || tx.transactionType}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">{tx.previousStock}</td>
                        <td
                          className={`py-2 px-3 text-center font-bold ${
                            tx.newStock > tx.previousStock ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {tx.newStock > tx.previousStock ? `+${tx.quantity}` : `-${tx.quantity}`}
                        </td>
                        <td className="py-2 px-3 text-center font-bold text-gray-900">{tx.newStock}</td>
                        <td className="py-2 px-3 text-gray-500 max-w-xs truncate">{tx.notes || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold border rounded-lg hover:bg-gray-100"
              >
                {t.common.close}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmProduct && (
        <Modal
          isOpen={!!deleteConfirmProduct}
          onClose={() => setDeleteConfirmProduct(null)}
          title={language === 'bn' ? 'পণ্য মুছে ফেলা নিশ্চিত করুন' : 'Confirm Delete Product'}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs sm:text-sm">
            <p>
              {language === 'bn'
                ? `আপনি কি নিশ্চিত যে "${deleteConfirmProduct.name}" পণ্যটি মুছে ফেলতে চান?`
                : `Are you sure you want to delete "${deleteConfirmProduct.name}"?`}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmProduct(null)}
                className="px-4 py-2 border rounded-xl hover:bg-gray-100"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs"
              >
                {t.common.delete}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
