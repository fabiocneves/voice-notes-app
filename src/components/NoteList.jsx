import React, { useState, useEffect } from 'react';
import { Trash2, Search, Cloud, Edit2, Check, X, Calendar as CalendarIcon } from 'lucide-react';
import { CustomCalendar } from './CustomCalendar';

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
  const [filterRange, setFilterRange] = useState('today');
  const [filterDate, setFilterDate] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  
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
      if (filterRange === 'today') {
        if (noteDate.toDateString() !== today.toDateString()) return false;
      } else if (filterRange === 'week') {
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
        const noteDateStr = noteDate.toLocaleDateString('en-CA');
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
     dateLabel = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);

     if (isToday) dateLabel = "Hoje";
     else if (isYesterday) dateLabel = "Ontem";

     if (!groups[dateLabel]) {
        groups[dateLabel] = [];
     }
     groups[dateLabel].push(note);
     return groups;
  }, {});

  const formatDate = (dateString) => {
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleTimeString('pt-BR', timeOptions);
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

  const formatDateLabel = (d) => {
    if (!d) return "Data";
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }

  return (
    <div className="notes-container">
      <div className="filters-container">
        <div className="search-bar-wrapper">
          <Search className="search-icon" size={20} />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Buscar..." 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="date-filter-wrapper range-wrapper">
          <CalendarIcon className="search-icon" size={20} />
          <select 
            className="search-input date-select"
            value={filterRange}
            onChange={(e) => setFilterRange(e.target.value)}
          >
            <option value="today">Hoje</option>
            <option value="all">Tudo</option>
            <option value="week">Semana</option>
            <option value="month">Mês</option>
            <option value="year">Ano</option>
            <option value="custom">Histórico...</option>
          </select>
        </div>
        {filterRange === 'custom' && (
          <div className="date-filter-wrapper">
             <button 
               className={`search-input date-select-btn ${filterDate ? 'active' : ''}`}
               onClick={() => setShowCalendar(true)}
             >
               <CalendarIcon size={18} />
               {filterDate ? formatDateLabel(filterDate) : 'Selecionar'}
             </button>
             {filterDate && (
               <button className="clear-date-btn" onClick={() => setFilterDate('')} title="Limpar">
                 <X size={14} />
               </button>
             )}
          </div>
        )}
      </div>

      {showCalendar && (
        <CustomCalendar 
          notes={notes}
          selectedDate={filterDate}
          onDateSelect={setFilterDate}
          onClose={() => setShowCalendar(false)}
        />
      )}

      {/* Rest of note cards... */}
      {Object.keys(groupedNotes).length === 0 ? (
        <div className="empty-state">
          <Cloud size={48} opacity={0.2} />
          <p>{notes.length === 0 ? "Grave uma nota para começar!" : "Nenhuma nota encontrada."}</p>
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
                       <button onClick={() => handleEditClick(note)} title="Editar">
                         <Edit2 size={16} />
                       </button>
                       <button onClick={() => onDeleteNote(note.id)} title="Excluir">
                         <Trash2 size={16} />
                       </button>
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
                      <button 
                        className="tag topic" 
                        onClick={() => onSearchChange(note.topic)}
                        title={`Filtrar por #${note.topic}`}
                      >
                        #{note.topic}
                      </button>
                    )}
                    {note.tags && note.tags.map(tag => (
                      <button 
                        key={tag} 
                        className="tag"
                        onClick={() => onSearchChange(tag)}
                        title={`Filtrar por #${tag}`}
                      >
                        #{tag}
                      </button>
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
