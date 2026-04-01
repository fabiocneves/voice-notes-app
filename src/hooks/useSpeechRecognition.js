import { useState, useEffect, useRef, useCallback } from 'react';

function getSupportedMimeType() {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];
  for (const type of types) {
    try {
      if (MediaRecorder.isTypeSupported(type)) return type;
    } catch (e) { /* ignore */ }
  }
  return '';
}

export function useSpeechRecognition() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(true);

  // Refs to avoid stale closures in async callbacks
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const isRecordingRef = useRef(false);
  const transcriptionRef = useRef('');   // <-- always has the latest transcript
  const accumulatedRef = useRef('');      // <-- runs across multiple recognition segments

  // Keep transcriptionRef in sync with state
  useEffect(() => {
    transcriptionRef.current = transcription;
  }, [transcription]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Seu navegador não suporta transcrição automática. A gravação de áudio ainda funcionará, mas o texto precisará ser digitado manualmente. No Android, use o Chrome. No iPhone, use o Safari 14.1+.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;      // more reliable on Android
    recognition.interimResults = true;
    recognition.lang = 'pt-BR';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          accumulatedRef.current += text + ' ';
        } else {
          interim = text;
        }
      }
      const full = accumulatedRef.current + interim;
      transcriptionRef.current = full;
      setTranscription(full);
    };

    recognition.onerror = (event) => {
      // 'no-speech' and 'aborted' are benign on mobile
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      console.error('Speech recognition error:', event.error);
      // Don't show network errors as fatal — just log them
      if (event.error === 'network') {
        console.warn('Network error in speech recognition — will retry');
        return;
      }
      setError(`Erro no reconhecimento de voz: ${event.error}`);
    };

    recognition.onend = () => {
      // Restart if we are still supposed to be recording
      if (isRecordingRef.current) {
        try { recognition.start(); } catch (e) { /* race condition, ignore */ }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      isRecordingRef.current = false;
      try { recognition.abort(); } catch (e) { /* ignore */ }
    };
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscription('');
    transcriptionRef.current = '';
    accumulatedRef.current = '';
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeType = getSupportedMimeType();
      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(500); // collect every 500ms for less data loss

      // Start speech recognition
      if (recognitionRef.current) {
        isRecordingRef.current = true;
        try { recognitionRef.current.start(); } catch (e) {
          console.warn('Recognition start error:', e);
        }
      }

      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      if (err.name === 'NotAllowedError') {
        setError('Permissão de microfone negada. Verifique as configurações do seu navegador e recarregue a página.');
      } else if (err.name === 'NotFoundError') {
        setError('Nenhum microfone encontrado neste dispositivo.');
      } else {
        setError('Não foi possível acessar o microfone: ' + err.message);
      }
    }
  }, []);

  /**
   * Returns a Promise that resolves to { finalTranscription, audioBlob }
   * once the MediaRecorder has fully flushed all audio chunks.
   */
  const stopRecording = useCallback(() => {
    // Take the transcription NOW via the ref, before any state clears
    const finalTranscription = transcriptionRef.current;

    // Signal onend to NOT restart recognition
    isRecordingRef.current = false;
    setIsRecording(false);

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) { /* ignore */ }
    }

    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        resolve({ finalTranscription, audioBlob: null });
        return;
      }

      const mimeType = recorder.mimeType || 'audio/webm';

      // onstop fires AFTER the last ondataavailable, so the blob is complete here
      recorder.onstop = () => {
        recorder.stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        resolve({ finalTranscription, audioBlob });
      };

      recorder.stop();
    });
  }, []);

  return {
    isRecording,
    transcription,
    setTranscription,
    startRecording,
    stopRecording,
    error,
    isSupported,
  };
}
