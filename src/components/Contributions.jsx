import React, { useEffect, useState } from 'react';
import { FaHandHoldingUsd, FaEdit, FaTrash, FaPlus } from "react-icons/fa";

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function Contributions() {
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editContribution, setEditContribution] = useState(null);
  const [formData, setFormData] = useState({
    memberName: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    target: 300,
    amountPaid: 0,
    method: 'Cash',
    status: 'Pending',
    extra: 0,
  });

  useEffect(() => {
    fetchContributions();
  }, []);

  async function fetchContributions() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/contributions`);
      const json = await res.json();
      setContributions(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function formatMonthYear(monthNum, year) {
    if (!monthNum || !year) return '-';
    const monthIndex = monthNum - 1;
    return monthNames[monthIndex] + ' ' + year;
  }

  const filteredContributions = contributions.filter(c => {
    const formattedMonth = formatMonthYear(c.month, c.year);
    return (
      c.memberName.toLowerCase().includes(search.toLowerCase()) ||
      c.method.toLowerCase().includes(search.toLowerCase()) ||
      (c.target && c.target.toString().includes(search)) ||
      (formattedMonth && formattedMonth.toLowerCase().includes(search.toLowerCase()))
    );
  });

  // Open modal
  const openModal = (contribution = null) => {
    setEditContribution(contribution);
    setFormData(contribution ? { ...contribution } : {
      memberName: '',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      target: 300,
      amountPaid: 0,
      method: 'Cash',
      status: 'Pending',
      extra: 0,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditContribution(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editContribution ? `${API}/contributions/${editContribution._id}` : `${API}/contributions`;
      const method = editContribution ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        fetchContributions();
        closeModal();
      } else {
        alert(data.message || 'Failed to save contribution');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (_id) => {
    if (!window.confirm('Are you sure you want to delete this contribution?')) return;
    try {
      const res = await fetch(`${API}/contributions/${_id}`, { method: 'DELETE' });
      if (res.ok) fetchContributions();
    } catch (err) {
      console.error(err);
    }
  };

  const exportCSV = () => {
  if (contributions.length === 0) return alert("No contributions to export");

  const header = ["Member Name", "Month", "Year", "Target", "Amount Paid", "Extra", "Method", "Status"];
  const rowsData = contributions.map(c => [
    c.memberName,
    c.month,
    c.year,
    c.target,
    c.amountPaid,
    c.extra,
    c.method,
    c.status
  ]);

  const csvContent = [
    header.join(","),
    ...rowsData.map(r => r.map(field => `"${field}"`).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `contributions_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <span className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
            <FaHandHoldingUsd className="text-white text-[20px]" />
          </span>
          <h2 className="text-2xl font-semibold ml-2 text-gray-900">Contributions List</h2>
        </div>
          <div className="flex items-center space-x-2">
  <button onClick={exportCSV} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center space-x-2">
    ⬇ Export CSV
  </button>
  <button onClick={() => openModal()} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center space-x-2">
    <FaPlus /> <span>Add Contribution</span>
  </button>
</div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search contributions..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="border border-gray-300 rounded-md p-3 mb-6 w-full max-w-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400 font-medium">Loading contributions...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-gray-800 text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                {['Member Name', 'Month', 'Target', 'Amount Paid', 'Extra', 'Method', 'Status', 'Actions'].map((header, i) => (
                  <th key={i} className="py-3 px-5 font-semibold">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredContributions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-gray-500 italic">
                    No contributions found.
                  </td>
                </tr>
              ) : (
                filteredContributions.map((c, idx) => (
                  <tr
                    key={idx}
                    className={`border-b hover:bg-blue-50 transition-colors duration-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    <td className="py-4 px-5">{c.memberName}</td>
                    <td className="py-4 px-5">{formatMonthYear(c.month, c.year)}</td>
                    <td className="py-4 px-5">₹{c.target.toLocaleString()}</td>
                    <td className="py-4 px-5 font-semibold text-green-700">₹{c.amountPaid.toLocaleString()}</td>
                    <td className="py-4 px-5 font-medium text-purple-700">₹{c.extra.toLocaleString()}</td>
                    <td className="py-4 px-5 capitalize">{c.method}</td>
                    <td className="py-4 px-5">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        c.status === 'Paid'
                          ? 'bg-green-100 text-green-800'
                          : c.status === 'Pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 flex space-x-2">
                      <button onClick={() => openModal(c)} className="text-blue-600 hover:text-blue-800"><FaEdit /></button>
                      <button onClick={() => handleDelete(c._id)} className="text-red-600 hover:text-red-800"><FaTrash /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">{editContribution ? 'Edit Contribution' : 'Add Contribution'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Member Name */}
              <div>
                <label className="block mb-1 font-medium text-gray-700">Member Name</label>
                <input
                  type="text"
                  placeholder="Member Name"
                  value={formData.memberName}
                  onChange={e => setFormData({ ...formData, memberName: e.target.value })}
                  required
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Month & Year */}
              <div className="flex space-x-2">
                <div className="w-1/2">
                  <label className="block mb-1 font-medium text-gray-700">Month</label>
                  <select
                    value={formData.month}
                    onChange={e => setFormData({ ...formData, month: Number(e.target.value) })}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {monthNames.map((m, idx) => (
                      <option key={idx} value={idx + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="w-1/2">
                  <label className="block mb-1 font-medium text-gray-700">Year</label>
                  <input
                    type="number"
                    placeholder="Year"
                    value={formData.year}
                    onChange={e => setFormData({ ...formData, year: Number(e.target.value) })}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Target & Amount Paid */}
              <div className="flex space-x-2">
                <div className="w-1/2">
                  <label className="block mb-1 font-medium text-gray-700">Target Amount</label>
                  <input
                    type="number"
                    placeholder="Target Amount"
                    value={formData.target}
                    onChange={e => setFormData({ ...formData, target: Number(e.target.value) })}
                    required
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="w-1/2">
                  <label className="block mb-1 font-medium text-gray-700">Amount Paid</label>
                  <input
                    type="number"
                    placeholder="Amount Paid"
                    value={formData.amountPaid}
                    onChange={e => setFormData({ ...formData, amountPaid: Number(e.target.value) })}
                    required
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Extra Amount */}
              <div>
                <label className="block mb-1 font-medium text-gray-700">Extra Amount (Optional Note)</label>
                <input
                  type="number"
                  placeholder="Extra Amount"
                  value={formData.extra}
                  onChange={e => setFormData({ ...formData, extra: Number(e.target.value) })}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Method & Status */}
              <div className="flex space-x-2">
                <div className="w-1/2">
                  <label className="block mb-1 font-medium text-gray-700">Payment Method</label>
                  <select
                    value={formData.method}
                    onChange={e => setFormData({ ...formData, method: e.target.value })}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {['Cash','UPI','Banking'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="w-1/2">
                  <label className="block mb-1 font-medium text-gray-700">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {['Paid','Partial','Pending'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 border rounded hover:bg-gray-100">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  {editContribution ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
