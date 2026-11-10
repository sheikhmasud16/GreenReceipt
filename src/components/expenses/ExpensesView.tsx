import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useLanguage } from '../../context/LanguageContext';
import { Expense, PaymentMethod } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Modal } from '../common/Modal';

export const ExpensesView: React.FC = () => {
  const { expenses, createExpense, updateExpense, deleteExpense } = useBusinessData();
  const { t, language } = useLanguage();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  // Form State
  const [category, setCategory] = useState<string>('rent');
  const [title, setTitle] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [description, setDescription] = useState<string>('');

  const currentMonth = new Date().toISOString().substring(0, 7);

  // Filtered
  const filteredExpenses = expenses.filter((e) => {
    const matchSearch =
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.description && e.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchCat = selectedCategory === 'all' || e.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const totalAllTime = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalThisMonth = expenses
    .filter((e) => e.date.startsWith(currentMonth))
    .reduce((sum, e) => sum + e.amount, 0);

  const handleOpenAdd = () => {
    setCategory('rent');
    setTitle('');
    setAmount(0);
    setDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('cash');
    setDescription('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (exp: Expense) => {
    setSelectedExpense(exp);
    setCategory(exp.category);
    setTitle(exp.title);
    setAmount(exp.amount);
    setDate(exp.date);
    setPaymentMethod(exp.paymentMethod || 'cash');
    setDescription(exp.description || '');
    setIsEditModalOpen(true);
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || amount <= 0) return;
    try {
      await createExpense({
        category,
        title,
        amount: Number(amount),
        date,
        paymentMethod,
        description,
      });
      setIsAddModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to add expense');
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpense || !title || amount <= 0) return;
    try {
      await updateExpense(selectedExpense.id, {
        category,
        title,
        amount: Number(amount),
        date,
        paymentMethod,
        description,
      });
      setIsEditModalOpen(false);
      setSelectedExpense(null);
    } catch (err) {
      console.error(err);
      alert('Failed to update expense');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(t.common.confirmDelete)) {
      try {
        await deleteExpense(id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-[#E2EAE4] shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-[#105C35]">{t.expenses.title}</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {language === 'bn'
              ? 'দোকান ভাড়া, ইউটিলিটি, বেতন ও ব্যবসার সকল পরিচালনা ব্যয় রেকর্ড করুন।'
              : 'Record rent, utilities, employee wages, and all business operating overheads.'}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#16834A] hover:bg-[#105C35] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{t.expenses.addExpense}</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#E2EAE4] shadow-2xs">
          <span className="text-[11px] font-semibold text-gray-500">{t.expenses.totalExpensesThisMonth}</span>
          <p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(totalThisMonth, language)}</p>
          <span className="text-[10px] text-gray-400">
            {language === 'bn' ? 'চলতি মাসের মোট ব্যয়' : 'This calendar month'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E2EAE4] shadow-2xs">
          <span className="text-[11px] font-semibold text-gray-500">
            {language === 'bn' ? 'সর্বমোট পরিচালনা ব্যয়' : 'Total All-time Expenses'}
          </span>
          <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(totalAllTime, language)}</p>
          <span className="text-[10px] text-gray-400">
            {expenses.length} {language === 'bn' ? 'টি খরচ এন্ট্রি' : 'Records logged'}
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
            placeholder={language === 'bn' ? 'খরচের বিবরণ দিয়ে খুঁজুন...' : 'Search by expense title...'}
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16834A]"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#16834A] w-full sm:w-auto"
        >
          <option value="all">{language === 'bn' ? 'সকল খাত' : 'All Categories'}</option>
          {Object.entries(t.expenses.categories).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E2EAE4] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#F7FAF8] border-b border-[#E2EAE4] text-gray-600 font-semibold">
              <tr>
                <th className="py-3 px-4">{t.common.date}</th>
                <th className="py-3 px-4">{t.expenses.category}</th>
                <th className="py-3 px-4">{t.expenses.expenseTitle}</th>
                <th className="py-3 px-4">{t.receipt.paymentMethod}</th>
                <th className="py-3 px-4 text-right">{t.expenses.amount}</th>
                <th className="py-3 px-4 text-center">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    {t.common.noDataFound}
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                      {formatDate(exp.date, language)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 text-xs font-semibold text-gray-700">
                        {t.expenses.categories[exp.category as keyof typeof t.expenses.categories] ||
                          exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      {exp.title}
                      {exp.description && (
                        <p className="text-xs text-gray-400 font-normal">{exp.description}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 uppercase text-xs font-medium text-gray-600">
                      {exp.paymentMethod}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-red-600 text-sm">
                      {formatCurrency(exp.amount, language)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(exp)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
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
            setSelectedExpense(null);
          }}
          title={isAddModalOpen ? t.expenses.addExpense : 'খরচ সম্পাদন করুন'}
          maxWidth="max-w-md"
        >
          <form
            onSubmit={isAddModalOpen ? handleSubmitAdd : handleSubmitEdit}
            className="space-y-4 text-xs sm:text-sm"
          >
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                {t.expenses.category} *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl bg-white"
              >
                {Object.entries(t.expenses.categories).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                {t.expenses.expenseTitle} *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="উদা: ফেব্রুয়ারি মাসের দোকান ভাড়া"
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {t.expenses.amount} (৳) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {t.common.date} *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                {t.receipt.paymentMethod}
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 border rounded-xl bg-white"
              >
                <option value="cash">ক্যাশ (Cash)</option>
                <option value="bkash">বিকাশ (bKash)</option>
                <option value="nagad">নগদ (Nagad)</option>
                <option value="bank">ব্যাংক (Bank)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                {language === 'bn' ? 'অতিরিক্ত বিবরণ' : 'Description / Notes'}
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
    </div>
  );
};
