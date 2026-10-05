import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Trash2,
  Calendar,
  X,
  CreditCard,
  PieChart
} from 'lucide-react';
import { Expense, ExpenseCategory } from '../types';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Tea/Food',
  'Tools & Equipment',
  'Electricity',
  'Rent',
  'Internet',
  'Transport',
  'Packaging',
  'Staff Salary',
  'Other'
];

interface ExpensesProps {
  initialOpenAddExpense?: boolean;
}

export const Expenses: React.FC<ExpensesProps> = ({ initialOpenAddExpense = false }) => {
  const { expenses, formatCurrency, formatDate, refreshData, showToast } = useShop();
  const { currentUser, canDeleteRecords } = useAuth();

  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState<boolean>(initialOpenAddExpense);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Tea/Food' as ExpenseCategory,
    amount: '',
    paymentMethod: 'Cash',
    description: ''
  });

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (categoryFilter !== 'All' && e.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          e.description.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          e.paymentMethod.toLowerCase().includes(q) ||
          e.addedBy.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [expenses, categoryFilter, searchQuery]);

  const totalExpenseAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      showToast('Please enter a valid expense amount', 'error');
      return;
    }

    try {
      await api.createExpense({
        ...formData,
        amount: Number(formData.amount),
        performedBy: currentUser?.name || 'Staff'
      });
      showToast(`Expense of ₹${formData.amount} logged!`, 'success');
      setShowAddModal(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        category: 'Tea/Food',
        amount: '',
        paymentMethod: 'Cash',
        description: ''
      });
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to add expense', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this expense record?')) return;
    try {
      await api.deleteExpense(id);
      showToast('Expense removed', 'success');
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete expense', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-rose-400" />
            <span>Shop Expense Management</span>
          </h1>
          <p className="text-xs text-slate-400">
            Log and audit shop operational costs (rent, tea/snacks, electricity, tools & packaging)
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center space-x-1.5 shadow-md shadow-rose-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Expense</span>
        </button>
      </div>

      {/* Filter and Category Pills */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto pb-1 scrollbar-none">
          {['All', ...EXPENSE_CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                categoryFilter === cat
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search description, staff..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>
      </div>

      {/* Expense Ledger Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-3 bg-slate-850 border-b border-slate-800 flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-300">Total Filtered Expenses:</span>
          <span className="text-base font-black text-rose-400">{formatCurrency(totalExpenseAmount)}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-850/60 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3">Payment Mode</th>
                <th className="py-2.5 px-3">Added By</th>
                {canDeleteRecords && <th className="py-2.5 px-4 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{formatDate(exp.date)}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-rose-300 border border-slate-700 font-semibold">
                      {exp.category}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-medium text-white max-w-xs">{exp.description}</td>
                  <td className="py-3 px-3 text-right font-black text-sm text-rose-400">
                    {formatCurrency(exp.amount)}
                  </td>
                  <td className="py-3 px-3 text-slate-300">{exp.paymentMethod}</td>
                  <td className="py-3 px-3 text-slate-400">{exp.addedBy}</td>
                  {canDeleteRecords && (
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="text-slate-500 hover:text-red-400 p-1"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No expense records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD EXPENSE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-4 space-y-4 text-slate-100">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">Record Shop Expense</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Expense Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Amount Spent (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="e.g. 150"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-base font-black text-rose-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Card">Card</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Description / Purpose</label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Morning tea & biscuits for customers and technicians"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow-md"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
