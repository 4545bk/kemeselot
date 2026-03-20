'use client';

import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:4000';

interface ReceiptUser {
  name: string;
  phone?: string;
  email?: string;
}

interface Receipt {
  _id: string;
  userId: string;
  imageUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  user?: ReceiptUser;
}

interface User {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  isPremium: boolean;
  googleId?: string;
  createdAt: string;
}

type Tab = 'receipts' | 'users';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('receipts');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin@kemeselot.com' && password === 'admin123') {
      setIsAuthenticated(true);
    } else {
      alert('Invalid credentials');
    }
  };

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/admin/receipts`);
      setReceipts(await res.json());
    } catch (error) {
      console.error('Failed to fetch receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/admin/users`);
      setUsers(await res.json());
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchReceipts();
      fetchUsers();
    }
  }, [isAuthenticated]);

  const handleApprove = async (id: string) => {
    if (!confirm('Approve this receipt?')) return;
    await fetch(`${API_URL}/api/admin/approve/${id}`, { method: 'POST' });
    setReceipts(prev => prev.map(r => r._id === id ? { ...r, status: 'approved' } : r));
    if (selectedReceipt?._id === id) setSelectedReceipt({ ...selectedReceipt, status: 'approved' });
    fetchUsers(); // Refresh user premium status
  };

  const handleReject = async (id: string) => {
    if (!confirm('Reject this receipt?')) return;
    await fetch(`${API_URL}/api/admin/reject/${id}`, { method: 'POST' });
    setReceipts(prev => prev.map(r => r._id === id ? { ...r, status: 'rejected' } : r));
    if (selectedReceipt?._id === id) setSelectedReceipt({ ...selectedReceipt, status: 'rejected' });
  };

  const badge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${colors[status] || ''}`}>{status}</span>;
  };

  // ============== LOGIN ==============
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <form onSubmit={handleLogin} className="p-8 bg-white rounded-xl shadow-lg w-full max-w-md border border-slate-100">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-amber-100 rounded-full text-amber-600 text-3xl">✝️</div>
          </div>
          <h1 className="text-2xl font-bold text-center text-slate-800 mb-8">Kemeselot Admin</h1>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="admin@kemeselot.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="••••••••" required />
            </div>
            <button type="submit" className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors mt-6">
              Sign In
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ============== DASHBOARD ==============
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-600 font-bold text-xl">✝️ Kemeselot Admin</div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">{users.length} users · {receipts.length} receipts</span>
            <button onClick={() => setIsAuthenticated(false)} className="text-sm font-medium text-slate-500 hover:text-slate-800">Sign Out</button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl w-full mx-auto px-6 pt-6">
        <div className="flex gap-1 bg-slate-200 rounded-lg p-1 w-fit">
          <button 
            onClick={() => setActiveTab('receipts')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'receipts' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}>
            🧾 Receipts ({receipts.length})
          </button>
          <button 
            onClick={() => { setActiveTab('users'); fetchUsers(); }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}>
            👥 Users ({users.length})
          </button>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 flex gap-6">
        
        {/* ============= RECEIPTS TAB ============= */}
        {activeTab === 'receipts' && (
          <>
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-800">Payment Receipts</h2>
                <button onClick={fetchReceipts} className="text-sm text-amber-600 hover:text-amber-700 font-medium">Refresh</button>
              </div>
              {loading ? (
                <div className="p-12 text-center text-slate-500">Loading...</div>
              ) : receipts.length === 0 ? (
                <div className="p-12 text-center text-slate-400">No receipts yet</div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-medium border-b">
                    <tr>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">User</th>
                      <th className="px-6 py-3">Phone</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {receipts.map(r => (
                      <tr key={r._id} className={`hover:bg-slate-50 ${selectedReceipt?._id === r._id ? 'bg-amber-50/50' : ''}`}>
                        <td className="px-6 py-3 whitespace-nowrap text-slate-600">{new Date(r.createdAt).toLocaleString()}</td>
                        <td className="px-6 py-3 font-medium text-slate-800">{r.user?.name || 'Unknown'}</td>
                        <td className="px-6 py-3 text-slate-500">{r.user?.phone || r.user?.email || 'N/A'}</td>
                        <td className="px-6 py-3">{badge(r.status)}</td>
                        <td className="px-6 py-3 text-right">
                          <button onClick={() => setSelectedReceipt(r)} className="text-amber-600 hover:text-amber-800 font-medium px-3 py-1 rounded hover:bg-amber-50">
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Detail Sidebar */}
            <div className="w-[380px] flex-shrink-0">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 sticky top-24 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="font-semibold text-slate-800">Receipt Details</h2>
                </div>
                {selectedReceipt ? (
                  <div className="p-6">
                    <div className="mb-4">
                      <p className="text-xs text-slate-400 mb-1">User</p>
                      <p className="font-medium">{selectedReceipt.user?.name || 'Unknown'}</p>
                      <p className="text-sm text-slate-500">{selectedReceipt.user?.phone || selectedReceipt.user?.email || 'N/A'}</p>
                    </div>
                    <div className="mb-4">{badge(selectedReceipt.status)}</div>
                    <div className="mb-4 rounded-lg overflow-hidden border bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={selectedReceipt.imageUrl} alt="Receipt" className="w-full h-auto max-h-[400px] object-contain" />
                    </div>
                    {selectedReceipt.status === 'pending' && (
                      <div className="flex gap-3">
                        <button onClick={() => handleApprove(selectedReceipt._id)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-medium">
                          ✅ Approve
                        </button>
                        <button onClick={() => handleReject(selectedReceipt._id)}
                          className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-2.5 rounded-lg font-medium">
                          ❌ Reject
                        </button>
                      </div>
                    )}
                    {selectedReceipt.status !== 'pending' && (
                      <div className={`w-full py-3 rounded-lg text-center font-medium border ${
                        selectedReceipt.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {selectedReceipt.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-300">
                    <p className="text-4xl mb-4">🧾</p>
                    <p>Select a receipt to view</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ============= USERS TAB ============= */}
        {activeTab === 'users' && (
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800">Registered Users</h2>
              <button onClick={fetchUsers} className="text-sm text-amber-600 hover:text-amber-700 font-medium">Refresh</button>
            </div>
            {loading ? (
              <div className="p-12 text-center text-slate-500">Loading...</div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center text-slate-400">No users yet</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b">
                  <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Phone</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Auth Method</th>
                    <th className="px-6 py-3">Premium</th>
                    <th className="px-6 py-3">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(u => (
                    <tr key={u._id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-medium text-slate-800">{u.name}</td>
                      <td className="px-6 py-3 text-slate-600">{u.phone || '—'}</td>
                      <td className="px-6 py-3 text-slate-600">{u.email || '—'}</td>
                      <td className="px-6 py-3">
                        {u.googleId ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Google</span>
                        ) : (
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">Phone</span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        {u.isPremium ? (
                          <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">⭐ Premium</span>
                        ) : (
                          <span className="text-slate-400 text-xs">Free</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-slate-500 whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
