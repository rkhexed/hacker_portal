import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const API_URL = "http://localhost:8080";

export default function ProtectedRoute({ children, requireApplication = true }) {
  const { user: authUser, session, loading: authLoading } = useAuth(); 
  const location = useLocation();
  const [applicationUser, setApplicationUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false); 
  const [userNotFound, setUserNotFound] = useState(false);

  useEffect(() => {
    if (authLoading) return; // wait for auth 
    if (session && authUser) {
      setLoading(true);
      fetch(`/api/user/email/${encodeURIComponent(authUser.email)}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
        .then(res => {
          if (res.status === 404) {
            setUserNotFound(true);
            return null;
          }
          if (!res.ok) throw new Error(`HTTP ${res.status}`); //non-404 error
          return res.json();
        })
        .then(data => {
          if (data) setApplicationUser(data.user);
        })
        .catch(err => {
          console.error("Error fetching user:", err);
          setFetchError(true); // network/server error
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [session, authUser, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div style={{ color: 'var(--foreground)', opacity: 0.6 }}>Loading...</div>
      </div>
    );
  }

  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;

  // fetch error
  if (fetchError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div style={{ color: 'var(--foreground)', opacity: 0.6 }}>
          Something went wrong. Please refresh.
        </div>
      </div>
    );
  }

  if (userNotFound && location.pathname !== '/application') {
    return <Navigate to="/application" replace />;
  }

  if (!requireApplication) return children;

  if (applicationUser && !applicationUser.status && location.pathname !== '/application') {
    return <Navigate to="/application" replace />;
  }

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

  // Show placeholder page if user is not accepted
  if (!applicationUser || applicationUser.status !== 'accepted') {
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
            {(!applicationUser || applicationUser.status === 'pending') && '⏳'}
            {applicationUser?.status === 'waitlisted' && '📋'}
            {applicationUser?.status === 'rejected' && '😔'}
          </div>
          
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
            {(!applicationUser || applicationUser.status === 'pending') && 'Application Under Review'}
            {applicationUser?.status === 'waitlisted' && "You're on the Waitlist"}
            {applicationUser?.status === 'rejected' && 'Application Not Accepted'}
          </h1>
          
          <p className="mb-6" style={{ color: 'var(--foreground)', opacity: 0.6 }}>
            {(!applicationUser || applicationUser.status === 'pending') && "Thanks for applying to CaseHacks! We're reviewing your application and will get back to you soon."}
            {applicationUser?.status === 'waitlisted' && "You're on our waitlist. We'll notify you if a spot opens up!"}
            {applicationUser?.status === 'rejected' && "Unfortunately, we weren't able to accept your application this time. We hope to see you at future events!"}
          </p>
          
          <div 
            className={`inline-block px-4 py-2 rounded-full text-sm font-medium border ${getStatusStyle(applicationUser?.status)}`}
          >
            {getStatusText(applicationUser?.status)}
          </div>
          
          {(!applicationUser || applicationUser.status === 'pending') && (
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
