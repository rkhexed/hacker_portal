import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Loading from '../components/Loading';
import BountiesDrawer from '../components/BountiesDrawer';

const API_URL = "http://localhost:8080";

const TABS = [
  { key: 'total', label: 'Total points' },
  { key: 'event', label: 'Event points' },
  { key: 'social', label: 'Social points' },
];

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Leaderboard() {
  const { session } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('total');
  const [userId, setUserId] = useState(null);
  const [bountiesOpen, setBountiesOpen] = useState(false);

  const userEmail = session?.user?.email || "test.hacker@casehacks.ca";

  useEffect(() => {
    if (!session) return;

    const fetchAll = async () => {
      try {
        const [leaderboardRes, userRes] = await Promise.all([
          fetch(`${API_URL}/api/leaderboard`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }),
          fetch(`${API_URL}/api/user/email/${encodeURIComponent(userEmail)}`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }),
        ]);

        const [leaderboardData, userData] = await Promise.all([
          leaderboardRes.json(),
          userRes.json(),
        ]);

        setUsers(leaderboardData.users || []);
        setUserId(userData.user.id);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchAll();
    }, 30000);

    return () => clearInterval(interval);
  }, [session]);

  const getVal = (u) => {
    if (tab === 'total') return (u.event_attendance_points || 0) + (u.user_interaction_points || 0);
    if (tab === 'event') return u.event_attendance_points || 0;
    return u.user_interaction_points || 0;
  };

  const sorted = [...users].sort((a, b) => getVal(b) - getVal(a));
  const max = sorted.length > 0 ? getVal(sorted[0]) : 1;
  const currentUserRank = sorted.findIndex(u => u.id === userId);

  if (loading) return <Loading />;

  return (
    <>
      <BountiesDrawer open={bountiesOpen} onClose={() => setBountiesOpen(false)} />

      <div className="space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold" style={{ color: 'var(--foreground)' }}>
              Leaderboard
            </h1>
            <p className="mt-1 opacity-60" style={{ color: 'var(--foreground)' }}>
              See how you stack up against other participants.
            </p>
          </div>

          <button
            onClick={() => setBountiesOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer whitespace-nowrap shrink-0 mt-1.5 transition-colors"
            style={{
              border: '1px solid var(--border)',
              backgroundColor: 'var(--card)',
              color: 'var(--foreground)',
            }}
          >
            <span>🎯</span>
            <span>Bounties</span>
          </button>
        </header>

        <div
          className="p-6 rounded-xl shadow-sm"
          style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
        >
          {/* Tab switcher + current place */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              {TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer border-none"
                  style={{
                    backgroundColor: tab === t.key ? 'var(--primary)' : 'var(--button)',
                    color: tab === t.key ? 'white' : 'var(--foreground)',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Current place badge */}
            {currentUserRank !== -1 && (
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap"
                style={{ backgroundColor: 'var(--primary)', color: 'white' }}
              >
                <span>Your place</span>
                <span
                  className="flex items-center justify-center rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.25)',
                    width: 42,
                    height: 22,
                  }}
                >
                  {`#${currentUserRank + 1}`}
                </span>
              </div>
            )}
          </div>

          {/* Rows */}
          <div>
            {sorted.map((u, i) => {
              const val = getVal(u);
              const pct = Math.round((val / max) * 100);
              const isCurrentUser = u.id === userId;

              return (
                <div
                  key={u.id}
                  className="flex items-center gap-4 py-4 px-3 -mx-3 rounded-lg transition-colors"
                  style={{
                    borderBottom: '1px solid var(--border)',
                    backgroundColor: isCurrentUser ? 'color-mix(in srgb, var(--primary) 10%, transparent)' : 'transparent',
                  }}
                >
                  {/* Rank */}
                  <span className="text-xl text-center" style={{ minWidth: 28 }}>
                    {i < 3
                      ? MEDALS[i]
                      : <span className="text-sm opacity-50" style={{ color: 'var(--foreground)' }}>{i + 1}</span>}
                  </span>

                  {/* Avatar */}
                  <div
                    className="flex items-center justify-center rounded-full text-sm font-medium shrink-0"
                    style={{
                      width: 36,
                      height: 36,
                      backgroundColor: isCurrentUser ? 'var(--primary)' : 'var(--button)',
                      color: isCurrentUser ? 'white' : 'var(--foreground)',
                    }}
                  >
                    {(u.name || u.email || '?').slice(0, 2).toUpperCase()}
                  </div>

                  {/* Name + bar */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
                      {u.name || u.email}
                      {isCurrentUser && (
                        <span
                          className="ml-2 text-xs px-1.5 py-0.5 rounded-full font-semibold align-middle"
                          style={{ backgroundColor: 'var(--primary)', color: 'white' }}
                        >
                          You
                        </span>
                      )}
                    </p>
                    <div
                      className="mt-1 rounded-full overflow-hidden"
                      style={{ height: 5, backgroundColor: 'var(--border)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: 'var(--primary)' }}
                      />
                    </div>
                  </div>

                  {/* Points */}
                  <div className="text-right shrink-0">
                    <p className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>{val}</p>
                    <p className="text-xs opacity-50" style={{ color: 'var(--foreground)' }}>pts</p>
                  </div>
                </div>
              );
            })}

            {sorted.length === 0 && (
              <p className="text-sm text-center py-8 opacity-50" style={{ color: 'var(--foreground)' }}>
                No participants yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}