import React, { useState } from 'react';
import {
  ShoppingBag,
  Plus,
  Trash2,
  Eye,
  XCircle,
  AlertCircle,
  Printer,
  Calendar,
  Search,
} from 'lucide-react';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Purchase, PurchaseItem, Product, PaymentMethod } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Modal } from '../common/Modal';

export const StockPurchasesView: React.FC = () => {
  const { purchases, suppliers, products, recordPurchase, cancelPurchase } = useBusinessData();
  const { profile } = useAuth();
  const { t, language } = useLanguage();

  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [cancelConfirmPurchase, setCancelConfirmPurchase] = useState<Purchase | null>(null);

  // Form State
  const [invoiceNumber, setInvoiceNumber] = useState<string>(
    `PUR-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`
  );
  const [supplierId, setSupplierId] = useState<string>('');
  const [supplierName, setSupplierName] = useState<string>('');
  const [supplierMobile, setSupplierMobile] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [additionalCost, setAdditionalCost] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Supplier select
  const handleSelectSupplier = (sId: string) => {
    setSupplierId(sId);
    const supp = suppliers.find((s) => s.id === sId);
    if (supp) {
      setSupplierName(supp.name);
      setSupplierMobile(supp.mobile);
    }
  };

  // Add Item to purchase
  const handleAddItem = (prod: Product) => {
    const existing = items.find((i) => i.productId === prod.id);
    if (existing) {
      const updated = items.map((i) =>
        i.productId === prod.id
          ? {
              ...i,
              quantity: i.quantity + 1,
              lineTotal: (i.quantity + 1) * i.purchasePrice,
            }
          : i
      );
      setItems(updated);
    } else {
      const newItem: PurchaseItem = {
        productId: prod.id,
        productName: prod.name,
        unit: prod.unit,
        quantity: 1,
        purchasePrice: prod.purchasePrice || 0,
        lineTotal: prod.purchasePrice || 0,
      };
      setItems([...items, newItem]);
    }
  };

  const handleUpdateItem = (
    index: number,
    field: 'quantity' | 'purchasePrice',
    val: number
  ) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: Math.max(0, val) };
    item.lineTotal = item.quantity * item.purchasePrice;
    updated[index] = item;
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Totals
  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const totalAmount = Math.max(0, subtotal - (discount || 0) + (additionalCost || 0));
  const dueAmount = Math.max(0, totalAmount - (paidAmount || 0));

  const handleOpenAdd = () => {
    setInvoiceNumber(
      `PUR-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`
    );
    setSupplierId('');
    setSupplierName('');
    setSupplierMobile('');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setItems([]);
    setAdditionalCost(0);
    setDiscount(0);
    setPaidAmount(0);
    setPaymentMethod('cash');
    setNotes('');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleSubmitPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setFormError(language === 'bn' ? 'কমপক্ষে একটি পণ্য যোগ করুন' : 'Please add at least one item');
      return;
    }
    if (!supplierName) {
      setFormError(language === 'bn' ? 'সরবরাহকারীর নাম লিখুন' : 'Enter supplier name');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      await recordPurchase({
        invoiceNumber,
        supplierId: supplierId || undefined,
        supplierName,
        supplierMobile,
        purchaseDate,
        items,
        additionalCost: Number(additionalCost) || 0,
        discount: Number(discount) || 0,
        totalAmount,
        paidAmount: Number(paidAmount) || 0,
        dueAmount,
        paymentMethod,
        notes,
        status: 'completed',
      });
      setIsAddModalOpen(false);
    } catch (err) {
      console.error(err);
      setFormError(err instanceof Error ? err.message : 'Purchase recording failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelConfirmPurchase) return;
    try {
      await cancelPurchase(cancelConfirmPurchase);
      setCancelConfirmPurchase(null);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Cancellation failed');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-[#E2EAE4] shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-[#105C35]">{t.purchases.title}</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {language === 'bn'
              ? 'সাপ্লায়ার থেকে স্টক ক্রয় রেকর্ড করুন। স্বয়ংক্রিয়ভাবে পণ্যের স্টক বৃদ্ধি পাবে।'
              : 'Record supplier inventory purchases. Product stock is automatically updated.'}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#16834A] hover:bg-[#105C35] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{t.purchases.newPurchase}</span>
        </button>
      </div>

      {/* Purchases List */}
      <div className="bg-white rounded-2xl border border-[#E2EAE4] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#F7FAF8] border-b border-[#E2EAE4] text-gray-600 font-semibold">
              <tr>
                <th className="py-3 px-4">{t.purchases.invoiceNumber}</th>
                <th className="py-3 px-4">{t.purchases.supplier}</th>
                <th className="py-3 px-4">{t.purchases.purchaseDate}</th>
                <th className="py-3 px-4 text-center">{language === 'bn' ? 'পণ্যের সংখ্যা' : 'Items'}</th>
                <th className="py-3 px-4 text-right">{t.purchases.totalAmount}</th>
                <th className="py-3 px-4 text-right">{t.purchases.paidAmount}</th>
                <th className="py-3 px-4 text-right">{t.purchases.dueAmount}</th>
                <th className="py-3 px-4 text-center">{t.common.status}</th>
                <th className="py-3 px-4 text-center">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    {language === 'bn' ? 'কোনো ক্রয়ের তথ্য নেই' : 'No purchases recorded yet'}
                  </td>
                </tr>
              ) : (
                purchases.map((purchase) => {
                  const isCancelled = purchase.status === 'cancelled';
                  return (
                    <tr
                      key={purchase.id}
                      className={`hover:bg-gray-50 ${isCancelled ? 'bg-gray-50/70 opacity-60' : ''}`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">
                        {purchase.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-800">
                        {purchase.supplierName}
                        {purchase.supplierMobile && (
                          <span className="block text-xs text-gray-400">{purchase.supplierMobile}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                        {formatDate(purchase.purchaseDate, language)}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-gray-700">
                        {purchase.items.length}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-gray-900">
                        {formatCurrency(purchase.totalAmount, language)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-green-700">
                        {formatCurrency(purchase.paidAmount, language)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-red-600">
                        {purchase.dueAmount > 0 ? formatCurrency(purchase.dueAmount, language) : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            isCancelled
                              ? 'bg-red-100 text-red-800'
                              : purchase.dueAmount === 0
                              ? 'bg-green-100 text-green-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isCancelled
                            ? t.receipt.receiptStatus.cancelled
                            : purchase.dueAmount === 0
                            ? t.common.paid
                            : t.common.due}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedPurchase(purchase);
                              setIsViewModalOpen(true);
                            }}
                            className="p-1.5 text-gray-500 hover:text-[#16834A] hover:bg-[#EAF7EF] rounded-lg"
                            title={t.common.view}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {!isCancelled && (
                            <button
                              onClick={() => setCancelConfirmPurchase(purchase)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              title={language === 'bn' ? 'ক্রয় বাতিল' : 'Cancel Purchase'}
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
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

      {/* Record Purchase Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title={t.purchases.newPurchase}
          maxWidth="max-w-4xl"
        >
          <form onSubmit={handleSubmitPurchase} className="space-y-4 text-xs sm:text-sm">
            {formError && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-medium">
                {formError}
              </div>
            )}

            {/* Supplier Details & Invoice Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {t.purchases.selectSupplier}
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => handleSelectSupplier(e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded-lg bg-white"
                >
                  <option value="">-- {language === 'bn' ? 'নতুন সরবরাহকারী' : 'New Supplier'} --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.mobile})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {language === 'bn' ? 'সরবরাহকারীর নাম *' : 'Supplier Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {language === 'bn' ? 'মোবাইল নম্বর' : 'Supplier Mobile'}
                </label>
                <input
                  type="text"
                  value={supplierMobile}
                  onChange={(e) => setSupplierMobile(e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded-lg"
                  placeholder="017..."
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {t.purchases.purchaseDate}
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded-lg"
                />
              </div>
            </div>

            {/* Select Products to purchase */}
            <div className="p-3 bg-white border border-gray-200 rounded-xl space-y-2">
              <span className="text-xs font-bold text-gray-700 block">
                {language === 'bn' ? 'ক্রয়ের পণ্য যোগ করুন:' : 'Add Items to Purchase:'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {products.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleAddItem(p)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs bg-gray-50 hover:bg-[#EAF7EF] hover:text-[#16834A] border border-gray-200 rounded-lg transition-colors"
                  >
                    <Plus className="w-3 h-3 text-[#16834A]" />
                    <span>{p.name}</span>
                    <span className="text-gray-400">(@৳{p.purchasePrice})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Line items table */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-100 text-gray-700 font-semibold">
                  <tr>
                    <th className="py-2 px-3">{t.receipt.product}</th>
                    <th className="py-2 px-3 text-center">{t.receipt.qty}</th>
                    <th className="py-2 px-3 text-right">{t.purchases.purchasePrice} (৳)</th>
                    <th className="py-2 px-3 text-right">{t.common.total}</th>
                    <th className="py-2 px-3 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400">
                        {language === 'bn' ? 'কোনো পণ্য নির্বাচিত হয়নি' : 'No items added'}
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-semibold text-gray-800">{item.productName}</td>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateItem(idx, 'quantity', parseFloat(e.target.value) || 1)
                            }
                            className="w-16 px-1.5 py-1 text-center border rounded font-bold"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            value={item.purchasePrice}
                            onChange={(e) =>
                              handleUpdateItem(idx, 'purchasePrice', parseFloat(e.target.value) || 0)
                            }
                            className="w-20 px-1.5 py-1 text-right border rounded"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-gray-900">
                          {formatCurrency(item.lineTotal, language)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Calculations & Payment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>{t.common.subtotal}:</span>
                  <span className="font-semibold">{formatCurrency(subtotal, language)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>{t.purchases.additionalCost}:</span>
                  <input
                    type="number"
                    value={additionalCost}
                    onChange={(e) => setAdditionalCost(parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1 text-right border rounded"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span>{t.common.discount}:</span>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1 text-right border rounded"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between font-bold text-base text-[#105C35]">
                  <span>{t.purchases.totalAmount}:</span>
                  <span>{formatCurrency(totalAmount, language)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{t.purchases.paidAmount}:</span>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                    className="w-28 px-2 py-1 text-right font-bold border rounded"
                  />
                </div>
                {dueAmount > 0 && (
                  <div className="flex justify-between text-red-600 font-bold">
                    <span>{t.purchases.dueAmount}:</span>
                    <span>{formatCurrency(dueAmount, language)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 border rounded-xl hover:bg-gray-100"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={isSubmitting || items.length === 0}
                className="px-5 py-2 font-bold text-white bg-[#16834A] hover:bg-[#105C35] rounded-xl shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? t.common.loading : t.common.save}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* View Purchase Modal */}
      {isViewModalOpen && selectedPurchase && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title={`Purchase Invoice - #${selectedPurchase.invoiceNumber}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="flex justify-between p-3 bg-gray-50 rounded-xl border">
              <div>
                <p className="font-bold text-gray-800">{selectedPurchase.supplierName}</p>
                <p className="text-gray-500">{selectedPurchase.supplierMobile}</p>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold">#{selectedPurchase.invoiceNumber}</p>
                <p className="text-gray-500">{formatDate(selectedPurchase.purchaseDate, language)}</p>
              </div>
            </div>

            <table className="w-full text-left text-xs border">
              <thead className="bg-gray-100 font-semibold">
                <tr>
                  <th className="p-2">Item</th>
                  <th className="p-2 text-center">Qty</th>
                  <th className="p-2 text-right">Cost</th>
                  <th className="p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {selectedPurchase.items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="p-2 font-semibold">{it.productName}</td>
                    <td className="p-2 text-center">
                      {it.quantity} {it.unit}
                    </td>
                    <td className="p-2 text-right">৳{it.purchasePrice}</td>
                    <td className="p-2 text-right font-bold">৳{it.lineTotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="p-3 bg-gray-50 rounded-xl space-y-1 text-right">
              <div>Total Amount: ৳{selectedPurchase.totalAmount}</div>
              <div className="text-green-700 font-semibold">Paid: ৳{selectedPurchase.paidAmount}</div>
              {selectedPurchase.dueAmount > 0 && (
                <div className="text-red-700 font-bold">Due: ৳{selectedPurchase.dueAmount}</div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#16834A] text-white rounded-lg text-xs font-semibold"
              >
                <Printer className="w-3.5 h-3.5 inline mr-1" />
                {t.common.print}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel Confirmation */}
      {cancelConfirmPurchase && (
        <Modal
          isOpen={!!cancelConfirmPurchase}
          onClose={() => setCancelConfirmPurchase(null)}
          title={language === 'bn' ? 'ক্রয় বাতিল নিশ্চিতকরণ' : 'Confirm Cancel Purchase'}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs sm:text-sm">
            <p className="text-red-600 font-medium">{t.purchases.cancelConfirm}</p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelConfirmPurchase(null)}
                className="px-4 py-2 border rounded-xl hover:bg-gray-100"
              >
                {t.common.close}
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-4 py-2 font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl"
              >
                {t.common.confirm}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
