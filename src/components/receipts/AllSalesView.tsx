import React, { useState } from 'react';
import {
  Search,
  Filter,
  Eye,
  Edit2,
  Printer,
  Download,
  Share2,
  Copy,
  XCircle,
  AlertCircle,
  Trash2,
  Plus,
} from 'lucide-react';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Receipt, ReceiptItem, PaymentStatus, PaymentMethod } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import { ReceiptPrintTemplate } from './ReceiptPrintTemplate';
import { WhatsAppShareModal } from './WhatsAppShareModal';
import { generateReceiptPDF } from '../../utils/pdfGenerator';

interface AllSalesViewProps {
  onDuplicate: (receipt: Receipt) => void;
}

export const AllSalesView: React.FC<AllSalesViewProps> = ({ onDuplicate }) => {
  const { receipts, updateReceipt, cancelReceipt, products } = useBusinessData();
  const { profile } = useAuth();
  const { t, language } = useLanguage();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 12;

  // Modals
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState<boolean>(false);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState<boolean>(false);
  const [cancelConfirmReceipt, setCancelConfirmReceipt] = useState<Receipt | null>(null);

  // Edit Receipt Form State
  const [editItems, setEditItems] = useState<ReceiptItem[]>([]);
  const [editCustomerName, setEditCustomerName] = useState<string>('');
  const [editCustomerMobile, setEditCustomerMobile] = useState<string>('');
  const [editCustomerAddress, setEditCustomerAddress] = useState<string>('');
  const [editOverallDiscount, setEditOverallDiscount] = useState<number>(0);
  const [editAdditionalCharges, setEditAdditionalCharges] = useState<number>(0);
  const [editPaidAmount, setEditPaidAmount] = useState<number>(0);
  const [editPaymentMethod, setEditPaymentMethod] = useState<PaymentMethod>('cash');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editError, setEditError] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Filter receipts
  const filteredReceipts = receipts.filter((r) => {
    // Search query match
    const q = searchTerm.toLowerCase();
    const matchSearch =
      r.receiptNumber.toLowerCase().includes(q) ||
      (r.customerName && r.customerName.toLowerCase().includes(q)) ||
      (r.customerMobile && r.customerMobile.includes(q));

    // Payment status match
    const matchPayment = paymentFilter === 'all' || r.paymentStatus === paymentFilter;

    // Status match (completed / cancelled)
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;

    // Date range
    let matchDate = true;
    if (startDate && r.date < startDate) matchDate = false;
    if (endDate && r.date > endDate) matchDate = false;

    return matchSearch && matchPayment && matchStatus && matchDate;
  });

  // Pagination
  const totalPages = Math.ceil(filteredReceipts.length / itemsPerPage) || 1;
  const paginatedReceipts = filteredReceipts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Open Edit Modal
  const handleOpenEdit = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setEditCustomerName(receipt.customerName);
    setEditCustomerMobile(receipt.customerMobile || '');
    setEditCustomerAddress(receipt.customerAddress || '');
    setEditItems(receipt.items.map((i) => ({ ...i })));
    setEditOverallDiscount(receipt.overallDiscount || 0);
    setEditAdditionalCharges(receipt.additionalCharges || 0);
    setEditPaidAmount(receipt.paidAmount || 0);
    setEditPaymentMethod(receipt.paymentMethod || 'cash');
    setEditNotes(receipt.notes || '');
    setEditError('');
    setEditModalOpen(true);
  };

  // Edit item inside edit modal
  const handleEditItemChange = (
    index: number,
    field: 'quantity' | 'sellingPrice' | 'discount',
    value: number
  ) => {
    const updated = [...editItems];
    const item = { ...updated[index], [field]: Math.max(0, value) };
    item.lineTotal = Math.max(0, item.quantity * item.sellingPrice - item.discount);
    updated[index] = item;
    setEditItems(updated);
  };

  const handleRemoveEditItem = (index: number) => {
    setEditItems(editItems.filter((_, i) => i !== index));
  };

  // Calculations for Edit Modal
  const editSubtotal = editItems.reduce((sum, item) => sum + item.quantity * item.sellingPrice, 0);
  const editItemDiscountTotal = editItems.reduce((sum, item) => sum + (item.discount || 0), 0);
  const editGrandTotal = Math.max(
    0,
    editSubtotal - editItemDiscountTotal - (editOverallDiscount || 0) + (editAdditionalCharges || 0)
  );
  const editDueAmount = Math.max(0, editGrandTotal - (editPaidAmount || 0));

  let editPaymentStatus: PaymentStatus = 'unpaid';
  if (editPaidAmount >= editGrandTotal && editGrandTotal > 0) {
    editPaymentStatus = 'paid';
  } else if (editPaidAmount > 0) {
    editPaymentStatus = 'partial';
  }

  const handleSaveEdit = async () => {
    if (!selectedReceipt) return;
    if (editItems.length === 0) {
      setEditError(language === 'bn' ? 'কমপক্ষে একটি পণ্য থাকা আবশ্যক' : 'Must have at least one product');
      return;
    }

    setIsUpdating(true);
    setEditError('');

    try {
      const updatedData: Partial<Receipt> = {
        customerName: editCustomerName,
        customerMobile: editCustomerMobile,
        customerAddress: editCustomerAddress,
        items: editItems,
        subtotal: editSubtotal,
        itemDiscount: editItemDiscountTotal,
        overallDiscount: Number(editOverallDiscount) || 0,
        additionalCharges: Number(editAdditionalCharges) || 0,
        grandTotal: editGrandTotal,
        paidAmount: Number(editPaidAmount) || 0,
        dueAmount: editDueAmount,
        paymentMethod: editPaymentMethod,
        paymentStatus: editPaymentStatus,
        notes: editNotes,
      };

      await updateReceipt(selectedReceipt.id, updatedData, selectedReceipt);
      setEditModalOpen(false);
      setSelectedReceipt(null);
    } catch (err) {
      console.error(err);
      setEditError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelConfirmReceipt) return;
    try {
      await cancelReceipt(cancelConfirmReceipt);
      setCancelConfirmReceipt(null);
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
          <h2 className="text-xl font-bold text-[#105C35]">{t.nav.allSales}</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {language === 'bn'
              ? 'সকল বিক্রয় রসিদের তালিকা, অনুসন্ধান, ফিল্টার, সম্পাদন ও প্রিন্ট করুন।'
              : 'View, search, filter, edit, duplicate, and print all customer sales receipts.'}
          </p>
        </div>

        <div className="text-xs font-semibold px-3 py-1.5 bg-[#EAF7EF] text-[#16834A] rounded-xl border border-[#16834A]/20">
          {language === 'bn' ? `মোট রসিদ: ${filteredReceipts.length} টি` : `Total Receipts: ${filteredReceipts.length}`}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E2EAE4] shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={language === 'bn' ? 'রসিদ নং, গ্রাহকের নাম বা মোবাইল...' : 'Search Receipt #, Customer or Mobile...'}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16834A]"
            />
          </div>

          {/* Payment Status Filter */}
          <div>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16834A] bg-white"
            >
              <option value="all">{language === 'bn' ? 'সব পেমেন্ট স্ট্যাটাস' : 'All Payments'}</option>
              <option value="paid">{t.receipt.paymentStatus.paid}</option>
              <option value="partial">{t.receipt.paymentStatus.partial}</option>
              <option value="unpaid">{t.receipt.paymentStatus.unpaid}</option>
            </select>
          </div>

          {/* Receipt Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16834A] bg-white"
            >
              <option value="all">{language === 'bn' ? 'সব স্ট্যাটাস' : 'All Statuses'}</option>
              <option value="completed">{t.receipt.receiptStatus.completed}</option>
              <option value="cancelled">{t.receipt.receiptStatus.cancelled}</option>
            </select>
          </div>

          {/* Date range filter */}
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-1/2 px-2 py-2 text-xs border border-gray-200 rounded-xl"
              title="Start Date"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-1/2 px-2 py-2 text-xs border border-gray-200 rounded-xl"
              title="End Date"
            />
          </div>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-2xl border border-[#E2EAE4] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#F7FAF8] border-b border-[#E2EAE4] text-gray-600 font-semibold">
              <tr>
                <th className="py-3 px-4">{t.receipt.receiptNumber}</th>
                <th className="py-3 px-4">{t.receipt.customerName}</th>
                <th className="py-3 px-4">{t.common.date}</th>
                <th className="py-3 px-4 text-right">{t.common.total}</th>
                <th className="py-3 px-4 text-right">{t.common.paid}</th>
                <th className="py-3 px-4 text-right">{t.common.due}</th>
                <th className="py-3 px-4 text-center">{t.common.status}</th>
                <th className="py-3 px-4 text-center">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedReceipts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400 text-sm">
                    {t.common.noDataFound}
                  </td>
                </tr>
              ) : (
                paginatedReceipts.map((receipt) => {
                  const isCancelled = receipt.status === 'cancelled';
                  return (
                    <tr
                      key={receipt.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        isCancelled ? 'bg-gray-50/60 opacity-60' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-gray-900 font-mono">
                        {receipt.receiptNumber}
                        {isCancelled && (
                          <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-red-100 text-red-700 font-sans">
                            {t.receipt.receiptStatus.cancelled}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-800">{receipt.customerName}</p>
                        {receipt.customerMobile && (
                          <p className="text-xs text-gray-500">{receipt.customerMobile}</p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                        {formatDate(receipt.date, language)}
                        <span className="block text-[11px] text-gray-400">{receipt.time}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-gray-900">
                        {formatCurrency(receipt.grandTotal, language)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-green-700">
                        {formatCurrency(receipt.paidAmount, language)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-red-600">
                        {receipt.dueAmount > 0 ? formatCurrency(receipt.dueAmount, language) : '-'}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-bold ${
                            receipt.paymentStatus === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : receipt.paymentStatus === 'partial'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {receipt.paymentStatus === 'paid'
                            ? t.receipt.paymentStatus.paid
                            : receipt.paymentStatus === 'partial'
                            ? t.receipt.paymentStatus.partial
                            : t.receipt.paymentStatus.unpaid}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* View */}
                          <button
                            onClick={() => {
                              setSelectedReceipt(receipt);
                              setViewModalOpen(true);
                            }}
                            className="p-1.5 text-gray-500 hover:text-[#16834A] hover:bg-[#EAF7EF] rounded-lg transition-colors"
                            title={t.common.view}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit (only if not cancelled) */}
                          {!isCancelled && (
                            <button
                              onClick={() => handleOpenEdit(receipt)}
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title={t.common.edit}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Print */}
                          <button
                            onClick={() => {
                              setSelectedReceipt(receipt);
                              setViewModalOpen(true);
                              setTimeout(() => window.print(), 300);
                            }}
                            className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                            title={t.common.print}
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Download PDF */}
                          <button
                            onClick={() => {
                              if (profile) {
                                const doc = generateReceiptPDF(
                                  receipt,
                                  profile,
                                  profile.receiptPaperSize || 'a4'
                                );
                                doc.save(`Receipt-${receipt.receiptNumber}.pdf`);
                              }
                            }}
                            className="p-1.5 text-gray-500 hover:text-[#16834A] hover:bg-green-50 rounded-lg transition-colors"
                            title={t.common.downloadPdf}
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {/* WhatsApp */}
                          <button
                            onClick={() => {
                              setSelectedReceipt(receipt);
                              setWhatsAppModalOpen(true);
                            }}
                            className="p-1.5 text-gray-500 hover:text-[#25D366] hover:bg-green-50 rounded-lg transition-colors"
                            title={t.common.shareWhatsApp}
                          >
                            <Share2 className="w-4 h-4" />
                          </button>

                          {/* Duplicate */}
                          <button
                            onClick={() => onDuplicate(receipt)}
                            className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title={t.common.duplicate}
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          {/* Cancel */}
                          {!isCancelled && (
                            <button
                              onClick={() => setCancelConfirmReceipt(receipt)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title={language === 'bn' ? 'রসিদ বাতিল' : 'Cancel Receipt'}
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

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-[#E2EAE4] bg-[#F7FAF8]">
            <span className="text-xs text-gray-500">
              {language === 'bn'
                ? `পৃষ্ঠা ${currentPage} / ${totalPages}`
                : `Page ${currentPage} of ${totalPages}`}
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 text-xs font-semibold rounded-lg border border-gray-300 disabled:opacity-40"
              >
                {language === 'bn' ? 'পূর্ববর্তী' : 'Previous'}
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 text-xs font-semibold rounded-lg border border-gray-300 disabled:opacity-40"
              >
                {language === 'bn' ? 'পরবর্তী' : 'Next'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Modal */}
      {viewModalOpen && selectedReceipt && profile && (
        <Modal
          isOpen={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedReceipt(null);
          }}
          title={`${t.common.view} - #${selectedReceipt.receiptNumber}`}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-4">
            <div className="flex justify-end gap-2 p-3 bg-gray-50 rounded-xl">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#16834A] text-white rounded-lg hover:bg-[#105C35]"
              >
                <Printer className="w-4 h-4" />
                <span>{t.common.print}</span>
              </button>
              <button
                onClick={() => {
                  const doc = generateReceiptPDF(
                    selectedReceipt,
                    profile,
                    profile.receiptPaperSize || 'a4'
                  );
                  doc.save(`Receipt-${selectedReceipt.receiptNumber}.pdf`);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700"
              >
                <Download className="w-4 h-4 text-[#16834A]" />
                <span>{t.common.downloadPdf}</span>
              </button>
              <button
                onClick={() => setWhatsAppModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#25D366] text-white rounded-lg hover:bg-[#1EBE5D]"
              >
                <Share2 className="w-4 h-4" />
                <span>{t.common.shareWhatsApp}</span>
              </button>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden p-4 bg-gray-100 flex justify-center">
              <ReceiptPrintTemplate receipt={selectedReceipt} profile={profile} />
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Receipt Modal */}
      {editModalOpen && selectedReceipt && (
        <Modal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedReceipt(null);
          }}
          title={`${t.receipt.editReceipt} - #${selectedReceipt.receiptNumber}`}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-4">
            {editError && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-medium">
                {editError}
              </div>
            )}

            {/* Customer info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t.receipt.customerName}
                </label>
                <input
                  type="text"
                  value={editCustomerName}
                  onChange={(e) => setEditCustomerName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t.receipt.customerMobile}
                </label>
                <input
                  type="text"
                  value={editCustomerMobile}
                  onChange={(e) => setEditCustomerMobile(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t.receipt.customerAddress}
                </label>
                <input
                  type="text"
                  value={editCustomerAddress}
                  onChange={(e) => setEditCustomerAddress(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            {/* Items */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-100 text-gray-700 font-semibold">
                  <tr>
                    <th className="py-2 px-3">{t.receipt.product}</th>
                    <th className="py-2 px-3 text-center">{t.receipt.qty}</th>
                    <th className="py-2 px-3 text-right">{t.receipt.unitPrice}</th>
                    <th className="py-2 px-3 text-right">{t.receipt.itemDiscount}</th>
                    <th className="py-2 px-3 text-right">{t.common.total}</th>
                    <th className="py-2 px-3 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {editItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 font-semibold">{item.productName}</td>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleEditItemChange(idx, 'quantity', parseFloat(e.target.value) || 1)
                          }
                          className="w-16 px-1.5 py-1 text-center border rounded font-bold"
                        />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <input
                          type="number"
                          value={item.sellingPrice}
                          onChange={(e) =>
                            handleEditItemChange(idx, 'sellingPrice', parseFloat(e.target.value) || 0)
                          }
                          className="w-20 px-1.5 py-1 text-right border rounded"
                        />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <input
                          type="number"
                          value={item.discount}
                          onChange={(e) =>
                            handleEditItemChange(idx, 'discount', parseFloat(e.target.value) || 0)
                          }
                          className="w-16 px-1.5 py-1 text-right border rounded"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-bold">
                        {formatCurrency(item.lineTotal, language)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => handleRemoveEditItem(idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations & Payment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs sm:text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>{t.common.subtotal}:</span>
                  <span className="font-semibold">{formatCurrency(editSubtotal, language)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>{t.receipt.overallDiscount}:</span>
                  <input
                    type="number"
                    value={editOverallDiscount}
                    onChange={(e) => setEditOverallDiscount(parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1 text-right border rounded"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span>{t.receipt.additionalCharges}:</span>
                  <input
                    type="number"
                    value={editAdditionalCharges}
                    onChange={(e) => setEditAdditionalCharges(parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1 text-right border rounded"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between font-bold text-base text-[#105C35]">
                  <span>{t.receipt.grandTotal}:</span>
                  <span>{formatCurrency(editGrandTotal, language)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{t.receipt.paidAmount}:</span>
                  <input
                    type="number"
                    value={editPaidAmount}
                    onChange={(e) => setEditPaidAmount(parseFloat(e.target.value) || 0)}
                    className="w-28 px-2 py-1 text-right font-bold border rounded"
                  />
                </div>
                {editDueAmount > 0 && (
                  <div className="flex justify-between text-red-600 font-bold">
                    <span>{t.receipt.dueAmount}:</span>
                    <span>{formatCurrency(editDueAmount, language)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold border rounded-lg hover:bg-gray-100"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isUpdating}
                className="px-5 py-2 text-xs font-bold text-white bg-[#16834A] hover:bg-[#105C35] rounded-lg shadow-sm"
              >
                {isUpdating ? t.common.loading : t.common.save}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel Confirmation Dialog */}
      {cancelConfirmReceipt && (
        <Modal
          isOpen={!!cancelConfirmReceipt}
          onClose={() => setCancelConfirmReceipt(null)}
          title={language === 'bn' ? 'রসিদ বাতিল নিশ্চিতকরণ' : 'Confirm Cancel Receipt'}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-red-50 text-red-800 rounded-xl border border-red-200">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold">{t.receipt.cancelReceiptConfirm}</p>
                <p className="mt-1">
                  {language === 'bn'
                    ? `রসিদ #${cancelConfirmReceipt.receiptNumber} বাতিল হবে এবং বিক্রিত পণ্য ইনভেন্টরি স্টকে পুনরায় যুক্ত হবে।`
                    : `Receipt #${cancelConfirmReceipt.receiptNumber} will be marked cancelled and stock will be restored to inventory.`}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelConfirmReceipt(null)}
                className="px-4 py-2 text-xs font-semibold border rounded-lg hover:bg-gray-100"
              >
                {t.common.close}
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm"
              >
                {language === 'bn' ? 'হ্যাঁ, বাতিল করুন' : 'Yes, Cancel Receipt'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* WhatsApp Modal */}
      {whatsAppModalOpen && selectedReceipt && profile && (
        <WhatsAppShareModal
          isOpen={whatsAppModalOpen}
          onClose={() => {
            setWhatsAppModalOpen(false);
            setSelectedReceipt(null);
          }}
          receipt={selectedReceipt}
          profile={profile}
        />
      )}
    </div>
  );
};
