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
  const audioCtxRef       = useRef(null);

  useEffect(() => {
    transcriptionRef.current = transcription;
  }, [transcription]);

  const initRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return null;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true; 
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
      const full = (accumulatedRef.current + interim).trim();
      transcriptionRef.current = full;
      setTranscription(full);
    };

    rec.onerror = (event) => {
      console.warn('Speech recognition error event:', event.error);
      if (['no-speech', 'audio-capture', 'network'].includes(event.error)) return;
      if (event.error === 'not-allowed') {
        setError('Microfone bloqueado pelo navegador.');
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
            recognitionRef.current = initRecognition();
            if (recognitionRef.current) recognitionRef.current.start();
          }
        }, 150); // Faster restart for better responsiveness
      }
    };

    return rec;
  }, []);

  useEffect(() => {
    const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (location.protocol !== 'https:' && !isLocalhost) {
      setIsSupported(false);
      setError('⚠️ HTTPS é obrigatório para voz no celular.');
      return;
    }

    recognitionRef.current = initRecognition();

    return () => {
      isRecordingRef.current = false;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      try { recognitionRef.current?.abort(); } catch (e) {}
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, [initRecognition]);

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscription('');
    transcriptionRef.current = '';
    accumulatedRef.current = '';
    audioChunksRef.current = [];

    try {
      // 1. Force AudioContext Resume (User Gesture Context)
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume();
      }

      // 2. Main Stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      // 3. MediaRecorder
      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorderRef.current = recorder;
      recorder.start(500);

      // 4. Speech Recognition
      isRecordingRef.current = true;
      setIsRecording(true);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          recognitionRef.current = initRecognition();
          recognitionRef.current?.start();
        }
      }

    } catch (err) {
      console.error('Mic Access Error:', err);
      setError('Erro: Sem acesso ao microfone. Verifique as permissões de "Microfone" e "Som" no Chrome Android.');
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
