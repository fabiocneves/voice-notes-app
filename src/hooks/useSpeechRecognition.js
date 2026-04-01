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

  const recognitionRef    = useRef(null);
  const mediaRecorderRef  = useRef(null);
  const audioChunksRef    = useRef([]);
  const isRecordingRef    = useRef(false);
  const transcriptionRef  = useRef('');
  const accumulatedRef    = useRef('');
  const restartTimerRef   = useRef(null);

  useEffect(() => {
    transcriptionRef.current = transcription;
  }, [transcription]);

  useEffect(() => {
    // 1. HTTPS guard — Web Speech API requires HTTPS on mobile
    const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (location.protocol !== 'https:' && !isLocalhost) {
      setIsSupported(false);
      setError('⚠️ A transcrição requer conexão segura (HTTPS). Acesse o app pelo link seguro (https://...).');
      return;
    }

    // 2. API support check
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Seu navegador não suporta transcrição automática. No Android use o Chrome, no iPhone o Safari 14.1+. Você ainda pode adicionar notas manualmente.');
      return;
    }

    const recognition = new SpeechRecognition();
    // Keep continuous:true — it's actually more stable on Android when combined
    // with a proper restart-on-end with a small delay
    recognition.continuous      = true;
    recognition.interimResults  = true;
    recognition.lang            = 'pt-BR';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      // Recognition successfully started — clear any pending restart timer
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }
    };

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
      // These are benign / expected on mobile — do NOT surface to user
      if (['no-speech', 'aborted', 'audio-capture'].includes(event.error)) return;

      if (event.error === 'network') {
        // Network blip — schedule a restart instead of giving up
        if (isRecordingRef.current) {
          restartTimerRef.current = setTimeout(() => {
            if (!isRecordingRef.current) return;
            try { recognition.start(); } catch (e) { /* ignore */ }
          }, 500);
        }
        return;
      }

      console.error('Speech recognition error:', event.error);
      setError(`Erro no reconhecimento de voz: ${event.error}`);
    };

    recognition.onend = () => {
      // CRITICAL FIX: Android Chrome needs ~250ms gap between sessions
      // Calling start() immediately causes a silent InvalidStateError
      if (isRecordingRef.current) {
        restartTimerRef.current = setTimeout(() => {
          if (!isRecordingRef.current) return;
          try { recognition.start(); } catch (e) { /* ignore */ }
        }, 250);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      isRecordingRef.current = false;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      try { recognition.abort(); } catch (e) { /* ignore */ }
    };
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscription('');
    transcriptionRef.current = '';
    accumulatedRef.current   = '';
    audioChunksRef.current   = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeType = getSupportedMimeType();
      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(500);

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
        setError('Permissão de microfone negada. Verifique as configurações do navegador e recarregue a página.');
      } else if (err.name === 'NotFoundError') {
        setError('Nenhum microfone encontrado neste dispositivo.');
      } else {
        setError('Não foi possível acessar o microfone: ' + err.message);
      }
    }
  }, []);

  const stopRecording = useCallback(() => {
    const finalTranscription = transcriptionRef.current;

    isRecordingRef.current = false;
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    setIsRecording(false);

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
    }

    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        resolve({ finalTranscription, audioBlob: null });
        return;
      }

      const mimeType = recorder.mimeType || 'audio/webm';

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
