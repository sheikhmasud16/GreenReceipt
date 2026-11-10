import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  DollarSign,
  History,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useLanguage } from '../../context/LanguageContext';
import { Customer } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { openWhatsAppChat } from '../../utils/whatsapp';
import { Modal } from '../common/Modal';

export const CustomersView: React.FC = () => {
  const {
    customers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    recordCustomerPayment,
    receipts,
    payments,
  } = useBusinessData();
  const { t, language } = useLanguage();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState<boolean>(false);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Form State
  const [name, setName] = useState<string>('');
  const [mobile, setMobile] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Payment Form State
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<string>('cash');
  const [payNotes, setPayNotes] = useState<string>('');
  const [isPaying, setIsPaying] = useState<boolean>(false);

  // Filtered
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.mobile.includes(searchTerm) ||
      (c.address && c.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalOutstandingDue = customers.reduce((sum, c) => sum + (c.totalDue || 0), 0);
  const totalCustomerPurchases = customers.reduce((sum, c) => sum + (c.totalPurchases || 0), 0);

  const handleOpenAdd = () => {
    setName('');
    setMobile('');
    setEmail('');
    setAddress('');
    setNotes('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setSelectedCustomer(c);
    setName(c.name);
    setMobile(c.mobile);
    setEmail(c.email || '');
    setAddress(c.address || '');
    setNotes(c.notes || '');
    setIsEditModalOpen(true);
  };

  const handleOpenPay = (c: Customer) => {
    setSelectedCustomer(c);
    setPayAmount(c.totalDue || 0);
    setPayMethod('cash');
    setPayNotes('');
    setIsPayModalOpen(true);
  };

  const handleOpenLedger = (c: Customer) => {
    setSelectedCustomer(c);
    setIsLedgerModalOpen(true);
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !mobile) return;
    try {
      await createCustomer({
        name,
        mobile,
        email,
        address,
        notes,
        totalPurchases: 0,
        totalPaid: 0,
        totalDue: 0,
      });
      setIsAddModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to add customer');
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !name) return;
    try {
      await updateCustomer(selectedCustomer.id, {
        name,
        mobile,
        email,
        address,
        notes,
      });
      setIsEditModalOpen(false);
      setSelectedCustomer(null);
    } catch (err) {
      console.error(err);
      alert('Failed to update customer');
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedCustomer || payAmount <= 0) return;
    setIsPaying(true);
    try {
      await recordCustomerPayment(selectedCustomer.id, payAmount, payMethod, payNotes);
      setIsPayModalOpen(false);
      setSelectedCustomer(null);
    } catch (err) {
      console.error(err);
      alert('Payment failed');
    } finally {
      setIsPaying(false);
    }
  };

  // Receipts and Payments for selected customer ledger
  const customerReceipts = selectedCustomer
    ? receipts.filter((r) => r.customerId === selectedCustomer.id || r.customerMobile === selectedCustomer.mobile)
    : [];
  const customerPayments = selectedCustomer
    ? payments.filter((p) => p.partyId === selectedCustomer.id && p.partyType === 'customer')
    : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-[#E2EAE4] shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-[#105C35]">{t.parties.customersTitle}</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {language === 'bn'
              ? 'গ্রাহকদের তালিকা, ক্রয় খতিয়ান, বাকি হিসাব ও পেমেন্ট গ্রহণ করুন।'
              : 'Customer accounts, purchase histories, outstanding dues, and payment ledgers.'}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#16834A] hover:bg-[#105C35] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'bn' ? '+ নতুন গ্রাহক' : '+ Add Customer'}</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#E2EAE4] shadow-2xs">
          <span className="text-[11px] font-semibold text-gray-500">{t.dashboard.totalCustomers}</span>
          <p className="text-xl font-bold text-gray-900 mt-1">{customers.length}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E2EAE4] shadow-2xs">
          <span className="text-[11px] font-semibold text-gray-500">{t.parties.totalPurchases}</span>
          <p className="text-xl font-bold text-[#16834A] mt-1">
            {formatCurrency(totalCustomerPurchases, language)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E2EAE4] shadow-2xs">
          <span className="text-[11px] font-semibold text-gray-500">{t.parties.totalDue}</span>
          <p className="text-xl font-bold text-red-600 mt-1">
            {formatCurrency(totalOutstandingDue, language)}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-[#E2EAE4] shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={language === 'bn' ? 'গ্রাহকের নাম বা মোবাইল নম্বর...' : 'Search Customer by name or mobile...'}
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16834A]"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-[#E2EAE4] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#F7FAF8] border-b border-[#E2EAE4] text-gray-600 font-semibold">
              <tr>
                <th className="py-3 px-4">{t.common.name}</th>
                <th className="py-3 px-4">{t.common.mobile}</th>
                <th className="py-3 px-4">{t.common.address}</th>
                <th className="py-3 px-4 text-right">{t.parties.totalPurchases}</th>
                <th className="py-3 px-4 text-right">{t.parties.totalPaid}</th>
                <th className="py-3 px-4 text-right">{t.parties.totalDue}</th>
                <th className="py-3 px-4 text-center">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    {t.common.noDataFound}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-bold text-gray-900">{c.name}</td>
                    <td className="py-3 px-4 text-gray-600 font-mono">{c.mobile}</td>
                    <td className="py-3 px-4 text-gray-500 max-w-xs truncate">{c.address || '-'}</td>
                    <td className="py-3 px-4 text-right font-medium text-gray-800">
                      {formatCurrency(c.totalPurchases || 0, language)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-green-700">
                      {formatCurrency(c.totalPaid || 0, language)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-red-600">
                      {c.totalDue > 0 ? formatCurrency(c.totalDue, language) : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* Due Payment */}
                        {c.totalDue > 0 && (
                          <button
                            onClick={() => handleOpenPay(c)}
                            className="px-2 py-1 bg-[#16834A] text-white hover:bg-[#105C35] rounded-lg text-xs font-semibold shadow-2xs"
                            title={t.parties.recordPayment}
                          >
                            ৳ {language === 'bn' ? 'পরিশোধ' : 'Pay'}
                          </button>
                        )}

                        {/* Ledger */}
                        <button
                          onClick={() => handleOpenLedger(c)}
                          className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                          title="Customer Ledger"
                        >
                          <History className="w-4 h-4" />
                        </button>

                        {/* WhatsApp Message */}
                        <button
                          onClick={() => {
                            const msg = `Dear ${c.name},\nThank you for shopping with us! Current outstanding balance: ৳${c.totalDue || 0}.\nBest regards.`;
                            openWhatsAppChat(c.mobile, msg);
                          }}
                          className="p-1.5 text-gray-500 hover:text-[#25D366] hover:bg-green-50 rounded-lg"
                          title="WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title={t.common.edit}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <Modal
          isOpen={isAddModalOpen || isEditModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setIsEditModalOpen(false);
            setSelectedCustomer(null);
          }}
          title={isAddModalOpen ? '+ নতুন গ্রাহক নিবন্ধন' : 'গ্রাহকের তথ্য সম্পাদন'}
          maxWidth="max-w-md"
        >
          <form
            onSubmit={isAddModalOpen ? handleSubmitAdd : handleSubmitEdit}
            className="space-y-4 text-xs sm:text-sm"
          >
            <div>
              <label className="block font-semibold text-gray-700 mb-1">{t.common.name} *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                {t.common.mobile} *
              </label>
              <input
                type="text"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
                placeholder="01712345678"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                {t.common.email} {t.common.optional}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                {t.common.address}
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">{t.common.notes}</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                }}
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

      {/* Record Payment Modal */}
      {isPayModalOpen && selectedCustomer && (
        <Modal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          title={`বকেয়া আদায় - ${selectedCustomer.name}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="p-3 bg-red-50 text-red-800 rounded-xl flex justify-between items-center font-bold">
              <span>{t.parties.totalDue}:</span>
              <span>{formatCurrency(selectedCustomer.totalDue, language)}</span>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                আদায়ের পরিমাণ (টাকা) *
              </label>
              <input
                type="number"
                min="1"
                max={selectedCustomer.totalDue}
                value={payAmount}
                onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-xl font-bold text-base"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                {t.receipt.paymentMethod}
              </label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl bg-white"
              >
                <option value="cash">ক্যাশ (Cash)</option>
                <option value="bkash">বিকাশ (bKash)</option>
                <option value="nagad">নগদ (Nagad)</option>
                <option value="bank">ব্যাংক (Bank)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">{t.common.notes}</label>
              <input
                type="text"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                placeholder="উদা: পার্সিয়াল পেমেন্ট গ্রহণ"
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="px-4 py-2 border rounded-xl hover:bg-gray-100"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={isPaying || payAmount <= 0}
                className="px-5 py-2 font-bold text-white bg-[#16834A] hover:bg-[#105C35] rounded-xl shadow-xs"
              >
                {isPaying ? t.common.loading : 'পেমেন্ট সম্পন্ন করুন'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Customer Ledger Modal */}
      {isLedgerModalOpen && selectedCustomer && (
        <Modal
          isOpen={isLedgerModalOpen}
          onClose={() => setIsLedgerModalOpen(false)}
          title={`গ্রাহকের হিসাব খাতা - ${selectedCustomer.name}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-xl border">
              <div>
                <span className="text-gray-500">মোট ক্রয়:</span>
                <p className="font-bold text-gray-900">{formatCurrency(selectedCustomer.totalPurchases || 0, language)}</p>
              </div>
              <div>
                <span className="text-gray-500">মোট পরিশোধ:</span>
                <p className="font-bold text-green-700">{formatCurrency(selectedCustomer.totalPaid || 0, language)}</p>
              </div>
              <div>
                <span className="text-gray-500">বর্তমান বকেয়া:</span>
                <p className="font-bold text-red-600">{formatCurrency(selectedCustomer.totalDue || 0, language)}</p>
              </div>
            </div>

            <h4 className="font-bold text-gray-800">বিক্রয় রসিদসমূহ ({customerReceipts.length})</h4>
            <div className="max-h-48 overflow-y-auto border rounded-xl">
              <table className="w-full text-xs">
                <thead className="bg-gray-100 font-semibold">
                  <tr>
                    <th className="p-2">রসিদ নং</th>
                    <th className="p-2">তারিখ</th>
                    <th className="p-2 text-right">সর্বমোট</th>
                    <th className="p-2 text-right">পরিশোধ</th>
                    <th className="p-2 text-right">বাকি</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {customerReceipts.map((r) => (
                    <tr key={r.id}>
                      <td className="p-2 font-mono font-bold">{r.receiptNumber}</td>
                      <td className="p-2 text-gray-600">{formatDate(r.date, language)}</td>
                      <td className="p-2 text-right font-bold">{formatCurrency(r.grandTotal, language)}</td>
                      <td className="p-2 text-right text-green-700">{formatCurrency(r.paidAmount, language)}</td>
                      <td className="p-2 text-right text-red-600 font-bold">{formatCurrency(r.dueAmount, language)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h4 className="font-bold text-gray-800">পরিশোধ হিস্ট্রি ({customerPayments.length})</h4>
            <div className="max-h-40 overflow-y-auto border rounded-xl">
              <table className="w-full text-xs">
                <thead className="bg-gray-100 font-semibold">
                  <tr>
                    <th className="p-2">তারিখ</th>
                    <th className="p-2">মাধ্যম</th>
                    <th className="p-2 text-right">পরিমাণ</th>
                    <th className="p-2">নোট</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {customerPayments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-3 text-center text-gray-400">কোনো অতিরিক্ত পেমেন্ট রেকর্ড নেই</td>
                    </tr>
                  ) : (
                    customerPayments.map((p) => (
                      <tr key={p.id}>
                        <td className="p-2">{p.date}</td>
                        <td className="p-2 uppercase">{p.paymentMethod}</td>
                        <td className="p-2 text-right font-bold text-green-700">{formatCurrency(p.amount, language)}</td>
                        <td className="p-2 text-gray-500">{p.notes || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsLedgerModalOpen(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                {t.common.close}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
