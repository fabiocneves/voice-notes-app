import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export function CustomCalendar({ notes, selectedDate, onDateSelect, onClose }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Helper to get dates with notes for the current month
  const datesWithNotes = new Set(
    notes.map(note => new Date(note.createdAt).toLocaleDateString('en-CA'))
  );

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const monthName = currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const renderDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    
    const days = [];
    // Padding for first week
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const hasNote = datesWithNotes.has(dateStr);
      const isSelected = selectedDate === dateStr;
      const isToday = new Date().toLocaleDateString('en-CA') === dateStr;

      days.push(
        <button
          key={d}
          className={`calendar-day ${hasNote ? 'has-notes' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
          onClick={() => {
            onDateSelect(dateStr);
            onClose();
          }}
        >
          {d}
          {hasNote && <span className="day-dot"></span>}
        </button>
      );
    }
    return days;
  };

  return (
    <div className="custom-calendar-overlay" onClick={onClose}>
      <div className="custom-calendar-card card" onClick={e => e.stopPropagation()}>
        <div className="calendar-header-nav">
          <button className="nav-btn" onClick={handlePrevMonth}><ChevronLeft size={20} /></button>
          <h3>{capitalizedMonth}</h3>
          <button className="nav-btn" onClick={handleNextMonth}><ChevronRight size={20} /></button>
          <button className="close-calendar-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="calendar-weekdays">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
            <div key={d} className="weekday">{d}</div>
          ))}
        </div>
        
        <div className="calendar-days-grid">
          {renderDays()}
        </div>
        
        <div className="calendar-footer-legend">
          <div className="legend-item">
            <span className="dot-indicator"></span> Dias com notas
          </div>
        </div>
      </div>
    </div>
  );
}
