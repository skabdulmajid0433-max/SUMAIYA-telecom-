import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Barcode as BarcodeIcon,
  Printer,
  AlertTriangle,
  History,
  Edit2,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Check,
  Filter
} from 'lucide-react';
import { Product, ProductCategory } from '../types';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { BarcodePrintModal } from '../components/BarcodePrintModal';

interface InventoryProps {
  initialProductId?: string;
  initialOpenAddModal?: boolean;
}

export const Inventory: React.FC<InventoryProps> = ({
  initialProductId,
  initialOpenAddModal = false
}) => {
  const { products, suppliers, settings, formatCurrency, refreshData, showToast } = useShop();
  const { currentUser, canDeleteRecords } = useAuth();

  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [stockStatusFilter, setStockStatusFilter] = useState<'All' | 'Low' | 'Out'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddEditModal, setShowAddEditModal] = useState<boolean>(initialOpenAddModal);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAdjustModal, setShowAdjustModal] = useState<boolean>(false);
  const [selectedProductForAdjust, setSelectedProductForAdjust] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<'IN' | 'OUT' | 'DAMAGE'>('IN');
  const [adjustQuantity, setAdjustQuantity] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState<string>('');

  const [showBarcodeScanner, setShowBarcodeScanner] = useState<boolean>(false);
  const [showBarcodePrintModal, setShowBarcodePrintModal] = useState<boolean>(false);
  const [productToPrint, setProductToPrint] = useState<Product | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    sku: '',
    barcode: '',
    name: '',
    category: 'Accessories' as ProductCategory,
    subcategory: '',
    brand: '',
    compatibleModels: '',
    supplierId: '',
    purchasePrice: '',
    sellingPrice: '',
    minSellingPrice: '',
    wholesalePrice: '',
    quantity: '',
    minStockLevel: '3',
    unit: 'Pcs',
    rackLocation: 'A-01',
    warranty: 'Testing Warranty',
    description: ''
  });

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.active) return false;
      if (categoryFilter !== 'All' && p.category !== categoryFilter) return false;

      const minLvl = p.minStockLevel || settings.lowStockThreshold || 3;
      if (stockStatusFilter === 'Low' && p.quantity > minLvl) return false;
      if (stockStatusFilter === 'Out' && p.quantity > 0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.barcode.includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.compatibleModels.toLowerCase().includes(q) ||
          p.rackLocation.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [products, categoryFilter, stockStatusFilter, searchQuery, settings.lowStockThreshold]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      sku: `SKU-${Date.now().toString().slice(-6)}`,
      barcode: `${Date.now().toString().slice(-8)}`,
      name: '',
      category: 'Accessories',
      subcategory: '',
      brand: '',
      compatibleModels: '',
      supplierId: suppliers[0]?.id || '',
      purchasePrice: '',
      sellingPrice: '',
      minSellingPrice: '',
      wholesalePrice: '',
      quantity: '',
      minStockLevel: '3',
      unit: 'Pcs',
      rackLocation: 'A-01',
      warranty: '30 Days Testing',
      description: ''
    });
    setShowAddEditModal(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku,
      barcode: product.barcode,
      name: product.name,
      category: product.category,
      subcategory: product.subcategory || '',
      brand: product.brand || '',
      compatibleModels: product.compatibleModels || '',
      supplierId: product.supplierId || '',
      purchasePrice: String(product.purchasePrice),
      sellingPrice: String(product.sellingPrice),
      minSellingPrice: String(product.minSellingPrice || product.sellingPrice),
      wholesalePrice: String(product.wholesalePrice || product.purchasePrice),
      quantity: String(product.quantity),
      minStockLevel: String(product.minStockLevel || 3),
      unit: product.unit || 'Pcs',
      rackLocation: product.rackLocation || 'A-01',
      warranty: product.warranty || '',
      description: product.description || ''
    });
    setShowAddEditModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sku) {
      showToast('Product name and SKU are required', 'error');
      return;
    }

    try {
      const payload = {
        ...formData,
        purchasePrice: Number(formData.purchasePrice) || 0,
        sellingPrice: Number(formData.sellingPrice) || 0,
        minSellingPrice: Number(formData.minSellingPrice) || Number(formData.sellingPrice) || 0,
        wholesalePrice: Number(formData.wholesalePrice) || Number(formData.purchasePrice) || 0,
        quantity: Number(formData.quantity) || 0,
        minStockLevel: Number(formData.minStockLevel) || 3,
        supplierName: suppliers.find((s) => s.id === formData.supplierId)?.companyName || '',
        performedBy: currentUser?.name || 'Admin'
      };

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload, currentUser?.name || 'Admin');
        showToast(`Product ${formData.name} updated!`, 'success');
      } else {
        await api.createProduct(payload, currentUser?.name || 'Admin');
        showToast(`Product ${formData.name} created!`, 'success');
      }

      setShowAddEditModal(false);
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save product', 'error');
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Are you sure you want to deactivate ${product.name}?`)) return;
    try {
      await api.deleteProduct(product.id, currentUser?.name || 'Admin');
      showToast(`Product archived`, 'success');
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete product', 'error');
    }
  };

  // Stock In / Out Adjustment
  const handleOpenAdjust = (product: Product, type: 'IN' | 'OUT') => {
    setSelectedProductForAdjust(product);
    setAdjustType(type);
    setAdjustQuantity(1);
    setAdjustReason(type === 'IN' ? 'Manual stock count inward' : 'Damaged / Shop testing loss');
    setShowAdjustModal(true);
  };

  const handleSaveStockAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForAdjust) return;

    try {
      await api.adjustStock({
        productId: selectedProductForAdjust.id,
        type: adjustType,
        quantity: Number(adjustQuantity) || 1,
        reason: adjustReason,
        performedBy: currentUser?.name || 'Staff'
      });
      showToast(`Stock updated! New balance: ${adjustType === 'IN' ? selectedProductForAdjust.quantity + adjustQuantity : selectedProductForAdjust.quantity - adjustQuantity}`, 'success');
      setShowAdjustModal(false);
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to adjust stock', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Package className="w-5 h-5 text-purple-400" />
            <span>Inventory & Spare Parts Master</span>
          </h1>
          <p className="text-xs text-slate-400">
            LCDs, mobile accessories, spare parts, charging flexes, batteries & stock valuation
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowBarcodeScanner(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <BarcodeIcon className="w-4 h-4 text-blue-400" />
            <span>Scan to Find</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center space-x-2 shadow-md shadow-purple-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Product</span>
          </button>
        </div>
      </div>

      {/* Filter Ribbon & Search */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Category & Status tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto pb-1 scrollbar-none">
          {['All', 'Accessories', 'Spare Parts', 'LCD / Display', 'Tools & Consumables'].map(
            (cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  categoryFilter === cat
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            )
          )}

          <div className="h-4 w-px bg-slate-700 mx-1 flex-shrink-0" />

          <button
            onClick={() =>
              setStockStatusFilter(stockStatusFilter === 'Low' ? 'All' : 'Low')
            }
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition ${
              stockStatusFilter === 'Low'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                : 'bg-slate-800/80 text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            ⚠️ Low Stock Alert
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search SKU, barcode, name, model, rack..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Products Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-850 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Product & SKU</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Location / Rack</th>
                <th className="py-3 px-3 text-right">Purchase (Cost)</th>
                <th className="py-3 px-3 text-right">Selling Price</th>
                <th className="py-3 px-3 text-center">In Stock</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => {
                  const minLvl = p.minStockLevel || settings.lowStockThreshold || 3;
                  const isLow = p.quantity <= minLvl && p.quantity > 0;
                  const isOut = p.quantity <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-sm">{p.name}</div>
                        <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                          <span className="font-mono text-purple-300 font-semibold">{p.sku}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-500">Barcode: {p.barcode}</span>
                          {p.compatibleModels && (
                            <>
                              <span>•</span>
                              <span className="text-slate-400 truncate max-w-xs">{p.compatibleModels}</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] border border-slate-700">
                          {p.category}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono font-semibold text-slate-300">
                        {p.rackLocation || 'A-01'}
                      </td>

                      <td className="py-3 px-3 text-right text-slate-400">
                        {formatCurrency(p.purchasePrice)}
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-emerald-400">
                        {formatCurrency(p.sellingPrice)}
                        <span className="block text-[10px] text-slate-500">
                          Min: {formatCurrency(p.minSellingPrice || p.sellingPrice)}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            isOut
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : isLow
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          <span>{p.quantity}</span>
                          <span className="text-[10px] font-normal">{p.unit}</span>
                        </div>
                        {isLow && (
                          <span className="block text-[9px] text-amber-400 mt-0.5 font-medium">
                            Min: {p.minStockLevel}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Stock In */}
                          <button
                            onClick={() => handleOpenAdjust(p, 'IN')}
                            title="Stock In (+)"
                            className="p-1.5 bg-slate-800 hover:bg-emerald-950 text-emerald-400 hover:border-emerald-500 border border-slate-700 rounded-lg transition"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>

                          {/* Stock Out */}
                          <button
                            onClick={() => handleOpenAdjust(p, 'OUT')}
                            title="Stock Out (-)"
                            className="p-1.5 bg-slate-800 hover:bg-red-950 text-red-400 hover:border-red-500 border border-slate-700 rounded-lg transition"
                          >
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                          </button>

                          {/* Print Barcode Label */}
                          <button
                            onClick={() => {
                              setProductToPrint(p);
                              setShowBarcodePrintModal(true);
                            }}
                            title="Print Barcode Stickers"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 rounded-lg transition"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Product */}
                          <button
                            onClick={() => handleOpenEdit(p)}
                            title="Edit Product Master"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          {canDeleteRecords && (
                            <button
                              onClick={() => handleDeleteProduct(p)}
                              title="Archive Product"
                              className="p-1.5 bg-slate-800 hover:bg-red-900/50 text-slate-500 hover:text-red-400 border border-slate-700 rounded-lg transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No matching products in inventory.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {showAddEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[92vh]">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
              <h3 className="font-bold text-base text-white">
                {editingProduct ? 'Edit Product Master' : 'Add New Inventory Product / LCD'}
              </h3>
              <button
                onClick={() => setShowAddEditModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-4 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-300 block mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Samsung Galaxy A15 LCD Screen (Folder)"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Accessories">Mobile Accessories</option>
                    <option value="Spare Parts">Mobile Repair Spare Parts</option>
                    <option value="LCD / Display">LCD / Display</option>
                    <option value="Tools & Consumables">Tools & Consumables</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">SKU / Item Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-purple-300 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Barcode</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="Barcode number"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Compatible Models</label>
                  <input
                    type="text"
                    value={formData.compatibleModels}
                    onChange={(e) => setFormData({ ...formData, compatibleModels: e.target.value })}
                    placeholder="e.g. Galaxy A15 4G/5G"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-850 p-3 rounded-xl border border-slate-800">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Purchase Price (₹)</label>
                  <input
                    type="number"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                    placeholder="Cost"
                    className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    placeholder="Retail"
                    className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-emerald-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Current Stock Qty</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="Qty"
                    className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Min Alert Stock</label>
                  <input
                    type="number"
                    value={formData.minStockLevel}
                    onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
                    placeholder="3"
                    className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-amber-300 focus:outline-none"
                  />
                </div>
              </div>

              {/* Location & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Rack / Shelf Location</label>
                  <input
                    type="text"
                    value={formData.rackLocation}
                    onChange={(e) => setFormData({ ...formData, rackLocation: e.target.value })}
                    placeholder="e.g. A-02, Drawer 4"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Unit</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="Pcs, Set, Meter"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Warranty Term</label>
                  <input
                    type="text"
                    value={formData.warranty}
                    onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
                    placeholder="30 Days Testing / 6 Months"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-purple-600/30"
                >
                  Save Product Master
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STOCK IN / OUT ADJUSTMENT MODAL */}
      {showAdjustModal && selectedProductForAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-base text-white">
                {adjustType === 'IN' ? 'Stock Inward (+)' : 'Stock Outward / Damage (-)'}
              </h3>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStockAdjust} className="p-4 space-y-4">
              <div className="p-3 bg-slate-850 rounded-xl space-y-1 text-xs">
                <p className="font-bold text-white">{selectedProductForAdjust.name}</p>
                <p className="text-slate-400 font-mono">SKU: {selectedProductForAdjust.sku}</p>
                <p className="text-emerald-400 font-semibold">
                  Current Stock: {selectedProductForAdjust.quantity} {selectedProductForAdjust.unit}
                </p>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Adjustment Type</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                >
                  <option value="IN">Stock In (+) - Purchase / Adjustment</option>
                  <option value="OUT">Stock Out (-) - Consumption / Adjustment</option>
                  <option value="DAMAGE">Stock Out (-) - Damaged / Defective</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm font-bold text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Reason / Reference</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Broken during installation test"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-md"
                >
                  Apply Stock Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onScan={(code) => setSearchQuery(code)}
        title="Find Product by Barcode"
      />

      {/* Barcode Print Modal */}
      <BarcodePrintModal
        isOpen={showBarcodePrintModal}
        onClose={() => setShowBarcodePrintModal(false)}
        product={productToPrint}
      />
    </div>
  );
};
