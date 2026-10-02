import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { apiErrorMessage } from '../../services/api';
import { ErrorState } from '../../components/States.jsx';

export default function AdminSetup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post('/admin/setup', form);
      navigate('/admin/login');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl mb-1 text-center">Create Admin Account</h1>
        <p className="text-sm text-ink/60 text-center mb-8">This only works once — before any admin account exists.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label">Name</label><input className="input" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
          <div><label className="label">Email</label><input className="input" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></div>
          <div><label className="label">Password (min. 8 characters)</label><input className="input" type="password" required minLength={8} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} /></div>
          {error && <ErrorState message={error} />}
          <button type="submit" disabled={submitting} className="btn-primary w-full">{submitting ? 'Creating…' : 'Create Account'}</button>
        </form>
        <p className="text-xs text-ink/40 text-center mt-6"><Link to="/admin/login" className="underline">Back to login</Link></p>
      </div>
    </div>
  );
}
