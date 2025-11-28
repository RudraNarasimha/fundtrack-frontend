import React, { useEffect, useState } from 'react';
import { FaHandHoldingUsd, FaEdit, FaTrash, FaPlus } from 'react-icons/fa';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Loans() {
  const [loans, setLoans] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editLoan, setEditLoan] = useState(null);
  const [newPayment, setNewPayment] = useState(0);
  const [search, setSearch] = useState('');

  const [formData, setFormData] = useState({
    memberId: '',
    memberName: '',
    loanAmount: 0,
    tenure: 12,
    interestRate: 0,
    repaymentMode: 'Calculated EMI',
    fixedMonthlyPayment: 0,
    monthlyEMI: 0,
    totalInterest: 0,
    totalRepayment: 0,
    payments: [],
    amountPaid: 0,
    remainingDue: 0,
    status: 'Active',
  });

  // Fetch loans
  const fetchLoans = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/loan`);
      const data = await res.json();
      setLoans(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLoans = loans.filter(
  loan =>
    loan.memberName.toLowerCase().includes(search.toLowerCase())
);


  // Fetch members
  const fetchMembers = async () => {
    try {
      const res = await fetch(`${API}/members`);
      const data = await res.json();
      setMembers(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLoans();
    fetchMembers();
  }, []);

  // Open Modal
  const openModal = (loan) => {
    setEditLoan(loan || null);
    if (loan) {
      const totalPaid = loan.amountPaid || 0;
      const remaining = loan.totalRepayment - totalPaid;
      setFormData({ ...loan, amountPaid: totalPaid, remainingDue: remaining });
    } else {
      setFormData({
        memberId: '',
        memberName: '',
        loanAmount: 0,
        tenure: 12,
        interestRate: 0,
        repaymentMode: 'Calculated EMI',
        fixedMonthlyPayment: 0,
        monthlyEMI: 0,
        totalInterest: 0,
        totalRepayment: 0,
        payments: [],
        amountPaid: 0,
        remainingDue: 0,
        status: 'Active',
      });
    }
    setNewPayment(0);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditLoan(null);
  };

  // Calculate EMI / total repayment
  const calculateLoan = () => {
    const P = Number(formData.loanAmount);
    const r = Number(formData.interestRate) / 12 / 100;
    let n = Number(formData.tenure);

    if (!P || (formData.repaymentMode === "Calculated EMI" && !r)) return;

    let totalRepayment = 0;
    let totalInterest = 0;
    let monthlyEMI = 0;

    if (formData.repaymentMode === "Calculated EMI") {
      monthlyEMI = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
      totalRepayment = monthlyEMI * n;
      totalInterest = totalRepayment - P;
    } else {
      const fixed = Number(formData.fixedMonthlyPayment);
      if (!fixed) return;

      let months = 0, balance = P;
      while (balance > 0) {
        balance = balance + balance * r - fixed;
        months++;
        if (months > 1000) break;
      }
      totalRepayment = fixed * months;
      totalInterest = totalRepayment - P;
      n = months;
    }

    const paid = formData.amountPaid || 0;
    const remainingDue = totalRepayment - paid;

    setFormData(prev => ({
      ...prev,
      monthlyEMI,
      totalRepayment,
      totalInterest,
      tenure: n,
      remainingDue,
      status: remainingDue <= 0 ? 'Closed' : prev.status,
    }));
  };

  useEffect(() => {
    calculateLoan();
  }, [
    formData.loanAmount,
    formData.tenure,
    formData.interestRate,
    formData.repaymentMode,
    formData.fixedMonthlyPayment,
    formData.amountPaid,
  ]);

  // Submit loan / update
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.memberId) return alert("Select a member");

    try {
      if (editLoan && newPayment > 0) {
        // Add new payment via installment API
        const res = await fetch(`${API}/loan/installment/${editLoan._id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: Number(newPayment), date: new Date().toISOString() }),
        });
        const data = await res.json();
        if (!res.ok) return alert(data.message || "Failed to add payment");
      }

      // Update loan details
      const payload = {
        memberId: formData.memberId,
        memberName: formData.memberName,
        loanAmount: formData.loanAmount,
        tenure: formData.tenure,
        interestRate: formData.interestRate,
        repaymentMode: formData.repaymentMode,
        fixedMonthlyPayment: formData.fixedMonthlyPayment,
        monthlyEMI: formData.monthlyEMI,
        totalInterest: formData.totalInterest,
        totalRepayment: formData.totalRepayment,
        status: formData.status,
      };

      const url = editLoan ? `${API}/loan/${editLoan._id}` : `${API}/loan/create`;
      const method = editLoan ? "PUT" : "POST";

      const res2 = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data2 = await res2.json();
      if (res2.ok) {
        fetchLoans();
        closeModal();
      } else {
        alert(data2.message || "Failed to save loan");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete loan
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this loan?")) return;
    try {
      const res = await fetch(`${API}/loan/${id}`, { method: "DELETE" });
      if (res.ok) fetchLoans();
    } catch (err) {
      console.error(err);
    }
  };

  return (
  <div className="bg-white p-6 rounded-lg shadow-md max-w-full">

    {/* Header */}
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-3">
        <span className="w-10 h-10 text-2xl bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
          💰
        </span>
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Loans List</h2>
          <p>Total Loans: <span className="font-semibold text-gray-800">{loans.length}</span></p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button onClick={() => openModal()} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center space-x-2">
          <FaPlus /> Add Loan
        </button>
      </div>
    </div>

    {/* Search */}
<div className="flex mb-4">
  <input
    type="text"
    placeholder="Search by member..."
    value={search}
    onChange={e => setSearch(e.target.value)}
    className="border border-gray-300 rounded-md p-2 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
</div>


    {/* Table */}
    {loading ? (
      <div className="text-center py-12 text-gray-400 font-medium">Loading loans...</div>
    ) : (
      <div className="overflow-x-auto">
        <table className="min-w-full text-center text-gray-800 text-sm border-collapse">
  <thead>
    <tr className="bg-gray-100 border-b border-gray-300">
      {['Member','Amount','Tenure','Rate','EMI','Interest','Total Repay','Amount Paid','Remaining Due','Status','Actions']
      .map((h,i)=><th key={i} className="py-3 px-5 font-semibold">{h}</th>)}
    </tr>
  </thead>
  <tbody>
    {filteredLoans.length === 0 ? (
  <tr>
    <td colSpan="12" className="py-8 text-center text-gray-500 italic">
      No loans found.
    </td>
  </tr>
  ) : filteredLoans.map((loan,i) => (
  <tr key={i} className={`border-b hover:bg-blue-50 transition-colors duration-200 ${i%2===0?'bg-white':'bg-gray-50'}`}>
        <td className="py-4 px-5">{loan.memberName}</td>
        <td className="py-4 px-5 font-semibold text-blue-700">₹{loan.loanAmount.toFixed(2)}</td>
        <td className="py-4 px-5">{loan.tenure}</td>
        <td className="py-4 px-5">{loan.interestRate}%</td>
        <td className="py-4 px-5 font-semibold text-green-700">
          ₹{loan.repaymentMode === "Fixed Payment" 
              ? loan.fixedMonthlyPayment?.toFixed(2) 
              : loan.monthlyEMI?.toFixed(2)}
        </td>
        <td className="py-4 px-5 font-semibold text-purple-700">₹{loan.totalInterest?.toFixed(2)}</td>
        <td className="py-4 px-5 font-semibold text-blue-700">₹{loan.totalRepayment?.toFixed(2)}</td>
        <td className="py-4 px-5 font-semibold text-green-700">₹{Number(loan.amountPaid || 0).toFixed(2)}</td>
        <td className="py-4 px-5 font-semibold text-red-700">₹{Number(loan.remainingDue || 0).toFixed(2)}</td>

        {/* Status Badge */}
        <td className="py-4 px-5">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
            loan.status === 'Active' ? 'bg-green-100 text-green-800' :
            'bg-gray-200 text-gray-700'
          }`}>
            {loan.status}
          </span>
        </td>

        <td className="py-4 px-5 text-center align-middle">
  <div className="inline-flex space-x-2">
    <button onClick={()=>openModal(loan)} className="text-blue-600 hover:text-blue-800"><FaEdit /></button>
    <button onClick={()=>handleDelete(loan._id)} className="text-red-600 hover:text-red-800"><FaTrash /></button>
  </div>
</td>

      </tr>
    ))}
  </tbody>
</table>

      </div>
    )}

    {/* Add/Edit Modal */}
    {modalOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-2xl grid grid-cols-2 gap-4">
          <div className="col-span-2 text-center mb-4">
            <h3 className="text-xl font-bold">{editLoan ? 'Edit Loan' : 'Add Loan'}</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 col-span-1">
            {/* Member Select */}
            <div>
              <label className="block mb-1 font-medium text-gray-700">Member</label>
              <select
                value={formData.memberId || ""}
                onChange={e => {
                  const selected = members.find(m => m._id === e.target.value);
                  setFormData({
                    ...formData,
                    memberId: selected?._id,
                    memberName: selected?.memberName
                  });
                }}
                required
                disabled={!!editLoan}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Member</option>
                {members.map(m => (
                  <option key={m._id} value={m._id}>{m.memberName}</option>
                ))}
              </select>
            </div>

            {/* Loan Fields */}
            <div>
              <label className="block mb-1 font-medium">Loan Amount</label>
              <input type="number" value={formData.loanAmount}
                onChange={e=>setFormData({...formData, loanAmount:Number(e.target.value)})}
                required
                disabled={!!editLoan}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <div>
              <label className="block mb-1 font-medium">Tenure (months)</label>
              <input type="number" value={formData.tenure}
                onChange={e=>setFormData({...formData, tenure:Number(e.target.value)})}
                readOnly={formData.repaymentMode==="Fixed Payment"}
                required
                disabled={!!editLoan}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <div>
              <label className="block mb-1 font-medium">Annual Interest Rate (%)</label>
              <input type="number" value={formData.interestRate}
                onChange={e=>setFormData({...formData, interestRate:Number(e.target.value)})}
                required
                disabled={!!editLoan}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <div>
              <label className="block mb-1 font-medium">Repayment Mode</label>
              <select value={formData.repaymentMode}
                onChange={e=>setFormData({...formData, repaymentMode:e.target.value})}
                required
                disabled={!!editLoan}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Calculated EMI</option>
                <option>Fixed Payment</option>
              </select>
            </div>

            {formData.repaymentMode==='Fixed Payment' && (
              <div>
                <label className="block mb-1 font-medium">Fixed Monthly Payment</label>
                <input type="number" value={formData.fixedMonthlyPayment}
                  onChange={e=>setFormData({...formData, fixedMonthlyPayment:Number(e.target.value)})}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>
            )}
          </form>

          {/* Summary & Actions */}
          <div className="col-span-1 space-y-2 p-2">
            <p className="font-semibold text-gray-700">Monthly EMI: ₹{formData.monthlyEMI?.toFixed(2)}</p>
            <p className="font-semibold text-gray-700">Total Interest: ₹{formData.totalInterest?.toFixed(2)}</p>
            <p className="font-semibold text-gray-700">Total Repayment: ₹{formData.totalRepayment?.toFixed(2)}</p>

            <div>
              <label className="block mb-1 font-medium text-gray-700">Add Payment</label>
              <input type="number" value={newPayment} onChange={e=>setNewPayment(Number(e.target.value))} placeholder="Enter amount" className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>

            <p className="text-gray-900 font-bold">Remaining Due: ₹{formData.remainingDue?.toFixed(2)}</p>
            <p className="text-gray-700">Total Paid: ₹{formData.amountPaid?.toFixed(2)}</p>

            <div>
              <label className="block mb-1 font-medium text-gray-700">Status</label>
              <select value={formData.status} onChange={e=>setFormData({...formData, status:e.target.value})} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Active</option>
                <option>Closed</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button type="button" onClick={closeModal} className="px-4 py-2 border rounded hover:bg-gray-100">Cancel</button>
              <button type="button" onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                {editLoan ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);
}

