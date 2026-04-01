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

  const initRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Navegador sem suporte a voz.');
      return null;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false; // Manually restarting is MORE stable on many Android flavors
    rec.interimResults = true;
    rec.lang = 'pt-BR';

    rec.onresult = (event) => {
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

    rec.onerror = (event) => {
      console.warn('Speech recognition error event:', event.error);
      if (['no-speech', 'aborted', 'audio-capture'].includes(event.error)) return;
      
      if (event.error === 'network') {
         // Silently wait for restart
         return;
      }
    };

    rec.onend = () => {
      if (isRecordingRef.current) {
        if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
        restartTimerRef.current = setTimeout(() => {
          if (!isRecordingRef.current) return;
          try {
            recognitionRef.current.start();
          } catch (e) {
            // Re-init if start fails repeatedly
            recognitionRef.current = initRecognition();
            if (recognitionRef.current) recognitionRef.current.start();
          }
        }, 300);
      }
    };

    return rec;
  }, []);

  useEffect(() => {
    const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (location.protocol !== 'https:' && !isLocalhost) {
      setIsSupported(false);
      setError('⚠️ HTTPS necessário para voz no celular.');
      return;
    }

    recognitionRef.current = initRecognition();

    return () => {
      isRecordingRef.current = false;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      try { recognitionRef.current?.abort(); } catch (e) {}
    };
  }, [initRecognition]);

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscription('');
    transcriptionRef.current = '';
    accumulatedRef.current = '';
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeType = getSupportedMimeType();
      mediaRecorderRef.current = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorderRef.current.start(500);

      isRecordingRef.current = true;
      setIsRecording(true);

      // Explicitly start or restart recognition
      try {
        recognitionRef.current?.start();
      } catch (e) {
        // If already started or failed, try to regenerate
        recognitionRef.current = initRecognition();
        recognitionRef.current?.start();
      }

    } catch (err) {
      setError('Erro ao abrir microfone. Verifique as permissões.');
    }
  }, [initRecognition]);

  const stopRecording = useCallback(() => {
    const finalTranscription = transcriptionRef.current;
    isRecordingRef.current = false;
    setIsRecording(false);
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);

    try { recognitionRef.current?.stop(); } catch (e) {}

    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        resolve({ finalTranscription, audioBlob: null });
        return;
      }
      recorder.onstop = () => {
        recorder.stream.getTracks().forEach(t => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType });
        resolve({ finalTranscription, audioBlob });
      };
      recorder.stop();
    });
  }, []);

  return { isRecording, transcription, startRecording, stopRecording, error, isSupported };
}
