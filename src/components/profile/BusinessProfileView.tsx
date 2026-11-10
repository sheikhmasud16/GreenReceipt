import React, { useState, useEffect } from 'react';
import {
  Store,
  Save,
  CheckCircle2,
  FileText,
  Sliders,
  DollarSign,
  Globe,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { PaperSize, ReceiptStyle, Language } from '../../types';

export const BusinessProfileView: React.FC = () => {
  const { profile, updateProfile } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  const [businessName, setBusinessName] = useState<string>('');
  const [mobile, setMobile] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [receiptFooter, setReceiptFooter] = useState<string>('');
  const [receiptPrefix, setReceiptPrefix] = useState<string>('REC-');
  const [receiptPaperSize, setReceiptPaperSize] = useState<PaperSize>('a4');
  const [receiptStyle, setReceiptStyle] = useState<ReceiptStyle>('green');
  const [allowNegativeStock, setAllowNegativeStock] = useState<boolean>(false);
  const [prefLang, setPrefLang] = useState<Language>('bn');

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    if (profile) {
      setBusinessName(profile.businessName || '');
      setMobile(profile.mobile || '');
      setEmail(profile.email || '');
      setAddress(profile.address || '');
      setLogoUrl(profile.logoUrl || '');
      setDescription(profile.description || '');
      setReceiptFooter(profile.receiptFooter || '');
      setReceiptPrefix(profile.receiptPrefix || 'REC-');
      setReceiptPaperSize(profile.receiptPaperSize || 'a4');
      setReceiptStyle(profile.receiptStyle || 'green');
      setAllowNegativeStock(profile.allowNegativeStock || false);
      setPrefLang(profile.preferredLanguage || 'bn');
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage('');

    try {
      await updateProfile({
        businessName,
        mobile,
        email,
        address,
        logoUrl,
        description,
        receiptFooter,
        receiptPrefix,
        receiptPaperSize,
        receiptStyle,
        allowNegativeStock,
        preferredLanguage: prefLang,
      });

      // Update current app language if changed
      if (prefLang !== language) {
        setLanguage(prefLang);
      }

      setSuccessMessage(t.common.success);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error(err);
      alert('Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-[#E2EAE4] shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-[#105C35]">{t.profile.title}</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {language === 'bn'
              ? 'আপনার ব্যবসায়ের পরিচিতি, রসিদ ডিজাইন, প্রিন্ট ফরম্যাট ও সিস্টেম সেটিংস।'
              : 'Customize company info, receipt branding, default paper size, and inventory controls.'}
          </p>
        </div>

        {successMessage && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-xl text-xs font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-[#16834A]" />
            <span>{successMessage}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business Information Card */}
        <div className="bg-white p-6 rounded-2xl border border-[#E2EAE4] shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-gray-800 pb-2 border-b border-gray-100 flex items-center gap-2">
            <Store className="w-4 h-4 text-[#16834A]" />
            {language === 'bn' ? 'ব্যবসায়িক মৌলিক তথ্য' : 'Business Information'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                {t.profile.businessName} *
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                {t.profile.mobileNumber} *
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
              <label className="block font-semibold text-gray-700 mb-1">
                {t.profile.emailAddress} *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                {t.profile.currency}
              </label>
              <input
                type="text"
                disabled
                value="BDT (৳)"
                className="w-full px-3 py-2 border rounded-xl bg-gray-50 text-gray-500 font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-gray-700 mb-1">
                {t.profile.businessAddress}
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="উদা: দোকান নং ১২, নিউ মার্কেট, ঢাকা"
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-gray-700 mb-1">
                {t.profile.businessLogo}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="flex-1 px-3 py-2 border rounded-xl text-xs"
                />
                {logoUrl && (
                  <img
                    src={logoUrl}
                    alt="Logo Preview"
                    className="w-10 h-10 object-contain rounded border p-0.5"
                  />
                )}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-gray-700 mb-1">
                {t.profile.businessDescription}
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Receipt Settings Card */}
        <div className="bg-white p-6 rounded-2xl border border-[#E2EAE4] shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-gray-800 pb-2 border-b border-gray-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#16834A]" />
            {language === 'bn' ? 'রসিদ ও প্রিন্টিং কনফিগারেশন' : 'Receipt & Print Preferences'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                {t.profile.receiptPrefix}
              </label>
              <input
                type="text"
                value={receiptPrefix}
                onChange={(e) => setReceiptPrefix(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl font-mono uppercase"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                {t.profile.defaultPaperSize}
              </label>
              <select
                value={receiptPaperSize}
                onChange={(e) => setReceiptPaperSize(e.target.value as PaperSize)}
                className="w-full px-3 py-2 border rounded-xl bg-white"
              >
                <option value="a4">{t.receipt.paperSize.a4}</option>
                <option value="a5">{t.receipt.paperSize.a5}</option>
                <option value="thermal80">{t.receipt.paperSize.thermal80}</option>
                <option value="thermal58">{t.receipt.paperSize.thermal58}</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                {t.profile.defaultReceiptStyle}
              </label>
              <select
                value={receiptStyle}
                onChange={(e) => setReceiptStyle(e.target.value as ReceiptStyle)}
                className="w-full px-3 py-2 border rounded-xl bg-white"
              >
                <option value="green">{t.receipt.receiptStyle.green}</option>
                <option value="minimal">{t.receipt.receiptStyle.minimal}</option>
                <option value="professional">{t.receipt.receiptStyle.professional}</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                {t.profile.preferredLanguage}
              </label>
              <select
                value={prefLang}
                onChange={(e) => setPrefLang(e.target.value as Language)}
                className="w-full px-3 py-2 border rounded-xl bg-white"
              >
                <option value="bn">বাংলা (Bangla)</option>
                <option value="en">English</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-gray-700 mb-1">
                {t.profile.receiptFooterText}
              </label>
              <input
                type="text"
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Inventory Controls Card */}
        <div className="bg-white p-6 rounded-2xl border border-[#E2EAE4] shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-gray-800 pb-2 border-b border-gray-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#16834A]" />
            {language === 'bn' ? 'ইনভেন্টরি কন্ট্রোল' : 'Inventory Policies'}
          </h3>

          <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
            <div>
              <p className="font-bold text-gray-800 text-xs sm:text-sm">
                {t.profile.allowNegativeStock}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {language === 'bn'
                  ? 'সক্রিয় থাকলে স্টকে পর্যাপ্ত পণ্য না থাকলেও বিক্রয় রসিদ তৈরি করা যাবে (স্টক ঋণাত্মক হতে পারবে)।'
                  : 'Allows sales receipts even if product stock drops below zero.'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={allowNegativeStock}
                onChange={(e) => setAllowNegativeStock(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#16834A]"></div>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 font-bold text-white bg-[#16834A] hover:bg-[#105C35] rounded-xl shadow-md transition-all text-xs sm:text-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? t.common.loading : t.common.save}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
