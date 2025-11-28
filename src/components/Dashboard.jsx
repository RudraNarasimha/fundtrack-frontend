import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSignInAlt, FaSignOutAlt, FaChartPie, FaUsers, FaHandHoldingUsd } from "react-icons/fa";
import { FaSackDollar } from "react-icons/fa6";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell,
  ResponsiveContainer, Legend
} from 'recharts';

import Members from './Members';
import Contributions from './Contributions';
import Loans from './Loans';
import Footer from './Footer';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Small utility for month names
const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const COLORS = ['#2b8aef','#2ecc71','#f39c12','#e74c3c','#9b59b6'];

export default function Dashboard() {
  const navigate = useNavigate();
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [method, setMethod] = useState('All');
  const [status, setStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({
    targetPerHead: 0,
    monthlyTarget: 0,
    totalCollected: 0,
    pendingBalance: 0,
    extraContributions: 0
  });
  const [chartData, setChartData] = useState({ monthly: [], methods: [] });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [viewMode, setViewMode] = useState('Single');

  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('adminToken'));

  const [loansData, setLoansData] = useState([]);

useEffect(() => {
  fetchLoansOverview();
}, []);

async function fetchLoansOverview() {
  try {
    const res = await fetch(`${API}/loan`); // same API
    const json = await res.json();
    setLoansData(json.data || []);
  } catch (err) {
    console.error(err);
  }
}
  
  useEffect(() => {
    fetchAll();
    fetchCharts();
  }, [month, year, method, status, search, viewMode]);

  async function fetchAll() {
    setLoading(true);
    try {
      const q = new URLSearchParams({ month, year, method, status, search });
      const res = await fetch(`${API}/contributions?${q.toString()}`);
      const json = await res.json();
      setRows(json.data || []);

      const sres = await fetch(`${API}/summary?month=${month}&year=${year}`);
      const sjson = await sres.json();
      setSummary(sjson);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCharts() {
    try {
      const url = new URL(`${API}/charts`);
      url.searchParams.append('year', year);
      if (viewMode === 'Single') {
        url.searchParams.append('month', month);
      }
      const res = await fetch(url.toString());
      const json = await res.json();

      const months = new Array(12).fill(0).map((_, i) => ({
        month: monthNames[i],
        monthIndex: i + 1,
        total: 0,
        target: 0,
        extra: 0,
        balance: 0
      }));

      (json.monthly || []).forEach(m => {
        const idx = (m._id || 1) - 1;
        if (months[idx]) {
          months[idx].total = m.total || 0;
          months[idx].target = m.target || 0;
          months[idx].extra = Math.max(0, (m.total || 0) - (m.target || 0));
          months[idx].balance = Math.max(0, (m.target || 0) - ((m.total || 0) - months[idx].extra));
        }
      });

      const pie = (json.methods || []).map(m => ({
        name: m._id,
        value: m.total
      }));

      setChartData({ monthly: months, methods: pie });
    } catch (err) {
      console.error(err);
    }
  }

  async function exportCSV() {
    try {
      const q = new URLSearchParams({ month, year });
      const res = await fetch(`${API}/export?${q.toString()}`);
      if (!res.ok) {
        const text = await res.text();
        console.error('CSV fetch error:', text);
        throw new Error('Failed to fetch CSV');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contributions_${month}_${year}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to export CSV');
    }
  }

  function handleLoginLogout() {
    if (isLoggedIn) {
      localStorage.removeItem('adminToken');
      setIsLoggedIn(false);
      setActiveTab('Dashboard');
    } else {
      navigate('/admin-login');
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 space-y-4 md:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-5xl text-white">₹</span>
          </div>
          <div>
            <div className="font-semibold text-xl text-gray-900">Sri Bala Ganesh Sevadal</div>
            <div className="text-sm text-gray-500">Fund Tracking System</div>
          </div>
        </div>

        {/* Top Navbar + Admin Login container */}
        <div className="flex items-center justify-between space-x-4 mb-4 max-w-4xl">
          {/* Top Navbar */}
          <div className="flex space-x-4">
            {[
              { name: 'Dashboard', icon: <FaChartPie className="inline-block mr-2 text-lg" /> },
              { name: 'Loans Overview', icon: <FaSackDollar className="inline-block mr-2 text-lg" /> },
              ...(isLoggedIn ? [
                { name: 'Members', icon: <FaUsers className="inline-block mr-2 text-lg" /> },
                { name: 'Contributions', icon: <FaHandHoldingUsd className="inline-block mr-2 text-lg" /> },
                { name: 'Loans', icon: <FaSackDollar className="inline-block mr-2 text-lg" /> }
              ] : [])
            ].map(tab => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`flex items-center px-5 py-2 rounded-md font-medium transition-colors duration-200 ${
                  activeTab === tab.name
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                aria-current={activeTab === tab.name ? 'page' : undefined}
              >
                {tab.icon}
                <span>{tab.name}</span>
              </button>
            ))}
          </div>

          {/* Admin Login / Logout */}
          <div>
            <button onClick={handleLoginLogout}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md font-semibold shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center space-x-2"
            >
              {isLoggedIn ? <FaSignOutAlt className="w-4 h-4" /> : <FaSignInAlt className="w-4 h-4" />}
              <span>{isLoggedIn ? 'Logout' : 'Admin'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Page Title */}
      <h1 className="text-3xl font-extrabold text-gray-900 mb-1">{activeTab}</h1>
      <p className="text-sm text-gray-600 mb-6 tracking-wide">Sri Bala Ganesh Youth Sevadal</p>

      {/* Dashboard Tab */}
      {activeTab === 'Dashboard' && (
        <>
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <label className="text-sm text-gray-600">View Mode</label>
                <select
                  className="border rounded px-2 py-1"
                  value={viewMode}
                  onChange={e => setViewMode(e.target.value)}
                >
                  <option value="Single">Single Month View</option>
                  <option value="All">All Months Summary</option>
                </select>
              </div>

              <div className="flex items-center space-x-3">
                <label className="text-sm text-gray-600">Month</label>
                <select
                  value={month}
                  onChange={e => setMonth(Number(e.target.value))}
                  className="border rounded px-2 py-1"
                  disabled={viewMode === 'All'}
                >
                  {monthNames.map((m, i) => (<option key={i} value={i + 1}>{m}</option>))}
                </select>

                <label className="text-sm text-gray-600">Year</label>
                <select
                  value={year}
                  onChange={e => setYear(Number(e.target.value))}
                  className="border rounded px-2 py-1"
                >
                  {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              <div className="flex justify-end items-center space-x-2">
                <button onClick={exportCSV} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center space-x-2">
                  ⬇ Export CSV
                </button>
              </div>
            </div>

            {viewMode === 'Single' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <label className="text-sm text-gray-600">Payment Method</label>
                  <select value={method} onChange={e => setMethod(e.target.value)} className="w-full border rounded px-2 py-1">
                    <option>All</option>
                    <option>Cash</option>
                    <option>UPI</option>
                    <option>Banking</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value)} className="w-full border rounded px-2 py-1">
                    <option>All</option>
                    <option>Paid</option>
                    <option>Partial</option>
                    <option>Pending</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600">Search Member</label>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-full border rounded px-2 py-1" />
                </div>
              </div>
            )}
          </div>

          {/* Single Month View */}
          {viewMode === 'Single' && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-white p-4 rounded shadow flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Target per Head</div>
                    <div className="text-2xl font-bold">₹{summary.targetPerHead || 0}</div>
                  </div>
                  <div className="text-blue-600 text-2xl">💠</div>
                </div>
                <div className="bg-white p-4 rounded shadow flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Monthly Target</div>
                    <div className="text-2xl font-bold">₹{summary.monthlyTarget || 0}</div>
                  </div>
                  <div className="text-blue-600 text-2xl">👥</div>
                </div>
                <div className="bg-white p-4 rounded shadow flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Total Collected</div>
                    <div className="text-2xl font-bold">₹{summary.totalCollected || 0}</div>
                  </div>
                  <div className="text-green-600 text-2xl">📈</div>
                </div>
                <div className="bg-white p-4 rounded shadow flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Pending Balance</div>
                    <div className="text-2xl font-bold">₹{Math.max(0, (summary.monthlyTarget - summary.totalCollected) || 0)}</div>
                  </div>
                  <div className="text-red-600 text-2xl">📉</div>
                </div>
                <div className="bg-white p-4 rounded shadow flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Extra Amount</div>
                    <div className="text-2xl font-bold">₹{Math.max(0, (summary.totalCollected - summary.monthlyTarget) || 0)}</div>
                  </div>
                  <div className="text-red-600 text-2xl">💹</div>
                </div>
              </div>

              {/* Extra Contributions */}
              <div className="bg-green-50 border border-green-100 p-3 rounded mb-6">
                <strong>Extra Contributions:</strong> ₹{summary.extraContributions || 0}
              </div>

              {/* Table */}
              <div className="bg-white rounded shadow overflow-hidden mb-6">
                <div className="p-4 border-b">
                  <h3 className="font-bold">Contributions - {monthNames[month-1]} {year}</h3>
                </div>
                <div className="p-4">
                  {loading ? <div>Loading...</div> : (
                    <table className="min-w-full">
                      <thead className="text-left text-sm text-gray-500">
                        <tr>
                          <th className="py-2">Member Name</th>
                          <th className="py-2">Target</th>
                          <th className="py-2">Amount Paid</th>
                          <th className="py-2">Method</th>
                          <th className="py-2">Status</th>
                          <th className="py-2">Balance</th>
                          <th className="py-2">Extra</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="py-3">{r.memberName}</td>
                            <td className="py-3">₹{r.target}</td>
                            <td className="py-3">₹{r.amountPaid}</td>
                            <td className="py-3">{r.method}</td>
                            <td className="py-3">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                r.status==='Paid'
                                  ? 'bg-green-50 text-green-600'
                                  : 'bg-yellow-50 text-yellow-700'
                              }`}>
                                {r.status}
                              </span>
                            </td>
                 <td className="py-3">
  ₹{Math.max(0, Number(r.target) - Number(r.amountPaid)).toLocaleString()}
</td>
<td className="py-3">
  {Number(r.amountPaid) > Number(r.target)
    ? `₹${(Number(r.amountPaid) - Number(r.target)).toLocaleString()}`
    : '-'}
</td>
                          </tr>
                        ))}
                        {rows.length===0 && <tr><td className="py-8 text-center" colSpan="7">No data</td></tr>}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>


{/* Charts */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div className="bg-white p-4 rounded shadow">
    <h4 className="font-semibold mb-4">
      Monthly Overview {month >= 1 && month <= 12 ? `- ${monthNames[month - 1]}` : '(Full Year)'}
    </h4>
    <div style={{ height: 260 }}>
  <ResponsiveContainer width="100%" height="100%">
    <BarChart
      data={month >= 1 && month <= 12 
        ? chartData.monthly.filter(m => m.monthIndex === month) 
        : chartData.monthly.map(m => ({
            ...m,
            balance: Math.max(0, (m.target || 0) - ((m.total || 0) - (m.extra || 0))) // Pending = Target - (Collected - Extra)
          }))
      }
    >
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
      <Legend />

      <Bar dataKey="target" name="Target" fill="#9b59b6" barSize={20} />
      <Bar dataKey="total" name="Collected" fill="#2ecc71" barSize={20} />
      <Bar dataKey="extra" name="Extra" fill="#f39c12" barSize={20} />
      <Bar dataKey="balance" name="Balance" fill="#e74c3c" barSize={20} />
    </BarChart>
  </ResponsiveContainer>
</div>
  </div>

<PieChart>
  <Legend />
  <Pie
    data={chartData.methods}
    dataKey="value"
    nameKey="name"
    cx="50%"
    cy="50%"
    outerRadius={80}
    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
  >
    {chartData.methods.map((entry, index) => (
      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
    ))}
  </Pie>
  <Tooltip />
</PieChart>


                <div className="bg-white p-4 rounded shadow">
                  <h4 className="font-semibold mb-4">Payment Methods</h4>
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Legend />
                        <Pie
                          data={chartData.methods}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                        >
                          {chartData.methods.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}
          

          {/* ============================= */}
          {/* All Months Summary View */}
          {/* ============================= */}
          {viewMode === 'All' && (
            <>
              <div className="bg-white rounded shadow p-4 mt-6 overflow-x-auto">
                <h3 className="font-bold mb-4">Month-wise Summary Matrix - {year}</h3>
                <table className="min-w-full border text-sm text-right">
                  <thead className="bg-gray-50 text-gray-700">
                    <tr>
                      <th className="py-2 px-3 text-left">Metric</th>
                      {chartData.monthly.map((m, idx) => (
                        <th key={idx} className="py-2 px-3">{m.month}</th>
                      ))}
                      <th className="py-2 px-3 font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
  {['target', 'total', 'pending', 'extra'].map((metric, i) => {
    const labelMap = {
      target: 'Target',
      total: 'Collected',
      pending: 'Pending',
      extra: 'Extra'
    };
    const rowValues = chartData.monthly.map(m => {
      if (metric === 'pending') {
        const collectedWithoutExtra = (m.total || 0) - (m.extra || 0);
        const pending = (m.target || 0) - collectedWithoutExtra;
        return pending > 0 ? pending : 0;
      }
      return m[metric] || 0;
    });
    const totalSum = rowValues.reduce((a, b) => a + b, 0);
    return (
      <tr key={i} className="border-t">
        <td className="py-2 px-3 text-left font-medium">{labelMap[metric]}</td>
        {rowValues.map((val, j) => (
          <td key={j} className="py-2 px-3">₹{val.toLocaleString()}</td>
        ))}
        <td className="py-2 px-3 font-semibold">₹{totalSum.toLocaleString()}</td>
      </tr>
    );
  })}
</tbody>

                </table>
              </div>

              <div className="bg-white p-4 rounded shadow mt-6">
                <h4 className="font-semibold mb-4">Yearly Collection Overview</h4>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.monthly}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                      <Legend />
                      <Bar dataKey="total" name="Collected" fill="#2ecc71" />
                      <Bar dataKey="target" name="Target" fill="#3498db" />
                      <Bar dataKey="extra" name="Extra" fill="#f39c12" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </>
      )}
      {isLoggedIn && activeTab === 'Members' && <Members />}

{isLoggedIn && activeTab === 'Contributions' && <Contributions />}

      {isLoggedIn && activeTab === 'Loans' && <Loans />}

{activeTab === 'Loans Overview' && (
  <div className="p-6 max-w-7xl mx-auto">
    {/* Search Bar */}
    <div className="mb-4 md:mb-6">
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by member name..."
        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    {/* Loans Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {loansData
        .filter(loan => loan.memberName.toLowerCase().includes(search.toLowerCase()))
        .map((loan, idx) => (
          <div key={idx} className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow flex">

            {/* Left side: loan info */}
            <div className="flex-1 pr-4 border-r border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-700">{loan.memberName}</h3>

              </div>

              <div className="text-sm text-gray-500">Loan Amount</div>
              <div className="text-lg font-bold mb-2">₹{Number(loan.loanAmount).toFixed(2)}</div>

              <div className="text-sm text-gray-500">Monthly EMI</div>
              <div className="text-lg font-bold mb-2">₹{Number(loan.monthlyEMI).toFixed(2)}</div>

              <div className="text-sm text-gray-500">Total Repayment</div>
              <div className="text-lg font-bold mb-2">₹{Number(loan.totalRepayment).toFixed(2)}</div>

              <div className="text-sm text-gray-500">Amount Paid</div>
              <div className="text-lg font-bold mb-2">₹{Number(loan.amountPaid || 0).toFixed(2)}</div>

              <div className="text-sm text-gray-500">Remaining Due</div>
              <div className="text-lg font-bold mb-2">₹{Number(loan.remainingDue || 0).toFixed(2)}</div>

              <div className="text-sm text-gray-500">Start Date</div>
              <div className="text-lg font-bold mb-2">{new Date(loan.loanStartDate).toLocaleDateString()}</div>

              <div className="text-sm text-gray-500">Tenure</div>
              <div className="text-lg font-bold mb-2">{loan.tenure} months</div>
            </div>

            {/* Right side: installments */}
            <div className="w-48 flex-shrink-0 pl-4">

              <div className="w-44 flex-shrink-0 flex flex-col">
              <span className={`mt-2 mb-2 px-2 py-1 text-xs rounded-full text-center w-full ${
      loan.status === "Active" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"
    }`}>{loan.status}</span>
    </div>
             
              <div className="max-h-64 overflow-y-auto border rounded p-2 bg-gray-50">
                {loan.installments && loan.installments.length > 0 ? (
                  loan.installments.map((inst, i) => (
                    <div key={i} className="flex justify-between text-sm text-gray-700 border-b last:border-b-0 py-1">
                      <span>{new Date(inst.date).toLocaleDateString()}</span>
                      <span>₹{Number(inst.amount).toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400 text-sm">No installments yet</div>
                )}
              </div>
              
            </div>

          </div>
        ))
      }

      {loansData.length === 0 && (
        <div className="col-span-2 text-center py-12 text-gray-500 italic">No loans available</div>
      )}
    </div>
  </div>
)}

{activeTab === 'Dashboard' && <Footer />}
      <div/>
    </div>
  );
}




