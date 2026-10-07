import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ExpenseCategory, ProductCategory } from '../../types';
import {
  Package,
  UserPlus,
  TrendingDown,
  Truck,
  Bell,
  X,
  Plus,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

/* ================= ADD PRODUCT MODAL ================= */
export const AddProductModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { categories, addProduct, language } = useApp();

  const [name, setName] = useState('');
  const [amharicName, setAmharicName] = useState('');
  const [sku, setSku] = useState(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
  const [barcode, setBarcode] = useState(`600100${Math.floor(1000 + Math.random() * 9000)}`);
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat_groc');
  const [unit, setUnit] = useState('pcs');
  const [purchasePrice, setPurchasePrice] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number | ''>(10);
  const [minStock, setMinStock] = useState<number | ''>(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || purchasePrice === '' || sellingPrice === '') return;

    addProduct({
      name,
      amharicName: amharicName || name,
      sku,
      barcode,
      categoryId,
      unit,
      purchasePrice: Number(purchasePrice),
      sellingPrice: Number(sellingPrice),
      quantity: Number(quantity) || 0,
      minStock: Number(minStock) || 5,
      active: true,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-sm">
              {language === 'am' ? 'አዲስ እቃ መመዝገቢያ' : 'Add New Product'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">
                {language === 'am' ? 'የእቃ ስም (እንግሊዝኛ):' : 'Product Name (English):'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Coca-Cola 300ml"
                className="w-full p-2.5 rounded-xl border border-slate-200"
                required
              />
            </div>
            <div>
              <label className="text-slate-700 font-semibold block mb-1">
                {language === 'am' ? 'የእቃ ስም (በአማርኛ):' : 'Name (Amharic):'}
              </label>
              <input
                type="text"
                value={amharicName}
                onChange={(e) => setAmharicName(e.target.value)}
                placeholder="ለምሳሌ: ኮካ ኮላ"
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">ምድብ / Category:</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {language === 'am' ? c.amharicName : c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-slate-700 font-semibold block mb-1">SKU ኮድ:</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="text-slate-700 font-semibold block mb-1">መለኪያ / Unit:</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
              >
                <option value="pcs">pcs (ፍሬ)</option>
                <option value="kg">kg (ኪ.ግ)</option>
                <option value="bottle">bottle (ጠርሙስ)</option>
                <option value="pack">pack (ፓኬት)</option>
                <option value="box">box (ካርቶን)</option>
                <option value="litre">litre (ሊትር)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">
                {language === 'am' ? 'የመግዣ ዋጋ (Cost):' : 'Purchase Cost (ETB):'}
              </label>
              <input
                type="number"
                step="any"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                required
              />
            </div>
            <div>
              <label className="text-slate-700 font-semibold block mb-1">
                {language === 'am' ? 'የመሸጫ ዋጋ (Price):' : 'Selling Price (ETB):'}
              </label>
              <input
                type="number"
                step="any"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">
                {language === 'am' ? 'የመጀመሪያ ክምችት ብዛት:' : 'Initial Stock Quantity:'}
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="text-slate-700 font-semibold block mb-1">
                {language === 'am' ? 'ዝቅተኛ የማስጠንቀቂያ መጠን:' : 'Minimum Stock Level:'}
              </label>
              <input
                type="number"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              {language === 'am' ? 'ሰርዝ' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold"
            >
              {language === 'am' ? 'እቃውን መዝግብ' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ================= ADD CUSTOMER MODAL ================= */
export const AddCustomerModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { addCustomer, language } = useApp();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [customerType, setCustomerType] = useState<'RETAIL' | 'WHOLESALE' | 'VIP'>('RETAIL');
  const [creditLimit, setCreditLimit] = useState<number | ''>(5000);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    addCustomer({
      name,
      phone,
      address,
      customerType,
      creditLimit: Number(creditLimit) || 5000,
      status: 'ACTIVE',
      notes,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm">
              {language === 'am' ? 'አዲስ ደንበኛ መመዝገቢያ' : 'Register Customer'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3 text-xs">
          <div>
            <label className="text-slate-700 font-semibold block mb-1">
              {language === 'am' ? 'የደንበኛ ሙሉ ስም:' : 'Customer Name:'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. አበበ ከበደ"
              className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
              required
            />
          </div>

          <div>
            <label className="text-slate-700 font-semibold block mb-1">
              {language === 'am' ? 'ስልክ ቁጥር (09...):' : 'Phone Number (+251):'}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0911234567"
              className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">
                {language === 'am' ? 'የደንበኛ አይነት:' : 'Type:'}
              </label>
              <select
                value={customerType}
                onChange={(e) => setCustomerType(e.target.value as any)}
                className="w-full p-2 rounded-xl border border-slate-200 bg-white"
              >
                <option value="RETAIL">{language === 'am' ? 'ችርቻሮ (Retail)' : 'Retail'}</option>
                <option value="WHOLESALE">{language === 'am' ? 'ጅምላ (Wholesale)' : 'Wholesale'}</option>
                <option value="VIP">{language === 'am' ? 'ቪአይፒ (VIP)' : 'VIP'}</option>
              </select>
            </div>
            <div>
              <label className="text-slate-700 font-semibold block mb-1">
                {language === 'am' ? 'የብድር ጣሪያ (Limit):' : 'Credit Limit (ETB):'}
              </label>
              <input
                type="number"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="5000"
                className="w-full p-2 rounded-xl border border-slate-200 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-700 font-semibold block mb-1">
              {language === 'am' ? 'አድራሻ / ሰፈር:' : 'Address / Subcity:'}
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. ቦሌ መድኃኔዓለም"
              className="w-full p-2 rounded-xl border border-slate-200"
            />
          </div>

          <div>
            <label className="text-slate-700 font-semibold block mb-1">
              {language === 'am' ? 'ማስታወሻ:' : 'Notes:'}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. በሳምንት ውስጥ የሚከፍል"
              className="w-full p-2 rounded-xl border border-slate-200"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              {language === 'am' ? 'ሰርዝ' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {language === 'am' ? 'መዝግብ' : 'Save Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ================= ADD EXPENSE MODAL ================= */
export const AddExpenseModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { addExpense, language, currentUser, branches } = useApp();

  const [amount, setAmount] = useState<number | ''>('');
  const [category, setCategory] = useState<ExpenseCategory>('Rent');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [description, setDescription] = useState('');

  const categoriesList: ExpenseCategory[] = [
    'Rent',
    'Electricity',
    'Water',
    'Internet',
    'Transport',
    'Salary',
    'Marketing',
    'Maintenance',
    'Supplies',
    'Tax',
    'Other',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    addExpense({
      branchId: branches[0]?.id || 'br_01',
      amount: Number(amount),
      category,
      paymentMethod,
      description: description || category,
      recordedBy: currentUser.name,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-400" />
            <h3 className="font-bold text-sm">
              {language === 'am' ? 'አዲስ ወጪ መመዝገቢያ' : 'Record Business Expense'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3 text-xs">
          <div>
            <label className="text-slate-700 font-semibold block mb-1">
              {language === 'am' ? 'የወጪው መጠን (ETB):' : 'Expense Amount (ETB):'}
            </label>
            <input
              type="number"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="0"
              className="w-full p-2.5 rounded-xl border border-slate-200 text-base font-bold font-mono text-red-600"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">
                {language === 'am' ? 'የወጪው ዘርፍ:' : 'Category:'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
              >
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-slate-700 font-semibold block mb-1">
                {language === 'am' ? 'የክፍያ ዘዴ:' : 'Payment Method:'}
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
              >
                <option value="Cash">ካሽ (Cash)</option>
                <option value="Telebirr">ቴሌብር (Telebirr)</option>
                <option value="CBE Birr">ሲቢኢ ብር (CBE Birr)</option>
                <option value="Bank Transfer">ባንክ (Bank Transfer)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-slate-700 font-semibold block mb-1">
              {language === 'am' ? 'ዝርዝር ማብራሪያ:' : 'Description:'}
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. የጥቅምት ወር የሱቅ ኪራይ ክፍያ"
              className="w-full p-2.5 rounded-xl border border-slate-200"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              {language === 'am' ? 'ሰርዝ' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {language === 'am' ? 'ወጪውን መዝግብ' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ================= RECORD PURCHASE MODAL ================= */
export const RecordPurchaseModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { suppliers, products, addPurchase, language, currentUser, branches } = useApp();

  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [quantity, setQuantity] = useState<number | ''>(20);
  const [purchasePrice, setPurchasePrice] = useState<number | ''>(
    products[0]?.purchasePrice || ''
  );
  const [amountPaid, setAmountPaid] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer (CBE)');

  const selectedProduct = products.find((p) => p.id === productId);
  const selectedSupplier = suppliers.find((s) => s.id === supplierId);

  const totalAmount = Number(quantity || 0) * Number(purchasePrice || 0);
  const paidVal = Number(amountPaid || 0);
  const debtPayable = Math.max(0, totalAmount - paidVal);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !selectedSupplier || totalAmount <= 0) return;

    addPurchase({
      branchId: branches[0]?.id || 'br_01',
      supplierId,
      supplierName: selectedSupplier.name,
      invoiceNumber: `PUR-INV-${Math.floor(1000 + Math.random() * 9000)}`,
      items: [
        {
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          quantity: Number(quantity),
          purchasePrice: Number(purchasePrice),
          subtotal: totalAmount,
        },
      ],
      totalAmount,
      amountPaid: paidVal,
      debtPayable,
      paymentMethod,
      createdBy: currentUser.name,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-sm">
              {language === 'am' ? 'አዲስ የግዢ እቃ መቀበያ' : 'Receive Purchase Order'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3 text-xs">
          <div>
            <label className="text-slate-700 font-semibold block mb-1">
              {language === 'am' ? 'አቅራቢ ምረጥ:' : 'Supplier:'}
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.phone})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-700 font-semibold block mb-1">
              {language === 'am' ? 'የተገዛው እቃ:' : 'Product to Restock:'}
            </label>
            <select
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                const p = products.find((item) => item.id === e.target.value);
                if (p) setPurchasePrice(p.purchasePrice);
              }}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (አሁን ያለ: {p.quantity} {p.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">
                {language === 'am' ? 'የተገዛው ብዛት:' : 'Quantity Received:'}
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold"
                required
              />
            </div>
            <div>
              <label className="text-slate-700 font-semibold block mb-1">
                {language === 'am' ? 'የአንዱ መግዣ ዋጋ (ETB):' : 'Unit Cost (ETB):'}
              </label>
              <input
                type="number"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                required
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-200 flex justify-between font-bold text-cyan-900">
            <span>{language === 'am' ? 'ጠቅላላ የግዢ ዋጋ:' : 'Total Purchase Amount:'}</span>
            <span className="font-mono">{totalAmount.toLocaleString()} ETB</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">
                {language === 'am' ? 'አሁን የተከፈለው (Paid):' : 'Amount Paid (ETB):'}
              </label>
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="text-slate-700 font-semibold block mb-1">
                {language === 'am' ? 'የክፍያ ዘዴ:' : 'Payment Method:'}
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
              >
                <option value="Bank Transfer (CBE)">የኢትዮጵያ ንግድ ባንክ (CBE)</option>
                <option value="Telebirr">ቴሌብር (Telebirr)</option>
                <option value="Cash">ጥሬ ገንዘብ (Cash)</option>
                <option value="Supplier Credit">በብድር (Accounts Payable)</option>
              </select>
            </div>
          </div>

          {debtPayable > 0 && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex justify-between">
              <span>{language === 'am' ? 'ለአቅራቢው የሚቀር ዕዳ (Payable):' : 'Supplier Accounts Payable:'}</span>
              <strong className="font-mono text-red-700">{debtPayable.toLocaleString()} ETB</strong>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              {language === 'am' ? 'ሰርዝ' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold"
            >
              {language === 'am' ? 'እቃውን ተቀበል' : 'Receive Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ================= NOTIFICATIONS MODAL ================= */
export const NotificationCenterModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { notifications, markNotificationRead, clearAllNotifications, language } = useApp();

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm">
              {language === 'am' ? 'የማሳሰቢያ ማዕከል' : 'Notification Center'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
          <span className="text-slate-500">
            {notifications.filter((n) => !n.read).length} {language === 'am' ? 'ያልተነበቡ' : 'unread'}
          </span>
          <button
            onClick={clearAllNotifications}
            className="text-blue-600 hover:text-blue-800 font-semibold text-[11px]"
          >
            {language === 'am' ? 'ሁሉንም እንዳነበብኩ አድርግ' : 'Mark all as read'}
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          {notifications.length === 0 ? (
            <p className="py-8 text-center text-slate-400 text-xs">ምንም ማሳሰቢያ የለም</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markNotificationRead(n.id)}
                className={`p-3 rounded-xl border text-xs space-y-1 transition cursor-pointer ${
                  n.read ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-blue-50/70 border-blue-200 text-slate-900 font-medium'
                }`}
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-xs">
                    {language === 'am' ? n.titleAm : n.title}
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  {language === 'am' ? n.messageAm : n.message}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs"
          >
            {language === 'am' ? 'ዝጋ' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
