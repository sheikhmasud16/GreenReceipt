import React, { useState } from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  Edit,
  Trash2,
  DollarSign,
  History,
  Building,
} from 'lucide-react';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useLanguage } from '../../context/LanguageContext';
import { Supplier } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Modal } from '../common/Modal';

export const SuppliersView: React.FC = () => {
  const {
    suppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    recordSupplierPayment,
    purchases,
    payments,
  } = useBusinessData();
  const { t, language } = useLanguage();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState<boolean>(false);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState<boolean>(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Form State
  const [name, setName] = useState<string>('');
  const [businessName, setBusinessName] = useState<string>('');
  const [mobile, setMobile] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Payment Form
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<string>('cash');
  const [payNotes, setPayNotes] = useState<string>('');
  const [isPaying, setIsPaying] = useState<boolean>(false);

  // Filtered
  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.businessName && s.businessName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      s.mobile.includes(searchTerm)
  );

  const totalSupplierDue = suppliers.reduce((sum, s) => sum + (s.totalDue || 0), 0);

  const handleOpenAdd = () => {
    setName('');
    setBusinessName('');
    setMobile('');
    setEmail('');
    setAddress('');
    setNotes('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (s: Supplier) => {
    setSelectedSupplier(s);
    setName(s.name);
    setBusinessName(s.businessName || '');
    setMobile(s.mobile);
    setEmail(s.email || '');
    setAddress(s.address || '');
    setNotes(s.notes || '');
    setIsEditModalOpen(true);
  };

  const handleOpenPay = (s: Supplier) => {
    setSelectedSupplier(s);
    setPayAmount(s.totalDue || 0);
    setPayMethod('cash');
    setPayNotes('');
    setIsPayModalOpen(true);
  };

  const handleOpenLedger = (s: Supplier) => {
    setSelectedSupplier(s);
    setIsLedgerModalOpen(true);
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !mobile) return;
    try {
      await createSupplier({
        name,
        businessName,
        mobile,
        email,
        address,
        notes,
        totalPurchased: 0,
        totalPaid: 0,
        totalDue: 0,
      });
      setIsAddModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to add supplier');
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || !name) return;
    try {
      await updateSupplier(selectedSupplier.id, {
        name,
        businessName,
        mobile,
        email,
        address,
        notes,
      });
      setIsEditModalOpen(false);
      setSelectedSupplier(null);
    } catch (err) {
      console.error(err);
      alert('Failed to update supplier');
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedSupplier || payAmount <= 0) return;
    setIsPaying(true);
    try {
      await recordSupplierPayment(selectedSupplier.id, payAmount, payMethod, payNotes);
      setIsPayModalOpen(false);
      setSelectedSupplier(null);
    } catch (err) {
      console.error(err);
      alert('Payment failed');
    } finally {
      setIsPaying(false);
    }
  };

  const supplierPurchases = selectedSupplier
    ? purchases.filter((p) => p.supplierId === selectedSupplier.id || p.supplierMobile === selectedSupplier.mobile)
    : [];
  const supplierPayments = selectedSupplier
    ? payments.filter((p) => p.partyId === selectedSupplier.id && p.partyType === 'supplier')
    : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-[#E2EAE4] shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-[#105C35]">{t.parties.suppliersTitle}</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {language === 'bn'
              ? 'সকল সরবরাহকারীর হিসাব, ক্রয় ইতিহাস ও বকেয়া দেনা পরিশোধ করুন।'
              : 'Supplier profiles, inventory purchases, and payable dues ledger.'}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#16834A] hover:bg-[#105C35] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'bn' ? '+ নতুন সরবরাহকারী' : '+ Add Supplier'}</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#E2EAE4] shadow-2xs">
          <span className="text-[11px] font-semibold text-gray-500">{t.nav.suppliers}</span>
          <p className="text-xl font-bold text-gray-900 mt-1">{suppliers.length}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E2EAE4] shadow-2xs">
          <span className="text-[11px] font-semibold text-gray-500">{language === 'bn' ? 'সাপ্লায়ার বকেয়া দেনা' : 'Total Payable Due'}</span>
          <p className="text-xl font-bold text-red-600 mt-1">
            {formatCurrency(totalSupplierDue, language)}
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
            placeholder={language === 'bn' ? 'নাম, প্রতিষ্ঠান বা মোবাইল...' : 'Search by name, company, mobile...'}
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16834A]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E2EAE4] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#F7FAF8] border-b border-[#E2EAE4] text-gray-600 font-semibold">
              <tr>
                <th className="py-3 px-4">{t.common.name}</th>
                <th className="py-3 px-4">{language === 'bn' ? 'প্রতিষ্ঠান' : 'Company'}</th>
                <th className="py-3 px-4">{t.common.mobile}</th>
                <th className="py-3 px-4 text-right">{language === 'bn' ? 'মোট ক্রয়' : 'Total Purchased'}</th>
                <th className="py-3 px-4 text-right">{t.parties.totalPaid}</th>
                <th className="py-3 px-4 text-right">{t.parties.totalDue}</th>
                <th className="py-3 px-4 text-center">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    {t.common.noDataFound}
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-bold text-gray-900">{s.name}</td>
                    <td className="py-3 px-4 text-gray-600">{s.businessName || '-'}</td>
                    <td className="py-3 px-4 text-gray-600 font-mono">{s.mobile}</td>
                    <td className="py-3 px-4 text-right font-medium text-gray-800">
                      {formatCurrency(s.totalPurchased || 0, language)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-green-700">
                      {formatCurrency(s.totalPaid || 0, language)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-red-600">
                      {s.totalDue > 0 ? formatCurrency(s.totalDue, language) : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {s.totalDue > 0 && (
                          <button
                            onClick={() => handleOpenPay(s)}
                            className="px-2 py-1 bg-[#16834A] text-white hover:bg-[#105C35] rounded-lg text-xs font-semibold shadow-2xs"
                          >
                            ৳ {language === 'bn' ? 'পরিশোধ' : 'Pay'}
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenLedger(s)}
                          className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                        >
                          <History className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
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
            setSelectedSupplier(null);
          }}
          title={isAddModalOpen ? '+ নতুন সরবরাহকারী নিবন্ধন' : 'সরবরাহকারীর তথ্য সম্পাদন'}
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
                {language === 'bn' ? 'প্রতিষ্ঠানের নাম' : 'Business / Company Name'}
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
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
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">{t.common.address}</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
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

      {/* Pay Supplier Modal */}
      {isPayModalOpen && selectedSupplier && (
        <Modal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          title={`সাপ্লায়ার দেনা পরিশোধ - ${selectedSupplier.name}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="p-3 bg-red-50 text-red-800 rounded-xl flex justify-between items-center font-bold">
              <span>{language === 'bn' ? 'মোট দেনা:' : 'Payable Due:'}</span>
              <span>{formatCurrency(selectedSupplier.totalDue, language)}</span>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                পরিশোধের পরিমাণ (টাকা) *
              </label>
              <input
                type="number"
                min="1"
                max={selectedSupplier.totalDue}
                value={payAmount}
                onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-xl font-bold"
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
                {isPaying ? t.common.loading : 'পরিশোধ সম্পন্ন করুন'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Supplier Ledger Modal */}
      {isLedgerModalOpen && selectedSupplier && (
        <Modal
          isOpen={isLedgerModalOpen}
          onClose={() => setIsLedgerModalOpen(false)}
          title={`সাপ্লায়ার হিসাব খাতা - ${selectedSupplier.name}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-xl border">
              <div>
                <span className="text-gray-500">মোট ক্রয়:</span>
                <p className="font-bold">{formatCurrency(selectedSupplier.totalPurchased || 0, language)}</p>
              </div>
              <div>
                <span className="text-gray-500">মোট পরিশোধ:</span>
                <p className="font-bold text-green-700">{formatCurrency(selectedSupplier.totalPaid || 0, language)}</p>
              </div>
              <div>
                <span className="text-gray-500">বাকি দেনা:</span>
                <p className="font-bold text-red-600">{formatCurrency(selectedSupplier.totalDue || 0, language)}</p>
              </div>
            </div>

            <h4 className="font-bold text-gray-800">ক্রয় ইনভয়েস ({supplierPurchases.length})</h4>
            <div className="max-h-48 overflow-y-auto border rounded-xl">
              <table className="w-full text-xs">
                <thead className="bg-gray-100 font-semibold">
                  <tr>
                    <th className="p-2">ইনভয়েস নং</th>
                    <th className="p-2">তারিখ</th>
                    <th className="p-2 text-right">মোট</th>
                    <th className="p-2 text-right">পরিশোধ</th>
                    <th className="p-2 text-right">বাকি</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {supplierPurchases.map((p) => (
                    <tr key={p.id}>
                      <td className="p-2 font-mono font-bold">{p.invoiceNumber}</td>
                      <td className="p-2">{formatDate(p.purchaseDate, language)}</td>
                      <td className="p-2 text-right font-bold">{formatCurrency(p.totalAmount, language)}</td>
                      <td className="p-2 text-right text-green-700">{formatCurrency(p.paidAmount, language)}</td>
                      <td className="p-2 text-right text-red-600 font-bold">{formatCurrency(p.dueAmount, language)}</td>
                    </tr>
                  ))}
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
