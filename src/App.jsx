import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io("https://geo-server-676h.onrender.com");

const getRoomFromCoords = (latitude, longitude) => {
  const lat = latitude.toFixed(3);
  const lon = longitude.toFixed(3);
  return `${lat}:${lon}`;
};

function App() {
  const [location, setLocation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setLocation(coords);

        const room = getRoomFromCoords(coords.latitude, coords.longitude);
        socket.emit('join-room', coords.latitude);
      },
      (err) => {
        setError('Error retrieving location: ' + err.message);
      }
    );
  }, []);
  console.log(location);

  useEffect(() => {
    socket.on('chat-message', (data) => {
      setMessages((prev) => [...prev, `${data.sender}: ${data.message}`]);
    });

    socket.on('user-joined', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('user-left', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off('chat-message');
      socket.off('user-joined');
      socket.off('user-left');
    };
  }, []);

  const handleSend = () => {
    if (message.trim()) {
      socket.emit('chat-message', message);
      setMessages((prev) => [...prev, `You: ${message}`]);
      setMessage('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">📍 Geo Chat</h1>
      {error ? (
        <p className="text-red-600">{error}</p>
      ) : !location ? (
        <p>Getting your location...</p>
      ) : (
        <>
          <div className="bg-white shadow-md p-4 rounded w-full max-w-md mb-4">
            <div className="h-64 overflow-y-auto border p-2 rounded">
              {messages.map((msg, i) => (
                <p key={i} className="text-sm mb-1">{msg}</p>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="border rounded w-full px-2 py-1"
                placeholder="Type a message..."
              />
              <button
                onClick={handleSend}
                className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
              >
                Send
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            You are chatting with people near: {location.latitude.toFixed(3)}, {location.longitude.toFixed(3)}
          </p>
        </>
      )}
    </div>
  );
}

export default App;
