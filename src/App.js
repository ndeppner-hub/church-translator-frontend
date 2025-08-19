import React, { useState, useEffect, useRef } from 'react';

const WS_SERVER = "wss://church-translator-backend.onrender.com";
const ROLE = localStorage.getItem("role") || "listener"; // 'speaker' or 'listener'

const App = () => {
  return (
    <div style={{ minHeight: '100vh', padding: '2rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Church Live Translator</h1>
      <RoleToggle />
      {ROLE === 'speaker' ? <Speaker /> : <Listener />}
    </div>
  );
};

const RoleToggle = () => {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <button onClick={() => { localStorage.setItem('role', 'speaker'); window.location.reload(); }} style={{ marginRight: '1rem' }}>Speaker Mode</button>
      <button onClick={() => { localStorage.setItem('role', 'listener'); window.location.reload(); }}>Listener Mode</button>
    </div>
  );
};

const Speaker = () => {
  const [transcript, setTranscript] = useState("");
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = new WebSocket(WS_SERVER);
    return () => socketRef.current?.close();
  }, []);

  const startSpeechRecognition = () => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      alert("Your browser does not support speech recognition. Please use Chrome or a desktop browser.");
      return;
    }
    const recognition = new SpeechRecognitionClass();
    recognition.lang = 'en-US';
    recognition.continuous = true;

    recognition.onresult = async (event) => {
      const text = event.results[event.results.length - 1][0].transcript;
      setTranscript(text);

      const response = await fetch("https://church-translator-backend.onrender.com/translate", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const { swahiliText } = await response.json();
      socketRef.current.send(swahiliText);
    };

    recognition.start();
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>Speaker Mode</h2>
      <button onClick={startSpeechRecognition} style={{ backgroundColor: '#007bff', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.25rem' }}>Start Speaking</button>
      <p style={{ marginTop: '1rem' }}>Transcript: {transcript}</p>
    </div>
  );
};

const Listener = () => {
  const [swahiliText, setSwahiliText] = useState("");
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = new WebSocket(WS_SERVER);

    socketRef.current.onmessage = (event) => {
      const msg = event.data;
      setSwahiliText(msg);
      const utterance = new SpeechSynthesisUtterance(msg);
      utterance.lang = 'sw';
      window.speechSynthesis.speak(utterance);
    };

    return () => socketRef.current?.close();
  }, []);

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>Listener Mode</h2>
      <p style={{ fontSize: '1rem', marginTop: '1rem' }}>Swahili: {swahiliText}</p>
    </div>
  );
};

export default App;
