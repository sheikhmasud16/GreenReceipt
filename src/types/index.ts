export type Language = 'bn' | 'en';

export type PaperSize = 'a4' | 'a5' | 'thermal80' | 'thermal58';
export type ReceiptStyle = 'green' | 'minimal' | 'professional';
export type PaymentMethod = 'cash' | 'bkash' | 'nagad' | 'bank' | 'card' | 'due';
export type PaymentStatus = 'paid' | 'partial' | 'unpaid';
export type ReceiptStatus = 'completed' | 'cancelled' | 'returned';
export type TransactionType = 'opening' | 'purchase' | 'sale' | 'return' | 'damage' | 'adjustment';

export interface UserProfile {
  businessName: string;
  mobile: string;
  email: string;
  address: string;
  logoUrl?: string;
  description?: string;
  currency: string;
  receiptFooter?: string;
  receiptPrefix: string;
  receiptPaperSize: PaperSize;
  receiptStyle: ReceiptStyle;
  preferredLanguage: Language;
  allowNegativeStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  description?: string;
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  openingStock: number;
  minimumStock: number;
  unit: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReceiptItem {
  productId: string;
  productName: string;
  sku?: string;
  unit: string;
  quantity: number;
  sellingPrice: number;
  costPriceAtSale: number;
  discount: number;
  lineTotal: number;
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  date: string;
  time: string;
  customerId?: string;
  customerName: string;
  customerMobile: string;
  customerAddress?: string;
  items: ReceiptItem[];
  subtotal: number;
  itemDiscount: number;
  overallDiscount: number;
  additionalCharges: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: ReceiptStatus;
  notes?: string;
  language: Language;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  unit: string;
  quantity: number;
  purchasePrice: number;
  lineTotal: number;
}

export interface Purchase {
  id: string;
  invoiceNumber: string;
  supplierId?: string;
  supplierName: string;
  supplierMobile: string;
  purchaseDate: string;
  items: PurchaseItem[];
  additionalCost: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  status: 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  notes?: string;
  totalPurchases: number;
  totalPaid: number;
  totalDue: number;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  businessName?: string;
  mobile: string;
  email?: string;
  address?: string;
  notes?: string;
  totalPurchased: number;
  totalPaid: number;
  totalDue: number;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  category: string;
  title: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  productName: string;
  transactionType: TransactionType;
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceId?: string;
  referenceType?: string;
  notes?: string;
  date: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  partyType: 'customer' | 'supplier';
  partyId: string;
  partyName: string;
  receiptId?: string;
  purchaseId?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  date: string;
  notes?: string;
  createdAt: string;
}
