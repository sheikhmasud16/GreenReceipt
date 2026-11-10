import React, { useState } from 'react';
import { Send, Download, Share2, AlertCircle, Copy, Check } from 'lucide-react';
import { Receipt, UserProfile } from '../../types';
import {
  generateWhatsAppMessage,
  openWhatsAppChat,
  shareReceiptViaWebShare,
  formatBangladeshMobile,
} from '../../utils/whatsapp';
import { generateReceiptPDF } from '../../utils/pdfGenerator';
import { Modal } from '../common/Modal';
import { useLanguage } from '../../context/LanguageContext';

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: Receipt;
  profile: UserProfile;
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  isOpen,
  onClose,
  receipt,
  profile,
}) => {
  const { t, language } = useLanguage();
  const [phone, setPhone] = useState<string>(receipt.customerMobile || '');
  const [customMessage, setCustomMessage] = useState<string>(
    generateWhatsAppMessage(receipt, profile)
  );
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState<boolean>(false);

  const handleDownloadPDF = () => {
    const doc = generateReceiptPDF(receipt, profile, profile.receiptPaperSize || 'a4');
    doc.save(`Receipt-${receipt.receiptNumber}.pdf`);
  };

  const handleWebShare = async () => {
    setIsSharing(true);
    try {
      const doc = generateReceiptPDF(receipt, profile, profile.receiptPaperSize || 'a4');
      const blob = doc.output('blob');
      const shared = await shareReceiptViaWebShare(
        blob,
        `Receipt-${receipt.receiptNumber}.pdf`,
        receipt,
        profile
      );
      if (!shared) {
        // Fallback to direct WhatsApp link
        handleOpenWhatsApp();
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleOpenWhatsApp = () => {
    if (!phone) {
      alert(language === 'bn' ? 'অনুগ্রহ করে মোবাইল নম্বর লিখুন' : 'Please enter a mobile number');
      return;
    }
    openWhatsAppChat(phone, customMessage);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(customMessage);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const formattedPhone = formatBangladeshMobile(phone);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={language === 'bn' ? 'হোয়াটসঅ্যাপে রসিদ শেয়ার' : 'Share Receipt via WhatsApp'}
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        {/* Phone number input */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            {language === 'bn' ? 'গ্রাহকের হোয়াটসঅ্যাপ নম্বর:' : "Customer's WhatsApp Number:"}
          </label>
          <div className="relative">
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01712345678"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#16834A]"
            />
            {formattedPhone && (
              <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-mono">
                +{formattedPhone}
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            {language === 'bn'
              ? 'বাংলাদেশি নম্বরে স্বয়ংক্রিয়ভাবে +৮৮০ কোড সংযুক্ত হবে।'
              : 'Bangladesh mobile numbers will automatically format with +880.'}
          </p>
        </div>

        {/* Message preview & editor */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-gray-700">
              {language === 'bn' ? 'মেসেজ প্রিভিউ / সম্পাদন:' : 'Message Content:'}
            </label>
            <button
              onClick={handleCopyMessage}
              className="text-xs text-[#16834A] hover:underline flex items-center gap-1"
            >
              {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? (language === 'bn' ? 'কপি হয়েছে' : 'Copied') : (language === 'bn' ? 'কপি করুন' : 'Copy')}</span>
            </button>
          </div>
          <textarea
            rows={7}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="w-full p-3 text-xs sm:text-sm font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#16834A] bg-gray-50"
          />
        </div>

        {/* Helpful instructions banner */}
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-semibold">
              {language === 'bn' ? 'গুরুত্বপূর্ণ নির্দেশিকা:' : 'Attachment Note:'}
            </p>
            <p className="mt-0.5">
              {language === 'bn'
                ? 'ব্রাউজারের সুরক্ষার কারণে হোয়াটসঅ্যাপ লিঙ্কে সরাসরি পিডিএফ ফাইল যুক্ত হয় না। অনুগ্রহ করে নিচে থেকে পিডিএফ ডাউনলোড করে হোয়াটসঅ্যাপে ফাইলটি অ্যাটাচ করে পাঠিয়ে দিন।'
                : 'Direct click-to-chat links pre-fill text. Please download the PDF below and attach it in the WhatsApp chat window.'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs sm:text-sm font-semibold border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
          >
            <Download className="w-4 h-4 text-[#16834A]" />
            <span>{t.common.downloadPdf}</span>
          </button>

          <button
            onClick={handleWebShare}
            disabled={isSharing}
            className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs sm:text-sm font-semibold border border-[#16834A] rounded-lg text-[#16834A] hover:bg-[#EAF7EF]"
          >
            <Share2 className="w-4 h-4" />
            <span>{language === 'bn' ? 'সরাসরি শেয়ার' : 'Web Share'}</span>
          </button>

          <button
            onClick={handleOpenWhatsApp}
            className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs sm:text-sm font-semibold bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-lg shadow-sm"
          >
            <Send className="w-4 h-4" />
            <span>{language === 'bn' ? 'হোয়াটসঅ্যাপ খুলুন' : 'Open WhatsApp'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
