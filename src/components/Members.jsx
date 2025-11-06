import React, { useEffect, useState } from 'react';
import { FaUsers, FaTrash, FaEdit, FaPlus } from "react-icons/fa";

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [formData, setFormData] = useState({ memberName: '', email: '', phone: '', active: true });

  useEffect(() => {
    fetchMembers();
  }, []);

  // Fetch members
  async function fetchMembers() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/members`);
      const json = await res.json();
      setMembers(json.data || []);
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredMembers = members.filter(m =>
    m.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.email && m.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (m.phone && m.phone.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Open Add/Edit modal
  const openModal = (member = null) => {
    setEditMember(member);
    setFormData(member ? { ...member } : { memberName: '', email: '', phone: '', active: true });
    setModalOpen(true);
  }

  const closeModal = () => {
    setModalOpen(false);
    setEditMember(null);
  }

  // Add or Edit member
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editMember ? `${API}/members/${editMember._id}` : `${API}/members`;
      const method = editMember ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        fetchMembers();
        closeModal();
      } else {
        alert(data.message || 'Failed to save member');
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Delete member
  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to delete this member?`)) return;
    try {
      const res = await fetch(`${API}/members/${id}`, { method: 'DELETE' });
      if (res.ok) fetchMembers();
    } catch (err) {
      console.error(err);
    }
  }

  // Export CSV
  const exportCSV = () => {
    if (members.length === 0) return alert("No members to export");

    const header = ["Member Name", "Email", "Phone", "Status"];
    const rowsData = members.map(m => [
      m.memberName,
      m.email || '',
      m.phone || '',
      m.active ? 'Active' : 'Inactive'
    ]);

    const csvContent = [
      header.join(","),
      ...rowsData.map(r => r.map(field => `"${field}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `members_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <span className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
            <FaUsers className="text-white text-[20px]" />
          </span>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Members List</h2>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-1">
              <p>Total Members: <span className="font-semibold text-gray-800">{filteredMembers.length || 0}</span></p>
              <p>Active Members: <span className="font-semibold text-green-700">{filteredMembers.filter(m => m.active).length}</span></p>
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
            <FaPlus /> <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          className="border border-gray-300 rounded-md p-3 mb-6 w-full max-w-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Loading / Empty / Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 font-medium">Loading members...</div>
      ) : filteredMembers.length === 0 ? (
        <div className="text-gray-500 text-center py-12 text-lg font-medium">No members found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-100 rounded-lg overflow-hidden text-sm text-gray-700">
            <thead className="bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 uppercase text-xs font-semibold">
              <tr>
                <th className="py-3 px-4 text-left">Member Name</th>
                <th className="py-3 px-4 text-left">Email</th>
                <th className="py-3 px-4 text-left">Phone</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((m, idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50 transition-colors duration-150">
                  <td className="py-3 px-4 font-medium text-gray-800">{m.memberName}</td>
                  <td className="py-3 px-4">{m.email || <span className="text-gray-400 italic">N/A</span>}</td>
                  <td className="py-3 px-4">{m.phone || <span className="text-gray-400 italic">N/A</span>}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      m.active ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                      {m.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 flex space-x-2">
                    <button onClick={() => openModal(m)} className="text-blue-600 hover:text-blue-800"><FaEdit /></button>
                    <button onClick={() => handleDelete(m._id)} className="text-red-600 hover:text-red-800"><FaTrash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">{editMember ? 'Edit Member' : 'Add Member'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Member Name"
                value={formData.memberName}
                onChange={(e) => setFormData({ ...formData, memberName: e.target.value })}
                required
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  id="activeCheck"
                  className="h-4 w-4"
                />
                <label htmlFor="activeCheck" className="text-gray-700">Active</label>
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 border rounded hover:bg-gray-100">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  {editMember ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
