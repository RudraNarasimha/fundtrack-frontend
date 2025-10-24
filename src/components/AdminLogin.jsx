import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserAlt, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa'; // Import the original icons

export default function AdminLogin({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem('adminToken', data.token);
        if (onLoginSuccess) onLoginSuccess();
        navigate('/');
      } else {
        console.error('Backend error:', data);
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Network or JS error:', err);
      setError(err.message || 'Server error');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prevState => !prevState);
  };

  const handleBackToDashboard = () => {
    navigate('/');
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-5xl text-white">₹</span>
          </div>
        </div>
        <h2 className="text-center text-2xl font-bold mb-2">Admin Login</h2>
        <p className="text-center text-gray-500 mb-6">Sri Bala Ganesh Sevadal</p>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          {/* Username field */}
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Username:</label>
            <div className="flex items-center border rounded-lg p-2">
              {/* Original username logo */}
              <FaUserAlt className="text-gray-500 mr-2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="flex-1 p-2 border-none outline-none"
                required
              />
            </div>
          </div>

          {/* Password field */}
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Password:</label>
            <div className="flex items-center border rounded-lg p-2">
              {/* Original password logo */}
              <FaLock className="text-gray-500 mr-2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 p-2 border-none outline-none"
                required
              />
              {/* Password visibility toggle */}
              <span onClick={togglePasswordVisibility} className="cursor-pointer text-xl">
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </span>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-300"
          >
            Login
          </button>
        </form>

        {/* Error Message */}
        {error && <p className="text-center text-red-500 mt-4">{error}</p>}

        {/* Back to Dashboard Link */}
        <div className="text-center mt-4">
          <button
            onClick={handleBackToDashboard}
            className="text-blue-500 font-bold hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
