import React, { useState } from 'react';
import { Mic, Square } from 'lucide-react';
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
  // For iOS/unsupported browsers: allow manual text entry
  const [manualText, setManualText] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const handleStart = () => {
    setShowManualInput(false);
    setManualText('');
    startRecording();
  };

  const handleStop = async () => {
    setIsStopping(true);
    try {
      // stopRecording is now a Promise — it resolves after audio is fully flushed
      const { finalTranscription, audioBlob } = await stopRecording();

      if (finalTranscription && finalTranscription.trim()) {
        onSaveNote(finalTranscription.trim(), audioBlob);
        setTranscription('');
      } else if (!isSupported) {
        // iOS: audio recorded but no transcription — let user type manually
        setShowManualInput(true);
      }
      // else: nothing recorded, do nothing
    } catch (e) {
      console.error('Error stopping recording:', e);
    } finally {
      setIsStopping(false);
    }
  };

  const handleSaveManual = () => {
    if (manualText.trim()) {
      onSaveNote(manualText.trim(), null);
      setManualText('');
      setShowManualInput(false);
    }
  };

  const liveLabel = isSupported
    ? 'Gravando e transcrevendo...'
    : 'Gravando áudio...';

  return (
    <div className="card record-panel">
      <h2 className="record-header-text">Gravar Nova Nota</h2>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

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

      {/* Fallback manual text entry for iOS or unsupported browsers */}
      {showManualInput && (
        <div className="transcription-area">
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
            Áudio gravado! Adicione o texto manualmente:
          </p>
          <textarea
            className="transcription-preview active"
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="Digite o conteúdo da nota aqui..."
            autoFocus
          />
          <div className="save-controls">
            <button className="btn btn-primary" onClick={handleSaveManual}>
              Salvar Nota
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
