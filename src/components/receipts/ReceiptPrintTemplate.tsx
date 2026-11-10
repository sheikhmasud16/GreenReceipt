import React from 'react';
import { Receipt, UserProfile, PaperSize, ReceiptStyle } from '../../types';
import { formatCurrency, formatDate, toBanglaDigits } from '../../utils/formatters';
import { useLanguage } from '../../context/LanguageContext';

interface ReceiptPrintTemplateProps {
  receipt: Receipt;
  profile: UserProfile;
  overrideSize?: PaperSize;
  overrideStyle?: ReceiptStyle;
}

export const ReceiptPrintTemplate: React.FC<ReceiptPrintTemplateProps> = ({
  receipt,
  profile,
  overrideSize,
  overrideStyle,
}) => {
  const { language, t } = useLanguage();
  const size = overrideSize || profile.receiptPaperSize || 'a4';
  const style = overrideStyle || profile.receiptStyle || 'green';
  const isThermal = size === 'thermal80' || size === 'thermal58';
  const isBangla = language === 'bn';

  // Format width styles based on size
  const containerClasses = {
    a4: 'w-full max-w-[210mm] min-h-[297mm] p-8',
    a5: 'w-full max-w-[148mm] min-h-[210mm] p-6 text-sm',
    thermal80: 'w-[80mm] max-w-[80mm] p-3 text-xs font-mono',
    thermal58: 'w-[58mm] max-w-[58mm] p-2 text-[11px] font-mono',
  }[size];

  if (isThermal) {
    return (
      <div className={`mx-auto bg-white text-black shadow-md print:shadow-none print:m-0 ${containerClasses}`}>
        {/* Thermal Header */}
        <div className="text-center pb-2 border-b border-dashed border-gray-400">
          {profile.logoUrl && (
            <img
              src={profile.logoUrl}
              alt={profile.businessName}
              className="w-12 h-12 mx-auto mb-1 object-contain"
            />
          )}
          <h2 className="font-bold text-sm tracking-wide uppercase">{profile.businessName}</h2>
          {profile.address && <p className="text-[10px] text-gray-600 leading-tight">{profile.address}</p>}
          {profile.mobile && <p className="text-[10px] text-gray-600">Mob: {profile.mobile}</p>}
        </div>

        {/* Thermal Details */}
        <div className="py-2 text-[11px] border-b border-dashed border-gray-400 space-y-0.5">
          <div className="flex justify-between">
            <span>{isBangla ? 'রসিদ নং:' : 'Receipt:'}</span>
            <span className="font-bold">{receipt.receiptNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>{isBangla ? 'তারিখ:' : 'Date:'}</span>
            <span>{formatDate(receipt.date, language)} {receipt.time}</span>
          </div>
          <div className="flex justify-between">
            <span>{isBangla ? 'গ্রাহক:' : 'Customer:'}</span>
            <span className="font-semibold">{receipt.customerName || (isBangla ? 'ক্যাশ গ্রাহক' : 'Cash')}</span>
          </div>
          {receipt.customerMobile && (
            <div className="flex justify-between">
              <span>{isBangla ? 'মোবাইল:' : 'Phone:'}</span>
              <span>{receipt.customerMobile}</span>
            </div>
          )}
        </div>

        {/* Thermal Items */}
        <table className="w-full my-2 text-left text-[11px]">
          <thead>
            <tr className="border-b border-gray-400">
              <th className="py-1">{isBangla ? 'বিবরণ' : 'Item'}</th>
              <th className="py-1 text-center">{isBangla ? 'পরিমাণ' : 'Qty'}</th>
              <th className="py-1 text-right">{isBangla ? 'মোট' : 'Total'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {receipt.items.map((item, idx) => (
              <tr key={idx} className="align-top">
                <td className="py-1">
                  <div className="font-semibold leading-tight">{item.productName}</div>
                  <div className="text-[9px] text-gray-500">
                    @{item.sellingPrice} {item.discount > 0 ? `(-${item.discount})` : ''}
                  </div>
                </td>
                <td className="py-1 text-center whitespace-nowrap">
                  {isBangla ? toBanglaDigits(item.quantity) : item.quantity} {item.unit}
                </td>
                <td className="py-1 text-right font-medium">
                  {formatCurrency(item.lineTotal, language)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Thermal Totals */}
        <div className="pt-2 border-t border-dashed border-gray-400 space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span>{t.common.subtotal}:</span>
            <span>{formatCurrency(receipt.subtotal, language)}</span>
          </div>
          {(receipt.overallDiscount > 0 || receipt.itemDiscount > 0) && (
            <div className="flex justify-between text-red-600">
              <span>{t.common.discount}:</span>
              <span>-{formatCurrency(receipt.overallDiscount + receipt.itemDiscount, language)}</span>
            </div>
          )}
          {receipt.additionalCharges > 0 && (
            <div className="flex justify-between">
              <span>{isBangla ? 'চার্জ / ডেলিভারি' : 'Charges'}:</span>
              <span>+{formatCurrency(receipt.additionalCharges, language)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-xs pt-1 border-t border-gray-800">
            <span>{t.receipt.grandTotal}:</span>
            <span>{formatCurrency(receipt.grandTotal, language)}</span>
          </div>
          <div className="flex justify-between">
            <span>{t.common.paid}:</span>
            <span>{formatCurrency(receipt.paidAmount, language)}</span>
          </div>
          {receipt.dueAmount > 0 && (
            <div className="flex justify-between text-red-600 font-bold">
              <span>{t.common.due}:</span>
              <span>{formatCurrency(receipt.dueAmount, language)}</span>
            </div>
          )}
          <div className="flex justify-between text-[10px] text-gray-600 pt-1">
            <span>{t.receipt.paymentMethod}:</span>
            <span className="uppercase">{receipt.paymentMethod}</span>
          </div>
        </div>

        {/* Thermal Footer */}
        <div className="mt-4 pt-2 border-t border-dashed border-gray-400 text-center text-[10px] text-gray-600">
          <p>{profile.receiptFooter || t.receipt.thanksMessage}</p>
          <p className="mt-1 font-mono text-[9px]">Smart Business Manager</p>
        </div>
      </div>
    );
  }

  // A4 / A5 Styles (Green, Minimal, Professional)
  return (
    <div
      className={`mx-auto bg-white text-[#202B25] rounded-xl shadow-lg print:shadow-none print:rounded-none print:m-0 border border-gray-100 ${containerClasses}`}
    >
      {/* Header */}
      {style === 'green' && (
        <div className="bg-[#16834A] text-white -m-8 sm:-m-8 p-8 mb-6 rounded-t-xl print:rounded-none flex justify-between items-start">
          <div className="flex items-center gap-4">
            {profile.logoUrl && (
              <img
                src={profile.logoUrl}
                alt={profile.businessName}
                className="w-16 h-16 rounded-lg bg-white p-1 object-contain"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{profile.businessName}</h1>
              <p className="text-sm text-green-100 max-w-md">{profile.address}</p>
              <div className="flex flex-wrap gap-4 text-xs text-green-100 mt-1">
                {profile.mobile && <span>📞 {profile.mobile}</span>}
                {profile.email && <span>✉️ {profile.email}</span>}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-white/20 rounded text-xs uppercase font-bold tracking-widest">
              {isBangla ? 'বিক্রয় চালান' : 'INVOICE'}
            </span>
            <div className="text-lg font-bold mt-2">#{receipt.receiptNumber}</div>
            <div className="text-xs text-green-100">{formatDate(receipt.date, language)}</div>
          </div>
        </div>
      )}

      {style === 'professional' && (
        <div className="border-b-2 border-gray-800 pb-6 mb-6 flex justify-between items-start">
          <div className="flex items-center gap-4">
            {profile.logoUrl && (
              <img
                src={profile.logoUrl}
                alt={profile.businessName}
                className="w-16 h-16 rounded object-contain border"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{profile.businessName}</h1>
              <p className="text-sm text-gray-600">{profile.address}</p>
              <p className="text-xs text-gray-500 mt-1">
                {profile.mobile} | {profile.email}
              </p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-800 tracking-wider">
              {isBangla ? 'ইনভয়েস / রসিদ' : 'SALES INVOICE'}
            </h2>
            <p className="text-sm font-semibold text-gray-700 mt-1">#{receipt.receiptNumber}</p>
            <p className="text-xs text-gray-500">{formatDate(receipt.date, language)}</p>
          </div>
        </div>
      )}

      {style === 'minimal' && (
        <div className="border-b border-gray-200 pb-4 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{profile.businessName}</h1>
            <p className="text-xs text-gray-500">{profile.address} • {profile.mobile}</p>
          </div>
          <div className="text-right text-xs">
            <span className="font-bold text-gray-700">#{receipt.receiptNumber}</span>
            <p className="text-gray-500">{formatDate(receipt.date, language)}</p>
          </div>
        </div>
      )}

      {/* Bill To & Invoice Info Grid */}
      <div className="grid grid-cols-2 gap-6 p-4 rounded-lg bg-[#F7FAF8] border border-[#E2EAE4] mb-6 text-xs sm:text-sm">
        <div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
            {isBangla ? 'গ্রাহকের তথ্য (Bill To):' : 'Customer Info:'}
          </span>
          <p className="font-bold text-[#105C35] text-base">
            {receipt.customerName || (isBangla ? 'ক্যাশ গ্রাহক' : 'Walk-in Customer')}
          </p>
          {receipt.customerMobile && <p className="text-gray-600">📞 {receipt.customerMobile}</p>}
          {receipt.customerAddress && <p className="text-gray-600">📍 {receipt.customerAddress}</p>}
        </div>

        <div className="text-right space-y-1">
          <div>
            <span className="text-gray-500">{t.common.date}: </span>
            <span className="font-semibold">{formatDate(receipt.date, language)} {receipt.time}</span>
          </div>
          <div>
            <span className="text-gray-500">{t.receipt.paymentMethod}: </span>
            <span className="font-semibold uppercase text-[#16834A]">{receipt.paymentMethod}</span>
          </div>
          <div>
            <span className="text-gray-500">{t.common.status}: </span>
            <span
              className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
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
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="bg-[#16834A] text-white">
              <th className="py-2.5 px-3 rounded-l-md">#</th>
              <th className="py-2.5 px-3">{t.receipt.product}</th>
              <th className="py-2.5 px-3 text-center">{t.receipt.qty}</th>
              <th className="py-2.5 px-3 text-right">{t.receipt.unitPrice}</th>
              <th className="py-2.5 px-3 text-right">{t.receipt.itemDiscount}</th>
              <th className="py-2.5 px-3 text-right rounded-r-md">{t.common.total}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {receipt.items.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="py-2.5 px-3 text-gray-500">{idx + 1}</td>
                <td className="py-2.5 px-3">
                  <span className="font-semibold text-gray-900">{item.productName}</span>
                  {item.sku && <span className="text-xs text-gray-500 block">SKU: {item.sku}</span>}
                </td>
                <td className="py-2.5 px-3 text-center whitespace-nowrap">
                  {isBangla ? toBanglaDigits(item.quantity) : item.quantity} {item.unit}
                </td>
                <td className="py-2.5 px-3 text-right">
                  {formatCurrency(item.sellingPrice, language)}
                </td>
                <td className="py-2.5 px-3 text-right text-gray-600">
                  {item.discount > 0 ? `-${formatCurrency(item.discount, language)}` : '-'}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-gray-900">
                  {formatCurrency(item.lineTotal, language)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Financial Summary */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-t border-gray-200 pt-4">
        {/* Left Side: Notes & Terms */}
        <div className="w-full sm:w-1/2 text-xs text-gray-600 space-y-2">
          {receipt.notes && (
            <div>
              <span className="font-bold text-gray-700">{t.common.notes}:</span>
              <p className="italic bg-gray-50 p-2 rounded border border-gray-200 mt-1">{receipt.notes}</p>
            </div>
          )}
          <div className="pt-2">
            <p className="font-semibold text-[#105C35]">
              {profile.receiptFooter || t.receipt.thanksMessage}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              * {isBangla ? 'পণ্য ফেরতের জন্য মূল রসিদ প্রদর্শন বাধ্যতামূলক।' : 'Original receipt required for returns within 7 days.'}
            </p>
          </div>
        </div>

        {/* Right Side: Calculation Totals */}
        <div className="w-full sm:w-72 space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between py-1 border-b border-gray-100 text-gray-700">
            <span>{t.common.subtotal}:</span>
            <span className="font-semibold">{formatCurrency(receipt.subtotal, language)}</span>
          </div>

          {(receipt.overallDiscount > 0 || receipt.itemDiscount > 0) && (
            <div className="flex justify-between py-1 border-b border-gray-100 text-red-600">
              <span>{t.common.discount}:</span>
              <span className="font-semibold">
                -{formatCurrency(receipt.overallDiscount + receipt.itemDiscount, language)}
              </span>
            </div>
          )}

          {receipt.additionalCharges > 0 && (
            <div className="flex justify-between py-1 border-b border-gray-100 text-gray-700">
              <span>{isBangla ? 'ডেলিভারি / অন্যান্য চার্জ' : 'Additional Charges'}:</span>
              <span className="font-semibold">+{formatCurrency(receipt.additionalCharges, language)}</span>
            </div>
          )}

          <div className="flex justify-between py-2.5 px-3 bg-[#EAF7EF] text-[#105C35] rounded-lg font-bold text-base">
            <span>{t.receipt.grandTotal}:</span>
            <span>{formatCurrency(receipt.grandTotal, language)}</span>
          </div>

          <div className="flex justify-between py-1 text-gray-700">
            <span>{t.common.paid}:</span>
            <span className="font-semibold text-green-700">{formatCurrency(receipt.paidAmount, language)}</span>
          </div>

          {receipt.dueAmount > 0 && (
            <div className="flex justify-between py-1 text-red-700 font-bold border-t border-red-200">
              <span>{t.common.due}:</span>
              <span>{formatCurrency(receipt.dueAmount, language)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Signature Lines */}
      <div className="mt-16 pt-8 flex justify-between items-end text-xs text-gray-500 border-t border-dashed border-gray-300">
        <div className="text-center w-40">
          <div className="border-t border-gray-400 pt-1 font-medium">{t.receipt.customerSignature}</div>
        </div>
        <div className="text-center w-40">
          <div className="border-t border-gray-400 pt-1 font-semibold text-gray-800">{t.receipt.signature}</div>
        </div>
      </div>
    </div>
  );
};
