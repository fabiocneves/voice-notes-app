import React, { useState } from 'react';
import { Mic, Square, Save, RotateCcw } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

export function AudioRecorder({ onSaveNote }) {
  const {
    isRecording,
    transcription,
    setTranscription,
    startRecording,
    stopRecording,
    error
  } = useSpeechRecognition();

  const [finalText, setFinalText] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const handleStart = () => {
    setFinalText('');
    setShowPreview(true);
    startRecording();
  };

  const handleStop = () => {
    const { finalTranscription, audioBlob } = stopRecording();
    const textToSave = finalTranscription || transcription;
    
    if (textToSave.trim()) {
      onSaveNote(textToSave, audioBlob);
    }
    
    setTranscription('');
    setFinalText('');
    setShowPreview(false);
  };

  // We removed handleSave and handleDiscard since it autosaves


  return (
    <div className="card record-panel">
      <h2 className="record-header-text">Gravar Nova Nota</h2>
      
      {error && (
        <div style={{ color: 'var(--danger)', fontSize: '0.9rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div className="record-btn-container">
        {!isRecording && !showPreview && (
          <button className="record-button-main" onClick={handleStart} title="Começar a gravar">
            <Mic size={32} />
          </button>
        )}
        
        {isRecording && (
          <button className="record-button-main recording" onClick={handleStop} title="Parar gravação">
            <Square size={32} fill="currentColor" />
          </button>
        )}
      </div>

      {isRecording && (
        <div className="transcription-area">
          <div className="live-indicator">
            <span className="live-dot"></span> Gravando e transcrevendo...
          </div>
          <textarea 
            className="transcription-preview active"
            value={transcription}
            readOnly
            disabled
            placeholder="A transcrição aparecerá aqui..."
          />
        </div>
      )}
    </div>
  );
}
