import React, { useState, useEffect } from 'react';
import { AudioRecorder } from './components/AudioRecorder';
import { NoteList } from './components/NoteList';
import { useNotesDB } from './hooks/useNotesDB';
import { Mic, Cloud, Sun, Moon } from 'lucide-react';
import './index.css';

function App() {
  const { notes, addNote, deleteNote, updateNote } = useNotesDB();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Theme logic
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

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
        
        {/* Mock cloud sync indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          <Cloud size={18} /> 
          <span>Sincronizado localmente</span>
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
