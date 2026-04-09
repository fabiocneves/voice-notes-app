import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Save } from 'lucide-react';
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

  const [isStopping, setIsStopping] = useState(false);
  const [content, setContent] = useState('');
  const lastAudioBlobRef = useRef(null);

  // Sync the speech recognition text into our editable box
  useEffect(() => {
    if (isRecording) {
      setContent(transcription);
    }
  }, [transcription, isRecording]);

  const handleStart = () => {
    lastAudioBlobRef.current = null;
    setContent('');
    startRecording();
  };

  const handleStop = async () => {
    setIsStopping(true);
    try {
      const { finalTranscription, audioBlob } = await stopRecording();
      // Keep output in textarea for any manual fixes
      setContent(finalTranscription || content);
      lastAudioBlobRef.current = audioBlob;
      setTranscription(''); // Clear hook
    } catch (e) {
      console.error('Error stopping recording:', e);
    } finally {
      setIsStopping(false);
    }
  };

  const handleSave = () => {
    if (content.trim()) {
      onSaveNote(content.trim(), lastAudioBlobRef.current);
      setContent('');
      lastAudioBlobRef.current = null;
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  const liveLabel = isSupported ? 'Gravando sua voz...' : 'Gravando áudio (sem suporte a texto)...';

  return (
    <div className="card record-panel">
      {error && (
        <div className="error-banner">{error}</div>
      )}

      <div className="transcription-area">
        {isRecording && (
          <div className="live-indicator" style={{ marginBottom: '0.5rem' }}>
            <span className="live-dot"></span> {liveLabel}
          </div>
        )}
        
        <textarea
          className={`transcription-preview active ${isRecording ? 'recording-active' : ''}`}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Comece a falar no microfone ou digite sua nota aqui..."
          rows={6}
          disabled={isRecording} 
        />
        
        <div className="action-buttons-group" style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'center' }}>
          {!isRecording && !isStopping && (
            <button
              className="record-button-main"
              onClick={handleStart}
              title="Gravar com a voz"
              style={{ width: 'auto', padding: '0.5rem 1rem', borderRadius: '8px', display: 'flex', gap: '0.5rem', flex: 1 }}
            >
              <Mic size={20} /> Falar
            </button>
          )}

          {(isRecording || isStopping) && (
            <button
              className={`record-button-main ${isRecording ? 'recording' : ''}`}
              onClick={isRecording ? handleStop : undefined}
              disabled={isStopping}
              title="Parar gravação"
              style={{ width: 'auto', padding: '0.5rem 1rem', borderRadius: '8px', display: 'flex', gap: '0.5rem', flex: 1 }}
            >
              <Square size={20} fill="currentColor" /> Parar
            </button>
          )}

          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!content.trim() || isRecording || isStopping}
            style={{ flex: 1, height: '100%', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}
          >
            <Save size={20} /> Salvar
          </button>
        </div>
        
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.5rem' }}>
          Dica: Você pode editar o texto antes de salvar. (Ctrl+Enter salva rápido)
        </div>
      </div>
    </div>
  );
}
