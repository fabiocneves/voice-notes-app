import React, { useState } from 'react';
import { AudioRecorder } from './components/AudioRecorder';
import { NoteList } from './components/NoteList';
import { useNotesDB } from './hooks/useNotesDB';
import { Mic, Cloud } from 'lucide-react';
import './index.css';

function App() {
  const { notes, addNote, deleteNote, updateNote } = useNotesDB();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="app-container">
      <header className="header">
        <h1><Mic size={32} color="var(--accent)" /> VoiceNotes</h1>
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
