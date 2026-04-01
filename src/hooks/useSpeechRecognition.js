import { useState, useEffect, useRef } from 'react';

export function useSpeechRecognition() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [error, setError] = useState(null);
  
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Your browser does not support the Web Speech API. Please try Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'pt-BR'; // Assuming Portuguese from the prompt

    recognition.onresult = (event) => {
      let currentTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscription(currentTranscript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setError(`Microphone error: ${event.error}`);
      stopRecording();
    };

    recognition.onend = () => {
      // If we are still supposed to be recording, it means it stopped unexpectedly (like a pause).
      // Web speech API sometimes stops automatically if it hears silence.
      if (isRecording) {
        try {
            recognition.start();
        } catch(e) {
            // Already started exception
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    setError(null);
    setTranscription('');
    audioChunksRef.current = [];

    try {
      // Request microphone access for actual audio blob (to save if we want)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // 1 sec chunks

      // Start speech to text
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
      
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Could not access microphone.');
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      // Also stop the tracks to release the mic light
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }

    // Return the final transcription and an audio blob
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    return { finalTranscription: transcription, audioBlob };
  };

  return {
    isRecording,
    transcription,
    setTranscription,
    startRecording,
    stopRecording,
    error
  };
}
