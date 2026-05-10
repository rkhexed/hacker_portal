import { useState, useEffect } from 'react';
import { Users, Search, UserPlus, Plus, Loader2, CheckCircle, Pencil, Save } from 'lucide-react';
import Loading from '../components/Loading';
import { useAuth } from '../contexts/AuthContext';

const API_URL = "http://localhost:8080";

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [user, setUser] = useState(null);
  const [userTeam, setUserTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const { session } = useAuth();

  const [newTeam, setNewTeam] = useState({ name: '', looking_for: '', has_space: true });
  const [editTeam, setEditTeam] = useState({ name: '', looking_for: '', has_space: true });
  

  // For now, using test user email - replace with auth context
  const userEmail = session?.user?.email || "test.hacker@casehacks.ca";

  const fetchTeams = async () => {
    try {
      const res = await fetch(`${API_URL}/api/teams/available`);
      const data = await res.json();
      setTeams(data.teams || []);
    } catch (err) {
      console.error("Error fetching teams:", err);
    }
  };

  const fetchUser = async () => {
    try {
      const userRes = await fetch(`${API_URL}/api/user/email/${encodeURIComponent(userEmail)}`);
      const userData = await userRes.json();
      const fetchedUser = userData.user;
      setUser(fetchedUser);

      if (fetchedUser?.team_id) {
        const teamRes = await fetch(`${API_URL}/api/team/${fetchedUser.team_id}`);
        const teamData = await teamRes.json();
        setUserTeam(teamData.team);
        setEditTeam({
          name: teamData.team?.name || '',
          looking_for: teamData.team?.looking_for || '',
          has_space: teamData.team?.has_space ?? true,
        });
      }
    } catch (err) {
      console.error("Error fetching user:", err);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        await Promise.all([fetchUser(), fetchTeams()]);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleUpdateTeam = async (e) => {
    e.preventDefault();
    if (!editTeam.name.trim()) {
      setMessage({ type: 'error', text: 'Team name is required' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`${API_URL}/api/team/${userTeam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editTeam),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Team updated successfully!' });
        setEditMode(false);
        // Refresh user and teams data
        fetchUser();
        fetchTeams();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to update team' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    }

    setSaving(false);
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeam.name.trim()) {
      setMessage({ type: 'error', text: 'Team name is required' });
      return;
    }

    setCreating(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`${API_URL}/api/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTeam,
          creator_email: userEmail
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Team created successfully!' });
        setNewTeam({ name: '', looking_for: '', has_space: true });
        setShowCreateForm(false);
        fetchTeams(); // Refresh the list
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to create team' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    }

    setCreating(false);
  };

  const filteredTeams = teams.filter(team => 
    team.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.looking_for?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold" style={{ color: 'var(--foreground)' }}>
            {userTeam ? 'Your Team' : 'Find a Team'}
          </h1>
          <p className="mt-1" style={{ color: 'var(--foreground)', opacity: 0.6 }}>
            {userTeam ? 'Manage your team and find new members' : 'Browse teams looking for members or create your own'}
          </p>
        </div>
        {!userTeam && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-white transition-colors"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            <Plus className="w-4 h-4" />
            <span>{showCreateForm ? 'Cancel' : 'Create Team'}</span>
          </button>
        )}
      </header>

      {/* Your Current Team Card */}
      {userTeam && (
        <div 
          className="p-6 rounded-xl shadow-sm"
          style={{ backgroundColor: 'var(--card)', border: '2px solid var(--primary)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                You're on a team!
              </h2>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                Member
              </span>
              <button
                onClick={() => setEditMode(!editMode)}
                className="p-2 rounded-lg transition-colors"
                style={{ backgroundColor: 'var(--button)' }}
              >
                <Pencil className="w-4 h-4" style={{ color: 'var(--foreground)' }} />
              </button>
            </div>
          </div>
          
          {editMode ? (
            <form onSubmit={handleUpdateTeam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                  Team Name *
                </label>
                <input
                  type="text"
                  value={editTeam.name}
                  onChange={(e) => setEditTeam({ ...editTeam, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: 'var(--background)', 
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)'
                  }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                  Looking For
                </label>
                <input
                  type="text"
                  value={editTeam.looking_for}
                  onChange={(e) => setEditTeam({ ...editTeam, looking_for: e.target.value })}
                  placeholder="e.g., Frontend developer, UI/UX designer"
                  className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: 'var(--background)', 
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)'
                  }}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit_has_space"
                  checked={editTeam.has_space}
                  onChange={(e) => setEditTeam({ ...editTeam, has_space: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="edit_has_space" className="text-sm" style={{ color: 'var(--foreground)' }}>
                  Open to new members
                </label>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium text-white transition-colors disabled:opacity-60"
                  style={{ backgroundColor: 'var(--primary)' }}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditMode(false);
                    setEditTeam({
                      name: userTeam.name || '',
                      looking_for: userTeam.looking_for || '',
                      has_space: userTeam.has_space ?? true
                    });
                  }}
                  className="px-4 py-2 rounded-lg font-medium border transition-colors"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                {userTeam.name}
              </h3>
              
              {userTeam.looking_for && (
                <p className="text-sm mb-4" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                  Looking for: {userTeam.looking_for}
                </p>
              )}

              <p className="text-sm mb-4" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                Status: {userTeam.has_space ? '🟢 Open to new members' : '🔴 Not accepting members'}
              </p>
              
              {userTeam.users && userTeam.users.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                    Team Members ({userTeam.users.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {userTeam.users.map((member) => (
                      <span 
                        key={member.id}
                        className={`text-sm px-3 py-1 rounded-full ${
                          member.email === userEmail 
                            ? 'bg-green-100 text-green-700' 
                            : ''
                        }`}
                        style={member.email !== userEmail ? { backgroundColor: 'var(--button)', color: 'var(--foreground)' } : {}}
                      >
                        {member.name || member.email?.split('@')[0]}
                        {member.email === userEmail && ' (You)'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Success/Error Message */}
      {message.text && (
        <div 
          className={`p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-red-100 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Create Team Form */}
      {showCreateForm && !userTeam && (
        <div 
          className="p-6 rounded-xl shadow-sm"
          style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
            Create a New Team
          </h2>
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                Team Name *
              </label>
              <input
                type="text"
                value={newTeam.name}
                onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                placeholder="Enter your team name"
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                style={{ 
                  backgroundColor: 'var(--background)', 
                  borderColor: 'var(--border)',
                  color: 'var(--foreground)'
                }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                Looking For
              </label>
              <input
                type="text"
                value={newTeam.looking_for}
                onChange={(e) => setNewTeam({ ...newTeam, looking_for: e.target.value })}
                placeholder="e.g., Frontend developer, UI/UX designer"
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                style={{ 
                  backgroundColor: 'var(--background)', 
                  borderColor: 'var(--border)',
                  color: 'var(--foreground)'
                }}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
                Describe the skills or roles you're looking for in teammates
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="has_space"
                checked={newTeam.has_space}
                onChange={(e) => setNewTeam({ ...newTeam, has_space: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="has_space" className="text-sm" style={{ color: 'var(--foreground)' }}>
                Open to new members
              </label>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium text-white transition-colors disabled:opacity-60"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create Team</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search 
          className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" 
          style={{ color: 'var(--foreground)', opacity: 0.4 }}
        />
        <input
          type="text"
          placeholder="Search teams by name, description, or skills needed..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
          style={{ 
            backgroundColor: 'var(--card)', 
            borderColor: 'var(--border)',
            color: 'var(--foreground)'
          }}
        />
      </div>

      {/* Teams Grid */}
      {filteredTeams.length === 0 ? (
        <div 
          className="text-center py-12 rounded-xl"
          style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <Users className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--foreground)', opacity: 0.3 }} />
          <p style={{ color: 'var(--foreground)', opacity: 0.6 }}>
            {searchQuery ? 'No teams match your search' : 'No teams looking for members right now'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTeams.map((team) => (
            <div 
              key={team.id}
              className="p-6 rounded-xl shadow-sm transition-all hover:shadow-md"
              style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                  {team.name}
                </h3>
                <span 
                  className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700"
                >
                  Open
                </span>
              </div>

              {team.looking_for && (
                <div className="mb-4">
                  <p className="text-xs font-medium mb-2" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
                    Looking for:
                  </p>
                  <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                    {team.looking_for}
                  </p>
                </div>
              )}

              {/* Team Members */}
              {team.users && team.users.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium mb-2" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
                    Current members ({team.users.length}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {team.users.map((member) => (
                      <span 
                        key={member.id}
                        className="text-xs px-2 py-1 rounded-full"
                        style={{ backgroundColor: 'var(--button)', color: 'var(--foreground)' }}
                      >
                        {member.name || member.email?.split('@')[0]}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Show "Your Team" badge or Request to Join button */}
              {userTeam?.id === team.id ? (
                <div 
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium bg-green-100 text-green-700"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Your Team</span>
                </div>
              ) : (
                <button
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium text-white transition-colors"
                  style={{ backgroundColor: 'var(--primary)' }}
                  onClick={() => {
                    // TODO: Implement join request functionality
                    alert(`Request to join "${team.name}" - Feature coming soon!`);
                  }}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Request to Join</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div 
        className="p-4 rounded-xl text-sm"
        style={{ backgroundColor: 'var(--button)', color: 'var(--foreground)' }}
      >
        <p className="font-medium mb-1">Looking for teammates?</p>
        <p style={{ opacity: 0.7 }}>
          Teams will review your request and reach out if interested. Make sure your profile is complete with your skills and experience!
        </p>
      </div>
    </div>
  );
}
