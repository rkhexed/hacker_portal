import { useState, useEffect } from 'react';
import { QrCode } from 'lucide-react';

const API_URL = "http://localhost:8080";

export default function Schedule() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/events`)
      .then(res => res.json())
      .then(data => {
        setEvents(data.events || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching events:", err);
        setLoading(false);
      });
  }, []);

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  // Determine event type based on title (simple heuristic)
  const getEventType = (title) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('lunch') || lowerTitle.includes('dinner') || lowerTitle.includes('breakfast') || lowerTitle.includes('food') || lowerTitle.includes('snack')) {
      return 'food';
    }
    if (lowerTitle.includes('workshop') || lowerTitle.includes('intro') || lowerTitle.includes('tutorial')) {
      return 'workshop';
    }
    return 'event';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div style={{ color: 'var(--foreground)', opacity: 0.6 }}>Loading schedule...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header>
        <h1 className="text-4xl font-bold" style={{ color: 'var(--foreground)' }}>Schedule</h1>
        <p style={{ color: 'var(--foreground)', opacity: 0.6 }}>
          {events.length > 0 ? formatDate(events[0]?.starts_at) : "No events scheduled"}
        </p>
      </header>

      {events.length === 0 ? (
        <div 
          className="p-8 rounded-xl text-center shadow-sm border"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <p style={{ color: 'var(--foreground)', opacity: 0.6 }}>No events scheduled yet. Check back later!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const eventType = getEventType(event.title);
            return (
              <div 
                key={event.id} 
                className="p-4 rounded-xl shadow-sm border flex flex-col md:flex-row md:items-center justify-between gap-4"
                style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-start space-x-4">
                  <div className="shrink-0 w-20 text-center">
                    <span className="font-bold" style={{ color: 'var(--primary)' }}>
                      {formatTime(event.starts_at)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
                      {event.title}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.6 }}>
                      {event.location || "TBA"}
                    </p>
                    {event.description && (
                      <p className="text-sm mt-1" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
                
                {eventType === 'food' && (
                  <button 
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                    style={{ backgroundColor: 'var(--secondary)', color: 'var(--foreground)' }}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Meal Ticket</span>
                  </button>
                )}
                {eventType === 'workshop' && (
                  <button 
                    className="text-sm px-4 py-2 rounded-lg font-medium transition-colors"
                    style={{ backgroundColor: 'var(--button)', color: 'var(--foreground)' }}
                  >
                    View Details
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
