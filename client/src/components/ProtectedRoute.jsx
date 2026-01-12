import { useState, useEffect } from 'react';

const API_URL = "http://localhost:8080";

export default function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // For now, using test user email - replace with auth context
  const userEmail = "test.hacker@casehacks.ca";

  useEffect(() => {
    fetch(`${API_URL}/api/user/email/${encodeURIComponent(userEmail)}`)
      .then(res => res.json())
      .then(data => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching user:", err);
        setLoading(false);
      });
  }, []);

  // Get application status styling
  const getStatusStyle = (status) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'waitlisted':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'accepted':
        return '✓ Accepted';
      case 'rejected':
        return '✗ Not Accepted';
      case 'waitlisted':
        return '⏳ Waitlisted';
      default:
        return '⏳ Pending';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div style={{ color: 'var(--foreground)', opacity: 0.6 }}>Loading...</div>
      </div>
    );
  }

  // Show placeholder page if user is not accepted
  if (!user || user.status !== 'accepted') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div 
          className="p-8 rounded-2xl shadow-sm max-w-md w-full"
          style={{ 
            backgroundColor: 'var(--card)', 
            border: '1px solid var(--border)'
          }}
        >
          <div 
            className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl"
            style={{ backgroundColor: 'var(--button)' }}
          >
            {(!user || user.status === 'pending') && '⏳'}
            {user?.status === 'waitlisted' && '📋'}
            {user?.status === 'rejected' && '😔'}
          </div>
          
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
            {(!user || user.status === 'pending') && 'Application Under Review'}
            {user?.status === 'waitlisted' && "You're on the Waitlist"}
            {user?.status === 'rejected' && 'Application Not Accepted'}
          </h1>
          
          <p className="mb-6" style={{ color: 'var(--foreground)', opacity: 0.6 }}>
            {(!user || user.status === 'pending') && "Thanks for applying to CaseHacks! We're reviewing your application and will get back to you soon."}
            {user?.status === 'waitlisted' && "You're on our waitlist. We'll notify you if a spot opens up!"}
            {user?.status === 'rejected' && "Unfortunately, we weren't able to accept your application this time. We hope to see you at future events!"}
          </p>
          
          <div 
            className={`inline-block px-4 py-2 rounded-full text-sm font-medium border ${getStatusStyle(user?.status)}`}
          >
            {getStatusText(user?.status)}
          </div>
          
          {(!user || user.status === 'pending') && (
            <p className="mt-6 text-sm" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
              Check back later for updates on your application status.
            </p>
          )}
        </div>
      </div>
    );
  }

  // User is accepted, render children
  return children;
}
