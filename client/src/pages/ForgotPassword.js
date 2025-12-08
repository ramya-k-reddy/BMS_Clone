import React, { useState } from 'react';
import { forgotPassword } from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await forgotPassword(email);
    setMessage(res.message || 'Check your email for reset instructions.');
    setLoading(false);
  };

  return (
    <div className="auth-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', overflow: 'auto' }}>
      <div className="auth-card" style={{ maxWidth: 400, width: '100%', background: '#fff', borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '2rem', margin: '2rem 1rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Forgot Password</h2>
        <form onSubmit={handleSubmit} className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <label style={{ fontWeight: 500 }}>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ padding: '0.75rem', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '1rem' }}
            placeholder="Enter your email address"
          />
          <button type="submit" disabled={loading} style={{ padding: '0.75rem', borderRadius: 8, background: '#ef4444', color: '#fff', fontWeight: 600, border: 'none', fontSize: '1rem', cursor: 'pointer', width: '100%' }}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        {message && <p className="auth-message" style={{ marginTop: '1rem', textAlign: 'center', color: '#2563eb' }}>{message}</p>}
      </div>
    </div>
  );
};

export default ForgotPassword;
