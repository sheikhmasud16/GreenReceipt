import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Printer,
  Download,
  Share2,
  CheckCircle,
  Eye,
  AlertTriangle,
  Search,
  UserCheck,
} from 'lucide-react';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Product, ReceiptItem, Receipt, PaymentMethod, PaymentStatus } from '../../types';
import { formatCurrency, toBanglaDigits } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import { ReceiptPrintTemplate } from './ReceiptPrintTemplate';
import { WhatsAppShareModal } from './WhatsAppShareModal';
import { generateReceiptPDF } from '../../utils/pdfGenerator';

interface CreateReceiptViewProps {
  onSaved?: (receiptId: string) => void;
  duplicateReceipt?: Receipt | null;
}

export const CreateReceiptView: React.FC<CreateReceiptViewProps> = ({
  onSaved,
  duplicateReceipt,
}) => {
  const { products, customers, createReceipt, createCustomer } = useBusinessData();
  const { profile } = useAuth();
  const { t, language } = useLanguage();

  // Receipt Number generation
  const generateReceiptNumber = () => {
    const prefix = profile?.receiptPrefix || 'REC-';
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    return `${prefix}${datePart}-${randomSuffix}`;
  };

  const [receiptNumber, setReceiptNumber] = useState<string>(generateReceiptNumber());
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>(
    new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  );

  // Customer info (No customer selection dropdown as requested)
  const [customerName, setCustomerName] = useState<string>('');
  const [customerMobile, setCustomerMobile] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');

  // Items
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [overallDiscount, setOverallDiscount] = useState<number>(0);
  const [additionalCharges, setAdditionalCharges] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState<string>('');

  // Product Search / Selector state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showProductDropdown, setShowProductDropdown] = useState<boolean>(false);
  const [showProductModal, setShowProductModal] = useState<boolean>(false);
  const [modalCategoryFilter, setModalCategoryFilter] = useState<string>('all');

  // Modals & UI states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [savedReceipt, setSavedReceipt] = useState<Receipt | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Prefill if duplicating
  useEffect(() => {
    if (duplicateReceipt) {
      setReceiptNumber(generateReceiptNumber());
      setCustomerName(duplicateReceipt.customerName || '');
      setCustomerMobile(duplicateReceipt.customerMobile || '');
      setCustomerAddress(duplicateReceipt.customerAddress || '');
      setItems(duplicateReceipt.items.map((i) => ({ ...i })));
      setOverallDiscount(duplicateReceipt.overallDiscount || 0);
      setAdditionalCharges(duplicateReceipt.additionalCharges || 0);
      setPaidAmount(duplicateReceipt.paidAmount || 0);
      setPaymentMethod(duplicateReceipt.paymentMethod || 'cash');
      setNotes(duplicateReceipt.notes || '');
    }
  }, [duplicateReceipt]);

  // Add product to receipt
  const handleAddProduct = (product: Product) => {
    if (!product) return;
    const existingIndex = items.findIndex((i) => i.productId === product.id);
    if (existingIndex >= 0) {
      const updated = [...items];
      const newQty = updated[existingIndex].quantity + 1;
      updated[existingIndex].quantity = newQty;
      updated[existingIndex].lineTotal = Math.max(
        0,
        newQty * updated[existingIndex].sellingPrice - (updated[existingIndex].discount || 0)
      );
      setItems(updated);
    } else {
      const newItem: ReceiptItem = {
        productId: product.id,
        productName: product.name || 'Unnamed Product',
        sku: product.sku || '',
        unit: product.unit || 'পিস',
        quantity: 1,
        sellingPrice: Number(product.sellingPrice) || 0,
        costPriceAtSale: Number(product.purchasePrice) || 0, // Snapshot historical cost price!
        discount: 0,
        lineTotal: Number(product.sellingPrice) || 0,
      };
      setItems([...items, newItem]);
    }
    setSearchQuery('');
    setShowProductDropdown(false);
  };

  const handleUpdateItem = (
    index: number,
    field: 'quantity' | 'sellingPrice' | 'discount',
    value: number
  ) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: Math.max(0, value) };
    item.lineTotal = Math.max(0, item.quantity * item.sellingPrice - item.discount);
    updated[index] = item;
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.sellingPrice, 0);
  const itemDiscountTotal = items.reduce((sum, item) => sum + (item.discount || 0), 0);
  const grandTotal = Math.max(
    0,
    subtotal - itemDiscountTotal - (overallDiscount || 0) + (additionalCharges || 0)
  );

  // Auto-fill paidAmount with grandTotal if payment method is not 'due' and paid hasn't been manually set differently
  useEffect(() => {
    if (paymentMethod === 'due') {
      setPaidAmount(0);
    } else if (paidAmount === 0 && grandTotal > 0) {
      setPaidAmount(grandTotal);
    }
  }, [grandTotal, paymentMethod]);

  const dueAmount = Math.max(0, grandTotal - (paidAmount || 0));

  let paymentStatus: PaymentStatus = 'unpaid';
  if (paidAmount >= grandTotal && grandTotal > 0) {
    paymentStatus = 'paid';
  } else if (paidAmount > 0) {
    paymentStatus = 'partial';
  }

  // Filter products for dropdown & modal (Null-safe)
  const q = (searchQuery || '').trim().toLowerCase();
  const filteredProducts = products.filter((p) => {
    if (!p) return false;
    const nameMatch = (p.name || '').toLowerCase().includes(q);
    const skuMatch = (p.sku || '').toLowerCase().includes(q);
    const barcodeMatch = (p.barcode || '').toLowerCase().includes(q);
    const catMatch = (p.category || '').toLowerCase().includes(q);
    return nameMatch || skuMatch || barcodeMatch || catMatch;
  });

  // Modal filtered products (by search query and category)
  const modalFilteredProducts = products.filter((p) => {
    if (!p) return false;
    const matchesCat = modalCategoryFilter === 'all' || p.category === modalCategoryFilter;
    const nameMatch = (p.name || '').toLowerCase().includes(q);
    const skuMatch = (p.sku || '').toLowerCase().includes(q);
    const barcodeMatch = (p.barcode || '').toLowerCase().includes(q);
    return matchesCat && (nameMatch || skuMatch || barcodeMatch);
  });

  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

  const handleSaveReceipt = async () => {
    if (items.length === 0) {
      setErrorMessage(language === 'bn' ? 'অনুগ্রহ করে অন্তত একটি পণ্য যোগ করুন' : 'Please add at least one product');
      return;
    }

    // Stock check
    if (!profile?.allowNegativeStock) {
      for (const item of items) {
        const prod = products.find((p) => p.id === item.productId);
        if (prod && prod.currentStock < item.quantity) {
          setErrorMessage(
            language === 'bn'
              ? `"${item.productName}" এর পর্যাপ্ত স্টক নেই! স্টকে আছে: ${prod.currentStock}`
              : `Insufficient stock for "${item.productName}"! Available: ${prod.currentStock}`
          );
          return;
        }
      }
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const receiptPayload: Omit<Receipt, 'id' | 'createdAt' | 'updatedAt'> = {
        receiptNumber,
        date,
        time,
        customerName: customerName.trim() || (language === 'bn' ? 'ক্যাশ গ্রাহক' : 'Cash Customer'),
        customerMobile: customerMobile.trim(),
        customerAddress: customerAddress.trim(),
        items,
        subtotal,
        itemDiscount: itemDiscountTotal,
        overallDiscount: Number(overallDiscount) || 0,
        additionalCharges: Number(additionalCharges) || 0,
        grandTotal,
        paidAmount: Number(paidAmount) || 0,
        dueAmount,
        paymentMethod,
        paymentStatus,
        status: 'completed',
        notes,
        language: profile?.preferredLanguage || 'bn',
      };

      const newId = await createReceipt(receiptPayload);

      const createdObj: Receipt = {
        ...receiptPayload,
        id: newId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setSavedReceipt(createdObj);
      setShowPreviewModal(true);

      if (onSaved) onSaved(newId);
    } catch (err) {
      console.error(err);
      setErrorMessage(
        err instanceof Error ? err.message : (language === 'bn' ? 'রসিদ সংরক্ষণ ব্যর্থ হয়েছে' : 'Failed to save receipt')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setReceiptNumber(generateReceiptNumber());
    setCustomerName('');
    setCustomerMobile('');
    setCustomerAddress('');
    setItems([]);
    setOverallDiscount(0);
    setAdditionalCharges(0);
    setPaidAmount(0);
    setPaymentMethod('cash');
    setNotes('');
    setSavedReceipt(null);
    setShowPreviewModal(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-[#E2EAE4] shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-[#105C35]">{t.receipt.createTitle}</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {language === 'bn'
              ? 'পণ্য নির্বাচন করুন, মূল্য পরিশোধের মাধ্যম নির্ধারণ করুন এবং দ্রুত রসিদ তৈরি করুন।'
              : 'Select products, set payment details, and generate instant professional receipts.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              if (items.length > 0) setShowPreviewModal(true);
            }}
            disabled={items.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold border border-gray-300 rounded-xl hover:bg-gray-50 text-gray-700 disabled:opacity-40"
          >
            <Eye className="w-4 h-4 text-[#16834A]" />
            <span>{t.receipt.instantPreview}</span>
          </button>

          <button
            onClick={handleSaveReceipt}
            disabled={isSubmitting || items.length === 0}
            className="flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-bold text-white bg-[#16834A] hover:bg-[#105C35] rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{isSubmitting ? t.common.loading : t.receipt.saveAndPreview}</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm font-medium animate-in fade-in">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Grid: Left (Customer & Items) + Right (Totals & Payment) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Invoice Meta */}
          <div className="bg-white p-5 rounded-2xl border border-[#E2EAE4] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#16834A]" />
                {t.receipt.customerInfo}
              </span>
              <div className="text-xs text-gray-500 font-mono">
                {t.receipt.receiptNumber}: <span className="font-bold text-gray-800">{receiptNumber}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Customer Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {t.receipt.customerName} {language === 'bn' ? '(ঐচ্ছিক)' : '(Optional)'}
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={language === 'bn' ? 'ক্যাশ গ্রাহক / সাধারণ ক্রেতা' : 'Cash / Walk-in Customer'}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16834A]"
                />
              </div>

              {/* Customer Mobile */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {t.receipt.customerMobile} {language === 'bn' ? '(ঐচ্ছিক)' : '(Optional)'}
                </label>
                <input
                  type="text"
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                  placeholder="01712345678"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16834A]"
                />
              </div>

              {/* Customer Address */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {t.receipt.customerAddress} {language === 'bn' ? '(ঐচ্ছিক)' : '(Optional)'}
                </label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder={language === 'bn' ? 'ঠিকানা (উদা: মিরপুর, ঢাকা)' : 'e.g. Dhaka, Bangladesh'}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16834A]"
                />
              </div>
            </div>
          </div>

          {/* Product Picker & Line Items */}
          <div className="bg-white p-5 rounded-2xl border border-[#E2EAE4] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              {/* Active Clickable Add Product Button */}
              <button
                type="button"
                onClick={() => setShowProductModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#16834A] hover:bg-[#105C35] text-white rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-colors w-fit cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t.receipt.addItem}</span>
                <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[11px]">
                  {items.length}
                </span>
              </button>

              {/* Interactive Live Search Bar for Products */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowProductDropdown(true);
                  }}
                  onFocus={() => setShowProductDropdown(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (filteredProducts.length > 0) {
                        handleAddProduct(filteredProducts[0]);
                      }
                    } else if (e.key === 'Escape') {
                      setShowProductDropdown(false);
                    }
                  }}
                  placeholder={language === 'bn' ? 'পণ্য নাম, SKU বা বারকোড দিয়ে সার্চ করুন...' : 'Search product name, SKU or barcode...'}
                  className="w-full pl-9 pr-8 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16834A] bg-white shadow-xs"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setShowProductDropdown(false);
                    }}
                    className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 p-0.5 text-xs font-bold"
                  >
                    ✕
                  </button>
                )}

                {/* Dropdown Results */}
                {showProductDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setShowProductDropdown(false)}
                    />
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-72 overflow-y-auto z-40 divide-y divide-gray-100 animate-in fade-in">
                      <div className="p-2 bg-gray-50 text-[11px] font-semibold text-gray-500 flex justify-between">
                        <span>{language === 'bn' ? 'পণ্য তালিকা (ক্লিক করে যোগ করুন)' : 'Matching Products (Click to add)'}</span>
                        <span>{filteredProducts.length} {language === 'bn' ? 'টি' : 'found'}</span>
                      </div>
                      {filteredProducts.length === 0 ? (
                        <div className="p-4 text-xs text-center text-gray-500">
                          <p>{language === 'bn' ? 'কোনো পণ্য মেলেনি' : 'No matching products'}</p>
                          <button
                            type="button"
                            onClick={() => {
                              setShowProductDropdown(false);
                              setShowProductModal(true);
                            }}
                            className="mt-1.5 text-xs text-[#16834A] font-bold hover:underline block mx-auto"
                          >
                            + {language === 'bn' ? 'সকল পণ্য থেকে বেছে নিন' : 'Browse All Products'}
                          </button>
                        </div>
                      ) : (
                        filteredProducts.slice(0, 15).map((p) => (
                          <div
                            key={p.id}
                            onClick={() => handleAddProduct(p)}
                            className="p-3 hover:bg-[#EAF7EF] cursor-pointer flex items-center justify-between text-xs transition-colors group"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 font-bold shrink-0 group-hover:bg-white">
                                {p.name ? p.name.charAt(0).toUpperCase() : 'P'}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 group-hover:text-[#105C35]">
                                  {p.name}
                                </p>
                                <span className="text-[11px] text-gray-500">
                                  SKU: {p.sku || '-'} • {t.receipt.available}:{' '}
                                  <span
                                    className={`font-semibold ${
                                      p.currentStock <= 0 ? 'text-red-600' : 'text-gray-700'
                                    }`}
                                  >
                                    {p.currentStock} {p.unit}
                                  </span>
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-sm text-[#16834A] block">
                                ৳{p.sellingPrice}
                              </span>
                              <span className="text-[10px] text-gray-400 group-hover:text-[#16834A] font-medium">
                                + {language === 'bn' ? 'যোগ করুন' : 'Add'}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 font-semibold border-y border-gray-200">
                    <th className="py-2.5 px-2">{t.receipt.product}</th>
                    <th className="py-2.5 px-2 text-center">{t.receipt.available}</th>
                    <th className="py-2.5 px-2 text-center w-20">{t.receipt.qty}</th>
                    <th className="py-2.5 px-2 text-right w-24">{t.receipt.unitPrice}</th>
                    <th className="py-2.5 px-2 text-right w-20">{t.receipt.itemDiscount}</th>
                    <th className="py-2.5 px-2 text-right w-24">{t.common.total}</th>
                    <th className="py-2.5 px-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-400">
                        {language === 'bn'
                          ? 'রসিদে কোনো পণ্য যোগ করা হয়নি। উপরে পণ্য অনুসন্ধান করে নির্বাচন করুন।'
                          : 'No items added. Search and select products above.'}
                      </td>
                    </tr>
                  ) : (
                    items.map((item, index) => {
                      const prod = products.find((p) => p.id === item.productId);
                      const currentStock = prod ? prod.currentStock : 0;
                      const isLow = currentStock < item.quantity;

                      return (
                        <tr key={index} className="hover:bg-[#F7FAF8]">
                          <td className="py-2.5 px-2">
                            <p className="font-semibold text-gray-800">{item.productName}</p>
                            <span className="text-[10px] text-gray-500">Unit: {item.unit}</span>
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                                isLow ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {currentStock}
                            </span>
                          </td>
                          <td className="py-2.5 px-2">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateItem(index, 'quantity', parseFloat(e.target.value) || 1)
                              }
                              className="w-16 px-1.5 py-1 text-center font-bold border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#16834A]"
                            />
                          </td>
                          <td className="py-2.5 px-2 text-right">
                            <input
                              type="number"
                              value={item.sellingPrice}
                              onChange={(e) =>
                                handleUpdateItem(index, 'sellingPrice', parseFloat(e.target.value) || 0)
                              }
                              className="w-20 px-1.5 py-1 text-right font-medium border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#16834A]"
                            />
                          </td>
                          <td className="py-2.5 px-2 text-right">
                            <input
                              type="number"
                              value={item.discount}
                              onChange={(e) =>
                                handleUpdateItem(index, 'discount', parseFloat(e.target.value) || 0)
                              }
                              className="w-16 px-1.5 py-1 text-right border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#16834A]"
                            />
                          </td>
                          <td className="py-2.5 px-2 text-right font-bold text-gray-900">
                            {formatCurrency(item.lineTotal, language)}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <button
                              onClick={() => handleRemoveItem(index)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Quick Product Chips */}
            <div className="pt-2 border-t border-gray-100">
              <span className="text-[11px] font-semibold text-gray-500 block mb-1.5">
                {language === 'bn' ? 'জনপ্রিয় পণ্য থেকে দ্রুত যোগ করুন:' : 'Quick Add Popular Items:'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {products.slice(0, 8).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleAddProduct(p)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs bg-gray-50 hover:bg-[#EAF7EF] hover:text-[#16834A] border border-gray-200 rounded-lg transition-colors"
                  >
                    <Plus className="w-3 h-3 text-[#16834A]" />
                    <span>{p.name}</span>
                    <span className="text-gray-400">({p.currentStock})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 col): Payment & Summary */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-[#E2EAE4] shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-800 pb-2 border-b border-gray-100">
              {t.receipt.financialSummary}
            </h3>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between text-gray-600">
                <span>{t.common.subtotal}:</span>
                <span className="font-semibold text-gray-900">{formatCurrency(subtotal, language)}</span>
              </div>

              {itemDiscountTotal > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>{t.receipt.itemDiscount}:</span>
                  <span>-{formatCurrency(itemDiscountTotal, language)}</span>
                </div>
              )}

              {/* Overall Discount Input */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-gray-600">{t.receipt.overallDiscount}:</span>
                <input
                  type="number"
                  min="0"
                  value={overallDiscount}
                  onChange={(e) => setOverallDiscount(parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 text-right text-xs font-semibold border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#16834A]"
                />
              </div>

              {/* Additional Charges Input */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-gray-600">{t.receipt.additionalCharges}:</span>
                <input
                  type="number"
                  min="0"
                  value={additionalCharges}
                  onChange={(e) => setAdditionalCharges(parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 text-right text-xs font-semibold border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#16834A]"
                />
              </div>

              {/* Grand Total */}
              <div className="flex justify-between items-center p-3 bg-[#EAF7EF] text-[#105C35] rounded-xl font-bold text-base">
                <span>{t.receipt.grandTotal}:</span>
                <span className="text-lg">{formatCurrency(grandTotal, language)}</span>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  {t.receipt.paymentMethod}
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {(['cash', 'bkash', 'nagad', 'bank', 'card', 'due'] as PaymentMethod[]).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-1.5 px-2 rounded-lg font-semibold border transition-all text-center ${
                        paymentMethod === method
                          ? 'bg-[#16834A] text-white border-[#16834A] shadow-xs'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {t.receipt.paymentMethods[method]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Paid Amount */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                <span className="font-semibold text-gray-700">{t.receipt.paidAmount}:</span>
                <input
                  type="number"
                  min="0"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                  className="w-28 px-2 py-1.5 text-right font-bold text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#16834A]"
                />
              </div>

              {/* Due Amount Alert */}
              {dueAmount > 0 && (
                <div className="flex justify-between items-center p-2.5 bg-red-50 text-red-700 rounded-xl font-bold border border-red-200">
                  <span>{t.receipt.dueAmount}:</span>
                  <span>{formatCurrency(dueAmount, language)}</span>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {t.common.notes}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={language === 'bn' ? 'বিশেষ কোনো মন্তব্য...' : 'Additional notes...'}
                  className="w-full p-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#16834A]"
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSaveReceipt}
                disabled={isSubmitting || items.length === 0}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#16834A] hover:bg-[#105C35] text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
              >
                <CheckCircle className="w-5 h-5" />
                <span>{isSubmitting ? t.common.loading : t.receipt.saveAndPreview}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Instant Preview Modal */}
      {showPreviewModal && (
        <Modal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          title={t.receipt.instantPreview}
          maxWidth="max-w-4xl"
        >
          {profile && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-xs font-semibold text-gray-600">
                  {language === 'bn' ? 'রসিদের অ্যাকশন:' : 'Receipt Actions:'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#16834A] text-white rounded-lg hover:bg-[#105C35]"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{t.common.print}</span>
                  </button>

                  <button
                    onClick={() => {
                      const doc = generateReceiptPDF(
                        savedReceipt || {
                          id: 'temp',
                          receiptNumber,
                          date,
                          time,
                          customerName,
                          customerMobile,
                          customerAddress,
                          items,
                          subtotal,
                          itemDiscount: itemDiscountTotal,
                          overallDiscount,
                          additionalCharges,
                          grandTotal,
                          paidAmount,
                          dueAmount,
                          paymentMethod,
                          paymentStatus,
                          status: 'completed',
                          language: 'bn',
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                        },
                        profile
                      );
                      doc.save(`Receipt-${receiptNumber}.pdf`);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700"
                  >
                    <Download className="w-3.5 h-3.5 text-[#16834A]" />
                    <span>{t.common.downloadPdf}</span>
                  </button>

                  <button
                    onClick={() => setShowWhatsAppModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#25D366] text-white rounded-lg hover:bg-[#1EBE5D]"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{t.common.shareWhatsApp}</span>
                  </button>
                </div>
              </div>

              {/* Render printable template */}
              <div className="border border-gray-200 rounded-xl overflow-hidden p-2 sm:p-4 bg-gray-100 flex justify-center">
                <ReceiptPrintTemplate
                  receipt={
                    savedReceipt || {
                      id: 'temp',
                      receiptNumber,
                      date,
                      time,
                      customerName,
                      customerMobile,
                      customerAddress,
                      items,
                      subtotal,
                      itemDiscount: itemDiscountTotal,
                      overallDiscount,
                      additionalCharges,
                      grandTotal,
                      paidAmount,
                      dueAmount,
                      paymentMethod,
                      paymentStatus,
                      status: 'completed',
                      language: 'bn',
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    }
                  }
                  profile={profile}
                />
              </div>

              {savedReceipt && (
                <div className="text-center pt-2">
                  <button
                    onClick={handleResetForm}
                    className="px-4 py-2 text-xs font-semibold text-[#16834A] hover:underline"
                  >
                    + {language === 'bn' ? 'আরেকটি নতুন রসিদ তৈরি করুন' : 'Create Another Receipt'}
                  </button>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}

      {/* Product Selector Modal (+ পণ্য যোগ করুন) */}
      {showProductModal && (
        <Modal
          isOpen={showProductModal}
          onClose={() => setShowProductModal(false)}
          title={language === 'bn' ? '+ পণ্য যোগ / নির্বাচন করুন' : '+ Select / Add Products'}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            {/* Search Input inside modal */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'bn' ? 'পণ্যের নাম, SKU বা বারকোড দিয়ে খুঁজুন...' : 'Search by name, SKU or barcode...'}
                className="w-full pl-9 pr-8 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16834A]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5 pb-1">
              <button
                type="button"
                onClick={() => setModalCategoryFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  modalCategoryFilter === 'all'
                    ? 'bg-[#16834A] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {language === 'bn' ? 'সকল' : 'All'}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setModalCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    modalCategoryFilter === cat
                      ? 'bg-[#16834A] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Products List Table */}
            <div className="border border-gray-200 rounded-xl max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#F7FAF8] border-b border-gray-200 text-gray-600 font-semibold sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">{t.receipt.product}</th>
                    <th className="py-2.5 px-3 text-center">{t.receipt.available}</th>
                    <th className="py-2.5 px-3 text-right">{t.receipt.unitPrice}</th>
                    <th className="py-2.5 px-3 text-center">{language === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {modalFilteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-gray-400">
                        {language === 'bn' ? 'কোনো পণ্য মেলেনি' : 'No products found'}
                      </td>
                    </tr>
                  ) : (
                    modalFilteredProducts.map((p) => {
                      const itemInReceipt = items.find((i) => i.productId === p.id);
                      const isOutOfStock = p.currentStock <= 0;
                      return (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-2.5 px-3">
                            <p className="font-bold text-gray-900">{p.name}</p>
                            <span className="text-[11px] text-gray-400">
                              SKU: {p.sku || '-'} {p.category ? `• ${p.category}` : ''}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                isOutOfStock
                                  ? 'bg-red-100 text-red-800'
                                  : p.currentStock <= (p.minimumStock || 5)
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {p.currentStock} {p.unit}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-[#16834A] text-sm">
                            ৳{p.sellingPrice}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {itemInReceipt && (
                                <span className="text-xs font-bold px-2 py-0.5 bg-green-50 text-[#16834A] rounded-md border border-green-200">
                                  {itemInReceipt.quantity} {p.unit}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleAddProduct(p)}
                                className="px-3 py-1.5 bg-[#16834A] hover:bg-[#105C35] text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                              >
                                + {language === 'bn' ? 'যোগ করুন' : 'Add'}
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

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="text-xs font-semibold text-gray-500">
                {language === 'bn' ? 'রসিদে যুক্ত পণ্য:' : 'Items in receipt:'}{' '}
                <strong className="text-gray-900">{items.length}</strong>
              </span>
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="px-5 py-2 bg-[#16834A] hover:bg-[#105C35] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs"
              >
                {language === 'bn' ? 'সম্পন্ন (Done)' : 'Done'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* WhatsApp Modal */}
      {showWhatsAppModal && profile && (
        <WhatsAppShareModal
          isOpen={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          receipt={
            savedReceipt || {
              id: 'temp',
              receiptNumber,
              date,
              time,
              customerName,
              customerMobile,
              customerAddress,
              items,
              subtotal,
              itemDiscount: itemDiscountTotal,
              overallDiscount,
              additionalCharges,
              grandTotal,
              paidAmount,
              dueAmount,
              paymentMethod,
              paymentStatus,
              status: 'completed',
              language: 'bn',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          }
          profile={profile}
        />
      )}
    </div>
  );
};
