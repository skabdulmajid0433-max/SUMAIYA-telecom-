import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  Download,
  Upload,
  FileSpreadsheet,
  Users,
  ShieldCheck,
  Check,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { ShopSettings, User } from '../types';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const Settings: React.FC = () => {
  const { settings, users, refreshData, showToast } = useShop();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'shop' | 'invoice' | 'inventory' | 'backup' | 'import' | 'users'>('shop');

  // Form states
  const [shopForm, setShopForm] = useState<ShopSettings>({ ...settings });
  const [isSaving, setIsSaving] = useState(false);

  // Bulk import state
  const [importCsvText, setImportCsvText] = useState('');
  const [importPreview, setImportPreview] = useState<any[]>([]);

  // User management state
  const [newStaffUser, setNewStaffUser] = useState({
    name: '',
    role: 'staff' as any,
    username: '',
    pin: '1234',
    phone: ''
  });

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateSettings(shopForm, currentUser?.name || 'Owner');
      showToast('Shop settings updated successfully!', 'success');
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // CSV Import Parser
  const parseCsv = () => {
    try {
      const lines = importCsvText.trim().split('\n');
      if (lines.length < 2) {
        showToast('CSV must contain a header and at least one data row', 'error');
        return;
      }
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const parsed: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(',').map((v) => v.trim());
        const row: any = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });
        if (row.name || row.product) {
          parsed.push({
            name: row.name || row.product,
            sku: row.sku || `SKU-${Date.now()}-${i}`,
            category: row.category || 'Accessories',
            brand: row.brand || 'Generic',
            compatibleModels: row.model || row.compatiblemodels || '',
            purchasePrice: Number(row.purchaseprice || row.cost) || 0,
            sellingPrice: Number(row.sellingprice || row.price) || 0,
            quantity: Number(row.quantity || row.stock) || 0,
            minStockLevel: Number(row.minstock || row.minstocklevel) || 3,
            rackLocation: row.rack || row.racklocation || 'A-01'
          });
        }
      }
      setImportPreview(parsed);
      showToast(`Parsed ${parsed.length} products successfully!`, 'info');
    } catch (err) {
      showToast('Failed to parse CSV format', 'error');
    }
  };

  const handleCommitImport = async () => {
    if (importPreview.length === 0) return;
    try {
      const res = await api.importProducts(importPreview, currentUser?.name || 'Owner');
      showToast(`Successfully imported ${res.count} products into inventory!`, 'success');
      setImportPreview([]);
      setImportCsvText('');
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Import failed', 'error');
    }
  };

  // Database Restore
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const json = JSON.parse(reader.result as string);
        if (!json.settings || !json.products) {
          showToast('Invalid backup file. Missing essential database collections.', 'error');
          return;
        }
        await api.restoreBackup(json, currentUser?.name || 'Owner');
        showToast('Database restored successfully from backup!', 'success');
        await refreshData();
      } catch (err) {
        showToast('Failed to parse backup JSON file', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Create Staff User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffUser.name || !newStaffUser.username) return;
    try {
      await api.createUser(newStaffUser, currentUser?.name || 'Admin');
      showToast(`Staff login account created for ${newStaffUser.name}!`, 'success');
      setNewStaffUser({ name: '', role: 'staff', username: '', pin: '1234', phone: '' });
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to create user', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <SettingsIcon className="w-5 h-5 text-blue-400" />
            <span>Shop Configuration & System Settings</span>
          </h1>
          <p className="text-xs text-slate-400">
            Customize Sumaiya telecom shop details, bill prefixes, backup, restore & staff login permissions
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'shop', label: 'Shop Details' },
          { id: 'invoice', label: 'Invoice & Repair Rules' },
          { id: 'inventory', label: 'Inventory Policies' },
          { id: 'backup', label: 'Backup & Restore' },
          { id: 'import', label: 'Bulk Product CSV Import' },
          { id: 'users', label: 'Staff Logins' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: SHOP DETAILS */}
      {activeTab === 'shop' && (
        <form onSubmit={handleSaveSettings} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-sm text-white border-b border-slate-800 pb-2">
            Sumaiya Telecom Store Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-300 block mb-1">Shop Name *</label>
              <input
                type="text"
                required
                value={shopForm.shopName}
                onChange={(e) => setShopForm({ ...shopForm, shopName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1">Owner / Proprietor Name *</label>
              <input
                type="text"
                required
                value={shopForm.ownerName}
                onChange={(e) => setShopForm({ ...shopForm, ownerName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1">Primary Mobile Phone *</label>
              <input
                type="tel"
                required
                value={shopForm.phone}
                onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1">WhatsApp Business Number *</label>
              <input
                type="tel"
                required
                value={shopForm.whatsapp}
                onChange={(e) => setShopForm({ ...shopForm, whatsapp: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-slate-300 block mb-1">Shop Full Address *</label>
              <input
                type="text"
                required
                value={shopForm.address}
                onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1">GSTIN Number (Optional)</label>
              <input
                type="text"
                value={shopForm.gstNumber}
                onChange={(e) => setShopForm({ ...shopForm, gstNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1">Currency Symbol</label>
              <input
                type="text"
                value={shopForm.currency}
                onChange={(e) => setShopForm({ ...shopForm, currency: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold text-center"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Changes...' : 'Save Shop Information'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: INVOICE & REPAIR RULES */}
      {activeTab === 'invoice' && (
        <form onSubmit={handleSaveSettings} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-sm text-white border-b border-slate-800 pb-2">
            Invoice & Repair Policy Settings
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-300 block mb-1">Invoice Prefix</label>
              <input
                type="text"
                value={shopForm.invoicePrefix}
                onChange={(e) => setShopForm({ ...shopForm, invoicePrefix: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1">Repair Job ID Prefix</label>
              <input
                type="text"
                value={shopForm.repairPrefix}
                onChange={(e) => setShopForm({ ...shopForm, repairPrefix: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-slate-300 block mb-1">Terms & Conditions (Printed on Bills)</label>
              <textarea
                rows={4}
                value={shopForm.terms}
                onChange={(e) => setShopForm({ ...shopForm, terms: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs leading-relaxed"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-slate-300 block mb-1">Invoice Footer Greeting</label>
              <input
                type="text"
                value={shopForm.invoiceFooter}
                onChange={(e) => setShopForm({ ...shopForm, invoiceFooter: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
            </div>

            <div className="sm:col-span-2 flex items-center space-x-2 bg-slate-850 p-3 rounded-xl border border-slate-800">
              <input
                type="checkbox"
                id="allowDueDeliv"
                checked={shopForm.allowDeliveryWithDue}
                onChange={(e) => setShopForm({ ...shopForm, allowDeliveryWithDue: e.target.checked })}
                className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
              />
              <label htmlFor="allowDueDeliv" className="text-xs text-slate-200 cursor-pointer">
                Allow device delivery with pending due amount (logs remaining balance to customer ledger)
              </label>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save Policy Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: INVENTORY POLICIES */}
      {activeTab === 'inventory' && (
        <form onSubmit={handleSaveSettings} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-sm text-white border-b border-slate-800 pb-2">
            Inventory & Stock Alert Policies
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="text-slate-300 block mb-1">Low Stock Warning Threshold (Quantity)</label>
              <input
                type="number"
                min="1"
                value={shopForm.lowStockThreshold}
                onChange={(e) => setShopForm({ ...shopForm, lowStockThreshold: Number(e.target.value) || 3 })}
                className="w-48 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold"
              />
              <span className="text-slate-500 block mt-1">
                Products with stock equal or less than this value will show up in the Low Stock alert counter.
              </span>
            </div>

            <div className="flex items-center space-x-2 bg-slate-850 p-3 rounded-xl border border-slate-800">
              <input
                type="checkbox"
                id="allowNeg"
                checked={shopForm.allowNegativeStock}
                onChange={(e) => setShopForm({ ...shopForm, allowNegativeStock: e.target.checked })}
                className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
              />
              <div>
                <label htmlFor="allowNeg" className="text-xs text-white font-semibold cursor-pointer block">
                  Allow Negative Stock Transactions
                </label>
                <span className="text-[11px] text-slate-400">
                  When unchecked (recommended), the POS and repair module will strictly block sales or repair part fitting if stock is 0.
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save Inventory Policies</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: BACKUP & RESTORE */}
      {activeTab === 'backup' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-6">
          <div>
            <h3 className="font-bold text-sm text-white mb-1">Database Backup & Disaster Recovery</h3>
            <p className="text-xs text-slate-400">
              Download complete shop data (customers, products, repairs, billing, suppliers, staff, expenses) as a secure offline JSON backup.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-850 rounded-xl border border-slate-800 space-y-3">
              <span className="font-bold text-xs text-emerald-400 block uppercase tracking-wider">
                1. Download Database Backup
              </span>
              <p className="text-xs text-slate-300">
                Safeguard your business records. Can be restored anytime or saved to Google Drive / Pen Drive.
              </p>
              <a
                href="/api/backup"
                download
                className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition"
              >
                <Download className="w-4 h-4" />
                <span>Download Full Database Backup (.json)</span>
              </a>
            </div>

            <div className="p-4 bg-slate-850 rounded-xl border border-slate-800 space-y-3">
              <span className="font-bold text-xs text-amber-400 block uppercase tracking-wider">
                2. Restore Database from File
              </span>
              <p className="text-xs text-slate-300">
                Restore database from a previously downloaded backup JSON file.
              </p>
              <label className="inline-flex items-center space-x-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-md cursor-pointer transition">
                <Upload className="w-4 h-4" />
                <span>Upload & Restore Database</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: BULK PRODUCT CSV IMPORT */}
      {activeTab === 'import' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-sm text-white">Bulk Product Import from CSV</h3>
              <p className="text-xs text-slate-400">
                Paste CSV data with columns: name, category, sku, purchasePrice, sellingPrice, quantity, rack
              </p>
            </div>
            <button
              onClick={() => {
                setImportCsvText(
                  `name,category,sku,purchasePrice,sellingPrice,quantity,rack\nRealme C55 Display Combo,LCD / Display,LCD-RLM-C55,1100,1750,5,A-05\nOnePlus Nord CE 3 Battery,Spare Parts,BAT-OP-N3,950,1650,4,B-03\nType-C 20W PD Adapter,Accessories,ACC-CHG-20W,180,450,15,D-06`
                );
              }}
              className="text-xs text-blue-400 hover:text-blue-300 underline"
            >
              Load Sample CSV
            </button>
          </div>

          <textarea
            rows={6}
            value={importCsvText}
            onChange={(e) => setImportCsvText(e.target.value)}
            placeholder="name,category,sku,purchasePrice,sellingPrice,quantity,rack&#10;Samsung M14 LCD Combo,LCD / Display,LCD-SAM-M14,1250,1900,6,A-06"
            className="w-full p-3 bg-slate-850 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
          />

          <div className="flex space-x-2">
            <button
              onClick={parseCsv}
              disabled={!importCsvText.trim()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700"
            >
              Parse & Preview
            </button>

            {importPreview.length > 0 && (
              <button
                onClick={handleCommitImport}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Import {importPreview.length} Products to Inventory
              </button>
            )}
          </div>

          {/* Preview Table */}
          {importPreview.length > 0 && (
            <div className="border border-slate-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-800 text-slate-400">
                  <tr>
                    <th className="p-2">Name</th>
                    <th className="p-2">SKU</th>
                    <th className="p-2">Cost</th>
                    <th className="p-2">Sell</th>
                    <th className="p-2 text-center">Stock</th>
                    <th className="p-2">Rack</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {importPreview.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-medium text-white">{item.name}</td>
                      <td className="p-2 font-mono text-purple-300">{item.sku}</td>
                      <td className="p-2">₹{item.purchasePrice}</td>
                      <td className="p-2 text-emerald-400 font-bold">₹{item.sellingPrice}</td>
                      <td className="p-2 text-center font-bold">{item.quantity}</td>
                      <td className="p-2 font-mono">{item.rackLocation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: STAFF LOGINS */}
      {activeTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-white">Staff Login Credentials & Roles</h3>
              <p className="text-xs text-slate-400">Owner, Manager, and Technician role permissions</p>
            </div>
          </div>

          {/* Existing Users list */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {users.map((u) => (
              <div key={u.id} className="p-3 bg-slate-850 rounded-xl border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white text-sm">{u.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 font-bold uppercase">
                    {u.role}
                  </span>
                </div>
                <p className="text-slate-400">User: <strong className="text-slate-300 font-mono">{u.username}</strong></p>
                <p className="text-slate-400">PIN: <strong className="text-slate-300 font-mono">{u.pin}</strong></p>
                {u.phone && <p className="text-slate-500 text-[11px]">{u.phone}</p>}
              </div>
            ))}
          </div>

          {/* Add Staff Login form */}
          <form onSubmit={handleCreateUser} className="p-4 bg-slate-850 rounded-xl border border-slate-800 space-y-3">
            <span className="font-bold text-xs text-slate-300 uppercase tracking-wider block">
              + Create New Staff Login
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <input
                  type="text"
                  required
                  placeholder="Staff Name"
                  value={newStaffUser.name}
                  onChange={(e) => setNewStaffUser({ ...newStaffUser, name: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-white"
                />
              </div>
              <div>
                <select
                  value={newStaffUser.role}
                  onChange={(e) => setNewStaffUser({ ...newStaffUser, role: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-white"
                >
                  <option value="staff">Staff (Repairs & Sales)</option>
                  <option value="manager">Manager (Inventory & Bills)</option>
                  <option value="admin">Admin / Owner (Full Access)</option>
                </select>
              </div>
              <div>
                <input
                  type="text"
                  required
                  placeholder="Username"
                  value={newStaffUser.username}
                  onChange={(e) => setNewStaffUser({ ...newStaffUser, username: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-white font-mono"
                />
              </div>
              <div>
                <input
                  type="text"
                  required
                  placeholder="4-Digit PIN"
                  value={newStaffUser.pin}
                  onChange={(e) => setNewStaffUser({ ...newStaffUser, pin: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-white font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg shadow-sm"
              >
                Create Staff Account
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
