import React, { useState } from 'react';
import { generateId } from '../utils/helpers';

interface JoinScreenProps {
  onJoin: (name: string, sessionId: string) => void;
}

const JoinScreen: React.FC<JoinScreenProps> = ({ onJoin }) => {
  const [name, setName] = useState('');
  const [sessionId, setSessionId] = useState('');

  const handleCreate = () => {
    if (name.trim()) {
      onJoin(name, generateId());
    }
  };

  const handleJoin = () => {
    if (name.trim() && sessionId.trim()) {
      onJoin(name, sessionId.toUpperCase());
    }
  };

  return (
    <div className="w-full max-w-sm flex flex-col items-center space-y-8 animate-fade-in">
      <div className="w-full space-y-4">
        <h2 className="text-3xl font-bold text-white">Join or Create a Room</h2>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          className="w-full px-4 py-3 bg-gray-900 border-2 border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-lime-400 transition-colors"
          maxLength={20}
        />
      </div>
      
      <div className="w-full space-y-4">
        <button
          onClick={handleCreate}
          disabled={!name.trim()}
          className="w-full px-8 py-3 text-lg font-bold bg-lime-400 text-black rounded-md hover:bg-lime-300 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          Create New Room
        </button>
      </div>

      <div className="flex items-center w-full">
        <hr className="flex-grow border-gray-700" />
        <span className="px-4 text-gray-500">OR</span>
        <hr className="flex-grow border-gray-700" />
      </div>

      <div className="w-full space-y-4">
        <input
          type="text"
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          placeholder="Enter Room Code"
          className="w-full px-4 py-3 bg-gray-900 border-2 border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-lime-400 transition-colors uppercase"
          maxLength={6}
        />
        <button
          onClick={handleJoin}
          disabled={!name.trim() || !sessionId.trim()}
          className="w-full px-8 py-3 text-lg font-bold bg-gray-700 text-white rounded-md hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          Join Room
        </button>
      </div>
    </div>
  );
};

export default JoinScreen;
