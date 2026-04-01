import React, { useState, useEffect } from 'react';
import { AudioRecorder } from './components/AudioRecorder';
import { NoteList } from './components/NoteList';
import { useNotesDB } from './hooks/useNotesDB';
import { Mic, Cloud, Sun, Moon } from 'lucide-react';
import './index.css';
import { auth, loginWithGoogle, logout } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

function App() {
  const { notes, addNote, deleteNote, updateNote } = useNotesDB();
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Theme logic
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isDark) {
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <div className="app-container">
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1>
            <Mic size={32} color="var(--accent)" /> VoiceNotes 
            <span className="version-badge">v{import.meta.env.VITE_APP_VERSION}</span>
          </h1>
          <button 
            className="btn btn-icon-only theme-toggle" 
            onClick={toggleTheme}
            title={isDark ? "Modo Claro" : "Modo Escuro"}
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
        
        <div className="auth-header">
           {!authLoading && (
             user ? (
               <div className="user-info">
                 <div className="cloud-indicator online" title="Sincronização em nuvem ativa">
                   <Cloud size={18} />
                   <span>Cloud Sync</span>
                 </div>
                 <img src={user.photoURL} alt={user.displayName} className="user-avatar" />
                 <span className="user-name">{user.displayName.split(' ')[0]}</span>
                 <button className="btn btn-sm" onClick={() => logout()}>Sair</button>
               </div>
             ) : (
               <button className="btn btn-primary" onClick={() => loginWithGoogle()}>
                 Login com Google
               </button>
             )
           )}
        </div>
      </header>

      <main className="main-content">
        {/* Sidebar / Left Column */}
        <aside>
          <AudioRecorder onSaveNote={(text, audioBlob) => addNote(text, audioBlob)} />
        </aside>

        {/* Main Area / Right Column */}
        <section>
          <NoteList 
            notes={notes} 
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onDeleteNote={deleteNote}
            onUpdateNote={updateNote}
          />
        </section>
      </main>
    </div>
  );
}

export default App;
