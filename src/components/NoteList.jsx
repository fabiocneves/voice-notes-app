import React, { useState, useEffect } from 'react';
import { Trash2, Search, Cloud, Edit2, Check, X, Calendar } from 'lucide-react';

const AudioPlayer = ({ blob }) => {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (!blob) return;
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  if (!url) return null;
  return (
    <audio controls src={url} className="audio-player" />
  );
};

export function NoteList({ notes, searchQuery, onSearchChange, onDeleteNote, onUpdateNote }) {
  const [filterRange, setFilterRange] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState('');
  
  const filteredNotes = notes.filter(note => {
    // text search
    if (searchQuery) {
       const q = searchQuery.toLowerCase();
       const matchesSearch = note.content.toLowerCase().includes(q) || 
                             (note.topic && note.topic.toLowerCase().includes(q)) ||
                             (note.tags && note.tags.some(t => t.toLowerCase().includes(q)));
       if (!matchesSearch) return false;
    }

    // date filter
    const noteDate = new Date(note.createdAt);
    const today = new Date();
    
    if (filterRange !== 'all') {
      if (filterRange === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        if (noteDate < weekAgo) return false;
      } else if (filterRange === 'month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        if (noteDate < monthAgo) return false;
      } else if (filterRange === 'year') {
        const yearAgo = new Date(today);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        if (noteDate < yearAgo) return false;
      } else if (filterRange === 'custom' && filterDate) {
        const noteDateStr = noteDate.toLocaleDateString('en-CA'); // YYYY-MM-DD
        if (noteDateStr !== filterDate) return false;
      }
    }
    
    return true;
  });

  // Group notes by date
  const groupedNotes = filteredNotes.reduce((groups, note) => {
     const date = new Date(note.createdAt);
     
     const today = new Date();
     const yesterday = new Date(today);
     yesterday.setDate(yesterday.getDate() - 1);

     const isToday = date.toDateString() === today.toDateString();
     const isYesterday = date.toDateString() === yesterday.toDateString();

     let dateLabel = date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
     dateLabel = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1); // Capitalize

     if (isToday) dateLabel = "Hoje";
     else if (isYesterday) dateLabel = "Ontem";

     if (!groups[dateLabel]) {
        groups[dateLabel] = [];
     }
     groups[dateLabel].push(note);
     return groups;
  }, {});

  const formatDate = (dateString) => {
    const options = { hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('pt-BR', options).split(' ')[1] || new Date(dateString).toLocaleTimeString('pt-BR', options);
  };

  const handleEditClick = (note) => {
    setEditingId(note.id);
    setEditDraft(note.content);
  };

  const handleSaveEdit = (id) => {
    onUpdateNote(id, { content: editDraft });
    setEditingId(null);
    setEditDraft('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditDraft('');
  };

  return (
    <div className="notes-container">
      <div className="filters-container">
        <div className="search-bar-wrapper">
          <Search className="search-icon" size={20} />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Buscar nas anotações..." 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="date-filter-wrapper range-wrapper">
          <Calendar className="search-icon" size={20} />
          <select 
            className="search-input date-select"
            value={filterRange}
            onChange={(e) => setFilterRange(e.target.value)}
          >
            <option value="all">Desde sempre</option>
            <option value="week">Na última semana</option>
            <option value="month">No último mês</option>
            <option value="year">No último ano</option>
            <option value="custom">Data específica...</option>
          </select>
        </div>
        {filterRange === 'custom' && (
          <div className="date-filter-wrapper">
            <input 
              type="date" 
              className="search-input date-input" 
              style={{ paddingLeft: '1rem' }}
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              title="Filtrar por data"
            />
            {filterDate && (
               <button className="clear-date-btn" onClick={() => setFilterDate('')} title="Limpar data">
                 <X size={14} />
               </button>
            )}
          </div>
        )}
      </div>

      {Object.keys(groupedNotes).length === 0 ? (
        <div className="empty-state">
          <Cloud size={48} opacity={0.2} />
          <p>{notes.length === 0 ? "Nenhuma nota ainda. Comece a gravar!" : "Nenhuma nota encontrada na busca."}</p>
        </div>
      ) : (
        Object.entries(groupedNotes).map(([dateLabel, notesGroup]) => (
          <div key={dateLabel} className="note-group">
            <h3 className="group-header">{dateLabel}</h3>
            <div className="notes-grid">
              {notesGroup.map(note => (
                <div key={note.id} className="note-card">
                  <div className="note-header">
                    <span className="note-date">{formatDate(note.createdAt)}</span>
                    <div className="note-actions">
                      {editingId === note.id ? null : (
                         <>
                           <button onClick={() => handleEditClick(note)} title="Editar nota">
                             <Edit2 size={16} />
                           </button>
                           <button onClick={() => onDeleteNote(note.id)} title="Excluir nota">
                             <Trash2 size={16} />
                           </button>
                         </>
                      )}
                    </div>
                  </div>
                  
                  <div className="note-content">
                    {editingId === note.id ? (
                       <textarea 
                         className="edit-textarea"
                         value={editDraft}
                         onChange={(e) => setEditDraft(e.target.value)}
                         onBlur={() => handleSaveEdit(note.id)}
                         autoFocus
                       />
                    ) : (
                       note.content
                    )}
                    
                    {note.audioBlob && (
                      <AudioPlayer blob={note.audioBlob} />
                    )}
                  </div>

                  <div className="tags-container">
                    {note.topic && (
                      <span className="tag topic">#{note.topic}</span>
                    )}
                    {note.tags && note.tags.map(tag => (
                      <span key={tag} className="tag">#{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
