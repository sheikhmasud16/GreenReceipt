import { Receipt, UserProfile } from '../types';

export function formatBangladeshMobile(phone: string): string {
  if (!phone) return '';
  // Strip non-digits
  let digits = phone.replace(/\D/g, '');

  // If starts with 880, keep it
  if (digits.startsWith('880')) {
    return digits;
  }

  // If starts with 0 (e.g., 01712345678), replace 0 with 880
  if (digits.startsWith('0')) {
    return '88' + digits;
  }

  // If 10 digits starting with 1, prepend 880
  if (digits.length === 10 && digits.startsWith('1')) {
    return '880' + digits;
  }

  return digits;
}

export function generateWhatsAppMessage(receipt: Receipt, profile: UserProfile): string {
  const businessName = profile.businessName || 'Our Business';
  const grandTotal = Number(receipt.grandTotal).toLocaleString('en-US');
  const paid = Number(receipt.paidAmount).toLocaleString('en-US');
  const due = Number(receipt.dueAmount).toLocaleString('en-US');

  return `Dear Customer,

Thank you for shopping with us!
Your sales receipt is ready.

🏢 Business: ${businessName}
🧾 Receipt No: ${receipt.receiptNumber}
📅 Date: ${receipt.date}
💰 Total Amount: ৳${grandTotal}
✅ Paid: ৳${paid}
⏳ Due: ৳${due}

${receipt.items.length > 0 ? `📦 Items: ${receipt.items.map((i) => `${i.productName} (${i.quantity} ${i.unit})`).join(', ')}` : ''}

Thank you for your business!
${businessName}`;
}

export function openWhatsAppChat(phone: string, text: string) {
  const formattedPhone = formatBangladeshMobile(phone);
  const encodedText = encodeURIComponent(text);
  const url = `https://wa.me/${formattedPhone}?text=${encodedText}`;
  window.open(url, '_blank');
}

export async function shareReceiptViaWebShare(
  pdfBlob: Blob,
  filename: string,
  receipt: Receipt,
  profile: UserProfile
): Promise<boolean> {
  const message = generateWhatsAppMessage(receipt, profile);
  const file = new File([pdfBlob], filename, { type: 'application/pdf' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: `Sales Receipt ${receipt.receiptNumber}`,
        text: message,
        files: [file],
      });
      return true;
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        console.error('Web Share failed', e);
      }
      return false;
    }
  }
  return false;
}
