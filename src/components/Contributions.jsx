import React, { useEffect, useState } from 'react';
import { FaHandHoldingUsd, FaEdit, FaTrash, FaPlus } from "react-icons/fa";

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function Contributions() {
  const [contributions, setContributions] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editContribution, setEditContribution] = useState(null);
  const [addMembersModalOpen, setAddMembersModalOpen] = useState(false);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filteredMembers, setFilteredMembers] = useState([]);
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

  // Fetch contributions & members
  useEffect(() => {
    fetchContributions();
    fetchMembers();
  }, []);

  const fetchContributions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/contributions`);
      const json = await res.json();
      setContributions(json.data || []);
    } catch (err) {
      console.error("Error fetching contributions:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch(`${API}/members`);
      const data = await res.json();
      setMembers(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error("Error fetching members:", err);
    }
  };

  const filteredContributions = contributions.filter(c => {
    const matchSearch =
      c.memberName?.toLowerCase().includes(search.toLowerCase()) ||
      c.method?.toLowerCase().includes(search.toLowerCase()) ||
      c.status?.toLowerCase().includes(search.toLowerCase());
    const matchMonth = c.month === filterMonth && c.year === filterYear;
    return matchSearch && matchMonth;
  });

  // Open add/edit contribution modal
  const openModal = (contribution = null) => {
    setEditContribution(contribution);
    setFormData(
      contribution
        ? { ...contribution }
        : {
            memberName: '',
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            target: 300,
            amountPaid: 0,
            method: 'Cash',
            status: 'Pending',
            extra: 0,
          }
    );
    setFilteredMembers([]);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditContribution(null);
    setFilteredMembers([]);
  };

  // Add Members modal
  const openAddMembersModal = () => {
    setAddMembersModalOpen(true);
  };

  const closeAddMembersModal = () => {
    setAddMembersModalOpen(false);
  };

  const handleAddMemberContribution = async (memberName) => {
    const existing = contributions.find(
      c => c.memberName === memberName && c.month === filterMonth && c.year === filterYear
    );
    if (existing) return;

    const newContribution = {
      memberName,
      month: filterMonth,
      year: filterYear,
      target: 300,
      amountPaid: 0,
      method: 'Cash',
      status: 'Pending',
      extra: 0
    };

    try {
      const res = await fetch(`${API}/contributions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContribution)
      });
      if (res.ok) fetchContributions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const memberExists = members.some(
      (m) => m.memberName.toLowerCase() === formData.memberName.toLowerCase()
    );
    if (!memberExists) {
      alert(`"${formData.memberName}" does not exist. Please add this member first in Members section.`);
      return;
    }

    try {
      const url = editContribution
        ? `${API}/contributions/${editContribution._id}`
        : `${API}/contributions`;
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
      console.error("Error saving contribution:", err);
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
    if (filteredContributions.length === 0) return alert("No contributions to export");
    const header = ["Member Name", "Month", "Year", "Target", "Amount Paid", "Extra", "Method", "Status"];
    const rowsData = filteredContributions.map(c => [
      c.memberName,
      monthNames[c.month - 1],
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
    link.href = url;
    link.download = `contributions_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMemberInput = (value) => {
    setFormData({ ...formData, memberName: value });
    if (value.trim() === '') {
      setFilteredMembers([]);
    } else {
      const filtered = members
        .map(m => m.memberName)
        .filter(n => n.toLowerCase().includes(value.toLowerCase()));
      setFilteredMembers(filtered);
    }
  };

  // Members not already added for this month
  const availableMembersForAdd = members
    .filter(m => !contributions.some(c => c.memberName === m.memberName && c.month === filterMonth && c.year === filterYear));

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <span className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
            <FaHandHoldingUsd className="text-white text-[20px]" />
          </span>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Contributions List</h2>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-1">
              <p>
                Total Contributions:{" "}
                <span className="font-semibold text-gray-800">{filteredContributions.length}</span>
              </p>
              <p>
                Total Amount Paid:{" "}
                <span className="font-semibold text-green-700">
                  ₹{filteredContributions.reduce((sum, c) => sum + Number(c.amountPaid || 0), 0).toLocaleString()}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={exportCSV}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center space-x-2"
          >
            ⬇ Export CSV
          </button>

          <button
            onClick={() => openModal()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center space-x-2"
          >
            <FaPlus /> <span>Add Contribution</span>
          </button>

          <button
            onClick={openAddMembersModal}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded flex items-center space-x-2"
          >
            <FaPlus /> <span>Add Members</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <select
          value={filterMonth}
          onChange={e => setFilterMonth(Number(e.target.value))}
          className="border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
        >
          {monthNames.map((m, i) => (
            <option key={i} value={i + 1}>{m}</option>
          ))}
        </select>

        <input
          type="number"
          value={filterYear}
          onChange={e => setFilterYear(Number(e.target.value))}
          className="border rounded px-3 py-2 w-24 focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="text"
          placeholder="Search by member, method, or status..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded-md p-3 flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400 font-medium">Loading contributions...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-gray-800 text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                {['Member Name', 'Target', 'Amount Paid', 'Extra', 'Method', 'Status', 'Actions'].map((header, i) => (
                  <th key={i} className="py-3 px-5 font-semibold">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredContributions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-gray-500 italic">
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

      {/* Add/Edit Contribution Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md relative">
            <h3 className="text-xl font-bold mb-4">{editContribution ? 'Edit Contribution' : 'Add Contribution'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Member Name */}
              <div className="relative">
                <label className="block mb-1 font-medium text-gray-700">Member Name</label>
                <input
                  type="text"
                  placeholder="Search member..."
                  value={formData.memberName}
                  onChange={e => handleMemberInput(e.target.value)}
                  readOnly={!!editContribution}
                  required
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {filteredMembers.length > 0 && !editContribution && (
                  <ul className="absolute bg-white border w-full mt-1 rounded shadow-md max-h-40 overflow-y-auto z-50">
                    {filteredMembers.map((m, i) => (
                      <li
                        key={i}
                        onClick={() => {
                          setFormData({ ...formData, memberName: m });
                          setFilteredMembers([]); // hide after selection
                        }}
                        className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
                      >
                        {m}
                      </li>
                    ))}
                  </ul>
                )}
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
                    value={formData.year}
                    onChange={e => setFormData({ ...formData, year: Number(e.target.value) })}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Target & Amount */}
              <div className="flex space-x-2">
                <div className="w-1/2">
                  <label className="block mb-1 font-medium text-gray-700">Target</label>
                  <input
                    type="number"
                    value={formData.target}
                    onChange={e => setFormData({ ...formData, target: Number(e.target.value) })}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="w-1/2">
                  <label className="block mb-1 font-medium text-gray-700">Amount Paid</label>
                  <input
                    type="number"
                    value={formData.amountPaid}
                    onChange={e => setFormData({ ...formData, amountPaid: Number(e.target.value) })}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Extra */}
              <div>
                <label className="block mb-1 font-medium text-gray-700">Extra</label>
                <input
                  type="number"
                  value={formData.extra}
                  onChange={e => setFormData({ ...formData, extra: Number(e.target.value) })}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Payment Method & Status */}
              <div className="flex space-x-2">
                <div className="w-1/2">
                  <label className="block mb-1 font-medium text-gray-700">Payment Method</label>
                  <select
                    value={formData.method}
                    onChange={e => setFormData({ ...formData, method: e.target.value })}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {['Cash', 'UPI', 'Banking'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="w-1/2">
                  <label className="block mb-1 font-medium text-gray-700">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {['Paid', 'Partial', 'Pending'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 border rounded hover:bg-gray-100">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editContribution ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Members Modal */}
      {addMembersModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md relative">
            <h3 className="text-xl font-bold mb-4">Add Members for {monthNames[filterMonth-1]} {filterYear}</h3>
            {availableMembersForAdd.length === 0 ? (
              <p className="text-gray-500">All members already added for this month.</p>
            ) : (
              <ul className="max-h-64 overflow-y-auto space-y-1">
                {availableMembersForAdd.map((m, i) => (
                  <li
                    key={i}
                    onClick={() => handleAddMemberContribution(m.memberName)}
                    className="cursor-pointer px-3 py-2 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    {m.memberName}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex justify-end mt-4">
              <button onClick={closeAddMembersModal} className="px-4 py-2 border rounded hover:bg-gray-100">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
