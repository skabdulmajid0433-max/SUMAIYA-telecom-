import React, { useState, useMemo } from 'react';
import {
  Wrench,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  Printer,
  MessageCircle,
  Phone,
  Camera,
  Package,
  Check,
  X,
  CreditCard,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Lock,
  UserCheck
} from 'lucide-react';
import { RepairJob, RepairStatus, Product } from '../types';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { InvoicePrintModal } from '../components/InvoicePrintModal';
import { WhatsAppReminderModal } from '../components/WhatsAppReminderModal';

const REPAIR_STATUSES: RepairStatus[] = [
  'Received',
  'Checking',
  'Estimate Given',
  'Customer Approval Pending',
  'Repairing',
  'Waiting for Spare Part',
  'Ready',
  'Delivered',
  'Cancelled',
  'Returned Without Repair'
];

const DEVICE_CONDITION_OPTIONS = [
  'Screen broken',
  'Display damaged',
  'Touch problem',
  'Body damaged / bent',
  'Camera damaged',
  'Charging problem',
  'Speaker problem',
  'Mic problem',
  'Battery problem / swelling',
  'Water damage / liquid ingress',
  'Back panel damaged',
  'Network / No SIM detection',
  'Power IC dead'
];

interface RepairsPageProps {
  initialRepairId?: string;
  initialOpenNewModal?: boolean;
}

