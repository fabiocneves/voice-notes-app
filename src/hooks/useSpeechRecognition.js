import { useState, useEffect, useRef, useCallback } from 'react';

// Detect the best supported audio MIME type for the current browser/device
function getSupportedMimeType() {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return ''; // let the browser choose
}

export function useSpeechRecognition() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const isRecordingRef = useRef(false); // ref mirror to avoid stale closures in onend

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // iOS Safari and some mobile browsers don't support it
      setIsSupported(false);
      setError('Seu navegador não suporta transcrição automática. A gravação de áudio ainda funcionará, mas o texto precisará ser digitado manualmente. Use o Chrome no Android ou Safari 14.1+ no iPhone.');
      return;
    }

    const recognition = new SpeechRecognition();

    // Use continuous: false on mobile — it works more reliably.
    // We restart it manually on each 'end' event while recording is active.
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'pt-BR';
    recognition.maxAlternatives = 1;

    let accumulatedTranscript = '';

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalFragment = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalFragment += text + ' ';
        } else {
          interimTranscript += text;
        }
      }

      if (finalFragment) {
        accumulatedTranscript += finalFragment;
      }

      setTranscription(accumulatedTranscript + interimTranscript);
    };

    recognition.onerror = (event) => {
      // 'no-speech' is a benign error on mobile (just silence), we can ignore it
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      console.error('Speech recognition error:', event.error);
      setError(`Erro no reconhecimento de voz: ${event.error}`);
    };

    recognition.onend = () => {
      // Use the ref (not state) to avoid stale closure bug
      if (isRecordingRef.current) {
        try {
          recognition.start(); // restart after each short segment
        } catch (e) {
          // ignore 'already started' race conditions
        }
      }
    };

    // Expose a way to reset accumulated transcript when starting fresh
    recognition._resetTranscript = () => { accumulatedTranscript = ''; };

    recognitionRef.current = recognition;

    return () => {
      isRecordingRef.current = false;
      try { recognition.abort(); } catch (e) { /* ignore */ }
    };
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscription('');
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
      mediaRecorder.start(1000);

      // Start speech recognition if supported
      if (recognitionRef.current) {
        recognitionRef.current._resetTranscript();
        isRecordingRef.current = true;
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.warn('Recognition start error:', e);
        }
      }

      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      if (err.name === 'NotAllowedError') {
        setError('Permissão de microfone negada. Verifique as configurações do seu navegador.');
      } else {
        setError('Não foi possível acessar o microfone.');
      }
    }
  }, []);

  const stopRecording = useCallback(() => {
    // Signal onend to NOT restart
    isRecordingRef.current = false;
    setIsRecording(false);

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) { /* ignore */ }
    }

    let audioBlob = null;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      const mimeType = mediaRecorderRef.current.mimeType || 'audio/webm';

      mediaRecorderRef.current.onstop = () => {
        // nothing extra needed here
      };
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());

      audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
    }

    // Read transcription from state — use a snapshot via a callback to avoid stale value
    return { audioBlob };
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
