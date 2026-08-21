import React, { useState, useEffect } from 'react';
import EditorPage from './pages/EditorPage';
import RoomDialog from './components/RoomDialog';

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
  );
}
