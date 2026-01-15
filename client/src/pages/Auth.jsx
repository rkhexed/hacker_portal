import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState('login');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          name: mode === 'signup' ? name : undefined,
        },
      },
    });

    if (error) {
      alert(error.error_description || error.message);
    } else {
      alert('Check your email for the login link!');
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50" style={{ backgroundColor: 'var(--background)' }}>
      <div className="p-8 rounded-2xl shadow-sm max-w-md w-full" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
        <h1 className="text-2xl font-bold mb-2 text-center" style={{ color: 'var(--foreground)' }}>Hacker Portal</h1>
        <p className="mb-6 text-center" style={{ color: 'var(--foreground)', opacity: 0.6 }}>
          {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
        </p>

        <div className="flex mb-6 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              mode === 'login' ? 'text-white' : 'text-gray-600'
            }`}
            style={{
              backgroundColor: mode === 'login' ? 'var(--primary)' : 'transparent',
              color: mode === 'login' ? 'white' : 'var(--foreground)',
              opacity: mode === 'login' ? 1 : 0.6,
            }}
          >
            Login
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              mode === 'signup' ? 'text-white' : 'text-gray-600'
            }`}
            style={{
              backgroundColor: mode === 'signup' ? 'var(--primary)' : 'transparent',
              color: mode === 'signup' ? 'white' : 'var(--foreground)',
              opacity: mode === 'signup' ? 1 : 0.6,
            }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="mb-4">
              <input
                className="w-full p-3 rounded-md bg-gray-100 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ backgroundColor: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                type="text"
                placeholder="Your name"
                value={name}
                required
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          <div className="mb-4">
            <input
              className="w-full p-3 rounded-md bg-gray-100 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ backgroundColor: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
              type="email"
              placeholder="Your email"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button
            className="w-full p-3 rounded-md text-white font-semibold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: 'var(--primary)' }}
            disabled={loading}
          >
            {loading ? <span>Loading...</span> : <span>Send Magic Link</span>}
          </button>
        </form>
      </div>
    </div>
  );
}
