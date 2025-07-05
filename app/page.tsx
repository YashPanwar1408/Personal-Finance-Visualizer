"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { PieChart, Pie, Cell } from "recharts";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface Transaction {
  _id?: string;
  amount: number;
  date: string;
  description: string;
  category: string;
}

const CATEGORIES = ["Food", "Transport", "Shopping", "Bills", "Other"];
const CATEGORY_COLORS = ["#6366f1", "#f59e42", "#10b981", "#ef4444", "#a855f7"];

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [form, setForm] = useState({ amount: "", date: "", description: "", category: CATEGORIES[0] });
  const [editForm, setEditForm] = useState({ amount: "", date: "", description: "", category: CATEGORIES[0] });
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Fetch transactions
  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    try {
      const res = await fetch("/api/transactions");
      const data = await res.json();
      // Ensure all transactions have a category field
      const normalizedData = data.map((t: Transaction) => ({
        ...t,
        category: t.category || CATEGORIES[0], // Default to first category if undefined
      }));
      setTransactions(normalizedData);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setError("Failed to fetch transactions");
    }
  }

  // Handle form input
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleEditChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  }

  // Handle category change for main form
  function handleCategoryChange(value: string) {
    setForm({ ...form, category: value });
  }

  // Handle category change for edit form
  function handleEditCategoryChange(value: string) {
    setEditForm({ ...editForm, category: value });
  }

  // Add transaction
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const category = form.category || "Other";
    if (!form.amount || !form.date || !form.description || !category) {
      setError("All fields are required.");
      return;
    }
    setError("");
    setLoading(true);
    
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(form.amount),
          date: form.date,
          description: form.description,
          category,
        }),
      });
      
      if (!res.ok) {
        throw new Error("Failed to add transaction");
      }
      
      setForm({ amount: "", date: "", description: "", category: CATEGORIES[0] });
      fetchTransactions();
    } catch (error) {
      console.error("Error adding transaction:", error);
      setError("Failed to add transaction.");
    } finally {
      setLoading(false);
    }
  }

  // Delete transaction
  async function handleDelete(id: string | undefined) {
    if (!id) return;
    
    try {
      const res = await fetch("/api/transactions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      
      if (!res.ok) {
        throw new Error("Failed to delete transaction");
      }
      
      fetchTransactions();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      setError("Failed to delete transaction.");
    }
  }

  // Group transactions by month for the bar chart
  function getMonthlyData() {
    const map: { [month: string]: number } = {};
    transactions.forEach((t) => {
      const month = t.date.slice(0, 7); // YYYY-MM
      map[month] = (map[month] || 0) + t.amount;
    });
    // Sort by month ascending
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({ month, total }));
  }

  // Helper to get color for a category
  function getCategoryColor(category: string) {
    const idx = CATEGORIES.indexOf(category);
    return CATEGORY_COLORS[idx >= 0 ? idx : 0]; // Default to first color if category not found
  }

  // Group transactions by category for the pie chart
  function getCategoryData() {
    const map: { [cat: string]: number } = {};
    transactions.forEach((t) => {
      const cat = t.category || CATEGORIES[0]; // Fallback to first category
      map[cat] = (map[cat] || 0) + t.amount;
    });
    return Object.entries(map).map(([category, value]) => ({ category, value }));
  }

  function startEdit(transaction: Transaction) {
    setEditingTransactionId(transaction._id || null);
    setEditDialogOpen(true);
    setEditForm({
      amount: transaction.amount.toString(),
      date: transaction.date,
      description: transaction.description,
      category: transaction.category || "Other",
    });
  }

  async function handleEditSave(id: string | undefined) {
    if (!id) return;
    const category = editForm.category || "Other";
    if (!editForm.amount || !editForm.date || !editForm.description || !category) {
      setError("All fields are required.");
      return;
    }
    
    setError("");
    setLoading(true);
    
    try {
      const res = await fetch("/api/transactions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          amount: Number(editForm.amount),
          date: editForm.date,
          description: editForm.description,
          category,
        }),
      });
      
      if (!res.ok) {
        throw new Error("Failed to update transaction");
      }
      
      setEditDialogOpen(false);
      setEditingTransactionId(null);
      fetchTransactions();
    } catch (error) {
      console.error("Error updating transaction:", error);
      setError("Failed to update transaction.");
    } finally {
      setLoading(false);
    }
  }

  function handleEditCancel() {
    setEditDialogOpen(false);
    setEditingTransactionId(null);
    setError("");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800 font-sans px-4">
      <div className="flex items-center justify-between max-w-3xl mx-auto pt-8 pb-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-indigo-700 dark:text-indigo-300 drop-shadow">Personal Finance Visualizer</h1>
        <ThemeToggle />
      </div>
      
      {/* Dashboard Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10 max-w-3xl mx-auto">
        {/* Total Expenses Card */}
        <Card className="shadow-lg border-0 bg-white/90 dark:bg-zinc-900/80">
          <div className="p-6 text-center">
            <div className="text-sm text-gray-500 mb-1">Total Expenses</div>
            <div className="text-3xl font-extrabold text-indigo-700">₹{transactions.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}</div>
          </div>
        </Card>
        
        {/* Top Category Card */}
        <Card className="shadow-lg border-0 bg-white/90 dark:bg-zinc-900/80">
          <div className="p-6 text-center">
            <div className="text-sm text-gray-500 mb-1">Top Category</div>
            <div className="text-lg font-semibold">
              {(() => {
                if (transactions.length === 0) return "-";
                const catTotals: { [cat: string]: number } = {};
                transactions.forEach((t) => {
                  const cat = t.category || CATEGORIES[0];
                  catTotals[cat] = (catTotals[cat] || 0) + t.amount;
                });
                const top = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];
                return top ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-full" style={{ background: getCategoryColor(top[0]) }}></span>
                    <span>{top[0]}</span> (₹{top[1].toFixed(2)})
                  </span>
                ) : "-";
              })()}
            </div>
          </div>
        </Card>
        
        {/* Most Recent Transaction Card */}
        <Card className="shadow-lg border-0 bg-white/90 dark:bg-zinc-900/80">
          <div className="p-6 text-center">
            <div className="text-sm text-gray-500 mb-1">Most Recent</div>
            {transactions.length === 0 ? (
              <div className="text-lg font-semibold">-</div>
            ) : (
              (() => {
                const recent = [...transactions].sort((a, b) => b.date.localeCompare(a.date))[0];
                const cat = recent.category || CATEGORIES[0];
                return (
                  <div>
                    <div className="font-semibold text-indigo-700">₹{recent.amount.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">{recent.date} &mdash; {recent.description}</div>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full mt-1" style={{ background: getCategoryColor(cat), color: 'white' }}>{cat}</span>
                  </div>
                );
              })()
            )}
          </div>
        </Card>
      </div>
      
      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 max-w-3xl mx-auto">
        {/* Monthly Expenses Bar Chart */}
        <Card className="shadow-md border-0 bg-white/90 dark:bg-zinc-900/80 hover:shadow-xl transition-shadow">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-2 text-indigo-700">Monthly Expenses</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={getMonthlyData()} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
                <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        {/* Category-wise Pie Chart */}
        <Card className="shadow-md border-0 bg-white/90 dark:bg-zinc-900/80 hover:shadow-xl transition-shadow">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-2 text-indigo-700">Spending by Category</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={getCategoryData()}
                  dataKey="value"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ category }) => category}
                >
                  {getCategoryData().map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      
      {/* Transaction Form */}
      <form onSubmit={handleSubmit} className="space-y-4 bg-white/90 dark:bg-zinc-900/80 p-6 rounded shadow mb-10 border-0 max-w-3xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium text-indigo-700">Amount</label>
            <Input
              name="amount"
              type="number"
              value={form.amount}
              onChange={handleChange}
              placeholder="Enter amount"
              min="0"
              step="0.01"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-indigo-700">Date</label>
            <Input
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-indigo-700">Description</label>
            <Input
              name="description"
              type="text"
              value={form.description}
              onChange={handleChange}
              placeholder="Enter description"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-indigo-700">Category</label>
            <Select value={form.category} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-full border rounded px-2 py-2 bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Adding..." : "Add Transaction"}
        </Button>
      </form>
      
      {/* Transaction List */}
      <div className="mt-10 max-w-3xl mx-auto mb-1">
        <h2 className="text-xl font-semibold mb-4 text-indigo-700">Transactions</h2>
        {transactions.length === 0 ? (
          <div className="text-gray-500">No transactions yet.</div>
        ) : (
          <ul className="space-y-2">
            {transactions.map((t) => {
              const cat = t.category || CATEGORIES[0];
              return (
                <li key={t._id} className="flex items-center justify-between bg-white/90 dark:bg-zinc-900/80 p-4 rounded shadow-sm hover:shadow-md transition-shadow border-0">
                  <div className="flex flex-col gap-1">
                    <div className="font-medium text-lg text-indigo-700">₹{t.amount.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">{t.date} &mdash; {t.description}</div>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full mt-1" style={{ background: getCategoryColor(cat), color: 'white' }}>{cat}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-indigo-600 text-indigo-700 hover:bg-indigo-50" 
                      onClick={() => startEdit(t)}
                    >
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(t._id)}>
                      Delete
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleEditSave(editingTransactionId || undefined); }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-medium text-indigo-700">Amount</label>
                <Input
                  name="amount"
                  type="number"
                  value={editForm.amount}
                  onChange={handleEditChange}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium text-indigo-700">Date</label>
                <Input
                  name="date"
                  type="date"
                  value={editForm.date}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium text-indigo-700">Description</label>
                <Input
                  name="description"
                  type="text"
                  value={editForm.description}
                  onChange={handleEditChange}
                  placeholder="Enter description"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium text-indigo-700">Category</label>
                <Select value={editForm.category} onValueChange={handleEditCategoryChange}>
                  <SelectTrigger className="w-full border rounded px-2 py-2 bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <DialogFooter className="gap-2">
              <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={handleEditCancel}>
                Cancel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}