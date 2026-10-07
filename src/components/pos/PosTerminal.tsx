import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, Customer, PaymentMethod, SaleItem, SplitPaymentDetail, Sale } from '../../types';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  AlertCircle,
  CreditCard,
  UserPlus,
  QrCode,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import { ReceiptModal } from '../common/ReceiptModal';

interface PosTerminalProps {
  onOpenAddCustomer: () => void;
}

export const PosTerminal: React.FC<PosTerminalProps> = ({ onOpenAddCustomer }) => {
  const {
    products,
    categories,
    customers,
    currentUser,
    currentBranchId,
    language,
    addSale,
    business,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');

  // Split payment state
  const [splitCash, setSplitCash] = useState<number>(0);
  const [splitMobile, setSplitMobile] = useState<number>(0);
  const [splitMobileProvider, setSplitMobileProvider] = useState<string>('Telebirr');
  const [splitCredit, setSplitCredit] = useState<number>(0);

  // Completed sale receipt modal
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [overrideAuthorized, setOverrideAuthorized] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter products
  const filteredProducts = products.filter((p) => {
    if (!p.active) return false;
    if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q) || (p.amharicName && p.amharicName.includes(q));
      const matchBarcode = p.barcode.includes(q) || p.sku.toLowerCase().includes(q);
      return matchName || matchBarcode;
    }
    return true;
  });

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Cart operations
  const addToCart = (product: Product) => {
    setErrorMsg(null);
    if (product.quantity <= 0) {
      setErrorMsg(language === 'am' ? 'ይህ እቃ በክምችት ውስጥ አልቋል!' : 'This item is out of stock!');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          setErrorMsg(
            language === 'am'
              ? `በክምችት ያለው ${product.quantity} ብቻ ነው!`
              : `Only ${product.quantity} items available in stock!`
          );
          return prev;
        }
        return prev.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.unitPrice,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: language === 'am' && product.amharicName ? product.amharicName : product.name,
          sku: product.sku,
          unit: product.unit,
          quantity: 1,
          unitPrice: product.sellingPrice,
          purchasePrice: product.purchasePrice,
          discount: 0,
          subtotal: product.sellingPrice,
        },
      ];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    const prod = products.find((p) => p.id === productId);
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (prod && newQty > prod.quantity) {
              setErrorMsg(language === 'am' ? `ከክምችት በላይ ማከል አይቻልም (${prod.quantity})` : 'Exceeds available stock');
              return item;
            }
            return {
              ...item,
              quantity: newQty,
              subtotal: newQty * item.unitPrice,
            };
          }
          return item;
        })
        .filter(Boolean) as SaleItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountAmount(0);
    setErrorMsg(null);
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const total = Math.max(0, subtotal - discountAmount);

  // Credit calculation
  let creditAmount = 0;
  let amountPaid = total;

  if (paymentMethod === 'CREDIT') {
    creditAmount = total;
    amountPaid = 0;
  } else if (paymentMethod === 'SPLIT') {
    creditAmount = splitCredit;
    amountPaid = splitCash + splitMobile;
  }

  // Credit limit validation
  const availableCredit = selectedCustomer
    ? Math.max(0, selectedCustomer.creditLimit - selectedCustomer.currentDebt)
    : 0;

  const isCreditExceeded =
    (paymentMethod === 'CREDIT' || (paymentMethod === 'SPLIT' && splitCredit > 0)) &&
    selectedCustomer &&
    creditAmount > availableCredit;

  // Handle Checkout
  const handleCheckout = () => {
    setErrorMsg(null);

    if (cart.length === 0) {
      setErrorMsg(language === 'am' ? 'እባክዎ መጀመሪያ እቃ ወደ ቅርጫት ይጨምሩ' : 'Cart is empty');
      return;
    }

    if ((paymentMethod === 'CREDIT' || (paymentMethod === 'SPLIT' && splitCredit > 0)) && !selectedCustomerId) {
      setErrorMsg(
        language === 'am'
          ? 'የብድር ሽያጭ ለመመዝገብ አስቀድመው ደንበኛ መምረጥ አለብዎት!'
          : 'Credit sale requires selecting a customer!'
      );
      return;
    }

    if (isCreditExceeded && !overrideAuthorized && currentUser.role !== 'OWNER' && currentUser.role !== 'MANAGER') {
      setErrorMsg(
        language === 'am'
          ? `የደንበኛው የብድር ጣሪያ አልፏል (${availableCredit} ብር ብቻ ቀርቷል)። የአስተዳዳሪ ፍቃድ ያስፈልጋል።`
          : `Credit limit exceeded! Customer only has ${availableCredit} ETB available credit.`
      );
      return;
    }

    // Split validation
    if (paymentMethod === 'SPLIT') {
      const splitTotal = splitCash + splitMobile + splitCredit;
      if (Math.abs(splitTotal - total) > 0.5) {
        setErrorMsg(
          language === 'am'
            ? `የተከፋፈለው ድምር (${splitTotal} ብር) ከጠቅላላ ዋጋው (${total} ብር) ጋር እኩል መሆን አለበት!`
            : `Split total (${splitTotal} ETB) must match order total (${total} ETB)!`
        );
        return;
      }
    }

    const splitPayments: SplitPaymentDetail[] = [];
    if (paymentMethod === 'SPLIT') {
      if (splitCash > 0) splitPayments.push({ method: 'CASH', amount: splitCash });
      if (splitMobile > 0) splitPayments.push({ method: 'MOBILE', provider: splitMobileProvider, amount: splitMobile });
      if (splitCredit > 0) splitPayments.push({ method: 'CREDIT', amount: splitCredit });
    }

    const created = addSale({
      businessId: business.id,
      branchId: currentBranchId === 'all' ? 'br_01' : currentBranchId,
      customerId: selectedCustomerId || undefined,
      customerName: selectedCustomer ? selectedCustomer.name : undefined,
      items: cart,
      subtotal,
      discount: discountAmount,
      tax: 0,
      total,
      paymentMethod,
      splitPayments: paymentMethod === 'SPLIT' ? splitPayments : undefined,
      amountPaid,
      creditAmount,
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      status: 'COMPLETED',
    });

    setCompletedSale(created);
    clearCart();
    setSelectedCustomerId('');
    setOverrideAuthorized(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pb-20 md:pb-8">
      {/* LEFT: PRODUCTS BROWSER (7 Cols on desktop) */}
      <div className="lg:col-span-7 space-y-4">
        {/* Search & Barcode Bar */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === 'am'
                  ? 'እቃ በስም፣ ባርኮድ ወይም SKU ፈልግ...'
                  : 'Search product by name, barcode, or SKU...'
              }
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {language === 'am' ? 'ሁሉም እቃዎች' : 'All Items'}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {language === 'am' ? cat.amharicName : cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[620px] overflow-y-auto pr-1">
          {filteredProducts.map((prod) => {
            const isLow = prod.quantity <= prod.minStock;
            const isOut = prod.quantity <= 0;

            return (
              <div
                key={prod.id}
                onClick={() => !isOut && addToCart(prod)}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer active:scale-95 select-none relative ${
                  isOut
                    ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                    : 'bg-white border-slate-200 hover:border-blue-500 hover:shadow-md'
                }`}
              >
                {isLow && !isOut && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] bg-amber-100 text-amber-800 font-bold">
                    {language === 'am' ? 'አነስተኛ' : 'LOW'}
                  </span>
                )}
                {isOut && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] bg-red-100 text-red-800 font-bold">
                    {language === 'am' ? 'አልቋል' : 'OUT'}
                  </span>
                )}

                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2">
                    {language === 'am' && prod.amharicName ? prod.amharicName : prod.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {prod.sku} • {prod.unit}
                  </p>
                </div>

                <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 font-mono">
                    {prod.sellingPrice} <span className="text-[10px] text-slate-500">ETB</span>
                  </span>
                  <span
                    className={`text-[11px] font-semibold ${
                      isLow ? 'text-amber-600' : 'text-slate-500'
                    }`}
                  >
                    {prod.quantity} {prod.unit}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: CART & CHECKOUT DRAWER (5 Cols on desktop) */}
      <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-md p-4 sm:p-5 flex flex-col justify-between space-y-4">
        <div>
          {/* Cart Header */}
          <div className="flex justify-between items-center pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900">
                {language === 'am' ? 'የሽያጭ ቅርጫት' : 'Current Order'}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                {cart.reduce((a, b) => a + b.quantity, 0)}
              </span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{language === 'am' ? 'አጽዳ' : 'Clear'}</span>
              </button>
            )}
          </div>

          {/* Customer Selection */}
          <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-700">
                {language === 'am' ? 'ደንበኛ ምረጥ:' : 'Select Customer:'}
              </label>
              <button
                type="button"
                onClick={onOpenAddCustomer}
                className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
              >
                <UserPlus className="w-3 h-3" />
                <span>+ {language === 'am' ? 'አዲስ ደንበኛ' : 'New Customer'}</span>
              </button>
            </div>

            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">
                {language === 'am' ? 'የመንገድ ደንበኛ (Walk-in Customer)' : 'Walk-in Customer (No debt allowed)'}
              </option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone}) - {language === 'am' ? 'ዕዳ' : 'Debt'}: {c.currentDebt} ETB / {language === 'am' ? 'ጣሪያ' : 'Limit'}: {c.creditLimit} ETB
                </option>
              ))}
            </select>

            {/* Customer Debt Info Pill */}
            {selectedCustomer && (
              <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-[11px] flex justify-between items-center">
                <div>
                  <span className="text-slate-600">
                    {language === 'am' ? 'ያለበት ዕዳ:' : 'Current Debt:'}{' '}
                    <strong className="text-red-600">{selectedCustomer.currentDebt.toLocaleString()} ETB</strong>
                  </span>
                </div>
                <div>
                  <span className="text-slate-600">
                    {language === 'am' ? 'የተፈቀደ ቀሪ:' : 'Avail Credit:'}{' '}
                    <strong className="text-emerald-700">{availableCredit.toLocaleString()} ETB</strong>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                {language === 'am' ? 'ቅርጫቱ ባዶ ነው። ከግራ በኩል እቃዎችን ይምረጡ።' : 'Cart is empty. Select items to add.'}
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.productId}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-xs text-slate-800">{item.productName}</p>
                    <p className="text-[11px] text-slate-500">
                      {item.unitPrice} ETB × {item.quantity} ={' '}
                      <strong className="text-slate-900">{item.subtotal.toLocaleString()} ETB</strong>
                    </p>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQuantity(item.productId, -1)}
                      className="w-6 h-6 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold font-mono">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, 1)}
                      className="w-6 h-6 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="p-1 text-slate-400 hover:text-red-500 ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* BOTTOM: PAYMENT & TOTALS */}
        <div className="pt-3 border-t border-slate-200 space-y-3">
          {/* Subtotal, Discount & Total */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>{language === 'am' ? 'ንዑስ ድምር' : 'Subtotal'}:</span>
              <span className="font-mono font-medium">{subtotal.toLocaleString()} ETB</span>
            </div>

            {/* Discount field */}
            <div className="flex justify-between items-center text-slate-500">
              <span>{language === 'am' ? 'ቅናሽ (Discount)' : 'Discount'}:</span>
              <input
                type="number"
                min="0"
                max={subtotal}
                value={discountAmount || ''}
                onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value)))}
                placeholder="0"
                className="w-20 px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-right text-xs font-mono"
              />
            </div>

            <div className="flex justify-between text-base font-bold text-slate-900 pt-1 border-t border-slate-100">
              <span>{language === 'am' ? 'ጠቅላላ ድምር' : 'TOTAL'}:</span>
              <span className="text-blue-700 font-mono">{total.toLocaleString()} ETB</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              {language === 'am' ? 'የክፍያ ዘዴ:' : 'Payment Method:'}
            </label>
            <div className="grid grid-cols-4 gap-1.5 text-[11px]">
              {(['CASH', 'MOBILE', 'CREDIT', 'SPLIT'] as PaymentMethod[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`py-2 px-1 rounded-xl font-semibold border text-center transition ${
                    paymentMethod === m
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {m === 'CASH' && (language === 'am' ? 'ካሽ' : 'Cash')}
                  {m === 'MOBILE' && (language === 'am' ? 'ቴሌብር' : 'Mobile')}
                  {m === 'CREDIT' && (language === 'am' ? 'በብድር' : 'Credit')}
                  {m === 'SPLIT' && (language === 'am' ? 'ክፍፍል' : 'Split')}
                </button>
              ))}
            </div>
          </div>

          {/* Split Payment Form Fields */}
          {paymentMethod === 'SPLIT' && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <span className="font-bold text-slate-700 block">
                {language === 'am' ? 'የክፍፍል ክፍያ ዝርዝር:' : 'Split Breakdown:'}
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 block">ካሽ (Cash):</label>
                  <input
                    type="number"
                    value={splitCash || ''}
                    onChange={(e) => setSplitCash(Number(e.target.value))}
                    className="w-full p-1.5 rounded border border-slate-200 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block">ቴሌብር (Mobile):</label>
                  <input
                    type="number"
                    value={splitMobile || ''}
                    onChange={(e) => setSplitMobile(Number(e.target.value))}
                    className="w-full p-1.5 rounded border border-slate-200 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block text-red-600 font-bold">ዕዳ (Credit):</label>
                  <input
                    type="number"
                    value={splitCredit || ''}
                    onChange={(e) => setSplitCredit(Number(e.target.value))}
                    className="w-full p-1.5 rounded border border-red-300 bg-red-50 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p>{errorMsg}</p>
                {isCreditExceeded && (currentUser.role === 'OWNER' || currentUser.role === 'MANAGER') && (
                  <button
                    type="button"
                    onClick={() => {
                      setOverrideAuthorized(true);
                      setErrorMsg(null);
                    }}
                    className="mt-1 text-[11px] font-bold text-red-800 underline block"
                  >
                    {language === 'am' ? 'እንደ አስተዳዳሪ የብድር ጣሪያውን ማለፍ ፍቀድ (Override)' : 'Authorize Manager Credit Override'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>
              {language === 'am' ? 'ሽያጩን አጠናቅቅ' : 'Complete Sale'} ({total.toLocaleString()} ETB)
            </span>
          </button>
        </div>
      </div>

      {/* Digital Receipt Modal */}
      {completedSale && (
        <ReceiptModal
          sale={completedSale}
          onClose={() => setCompletedSale(null)}
        />
      )}
    </div>
  );
};
