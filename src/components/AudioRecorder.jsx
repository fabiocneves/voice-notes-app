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

  // For iOS/unsupported browsers: allow manual text entry
  const [manualText, setManualText] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const handleStart = () => {
    startRecording();
  };

  const handleStop = () => {
    const { audioBlob } = stopRecording();
    const textToSave = transcription.trim();

    if (textToSave) {
      onSaveNote(textToSave, audioBlob);
    } else if (!isSupported && audioBlob) {
      // If speech API not supported, still save the audio blob so user can add text manually
      setShowManualInput(true);
    }

    setTranscription('');
  };

  const handleSaveManual = () => {
    if (manualText.trim()) {
      onSaveNote(manualText, null);
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
        {!isRecording && (
          <button
            className="record-button-main"
            onClick={handleStart}
            title="Começar a gravar"
          >
            <Mic size={32} />
          </button>
        )}

        {isRecording && (
          <button
            className="record-button-main recording"
            onClick={handleStop}
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
            Áudio salvo! Adicione o texto manualmente:
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
