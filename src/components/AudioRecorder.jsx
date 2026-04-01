import React, { useState } from 'react';
import { Mic, Square, PenLine } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

export function AudioRecorder({ onSaveNote }) {
  const {
    isRecording,
    transcription,
    setTranscription,
    startRecording,
    stopRecording,
    error,
    isSupported,
  } = useSpeechRecognition();

  const [isStopping, setIsStopping]     = useState(false);
  const [mode, setMode]                  = useState('voice'); // 'voice' | 'manual'
  const [manualText, setManualText]      = useState('');

  /* ─── Voice handlers ─── */
  const handleStart = () => startRecording();

  const handleStop = async () => {
    setIsStopping(true);
    try {
      const { finalTranscription, audioBlob } = await stopRecording();
      const text = finalTranscription?.trim();
      if (text) {
        onSaveNote(text, audioBlob);
        setTranscription('');
      }
    } catch (e) {
      console.error('Error stopping recording:', e);
    } finally {
      setIsStopping(false);
    }
  };

  /* ─── Manual note handler ─── */
  const handleSaveManual = () => {
    if (manualText.trim()) {
      onSaveNote(manualText.trim(), null);
      setManualText('');
    }
  };

  const handleManualKeyDown = (e) => {
    // Ctrl/Cmd + Enter saves
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSaveManual();
    }
  };

  const liveLabel = isSupported ? 'Gravando e transcrevendo...' : 'Gravando áudio...';

  return (
    <div className="card record-panel">

      {/* Mode Toggle */}
      <div className="mode-toggle">
        <button
          className={`mode-btn ${mode === 'voice' ? 'active' : ''}`}
          onClick={() => setMode('voice')}
        >
          <Mic size={16} /> Voz
        </button>
        <button
          className={`mode-btn ${mode === 'manual' ? 'active' : ''}`}
          onClick={() => setMode('manual')}
        >
          <PenLine size={16} /> Manual
        </button>
      </div>

      {/* Error banner */}
      {error && mode === 'voice' && (
        <div className="error-banner">{error}</div>
      )}

      {/* ── VOICE MODE ── */}
      {mode === 'voice' && (
        <>
          <div className="record-btn-container">
            {!isRecording && !isStopping && (
              <button
                className="record-button-main"
                onClick={handleStart}
                title="Começar a gravar"
              >
                <Mic size={32} />
              </button>
            )}
            {(isRecording || isStopping) && (
              <button
                className={`record-button-main ${isRecording ? 'recording' : ''}`}
                onClick={isRecording ? handleStop : undefined}
                disabled={isStopping}
                title="Parar gravação"
              >
                <Square size={32} fill="currentColor" />
              </button>
            )}
          </div>

          {isRecording && (
            <div className="transcription-area">
              <div className="live-indicator">
                <span className="live-dot"></span> {liveLabel}
              </div>
              {isSupported && (
                <textarea
                  className="transcription-preview active"
                  value={transcription}
                  readOnly
                  disabled
                  placeholder="A transcrição aparecerá aqui..."
                />
              )}
            </div>
          )}
        </>
      )}

      {/* ── MANUAL MODE ── */}
      {mode === 'manual' && (
        <div className="transcription-area" style={{ marginTop: '0.5rem' }}>
          <textarea
            className="transcription-preview active"
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            onKeyDown={handleManualKeyDown}
            placeholder="Digite sua nota aqui... (Ctrl+Enter para salvar)"
            rows={6}
            autoFocus
          />
          <div className="save-controls">
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
              Ctrl+Enter para salvar
            </span>
            <button
              className="btn btn-primary"
              onClick={handleSaveManual}
              disabled={!manualText.trim()}
            >
              Salvar Nota
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