export const Repairs: React.FC<RepairsPageProps> = ({
  initialRepairId,
  initialOpenNewModal = false
}) => {
  const {
    repairs,
    products,
    staff,
    settings,
    formatCurrency,
    formatDate,
    formatDateTime,
    refreshData,
    showToast
  } = useShop();

  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRepair, setSelectedRepair] = useState<RepairJob | null>(() => {
    if (initialRepairId) {
      return repairs.find((r) => r.id === initialRepairId) || null;
    }
    return repairs[0] || null;
  });

  // Modal states
  const [showNewJobModal, setShowNewJobModal] = useState<boolean>(initialOpenNewModal);
  const [showAddPartModal, setShowAddPartModal] = useState<boolean>(false);
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState<boolean>(false);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [printMode, setPrintMode] = useState<'invoice' | 'repair_receipt'>('repair_receipt');
  const [showReminderModal, setShowReminderModal] = useState<boolean>(false);

  // New repair form state
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerWhatsapp: '',
    customerAddress: '',
    brand: '',
    model: '',
    imei1: '',
    imei2: '',
    color: '',
    deviceCondition: [] as string[],
    lockCode: '',
    simReceived: false,
    sdCardReceived: false,
    chargerReceived: false,
    batteryCondition: 'Normal',
    otherAccessories: '',
    problemDescription: '',
    technicianNotes: '',
    estimatedCost: '',
    advancePaid: '',
    advancePaymentMethod: 'Cash',
    expectedDeliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    assignedTechnician: staff[0]?.name || 'sk abdulmajid',
    priority: 'Normal' as 'Normal' | 'High' | 'Urgent',
    warrantyDays: 30,
    photos: [] as string[]
  });

  // Add Part form state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [partQuantity, setPartQuantity] = useState(1);
  const [isIncludedInPrice, setIsIncludedInPrice] = useState(true);

  // Status Change form state
  const [targetStatus, setTargetStatus] = useState<RepairStatus>('Repairing');
  const [statusNote, setStatusNote] = useState('');

  // Delivery form state
  const [deliveryPaymentAmount, setDeliveryPaymentAmount] = useState<number>(0);
  const [deliveryPaymentMethod, setDeliveryPaymentMethod] = useState('Cash');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Filter repairs
  const filteredRepairs = useMemo(() => {
    return repairs.filter((r) => {
      if (!r.active) return false;

      // Status tab
      if (activeTab === 'Pending') {
        if (['Delivered', 'Cancelled', 'Returned Without Repair'].includes(r.status)) return false;
      } else if (activeTab === 'Ready') {
        if (r.status !== 'Ready') return false;
      } else if (activeTab === 'Delivered') {
        if (r.status !== 'Delivered') return false;
      } else if (activeTab !== 'All' && r.status !== activeTab) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          r.id.toLowerCase().includes(q) ||
          r.customerName.toLowerCase().includes(q) ||
          r.customerPhone.includes(q) ||
          r.brand.toLowerCase().includes(q) ||
          r.model.toLowerCase().includes(q) ||
          r.imei1.includes(q) ||
          (r.imei2 && r.imei2.includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [repairs, activeTab, searchQuery]);

  // Keep selectedRepair in sync with fresh data
  const currentRepair = useMemo(() => {
    if (!selectedRepair) return repairs[0] || null;
    return repairs.find((r) => r.id === selectedRepair.id) || selectedRepair;
  }, [repairs, selectedRepair]);

  // Handle Photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setFormData((prev) => ({
            ...prev,
            photos: [...prev.photos, reader.result as string]
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit New Repair
  const handleCreateRepair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || !formData.customerPhone || !formData.brand || !formData.model) {
      showToast('Please fill customer name, phone, brand and model', 'error');
      return;
    }

    try {
      const res = await api.createRepair({
        ...formData,
        estimatedCost: Number(formData.estimatedCost) || 0,
        advancePaid: Number(formData.advancePaid) || 0,
        performedBy: currentUser?.name || 'Staff'
      });
      showToast(`Repair job ${res.repair.id} created successfully!`, 'success');
      setShowNewJobModal(false);
      await refreshData();
      setSelectedRepair(res.repair);
      // Open print intake slip automatically
      setPrintMode('repair_receipt');
      setShowPrintModal(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to create repair job', 'error');
    }
  };

  // Submit Status Change
  const handleUpdateStatus = async () => {
    if (!currentRepair) return;
    try {
      await api.updateRepairStatus(currentRepair.id, {
        status: targetStatus,
        note: statusNote || `Status updated to ${targetStatus}`,
        staffName: currentUser?.name || 'Staff'
      });
      showToast(`Status updated to ${targetStatus}`, 'success');
      setShowStatusModal(false);
      setStatusNote('');
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  // Submit Add Part
  const handleAddPart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRepair || !selectedProductId) {
      showToast('Please select a spare part from stock', 'error');
      return;
    }

    try {
      await api.addRepairPart(currentRepair.id, {
        productId: selectedProductId,
        quantity: Number(partQuantity) || 1,
        isIncludedInRepairPrice: isIncludedInPrice,
        performedBy: currentUser?.name || 'Technician'
      });
      showToast('Part added to repair and deducted from inventory!', 'success');
      setShowAddPartModal(false);
      setSelectedProductId('');
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to add part', 'error');
    }
  };

  // Open delivery modal
  const openDeliveryModal = () => {
    if (!currentRepair) return;
    setDeliveryPaymentAmount(currentRepair.remainingAmount);
    setShowDeliveryModal(true);
  };

  // Submit Delivery
  const handleDeliverRepair = async () => {
    if (!currentRepair) return;
    try {
      const res = await api.deliverRepair(currentRepair.id, {
        paymentAmount: Number(deliveryPaymentAmount) || 0,
        paymentMethod: deliveryPaymentMethod,
        notes: deliveryNotes,
        performedBy: currentUser?.name || 'Staff'
      });
      showToast(`Device delivered successfully! Repair marked DELIVERED`, 'success');
      setShowDeliveryModal(false);
      await refreshData();
      // Open final invoice print
      setPrintMode('invoice');
      setShowPrintModal(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to complete delivery', 'error');
    }
  };

  const getStatusBadgeClass = (status: RepairStatus) => {
    switch (status) {
      case 'Received':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Checking':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Repairing':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'Waiting for Spare Part':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Ready':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse font-bold';
      case 'Delivered':
        return 'bg-slate-700 text-slate-300 border-slate-600';
      case 'Cancelled':
      case 'Returned Without Repair':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Wrench className="w-5 h-5 text-blue-400" />
            <span>Mobile Repair Jobs</span>
          </h1>
          <p className="text-xs text-slate-400">
            Intake job cards, technician workbench, parts allocation & delivery
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              customerName: '',
              customerPhone: '',
              customerWhatsapp: '',
              customerAddress: '',
              brand: '',
              model: '',
              imei1: '',
              imei2: '',
              color: '',
              deviceCondition: [],
              lockCode: '',
              simReceived: false,
              sdCardReceived: false,
              chargerReceived: false,
              batteryCondition: 'Normal',
              otherAccessories: '',
              problemDescription: '',
              technicianNotes: '',
              estimatedCost: '',
              advancePaid: '',
              advancePaymentMethod: 'Cash',
              expectedDeliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
              assignedTechnician: staff[0]?.name || 'sk abdulmajid',
              priority: 'Normal',
              warrantyDays: 30,
              photos: []
            });
            setShowNewJobModal(true);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center space-x-2 shadow-md shadow-blue-600/30 active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>+ New Repair Job</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Status Pipeline Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto pb-1 scrollbar-none">
          {['All', 'Pending', 'Ready', 'Delivered'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Job ID, IMEI, model, customer..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Main Split Layout: Left List, Right Detail Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Repairs List (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-2.5 max-h-[calc(100vh-16rem)] overflow-y-auto pr-1">
          {filteredRepairs.length > 0 ? (
            filteredRepairs.map((r) => {
              const isSelected = currentRepair?.id === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRepair(r)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-slate-850 border-blue-500 shadow-md ring-1 ring-blue-500/30'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-blue-400">{r.id}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border ${getStatusBadgeClass(
                            r.status
                          )}`}
                        >
                          {r.status}
                        </span>
                        {r.priority === 'Urgent' && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-red-500/20 text-red-400 font-bold rounded">
                            URGENT
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-white mt-1">
                        {r.brand} {r.model}
                      </h4>
                      <p className="text-xs text-slate-400">
                        Cust: <strong className="text-slate-200">{r.customerName}</strong> ({r.customerPhone})
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-white">{formatCurrency(r.estimatedCost)}</div>
                      <div className="text-[11px] text-amber-400 font-medium">
                        Due: {formatCurrency(r.remainingAmount)}
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-2 line-clamp-1 italic bg-slate-950/40 px-2 py-1 rounded">
                    "{r.problemDescription}"
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-1 border-t border-slate-800/80">
                    <span>In: {formatDate(r.createdAt)}</span>
                    <span>Tech: {r.assignedTechnician}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
              <Wrench className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-medium">No repair jobs found</p>
              <p className="text-xs text-slate-500 mt-1">Click "+ New Repair Job" to take in a customer phone</p>
            </div>
          )}
        </div>

        {/* Right Active Repair Job Details (7 cols on lg) */}
        <div className="lg:col-span-7">
          {currentRepair ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-6 shadow-sm">
              {/* Header card with ID, status & actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm font-bold text-blue-400">{currentRepair.id}</span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full border ${getStatusBadgeClass(
                        currentRepair.status
                      )}`}
                    >
                      {currentRepair.status}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-white mt-1">
                    {currentRepair.brand} {currentRepair.model}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Received on {formatDate(currentRepair.createdAt)} by {currentRepair.createdBy}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setTargetStatus(currentRepair.status);
                      setShowStatusModal(true);
                    }}
                    className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-lg text-xs font-semibold flex items-center space-x-1"
                  >
                    <span>Change Status</span>
                  </button>

                  <button
                    onClick={() => {
                      setPrintMode('repair_receipt');
                      setShowPrintModal(true);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center space-x-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Receipt</span>
                  </button>

                  <button
                    onClick={() => setShowReminderModal(true)}
                    className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold flex items-center space-x-1"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  {currentRepair.status !== 'Delivered' && (
                    <button
                      onClick={openDeliveryModal}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-sm"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Deliver Device</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Customer & Device Specs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-850 p-4 rounded-xl border border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Customer Details
                  </span>
                  <p className="font-bold text-white text-sm">{currentRepair.customerName}</p>
                  <p className="text-slate-300 mt-0.5">Phone: <strong>{currentRepair.customerPhone}</strong></p>
                  {currentRepair.customerAddress && (
                    <p className="text-slate-400 mt-0.5">{currentRepair.customerAddress}</p>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Device Info
                  </span>
                  {currentRepair.imei1 && (
                    <p className="font-mono text-slate-300">
                      IMEI 1: <strong className="text-white">{currentRepair.imei1}</strong>
                    </p>
                  )}
                  {currentRepair.lockCode && (
                    <p className="text-amber-300 mt-0.5 flex items-center">
                      <Lock className="w-3 h-3 mr-1" /> Lock: {currentRepair.lockCode}
                    </p>
                  )}
                  <p className="text-slate-400 mt-0.5">Color: {currentRepair.color || 'Standard'}</p>
                  <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 mt-1">
                    <span>SIM: {currentRepair.simReceived ? '✓ Yes' : '✗ No'}</span>
                    <span>SD: {currentRepair.sdCardReceived ? '✓ Yes' : '✗ No'}</span>
                    <span>Charger: {currentRepair.chargerReceived ? '✓ Yes' : '✗ No'}</span>
                  </div>
                </div>
              </div>

              {/* Problem Description & Conditions */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Problem & Device Checklist
                </span>
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 text-xs text-slate-200">
                  <p className="font-medium text-white">Complaint:</p>
                  <p className="mt-0.5 text-slate-300">{currentRepair.problemDescription}</p>
                  {currentRepair.technicianNotes && (
                    <p className="mt-2 text-blue-300 text-[11px]">
                      <strong>Tech Note:</strong> {currentRepair.technicianNotes}
                    </p>
                  )}
                </div>

                {currentRepair.deviceCondition && currentRepair.deviceCondition.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {currentRepair.deviceCondition.map((c, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700"
                      >
                        • {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Spare Parts Used from Inventory */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Spare Parts & Materials Used ({currentRepair.partsUsed?.length || 0})
                  </span>
                  <button
                    onClick={() => setShowAddPartModal(true)}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Part from Stock</span>
                  </button>
                </div>

                <div className="bg-slate-850 rounded-xl border border-slate-800 divide-y divide-slate-800 overflow-hidden text-xs">
                  {currentRepair.partsUsed && currentRepair.partsUsed.length > 0 ? (
                    currentRepair.partsUsed.map((p, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-white">{p.productName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            SKU: {p.sku} • Qty: {p.quantity} • Cost: {formatCurrency(p.costPrice)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-200">{formatCurrency(p.sellingPrice * p.quantity)}</p>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded ${
                              p.isIncludedInRepairPrice
                                ? 'bg-slate-800 text-slate-400'
                                : 'bg-emerald-950 text-emerald-400 font-bold'
                            }`}
                          >
                            {p.isIncludedInRepairPrice ? 'Included in Quote' : 'Charged Extra'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-500 text-xs">
                      No spare parts allocated yet. Click "+ Add Part from Stock" when fitting an LCD, battery or connector.
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Box: Cost, Advance, Remaining Due */}
              <div className="bg-gradient-to-br from-slate-850 to-slate-900 p-4 rounded-xl border border-slate-800">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-slate-800/60">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total Estimate</span>
                    <p className="text-base sm:text-lg font-black text-white mt-0.5">
                      {formatCurrency(currentRepair.estimatedCost)}
                    </p>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-800/60">
                    <span className="text-[10px] uppercase font-bold text-blue-400">Advance Paid</span>
                    <p className="text-base sm:text-lg font-black text-blue-400 mt-0.5">
                      {formatCurrency(currentRepair.advancePaid)}
                    </p>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-800/60">
                    <span className="text-[10px] uppercase font-bold text-red-400">Due Remaining</span>
                    <p className="text-base sm:text-lg font-black text-red-400 mt-0.5">
                      {formatCurrency(currentRepair.remainingAmount)}
                    </p>
                  </div>
                </div>

                {currentRepair.warrantyExpiresAt && (
                  <div className="mt-3 p-2 bg-emerald-950/40 border border-emerald-800/40 rounded-lg text-emerald-300 text-xs flex items-center justify-between">
                    <span className="flex items-center space-x-1.5 font-semibold">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Testing Warranty Active</span>
                    </span>
                    <span className="font-mono text-[11px]">
                      Expires: {formatDate(currentRepair.warrantyExpiresAt)}
                    </span>
                  </div>
                )}
              </div>

              {/* Status Change Timeline */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Status History Log
                </span>
                <div className="space-y-2">
                  {currentRepair.statusHistory?.map((h, i) => (
                    <div
                      key={i}
                      className="p-2.5 bg-slate-850 rounded-xl border border-slate-800 flex items-start justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white">{h.status}</span>
                          <span className="text-[10px] text-slate-500">by {h.staffName}</span>
                        </div>
                        <p className="text-slate-400 text-[11px] mt-0.5">{h.note}</p>
                      </div>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap">
                        {formatDateTime(h.date)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* NEW REPAIR MODAL */}
      {showNewJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[92vh]">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
              <div className="flex items-center space-x-2">
                <Wrench className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base text-white">Create New Mobile Repair Job</h3>
              </div>
              <button
                onClick={() => setShowNewJobModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRepair} className="p-4 space-y-5 overflow-y-auto">
              {/* Section 1: Customer Information */}
              <div>
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
                  1. Customer Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Customer Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      placeholder="e.g. Rahim Mondal"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Address / Locality</label>
                    <input
                      type="text"
                      value={formData.customerAddress}
                      onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                      placeholder="e.g. Rampurhat Bazar"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Mobile Phone Info */}
              <div>
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
                  2. Mobile Device Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Brand *</label>
                    <input
                      type="text"
                      required
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="e.g. Samsung, Vivo, Redmi"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Model Name / Number *</label>
                    <input
                      type="text"
                      required
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      placeholder="e.g. Galaxy A15 / Note 12"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">IMEI 1 (Optional)</label>
                    <input
                      type="text"
                      value={formData.imei1}
                      onChange={(e) => setFormData({ ...formData, imei1: e.target.value })}
                      placeholder="15-digit IMEI"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Phone Lock / PIN</label>
                    <input
                      type="text"
                      value={formData.lockCode}
                      onChange={(e) => setFormData({ ...formData, lockCode: e.target.value })}
                      placeholder="Pattern / PIN"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-amber-300 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Accessories received checkmarks */}
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-300 bg-slate-850 p-2.5 rounded-lg border border-slate-800">
                  <span className="font-semibold text-slate-400">Accessories Deposited:</span>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.simReceived}
                      onChange={(e) => setFormData({ ...formData, simReceived: e.target.checked })}
                      className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
                    />
                    <span>SIM Card</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.sdCardReceived}
                      onChange={(e) => setFormData({ ...formData, sdCardReceived: e.target.checked })}
                      className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
                    />
                    <span>Memory Card</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.chargerReceived}
                      onChange={(e) => setFormData({ ...formData, chargerReceived: e.target.checked })}
                      className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
                    />
                    <span>Charger</span>
                  </label>
                </div>
              </div>

              {/* Section 3: Device Condition Checkmarks */}
              <div>
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
                  3. Device Condition Checklist (Physical / Functional State)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-850 p-3 rounded-xl border border-slate-800">
                  {DEVICE_CONDITION_OPTIONS.map((cond) => {
                    const isChecked = formData.deviceCondition.includes(cond);
                    return (
                      <label
                        key={cond}
                        className={`flex items-center space-x-2 text-xs p-1.5 rounded cursor-pointer transition ${
                          isChecked ? 'bg-blue-900/40 text-blue-200' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, deviceCondition: [...formData.deviceCondition, cond] });
                            } else {
                              setFormData({
                                ...formData,
                                deviceCondition: formData.deviceCondition.filter((c) => c !== cond)
                              });
                            }
                          }}
                          className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
                        />
                        <span>{cond}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Section 4: Problem Complaint & Pricing */}
              <div>
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
                  4. Problem Complaint, Estimates & Advance
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">
                      Problem / Customer Complaint *
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={formData.problemDescription}
                      onChange={(e) => setFormData({ ...formData, problemDescription: e.target.value })}
                      placeholder="e.g. Display broken after drop, touch not responding, no picture only vibrating"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Estimated Cost (₹) *</label>
                      <input
                        type="number"
                        required
                        value={formData.estimatedCost}
                        onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                        placeholder="e.g. 1800"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Advance Payment (₹)</label>
                      <input
                        type="number"
                        value={formData.advancePaid}
                        onChange={(e) => setFormData({ ...formData, advancePaid: e.target.value })}
                        placeholder="0"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-emerald-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Advance Mode</label>
                      <select
                        value={formData.advancePaymentMethod}
                        onChange={(e) => setFormData({ ...formData, advancePaymentMethod: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI / GPay / PhonePe</option>
                        <option value="Card">Card</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Expected Delivery Date</label>
                      <input
                        type="date"
                        value={formData.expectedDeliveryDate}
                        onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Assign Technician</label>
                      <select
                        value={formData.assignedTechnician}
                        onChange={(e) => setFormData({ ...formData, assignedTechnician: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        {staff.map((s) => (
                          <option key={s.id} value={s.name}>
                            {s.name} ({s.jobRole})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Priority</label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="Normal">Normal</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent (Express)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewJobModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-blue-600/30"
                >
                  Save & Print Intake Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD SPARE PART MODAL */}
      {showAddPartModal && currentRepair && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-base text-white">Add Spare Part from Stock</h3>
              <button
                onClick={() => setShowAddPartModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPart} className="p-4 space-y-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  Select Product / LCD / Spare Part *
                </label>
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Choose part from inventory --</option>
                  {products
                    .filter((p) => p.active)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Stock: {p.quantity} {p.unit}) - {formatCurrency(p.sellingPrice)}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={partQuantity}
                    onChange={(e) => setPartQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Billing Treatment</label>
                  <select
                    value={isIncludedInPrice ? 'included' : 'extra'}
                    onChange={(e) => setIsIncludedInPrice(e.target.value === 'included')}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="included">Included in Quote</option>
                    <option value="extra">Charge Extra to Bill</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[11px] text-amber-300">
                Notice: Inventory stock will automatically decrease by {partQuantity} and a stock movement entry will be recorded in the ledger.
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddPartModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg"
                >
                  Add Part & Deduct Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE STATUS MODAL */}
      {showStatusModal && currentRepair && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-base text-white">Update Job Status</h3>
              <button
                onClick={() => setShowStatusModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1">New Status</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as RepairStatus)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  {REPAIR_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Status Note / Observation</label>
                <textarea
                  rows={3}
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g. Display fitted successfully. Touch test passed 100%. Ready for delivery."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateStatus}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg"
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELIVER DEVICE MODAL */}
      {showDeliveryModal && currentRepair && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">Deliver Phone to Customer</h3>
              </div>
              <button
                onClick={() => setShowDeliveryModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="p-3 bg-slate-800 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Customer:</span>
                  <span className="font-bold text-white">{currentRepair.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Device:</span>
                  <span className="font-semibold text-white">{currentRepair.brand} {currentRepair.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Repair Quote:</span>
                  <span className="font-bold text-white">{formatCurrency(currentRepair.estimatedCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Advance Paid:</span>
                  <span className="font-semibold text-emerald-400">{formatCurrency(currentRepair.advancePaid)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-700 font-bold text-sm">
                  <span className="text-red-400">Remaining Balance Due:</span>
                  <span className="text-red-400">{formatCurrency(currentRepair.remainingAmount)}</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  Payment Received at Delivery (₹)
                </label>
                <input
                  type="number"
                  value={deliveryPaymentAmount}
                  onChange={(e) => setDeliveryPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Payment Method</label>
                <select
                  value={deliveryPaymentMethod}
                  onChange={(e) => setDeliveryPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="Card">Debit / Credit Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              {currentRepair.remainingAmount - deliveryPaymentAmount > 0 && (
                <div className="p-3 bg-amber-950/40 border border-amber-800/40 rounded-lg text-amber-300 text-xs">
                  ⚠️ Note: Remaining ₹{currentRepair.remainingAmount - deliveryPaymentAmount} will be logged as Customer Due balance!
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeliveryModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeliverRepair}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md"
                >
                  Confirm Delivery & Print Bill
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINT MODAL (Intake Receipt or Final Tax Invoice) */}
      <InvoicePrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        repair={currentRepair}
        mode={printMode}
      />

      {/* WHATSAPP REMINDER MODAL */}
      {currentRepair && (
        <WhatsAppReminderModal
          isOpen={showReminderModal}
          onClose={() => setShowReminderModal(false)}
          customerName={currentRepair.customerName}
          phone={currentRepair.customerPhone}
          amount={currentRepair.remainingAmount}
          repairId={currentRepair.id}
          device={`${currentRepair.brand} ${currentRepair.model}`}
          initialType={currentRepair.status === 'Ready' ? 'repair_ready' : 'repair_received'}
        />
      )}
    </div>
  );
};
