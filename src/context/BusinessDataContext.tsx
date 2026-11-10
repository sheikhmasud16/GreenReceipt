import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  runTransaction,
  query,
  orderBy,
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  Product,
  Receipt,
  Purchase,
  Customer,
  Supplier,
  Expense,
  InventoryTransaction,
  Payment,
  TransactionType,
} from '../types';

interface BusinessDataContextType {
  products: Product[];
  receipts: Receipt[];
  purchases: Purchase[];
  customers: Customer[];
  suppliers: Supplier[];
  expenses: Expense[];
  transactions: InventoryTransaction[];
  payments: Payment[];
  loading: boolean;

  // Actions
  createProduct: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateProduct: (id: string, productData: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  adjustStock: (
    productId: string,
    quantityChange: number,
    type: TransactionType,
    notes?: string
  ) => Promise<void>;

  createReceipt: (receiptData: Omit<Receipt, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateReceipt: (id: string, updatedData: Partial<Receipt>, oldReceipt: Receipt) => Promise<void>;
  cancelReceipt: (receipt: Receipt) => Promise<void>;

  recordPurchase: (purchaseData: Omit<Purchase, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  cancelPurchase: (purchase: Purchase) => Promise<void>;

  createCustomer: (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateCustomer: (id: string, customerData: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  recordCustomerPayment: (customerId: string, amount: number, paymentMethod: string, notes?: string) => Promise<void>;

  createSupplier: (supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateSupplier: (id: string, supplierData: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  recordSupplierPayment: (supplierId: string, amount: number, paymentMethod: string, notes?: string) => Promise<void>;

  createExpense: (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateExpense: (id: string, expenseData: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
}

const BusinessDataContext = createContext<BusinessDataContextType | undefined>(undefined);

export const BusinessDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!currentUser) {
      setProducts([]);
      setReceipts([]);
      setPurchases([]);
      setCustomers([]);
      setSuppliers([]);
      setExpenses([]);
      setTransactions([]);
      setPayments([]);
      setLoading(false);
      return;
    }

    const uid = currentUser.uid;
    const unsubscribes: (() => void)[] = [];

    // Products listener
    const productsRef = collection(db, 'users', uid, 'products');
    unsubscribes.push(
      onSnapshot(
        productsRef,
        (snapshot) => {
          const list: Product[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as Product);
          });
          setProducts(list);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, `users/${uid}/products`)
      )
    );

    // Receipts listener (ordered by createdAt desc)
    const receiptsRef = query(collection(db, 'users', uid, 'receipts'), orderBy('createdAt', 'desc'));
    unsubscribes.push(
      onSnapshot(
        receiptsRef,
        (snapshot) => {
          const list: Receipt[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as Receipt);
          });
          setReceipts(list);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, `users/${uid}/receipts`)
      )
    );

    // Purchases listener
    const purchasesRef = query(collection(db, 'users', uid, 'purchases'), orderBy('createdAt', 'desc'));
    unsubscribes.push(
      onSnapshot(
        purchasesRef,
        (snapshot) => {
          const list: Purchase[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as Purchase);
          });
          setPurchases(list);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, `users/${uid}/purchases`)
      )
    );

    // Customers listener
    const customersRef = collection(db, 'users', uid, 'customers');
    unsubscribes.push(
      onSnapshot(
        customersRef,
        (snapshot) => {
          const list: Customer[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as Customer);
          });
          setCustomers(list);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, `users/${uid}/customers`)
      )
    );

    // Suppliers listener
    const suppliersRef = collection(db, 'users', uid, 'suppliers');
    unsubscribes.push(
      onSnapshot(
        suppliersRef,
        (snapshot) => {
          const list: Supplier[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as Supplier);
          });
          setSuppliers(list);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, `users/${uid}/suppliers`)
      )
    );

    // Expenses listener
    const expensesRef = query(collection(db, 'users', uid, 'expenses'), orderBy('createdAt', 'desc'));
    unsubscribes.push(
      onSnapshot(
        expensesRef,
        (snapshot) => {
          const list: Expense[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as Expense);
          });
          setExpenses(list);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, `users/${uid}/expenses`)
      )
    );

    // Inventory Transactions listener
    const transactionsRef = query(
      collection(db, 'users', uid, 'inventoryTransactions'),
      orderBy('createdAt', 'desc')
    );
    unsubscribes.push(
      onSnapshot(
        transactionsRef,
        (snapshot) => {
          const list: InventoryTransaction[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as InventoryTransaction);
          });
          setTransactions(list);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, `users/${uid}/inventoryTransactions`)
      )
    );

    // Payments listener
    const paymentsRef = query(collection(db, 'users', uid, 'payments'), orderBy('createdAt', 'desc'));
    unsubscribes.push(
      onSnapshot(
        paymentsRef,
        (snapshot) => {
          const list: Payment[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as Payment);
          });
          setPayments(list);
          setLoading(false);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, `users/${uid}/payments`)
      )
    );

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [currentUser]);

  // --- Product & Stock operations ---
  const createProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    if (!currentUser) throw new Error('Not authenticated');
    const uid = currentUser.uid;
    const docRef = doc(collection(db, 'users', uid, 'products'));
    const now = new Date().toISOString();

    const newProduct: Product = {
      ...productData,
      id: docRef.id,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await setDoc(docRef, newProduct);

      // Record opening stock transaction if stock > 0
      if (newProduct.openingStock > 0) {
        const transRef = doc(collection(db, 'users', uid, 'inventoryTransactions'));
        const trans: InventoryTransaction = {
          id: transRef.id,
          productId: docRef.id,
          productName: newProduct.name,
          transactionType: 'opening',
          quantity: newProduct.openingStock,
          previousStock: 0,
          newStock: newProduct.openingStock,
          referenceId: 'OPENING',
          referenceType: 'initial_stock',
          notes: 'Opening stock balance',
          date: new Date().toISOString().split('T')[0],
          createdAt: now,
        };
        await setDoc(transRef, trans);
      }

      return docRef.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${uid}/products`);
    }
  };

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    try {
      await updateDoc(doc(db, 'users', uid, 'products', id), {
        ...productData,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}/products/${id}`);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    try {
      await deleteDoc(doc(db, 'users', uid, 'products', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${uid}/products/${id}`);
    }
  };

  const adjustStock = async (
    productId: string,
    quantityChange: number,
    type: TransactionType,
    notes?: string
  ) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const productRef = doc(db, 'users', uid, 'products', productId);
    const transRef = doc(collection(db, 'users', uid, 'inventoryTransactions'));
    const now = new Date().toISOString();

    await runTransaction(db, async (transaction) => {
      const pDoc = await transaction.get(productRef);
      if (!pDoc.exists()) throw new Error('Product not found');
      const prod = pDoc.data() as Product;

      const previousStock = prod.currentStock;
      const newStock = previousStock + quantityChange;

      if (newStock < 0 && !profile?.allowNegativeStock) {
        throw new Error('Stock cannot be negative');
      }

      transaction.update(productRef, {
        currentStock: newStock,
        updatedAt: now,
      });

      const trans: InventoryTransaction = {
        id: transRef.id,
        productId,
        productName: prod.name,
        transactionType: type,
        quantity: Math.abs(quantityChange),
        previousStock,
        newStock,
        referenceId: 'ADJUSTMENT',
        referenceType: 'manual_adjustment',
        notes: notes || '',
        date: new Date().toISOString().split('T')[0],
        createdAt: now,
      };

      transaction.set(transRef, trans);
    });
  };

  // --- Sales Receipt Operations (ATOMIC) ---
  const createReceipt = async (
    receiptData: Omit<Receipt, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    if (!currentUser) throw new Error('Not authenticated');
    const uid = currentUser.uid;
    const receiptRef = doc(collection(db, 'users', uid, 'receipts'));
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    await runTransaction(db, async (transaction) => {
      // 1. Check stock and prepare product updates
      const productUpdates: {
        ref: ReturnType<typeof doc>;
        newStock: number;
        product: Product;
        soldQty: number;
      }[] = [];

      for (const item of receiptData.items) {
        const prodRef = doc(db, 'users', uid, 'products', item.productId);
        const prodDoc = await transaction.get(prodRef);
        if (!prodDoc.exists()) {
          throw new Error(`Product not found: ${item.productName}`);
        }
        const prodData = prodDoc.data() as Product;
        const newStock = prodData.currentStock - item.quantity;

        if (newStock < 0 && !profile?.allowNegativeStock) {
          throw new Error(
            `Insufficient stock for ${item.productName}. Available: ${prodData.currentStock}, Requested: ${item.quantity}`
          );
        }

        productUpdates.push({
          ref: prodRef,
          newStock,
          product: prodData,
          soldQty: item.quantity,
        });
      }

      // 2. Customer record check / creation / update
      let targetCustomerId = receiptData.customerId;
      if (!targetCustomerId && receiptData.customerMobile) {
        // Find existing customer by mobile
        const existing = customers.find((c) => c.mobile === receiptData.customerMobile);
        if (existing) {
          targetCustomerId = existing.id;
        } else if (receiptData.customerName) {
          // Auto create customer
          const newCustRef = doc(collection(db, 'users', uid, 'customers'));
          targetCustomerId = newCustRef.id;
          const newCust: Customer = {
            id: newCustRef.id,
            name: receiptData.customerName,
            mobile: receiptData.customerMobile,
            address: receiptData.customerAddress || '',
            totalPurchases: receiptData.grandTotal,
            totalPaid: receiptData.paidAmount,
            totalDue: receiptData.dueAmount,
            createdAt: now,
            updatedAt: now,
          };
          transaction.set(newCustRef, newCust);
        }
      } else if (targetCustomerId) {
        const custRef = doc(db, 'users', uid, 'customers', targetCustomerId);
        const custDoc = await transaction.get(custRef);
        if (custDoc.exists()) {
          const cust = custDoc.data() as Customer;
          transaction.update(custRef, {
            totalPurchases: (cust.totalPurchases || 0) + receiptData.grandTotal,
            totalPaid: (cust.totalPaid || 0) + receiptData.paidAmount,
            totalDue: (cust.totalDue || 0) + receiptData.dueAmount,
            updatedAt: now,
          });
        }
      }

      // 3. Save Receipt
      const finalReceipt: Receipt = {
        ...receiptData,
        id: receiptRef.id,
        customerId: targetCustomerId,
        createdAt: now,
        updatedAt: now,
      };
      transaction.set(receiptRef, finalReceipt);

      // 4. Update Product Stock and write inventory logs
      for (const update of productUpdates) {
        transaction.update(update.ref, {
          currentStock: update.newStock,
          updatedAt: now,
        });

        const transRef = doc(collection(db, 'users', uid, 'inventoryTransactions'));
        const trans: InventoryTransaction = {
          id: transRef.id,
          productId: update.product.id,
          productName: update.product.name,
          transactionType: 'sale',
          quantity: update.soldQty,
          previousStock: update.product.currentStock,
          newStock: update.newStock,
          referenceId: receiptData.receiptNumber,
          referenceType: 'receipt',
          notes: `Sale to ${receiptData.customerName || 'Cash Customer'}`,
          date: today,
          createdAt: now,
        };
        transaction.set(transRef, trans);
      }
    });

    return receiptRef.id;
  };

  const updateReceipt = async (
    receiptId: string,
    updatedData: Partial<Receipt>,
    oldReceipt: Receipt
  ) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const now = new Date().toISOString();
    const today = now.split('T')[0];
    const receiptRef = doc(db, 'users', uid, 'receipts', receiptId);

    await runTransaction(db, async (transaction) => {
      // Calculate item quantity differences
      const oldItemsMap = new Map<string, number>();
      oldReceipt.items.forEach((it) => oldItemsMap.set(it.productId, it.quantity));

      const newItems = updatedData.items || oldReceipt.items;
      const newItemsMap = new Map<string, number>();
      newItems.forEach((it) => newItemsMap.set(it.productId, it.quantity));

      // Union of all product IDs
      const allProductIds = new Set([...oldItemsMap.keys(), ...newItemsMap.keys()]);

      for (const pId of allProductIds) {
        const oldQty = oldItemsMap.get(pId) || 0;
        const newQty = newItemsMap.get(pId) || 0;
        const diff = newQty - oldQty; // If positive, we sold MORE -> deduct diff. If negative, sold LESS -> restore.

        if (diff !== 0) {
          const prodRef = doc(db, 'users', uid, 'products', pId);
          const prodDoc = await transaction.get(prodRef);
          if (prodDoc.exists()) {
            const prod = prodDoc.data() as Product;
            const previousStock = prod.currentStock;
            const newStock = previousStock - diff;

            if (newStock < 0 && !profile?.allowNegativeStock) {
              throw new Error(`Insufficient stock for ${prod.name}`);
            }

            transaction.update(prodRef, {
              currentStock: newStock,
              updatedAt: now,
            });

            const transRef = doc(collection(db, 'users', uid, 'inventoryTransactions'));
            const trans: InventoryTransaction = {
              id: transRef.id,
              productId: pId,
              productName: prod.name,
              transactionType: diff > 0 ? 'sale' : 'return',
              quantity: Math.abs(diff),
              previousStock,
              newStock,
              referenceId: oldReceipt.receiptNumber,
              referenceType: 'receipt_edit',
              notes: `Adjustment via receipt edit`,
              date: today,
              createdAt: now,
            };
            transaction.set(transRef, trans);
          }
        }
      }

      // Customer balance adjustment
      const oldDue = oldReceipt.dueAmount || 0;
      const newDue = updatedData.dueAmount ?? oldReceipt.dueAmount;
      const dueDiff = newDue - oldDue;

      const oldTotal = oldReceipt.grandTotal || 0;
      const newTotal = updatedData.grandTotal ?? oldReceipt.grandTotal;
      const totalDiff = newTotal - oldTotal;

      const oldPaid = oldReceipt.paidAmount || 0;
      const newPaid = updatedData.paidAmount ?? oldReceipt.paidAmount;
      const paidDiff = newPaid - oldPaid;

      const customerId = updatedData.customerId || oldReceipt.customerId;
      if (customerId) {
        const custRef = doc(db, 'users', uid, 'customers', customerId);
        const custDoc = await transaction.get(custRef);
        if (custDoc.exists()) {
          const cust = custDoc.data() as Customer;
          transaction.update(custRef, {
            totalPurchases: (cust.totalPurchases || 0) + totalDiff,
            totalPaid: (cust.totalPaid || 0) + paidDiff,
            totalDue: (cust.totalDue || 0) + dueDiff,
            updatedAt: now,
          });
        }
      }

      // Update the receipt
      transaction.update(receiptRef, {
        ...updatedData,
        updatedAt: now,
      });
    });
  };

  const cancelReceipt = async (receipt: Receipt) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const now = new Date().toISOString();
    const today = now.split('T')[0];
    const receiptRef = doc(db, 'users', uid, 'receipts', receipt.id);

    await runTransaction(db, async (transaction) => {
      // 1. Restore all product stock
      for (const item of receipt.items) {
        const prodRef = doc(db, 'users', uid, 'products', item.productId);
        const prodDoc = await transaction.get(prodRef);
        if (prodDoc.exists()) {
          const prod = prodDoc.data() as Product;
          const previousStock = prod.currentStock;
          const newStock = previousStock + item.quantity;

          transaction.update(prodRef, {
            currentStock: newStock,
            updatedAt: now,
          });

          const transRef = doc(collection(db, 'users', uid, 'inventoryTransactions'));
          const trans: InventoryTransaction = {
            id: transRef.id,
            productId: item.productId,
            productName: item.productName,
            transactionType: 'return',
            quantity: item.quantity,
            previousStock,
            newStock,
            referenceId: receipt.receiptNumber,
            referenceType: 'receipt_cancellation',
            notes: `Stock returned from cancelled receipt #${receipt.receiptNumber}`,
            date: today,
            createdAt: now,
          };
          transaction.set(transRef, trans);
        }
      }

      // 2. Reverse customer amounts
      if (receipt.customerId) {
        const custRef = doc(db, 'users', uid, 'customers', receipt.customerId);
        const custDoc = await transaction.get(custRef);
        if (custDoc.exists()) {
          const cust = custDoc.data() as Customer;
          transaction.update(custRef, {
            totalPurchases: Math.max(0, (cust.totalPurchases || 0) - receipt.grandTotal),
            totalPaid: Math.max(0, (cust.totalPaid || 0) - receipt.paidAmount),
            totalDue: Math.max(0, (cust.totalDue || 0) - receipt.dueAmount),
            updatedAt: now,
          });
        }
      }

      // 3. Mark receipt cancelled
      transaction.update(receiptRef, {
        status: 'cancelled',
        updatedAt: now,
      });
    });
  };

  // --- Purchase Operations ---
  const recordPurchase = async (
    purchaseData: Omit<Purchase, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    if (!currentUser) throw new Error('Not authenticated');
    const uid = currentUser.uid;
    const purchaseRef = doc(collection(db, 'users', uid, 'purchases'));
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    await runTransaction(db, async (transaction) => {
      // 1. Increase stock for each purchased item
      for (const item of purchaseData.items) {
        const prodRef = doc(db, 'users', uid, 'products', item.productId);
        const prodDoc = await transaction.get(prodRef);
        if (prodDoc.exists()) {
          const prod = prodDoc.data() as Product;
          const previousStock = prod.currentStock;
          const newStock = previousStock + item.quantity;

          transaction.update(prodRef, {
            currentStock: newStock,
            purchasePrice: item.purchasePrice, // Update cost price to latest
            updatedAt: now,
          });

          const transRef = doc(collection(db, 'users', uid, 'inventoryTransactions'));
          const trans: InventoryTransaction = {
            id: transRef.id,
            productId: item.productId,
            productName: item.productName,
            transactionType: 'purchase',
            quantity: item.quantity,
            previousStock,
            newStock,
            referenceId: purchaseData.invoiceNumber,
            referenceType: 'purchase',
            notes: `Purchase from ${purchaseData.supplierName}`,
            date: today,
            createdAt: now,
          };
          transaction.set(transRef, trans);
        }
      }

      // 2. Update Supplier record
      let targetSupplierId = purchaseData.supplierId;
      if (!targetSupplierId && purchaseData.supplierMobile) {
        const existing = suppliers.find((s) => s.mobile === purchaseData.supplierMobile);
        if (existing) {
          targetSupplierId = existing.id;
        } else if (purchaseData.supplierName) {
          const newSuppRef = doc(collection(db, 'users', uid, 'suppliers'));
          targetSupplierId = newSuppRef.id;
          const newSupplier: Supplier = {
            id: newSuppRef.id,
            name: purchaseData.supplierName,
            mobile: purchaseData.supplierMobile,
            totalPurchased: purchaseData.totalAmount,
            totalPaid: purchaseData.paidAmount,
            totalDue: purchaseData.dueAmount,
            createdAt: now,
            updatedAt: now,
          };
          transaction.set(newSuppRef, newSupplier);
        }
      } else if (targetSupplierId) {
        const suppRef = doc(db, 'users', uid, 'suppliers', targetSupplierId);
        const suppDoc = await transaction.get(suppRef);
        if (suppDoc.exists()) {
          const supp = suppDoc.data() as Supplier;
          transaction.update(suppRef, {
            totalPurchased: (supp.totalPurchased || 0) + purchaseData.totalAmount,
            totalPaid: (supp.totalPaid || 0) + purchaseData.paidAmount,
            totalDue: (supp.totalDue || 0) + purchaseData.dueAmount,
            updatedAt: now,
          });
        }
      }

      // 3. Save purchase document
      const newPurchase: Purchase = {
        ...purchaseData,
        id: purchaseRef.id,
        supplierId: targetSupplierId,
        createdAt: now,
        updatedAt: now,
      };
      transaction.set(purchaseRef, newPurchase);
    });

    return purchaseRef.id;
  };

  const cancelPurchase = async (purchase: Purchase) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const now = new Date().toISOString();
    const today = now.split('T')[0];
    const purchaseRef = doc(db, 'users', uid, 'purchases', purchase.id);

    await runTransaction(db, async (transaction) => {
      // Deduct purchased quantities
      for (const item of purchase.items) {
        const prodRef = doc(db, 'users', uid, 'products', item.productId);
        const prodDoc = await transaction.get(prodRef);
        if (prodDoc.exists()) {
          const prod = prodDoc.data() as Product;
          const previousStock = prod.currentStock;
          const newStock = previousStock - item.quantity;

          transaction.update(prodRef, {
            currentStock: newStock,
            updatedAt: now,
          });

          const transRef = doc(collection(db, 'users', uid, 'inventoryTransactions'));
          const trans: InventoryTransaction = {
            id: transRef.id,
            productId: item.productId,
            productName: item.productName,
            transactionType: 'adjustment',
            quantity: item.quantity,
            previousStock,
            newStock,
            referenceId: purchase.invoiceNumber,
            referenceType: 'purchase_cancellation',
            notes: `Purchase cancellation deduction`,
            date: today,
            createdAt: now,
          };
          transaction.set(transRef, trans);
        }
      }

      // Reverse supplier balance
      if (purchase.supplierId) {
        const suppRef = doc(db, 'users', uid, 'suppliers', purchase.supplierId);
        const suppDoc = await transaction.get(suppRef);
        if (suppDoc.exists()) {
          const supp = suppDoc.data() as Supplier;
          transaction.update(suppRef, {
            totalPurchased: Math.max(0, (supp.totalPurchased || 0) - purchase.totalAmount),
            totalPaid: Math.max(0, (supp.totalPaid || 0) - purchase.paidAmount),
            totalDue: Math.max(0, (supp.totalDue || 0) - purchase.dueAmount),
            updatedAt: now,
          });
        }
      }

      transaction.update(purchaseRef, {
        status: 'cancelled',
        updatedAt: now,
      });
    });
  };

  // --- Customers & Suppliers ---
  const createCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser) throw new Error('Not authenticated');
    const uid = currentUser.uid;
    const docRef = doc(collection(db, 'users', uid, 'customers'));
    const now = new Date().toISOString();
    const newCust: Customer = {
      ...customerData,
      id: docRef.id,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(docRef, newCust);
    return docRef.id;
  };

  const updateCustomer = async (id: string, customerData: Partial<Customer>) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    await updateDoc(doc(db, 'users', uid, 'customers', id), {
      ...customerData,
      updatedAt: new Date().toISOString(),
    });
  };

  const deleteCustomer = async (id: string) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    await deleteDoc(doc(db, 'users', uid, 'customers', id));
  };

  const recordCustomerPayment = async (
    customerId: string,
    amount: number,
    paymentMethod: string,
    notes?: string
  ) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const custRef = doc(db, 'users', uid, 'customers', customerId);
    const paymentRef = doc(collection(db, 'users', uid, 'payments'));
    const now = new Date().toISOString();

    await runTransaction(db, async (transaction) => {
      const custDoc = await transaction.get(custRef);
      if (!custDoc.exists()) throw new Error('Customer not found');
      const cust = custDoc.data() as Customer;

      transaction.update(custRef, {
        totalPaid: (cust.totalPaid || 0) + amount,
        totalDue: Math.max(0, (cust.totalDue || 0) - amount),
        updatedAt: now,
      });

      const payment: Payment = {
        id: paymentRef.id,
        partyType: 'customer',
        partyId: customerId,
        partyName: cust.name,
        amount,
        paymentMethod: paymentMethod as any,
        date: now.split('T')[0],
        notes: notes || 'Due payment received',
        createdAt: now,
      };
      transaction.set(paymentRef, payment);
    });
  };

  const createSupplier = async (supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser) throw new Error('Not authenticated');
    const uid = currentUser.uid;
    const docRef = doc(collection(db, 'users', uid, 'suppliers'));
    const now = new Date().toISOString();
    const newSupp: Supplier = {
      ...supplierData,
      id: docRef.id,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(docRef, newSupp);
    return docRef.id;
  };

  const updateSupplier = async (id: string, supplierData: Partial<Supplier>) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    await updateDoc(doc(db, 'users', uid, 'suppliers', id), {
      ...supplierData,
      updatedAt: new Date().toISOString(),
    });
  };

  const deleteSupplier = async (id: string) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    await deleteDoc(doc(db, 'users', uid, 'suppliers', id));
  };

  const recordSupplierPayment = async (
    supplierId: string,
    amount: number,
    paymentMethod: string,
    notes?: string
  ) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const suppRef = doc(db, 'users', uid, 'suppliers', supplierId);
    const paymentRef = doc(collection(db, 'users', uid, 'payments'));
    const now = new Date().toISOString();

    await runTransaction(db, async (transaction) => {
      const suppDoc = await transaction.get(suppRef);
      if (!suppDoc.exists()) throw new Error('Supplier not found');
      const supp = suppDoc.data() as Supplier;

      transaction.update(suppRef, {
        totalPaid: (supp.totalPaid || 0) + amount,
        totalDue: Math.max(0, (supp.totalDue || 0) - amount),
        updatedAt: now,
      });

      const payment: Payment = {
        id: paymentRef.id,
        partyType: 'supplier',
        partyId: supplierId,
        partyName: supp.name,
        amount,
        paymentMethod: paymentMethod as any,
        date: now.split('T')[0],
        notes: notes || 'Supplier due payment cleared',
        createdAt: now,
      };
      transaction.set(paymentRef, payment);
    });
  };

  // --- Expenses Operations ---
  const createExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser) throw new Error('Not authenticated');
    const uid = currentUser.uid;
    const docRef = doc(collection(db, 'users', uid, 'expenses'));
    const now = new Date().toISOString();
    const newExp: Expense = {
      ...expenseData,
      id: docRef.id,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(docRef, newExp);
    return docRef.id;
  };

  const updateExpense = async (id: string, expenseData: Partial<Expense>) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    await updateDoc(doc(db, 'users', uid, 'expenses', id), {
      ...expenseData,
      updatedAt: new Date().toISOString(),
    });
  };

  const deleteExpense = async (id: string) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    await deleteDoc(doc(db, 'users', uid, 'expenses', id));
  };

  return (
    <BusinessDataContext.Provider
      value={{
        products,
        receipts,
        purchases,
        customers,
        suppliers,
        expenses,
        transactions,
        payments,
        loading,
        createProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        createReceipt,
        updateReceipt,
        cancelReceipt,
        recordPurchase,
        cancelPurchase,
        createCustomer,
        updateCustomer,
        deleteCustomer,
        recordCustomerPayment,
        createSupplier,
        updateSupplier,
        deleteSupplier,
        recordSupplierPayment,
        createExpense,
        updateExpense,
        deleteExpense,
      }}
    >
      {children}
    </BusinessDataContext.Provider>
  );
};

export const useBusinessData = () => {
  const context = useContext(BusinessDataContext);
  if (!context) {
    throw new Error('useBusinessData must be used within a BusinessDataProvider');
  }
  return context;
};
