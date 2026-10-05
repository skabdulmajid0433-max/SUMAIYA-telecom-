import React, { useState, useMemo } from 'react';
import {
  UserCheck,
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  CreditCard,
  UserPlus,
  Phone,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { Staff, AttendanceRecord, AttendanceStatus, SalaryPayment } from '../types';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const StaffManagement: React.FC = () => {
  const {
    staff,
    attendance,
    salaryPayments,
    settings,
    formatCurrency,
    formatDate,
    refreshData,
    showToast
  } = useShop();

  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'attendance' | 'staff_list' | 'salary_history'>('attendance');

  // Attendance Date
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Attendance local form
  const [dailyStatusMap, setDailyStatusMap] = useState<{ [staffId: string]: AttendanceStatus }>({});

  // Modals
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showSalaryPaymentModal, setShowSalaryPaymentModal] = useState(false);
  const [selectedStaffForSalary, setSelectedStaffForSalary] = useState<Staff | null>(null);

  // Staff Form state
  const [staffForm, setStaffForm] = useState({
    name: '',
    phone: '',
    address: '',
    joiningDate: new Date().toISOString().split('T')[0],
    jobRole: 'Hardware Technician',
    salaryType: 'daily' as 'daily' | 'monthly',
    dailySalary: '600',
    monthlySalary: '18000',
    emergencyContact: '',
    notes: ''
  });

  // Salary Payment state
  const [salaryPeriod, setSalaryPeriod] = useState('Current Week');
  const [salaryAdvance, setSalaryAdvance] = useState(0);
  const [salaryDeduction, setSalaryDeduction] = useState(0);
  const [salaryPaidAmount, setSalaryPaidAmount] = useState(0);
  const [salaryMethod, setSalaryMethod] = useState('Cash');

  // Today's attendance records
  const dayRecords = useMemo(() => {
    return attendance.filter((a) => a.date === selectedDate);
  }, [attendance, selectedDate]);

  // Handle Bulk Attendance Save
  const handleSaveBulkAttendance = async () => {
    const records = staff
      .filter((s) => s.status === 'active' && s.id !== 'stf-1') // exclude owner from daily punch
      .map((s) => {
        const currentRec = dayRecords.find((r) => r.staffId === s.id);
        const status = dailyStatusMap[s.id] || currentRec?.status || 'Present';
        return {
          staffId: s.id,
          staffName: s.name,
          status,
          checkIn: '10:00 AM',
          checkOut: '08:00 PM',
          notes: ''
        };
      });

    try {
      await api.saveBulkAttendance({
        date: selectedDate,
        records,
        performedBy: currentUser?.name || 'Admin'
      });
      showToast(`Attendance saved for ${selectedDate}!`, 'success');
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save attendance', 'error');
    }
  };

  // Create Staff
  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.name || !staffForm.phone) {
      showToast('Name and mobile number are required', 'error');
      return;
    }
    try {
      await api.createStaff(
        {
          ...staffForm,
          dailySalary: Number(staffForm.dailySalary) || 0,
          monthlySalary: Number(staffForm.monthlySalary) || 0,
          status: 'active'
        },
        currentUser?.name || 'Admin'
      );
      showToast(`Staff member ${staffForm.name} added!`, 'success');
      setShowAddStaffModal(false);
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to add staff', 'error');
    }
  };

  // Open Salary Payment
  const openPaySalary = (s: Staff) => {
    setSelectedStaffForSalary(s);
    // Approximate week wage
    const weeklyApprox = s.salaryType === 'daily' ? s.dailySalary * 6 : s.monthlySalary / 4;
    setSalaryPaidAmount(weeklyApprox);
    setShowSalaryPaymentModal(true);
  };

  // Submit Salary Payment
  const handlePaySalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffForSalary) return;

    try {
      const net = salaryPaidAmount - salaryAdvance - salaryDeduction;
      await api.createSalaryPayment({
        staffId: selectedStaffForSalary.id,
        staffName: selectedStaffForSalary.name,
        period: salaryPeriod,
        totalEarned: salaryPaidAmount,
        advance: salaryAdvance,
        deduction: salaryDeduction,
        netSalary: net,
        paidAmount: salaryPaidAmount,
        remainingAmount: 0,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: salaryMethod,
        status: 'Paid',
        notes: `Salary settled for ${salaryPeriod}`,
        performedBy: currentUser?.name || 'Admin'
      });
      showToast(`Salary payment recorded for ${selectedStaffForSalary.name}!`, 'success');
      setShowSalaryPaymentModal(false);
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to record salary payment', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-indigo-400" />
            <span>Staff & Attendance Management</span>
          </h1>
          <p className="text-xs text-slate-400">
            Technicians, sales staff, daily attendance register & daily salary calculations
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAddStaffModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center space-x-1.5 shadow-md shadow-indigo-600/30 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add Staff Member</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        {[
          { id: 'attendance', label: 'Daily Attendance Register' },
          { id: 'staff_list', label: 'Staff Directory' },
          { id: 'salary_history', label: 'Salary Payments' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: DAILY ATTENDANCE REGISTER */}
      {activeTab === 'attendance' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-slate-300">Attendance Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-white focus:outline-none"
              />
            </div>

            <button
              onClick={handleSaveBulkAttendance}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save & Calculate Daily Wages</span>
            </button>
          </div>

          {/* Attendance Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-850 text-slate-400 uppercase text-[10px]">
                  <th className="py-2.5 px-3">Staff Member</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Salary Basis</th>
                  <th className="py-2.5 px-3 text-center">Attendance Status</th>
                  <th className="py-2.5 px-3 text-right">Daily Wage Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {staff
                  .filter((s) => s.status === 'active' && s.id !== 'stf-1')
                  .map((s) => {
                    const existingRec = dayRecords.find((r) => r.staffId === s.id);
                    const currentStatus: AttendanceStatus =
                      dailyStatusMap[s.id] || existingRec?.status || 'Present';

                    const dailyWage =
                      s.dailySalary || (s.monthlySalary ? Math.round(s.monthlySalary / 30) : 0);

                    let earned = 0;
                    if (currentStatus === 'Present') earned = dailyWage;
                    else if (currentStatus === 'Half Day') earned = Math.round(dailyWage * 0.5);
                    else if (currentStatus === 'Paid Leave') earned = dailyWage;
                    else earned = 0;

                    return (
                      <tr key={s.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-3">
                          <div className="font-bold text-white">{s.name}</div>
                          <div className="text-[10px] text-slate-400">{s.phone}</div>
                        </td>

                        <td className="py-3 px-3 text-slate-300 font-medium">{s.jobRole}</td>

                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-200">
                            {formatCurrency(dailyWage)} / day
                          </span>
                          <span className="block text-[10px] text-slate-500 uppercase">{s.salaryType}</span>
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center justify-center space-x-1.5">
                            {(['Present', 'Half Day', 'Absent', 'Paid Leave'] as AttendanceStatus[]).map(
                              (statusOpt) => {
                                const isSelected = currentStatus === statusOpt;
                                let btnColor = 'bg-slate-800 text-slate-400 hover:text-white';
                                if (isSelected) {
                                  if (statusOpt === 'Present') btnColor = 'bg-emerald-600 text-white font-bold';
                                  else if (statusOpt === 'Half Day') btnColor = 'bg-amber-600 text-white font-bold';
                                  else if (statusOpt === 'Paid Leave') btnColor = 'bg-blue-600 text-white font-bold';
                                  else btnColor = 'bg-red-600 text-white font-bold';
                                }

                                return (
                                  <button
                                    key={statusOpt}
                                    type="button"
                                    onClick={() =>
                                      setDailyStatusMap((prev) => ({
                                        ...prev,
                                        [s.id]: statusOpt
                                      }))
                                    }
                                    className={`px-2.5 py-1 text-[11px] rounded-lg transition ${btnColor}`}
                                  >
                                    {statusOpt}
                                  </button>
                                );
                              }
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right font-black text-sm text-emerald-400">
                          {formatCurrency(earned)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: STAFF LIST */}
      {activeTab === 'staff_list' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((s) => (
            <div
              key={s.id}
              className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between space-y-3 shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono">
                    {s.id}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      s.status === 'active' ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
                <h3 className="font-bold text-base text-white mt-2">{s.name}</h3>
                <p className="text-xs text-indigo-300 font-semibold">{s.jobRole}</p>
                <p className="text-xs text-slate-400 mt-1 flex items-center">
                  <Phone className="w-3.5 h-3.5 mr-1" /> {s.phone}
                </p>
                {s.address && <p className="text-[11px] text-slate-500 mt-0.5">{s.address}</p>}
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">Compensation:</span>
                  <span className="font-black text-white">
                    {s.salaryType === 'daily'
                      ? `${formatCurrency(s.dailySalary)} / day`
                      : `${formatCurrency(s.monthlySalary)} / month`}
                  </span>
                </div>

                {s.id !== 'stf-1' && (
                  <button
                    onClick={() => openPaySalary(s)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm"
                  >
                    Pay Wages
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: SALARY PAYMENTS HISTORY */}
      {activeTab === 'salary_history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-850 text-slate-400 uppercase text-[10px]">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-3">Staff Member</th>
                  <th className="py-3 px-3">Salary Period</th>
                  <th className="py-3 px-3 text-right">Amount Paid</th>
                  <th className="py-3 px-3">Payment Mode</th>
                  <th className="py-3 px-4">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {salaryPayments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 px-4 text-slate-400">{formatDate(p.paymentDate)}</td>
                    <td className="py-3 px-3 font-bold text-white">{p.staffName}</td>
                    <td className="py-3 px-3 text-slate-300">{p.period}</td>
                    <td className="py-3 px-3 text-right font-black text-emerald-400">
                      {formatCurrency(p.paidAmount)}
                    </td>
                    <td className="py-3 px-3 text-slate-400">{p.paymentMethod}</td>
                    <td className="py-3 px-4 text-slate-500">{p.createdBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD STAFF MODAL */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-4 space-y-3 text-slate-100">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">Add Staff / Technician Member</h3>
              <button onClick={() => setShowAddStaffModal(false)} className="p-1 text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  placeholder="e.g. Tapas Das"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                  placeholder="10-digit mobile"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Job Role / Designation</label>
                <input
                  type="text"
                  value={staffForm.jobRole}
                  onChange={(e) => setStaffForm({ ...staffForm, jobRole: e.target.value })}
                  placeholder="e.g. Display & Micro-soldering Tech"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Salary Type</label>
                  <select
                    value={staffForm.salaryType}
                    onChange={(e) => setStaffForm({ ...staffForm, salaryType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  >
                    <option value="daily">Daily Wages</option>
                    <option value="monthly">Monthly Fixed</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">
                    {staffForm.salaryType === 'daily' ? 'Daily Wage (₹)' : 'Monthly Salary (₹)'}
                  </label>
                  <input
                    type="number"
                    value={staffForm.salaryType === 'daily' ? staffForm.dailySalary : staffForm.monthlySalary}
                    onChange={(e) => {
                      if (staffForm.salaryType === 'daily') setStaffForm({ ...staffForm, dailySalary: e.target.value });
                      else setStaffForm({ ...staffForm, monthlySalary: e.target.value });
                    }}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md"
                >
                  Save Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAY SALARY MODAL */}
      {showSalaryPaymentModal && selectedStaffForSalary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-4 space-y-3 text-slate-100">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">Record Wage / Salary Payment</h3>
              <button onClick={() => setShowSalaryPaymentModal(false)} className="p-1 text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handlePaySalary} className="space-y-3">
              <div className="p-2.5 bg-slate-800 rounded-lg text-xs">
                <span className="text-slate-400 block">Paying to:</span>
                <span className="font-bold text-white text-sm">{selectedStaffForSalary.name}</span>
                <span className="text-indigo-300 block">{selectedStaffForSalary.jobRole}</span>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Salary Period / Description</label>
                <input
                  type="text"
                  value={salaryPeriod}
                  onChange={(e) => setSalaryPeriod(e.target.value)}
                  placeholder="e.g. October Week 1 / Monthly Wage"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Amount Paid (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={salaryPaidAmount}
                  onChange={(e) => setSalaryPaidAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm font-bold text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Payment Method</label>
                <select
                  value={salaryMethod}
                  onChange={(e) => setSalaryMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI / PhonePe / GPay</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowSalaryPaymentModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md"
                >
                  Disburse & Log Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
