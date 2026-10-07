import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, InventoryTxType } from '../../types';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  History,
  TrendingDown,
  TrendingUp,
  X,
  Edit,
  CheckCircle,
  Truck,
} from 'lucide-react';

interface InventoryManagementProps {
  onOpenAddProduct: () => void;
  onOpenRecordPurchase: () => void;
}

export const InventoryManagement: React.FC<InventoryManagementProps> = ({
  onOpenAddProduct,
  onOpenRecordPurchase,
}) => {
  const {
    products,
    categories,
    inventoryTransactions,
    language,
    adjustStock,
    updateProduct,
    currentUser,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);

  // Stock Adjustment Modal
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustmentDelta, setAdjustmentDelta] = useState<number | ''>('');
  const [adjustmentType, setAdjustmentType] = useState<InventoryTxType>('ADJUSTMENT');
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');

  // Stock History Modal
  const [historyProductId, setHistoryProductId] = useState<string | null>(null);

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return false;
    if (filterLowStockOnly && p.quantity > p.minStock) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.amharicName && p.amharicName.toLowerCase().includes(q)) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.includes(q)
      );
    }
    return true;
  });

  const handleConfirmAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct || adjustmentDelta === '' || Number(adjustmentDelta) === 0) return;

    adjustStock({
      productId: adjustingProduct.id,
      quantityDelta: Number(adjustmentDelta),
      type: adjustmentType,
      reason: adjustmentReason || 'Manual inventory adjustment',
    });

    setAdjustingProduct(null);
    setAdjustmentDelta('');
    setAdjustmentReason('');
  };

  const productTxHistory = historyProductId
    ? inventoryTransactions.filter((tx) => tx.productId === historyProductId)
    : [];

  const historyProduct = products.find((p) => p.id === historyProductId);

  // Valuation metrics
  const totalItemsCount = products.reduce((acc, p) => acc + p.quantity, 0);
  const inventoryCostValuation = products.reduce((acc, p) => acc + p.quantity * p.purchasePrice, 0);
  const inventorySalesValuation = products.reduce((acc, p) => acc + p.quantity * p.sellingPrice, 0);
  const lowStockCount = products.filter((p) => p.quantity <= p.minStock).length;

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header & KPI Summary */}
      <div className="bg-slate-900 rounded-2xl p-5 text-white border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {language === 'am' ? 'የእቃ ክምችት አስተዳደር' : 'Inventory Management'}
              </h2>
              <p className="text-xs text-slate-400">
                {language === 'am'
                  ? 'እያንዳንዱ የእቃ እንቅስቃሴ በህጋዊ መዝገብ የሚመዘገብበት ስርዓት'
                  : 'Track opening, sales, damages, and purchase arrivals with full audit trail'}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onOpenRecordPurchase}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Truck className="w-4 h-4 text-cyan-400" />
              <span>{language === 'am' ? 'ግዢ ተቀበል' : 'Receive Stock'}</span>
            </button>
            <button
              onClick={onOpenAddProduct}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'am' ? '+ አዲስ እቃ መዝግብ' : '+ Add Product'}</span>
            </button>
          </div>
        </div>

        {/* Valuation KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800 text-xs">
          <div className="p-3 rounded-xl bg-slate-800/80">
            <span className="text-slate-400 text-[11px] block">
              {language === 'am' ? 'ጠቅላላ እቃዎች በክምችት' : 'Total Items in Stock'}
            </span>
            <p className="text-lg font-bold text-white mt-1 font-mono">
              {totalItemsCount} <span className="text-xs text-slate-400">units</span>
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/80">
            <span className="text-slate-400 text-[11px] block">
              {language === 'am' ? 'የክምችት ግዢ ዋጋ (Cost)' : 'Inventory Cost Valuation'}
            </span>
            <p className="text-lg font-bold text-amber-400 mt-1 font-mono">
              {inventoryCostValuation.toLocaleString()} <span className="text-xs">ETB</span>
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/80">
            <span className="text-slate-400 text-[11px] block">
              {language === 'am' ? 'የክምችት መሸጫ ዋጋ' : 'Potential Sales Value'}
            </span>
            <p className="text-lg font-bold text-emerald-400 mt-1 font-mono">
              {inventorySalesValuation.toLocaleString()} <span className="text-xs">ETB</span>
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/80 border border-amber-900/40">
            <span className="text-amber-400 text-[11px] block flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              {language === 'am' ? 'ሊያልቁ የተቃረቡ' : 'Low Stock Items'}
            </span>
            <p className="text-lg font-bold text-amber-500 mt-1 font-mono">
              {lowStockCount} <span className="text-xs text-slate-400">products</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
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
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
          <button
            onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium border transition ${
              filterLowStockOnly
                ? 'bg-amber-100 text-amber-800 border-amber-300 font-bold'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            ⚠️ {language === 'am' ? 'ሊያልቁ የደረሱ ብቻ' : 'Low Stock Only'}
          </button>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {language === 'am' ? 'ሁሉም' : 'All'}
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition ${
                selectedCategory === c.id
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {language === 'am' ? c.amharicName : c.name}
            </button>
          ))}
        </div>
      </div>

      {/* PRODUCTS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">{language === 'am' ? 'የእቃ ስም' : 'Product'}</th>
                <th className="py-3 px-3">SKU / ባርኮድ</th>
                <th className="py-3 px-3 text-right">{language === 'am' ? 'የመግዣ ዋጋ' : 'Cost'}</th>
                <th className="py-3 px-3 text-right">{language === 'am' ? 'የመሸጫ ዋጋ' : 'Price'}</th>
                <th className="py-3 px-3 text-center">{language === 'am' ? 'በክምችት ያለ' : 'Stock Qty'}</th>
                <th className="py-3 px-3 text-center">{language === 'am' ? 'ዝቅተኛ' : 'Min'}</th>
                <th className="py-3 px-4 text-right">{language === 'am' ? 'ተግባራት' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((prod) => {
                const isLow = prod.quantity <= prod.minStock;
                const isOut = prod.quantity <= 0;

                return (
                  <tr key={prod.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">
                        {language === 'am' && prod.amharicName ? prod.amharicName : prod.name}
                      </div>
                      <span className="text-[10px] text-slate-400">{prod.unit}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">
                      <div>{prod.sku}</div>
                      <div className="text-[10px] text-slate-400">{prod.barcode}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      {prod.purchasePrice} ETB
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {prod.sellingPrice} ETB
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full font-bold font-mono text-xs ${
                          isOut
                            ? 'bg-red-100 text-red-700'
                            : isLow
                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {prod.quantity} {prod.unit}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-500">
                      {prod.minStock}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setHistoryProductId(prod.id)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                          title="Movement History"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setAdjustingProduct(prod);
                            setAdjustmentDelta('');
                            setAdjustmentType('ADJUSTMENT');
                            setAdjustmentReason('');
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] transition"
                        >
                          {language === 'am' ? 'አስተካክል' : 'Adjust'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADJUSTMENT MODAL */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Edit className="w-4 h-4 text-blue-600" />
                <span>{language === 'am' ? 'የክምችት ማስተካከያ መዝግብ' : 'Record Stock Adjustment'}</span>
              </h3>
              <button
                onClick={() => setAdjustingProduct(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-slate-900">
                {language === 'am' && adjustingProduct.amharicName ? adjustingProduct.amharicName : adjustingProduct.name}
              </p>
              <p className="text-slate-500">
                {language === 'am' ? 'በአሁኑ ሰዓት ያለ ብዛት:' : 'Current Stock:'}{' '}
                <strong className="text-slate-900 font-mono">{adjustingProduct.quantity} {adjustingProduct.unit}</strong>
              </p>
            </div>

            <form onSubmit={handleConfirmAdjustment} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {language === 'am' ? 'የማስተካከያ አይነት:' : 'Adjustment Type:'}
                </label>
                <select
                  value={adjustmentType}
                  onChange={(e) => setAdjustmentType(e.target.value as InventoryTxType)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white"
                >
                  <option value="ADJUSTMENT">{language === 'am' ? 'የቁጥር ማስተካከያ (General Audit)' : 'Stock Audit / Adjustment'}</option>
                  <option value="DAMAGE">{language === 'am' ? 'የተበላሸ እቃ ቅነሳ (Damaged Stock)' : 'Damaged Stock (Loss)'}</option>
                  <option value="EXPIRED">{language === 'am' ? 'ጊዜው ያለፈበት ቅነሳ (Expired Stock)' : 'Expired Stock (Loss)'}</option>
                  <option value="TRANSFER">{language === 'am' ? 'ወደ ሌላ ቅርንጫፍ ማስተላለፍ (Branch Transfer)' : 'Transfer to Branch'}</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {language === 'am' ? 'የሚጨመር ወይም የሚቀነስ ብዛት (+ ወይም -):' : 'Quantity Change (e.g. +10 or -5):'}
                </label>
                <input
                  type="number"
                  value={adjustmentDelta}
                  onChange={(e) => setAdjustmentDelta(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. -2 or +15"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold"
                  required
                />
              </div>

              {adjustmentDelta !== '' && (
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs flex justify-between">
                  <span className="text-blue-800">{language === 'am' ? 'አዲስ የሚሆነው ክምችት:' : 'New Closing Stock:'}</span>
                  <strong className="text-blue-900 font-mono">
                    {Math.max(0, adjustingProduct.quantity + Number(adjustmentDelta))} {adjustingProduct.unit}
                  </strong>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {language === 'am' ? 'ምክንያት (ለኦዲት መዝገብ):' : 'Reason / Note (For Audit Log):'}
                </label>
                <input
                  type="text"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder={language === 'am' ? 'ለምሳሌ: በቆጠራ ወቅት የተገኘ ልዩነት' : 'e.g. Stock count discrepancy'}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100"
                >
                  {language === 'am' ? 'ሰርዝ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                >
                  {language === 'am' ? 'አረጋግጥ' : 'Confirm Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRODUCT TRANSACTION AUDIT HISTORY MODAL */}
      {historyProductId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-purple-600" />
                  <span>{language === 'am' ? 'የእቃ እንቅስቃሴ ታሪክ መዝገብ' : 'Product Movement History'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {historyProduct?.name} ({historyProduct?.sku})
                </p>
              </div>
              <button
                onClick={() => setHistoryProductId(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
              {productTxHistory.length === 0 ? (
                <p className="text-slate-400 py-6 text-center">ምንም የእንቅስቃሴ ታሪክ የለም</p>
              ) : (
                productTxHistory.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800">{tx.type}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{tx.reason || '-'}</p>
                      <p className="text-[10px] text-slate-400">ፈጻሚ: {tx.createdBy}</p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`font-mono font-bold text-sm ${
                          tx.quantityDelta > 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {tx.quantityDelta > 0 ? `+${tx.quantityDelta}` : tx.quantityDelta}
                      </span>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {tx.previousQty} → {tx.newQty}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-200">
              <button
                onClick={() => setHistoryProductId(null)}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs"
              >
                {language === 'am' ? 'ዝጋ' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
