import React, { useState, useEffect, Component } from 'react';
import EditorPage from './pages/EditorPage';
import RoomDialog from './components/RoomDialog';

// Robust React ErrorBoundary to catch any uncaught errors and prevent blank screens
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('CodeSync UI Crash caught by ErrorBoundary:', error, errorInfo);
  }

  handleReset = () => {
    localStorage.removeItem('codesync_room_id');
    window.location.href = window.location.origin;
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-screen bg-[#0d1117] text-slate-100 flex flex-col items-center justify-center p-6 select-none font-sans">
          <div className="max-w-md w-full bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto text-xl font-bold">
              !
            </div>
            <h2 className="text-lg font-bold text-white">Something went wrong</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              An unexpected interface error occurred. You can safely return to the home screen and create or join a clean room.
            </p>
            {this.state.error && (
              <div className="text-[11px] font-mono p-3 rounded-lg bg-black/50 text-rose-300 text-left overflow-x-auto max-h-32 border border-rose-500/20">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-500/25 transition-all"
            >
              Reset Session & Go to Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Generate consistent random user color from a vibrant palette
const COLLAB_COLORS = [
  '#38bdf8', // Sky Blue
  '#818cf8', // Indigo
  '#c084fc', // Purple
  '#f472b6', // Pink
  '#fb7185', // Rose
  '#fb923c', // Orange
  '#facc15', // Yellow
  '#4ade80', // Green
  '#2dd4bf', // Teal
  '#34d399', // Emerald
];

export default function App() {
  const [roomId, setRoomId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [initialLanguage, setInitialLanguage] = useState('python');

  // Load user profile and initial room from URL or LocalStorage
  useEffect(() => {
    // 1. Restore or generate user profile
    const savedUser = localStorage.getItem('codesync_user');
    let profile;
    if (savedUser) {
      try {
        profile = JSON.parse(savedUser);
      } catch (e) {
        profile = null;
      }
    }
    if (!profile || !profile.name) {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      profile = {
        name: `Dev-${randomNum}`,
        color: COLLAB_COLORS[Math.floor(Math.random() * COLLAB_COLORS.length)],
      };
      localStorage.setItem('codesync_user', JSON.stringify(profile));
    }
    setUserProfile(profile);

    // 2. Restore saved theme
    const savedTheme = localStorage.getItem('codesync_theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');

    // 3. Check URL query params for ?room=...
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    const savedRoom = localStorage.getItem('codesync_room_id');

    if (roomParam) {
      const cleanRoom = roomParam.trim().toUpperCase();
      setRoomId(cleanRoom);
      localStorage.setItem('codesync_room_id', cleanRoom);
    } else if (savedRoom) {
      setRoomId(savedRoom);
    } else {
      setIsRoomDialogOpen(true);
    }
  }, []);

  const handleJoinRoom = (newRoomId, username, language = 'python') => {
    const cleanRoom = newRoomId.trim().toUpperCase();
    const updatedProfile = {
      ...userProfile,
      name: username?.trim() || userProfile.name,
    };
    setUserProfile(updatedProfile);
    localStorage.setItem('codesync_user', JSON.stringify(updatedProfile));

    setRoomId(cleanRoom);
    setInitialLanguage(language);
    localStorage.setItem('codesync_room_id', cleanRoom);

    // Update browser URL query string without reloading
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('room', cleanRoom);
    window.history.pushState({}, '', newUrl);

    setIsRoomDialogOpen(false);
  };

  const handleLeaveRoom = () => {
    setRoomId(null);
    localStorage.removeItem('codesync_room_id');
    const newUrl = new URL(window.location);
    newUrl.searchParams.delete('room');
    window.history.pushState({}, '', newUrl);
    setIsRoomDialogOpen(true);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('codesync_theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <ErrorBoundary>
      <div className={`min-h-screen w-screen overflow-hidden flex flex-col ${theme === 'dark' ? 'bg-[#0d1117] text-[#c9d1d9]' : 'bg-slate-50 text-slate-800'}`}>
        {roomId && userProfile ? (
          <EditorPage
            roomId={roomId}
            user={userProfile}
            theme={theme}
            onToggleTheme={toggleTheme}
            onLeaveRoom={handleLeaveRoom}
            initialLanguage={initialLanguage}
          />
        ) : (
          <RoomDialog
            isOpen={true}
            user={userProfile}
            onJoin={handleJoinRoom}
            onClose={() => {}}
          />
        )}

        {isRoomDialogOpen && roomId && (
          <RoomDialog
            isOpen={isRoomDialogOpen}
            user={userProfile}
            onJoin={handleJoinRoom}
            onClose={() => setIsRoomDialogOpen(false)}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
