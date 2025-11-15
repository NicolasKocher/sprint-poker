import React, { useState, useCallback } from 'react';
import JoinScreen from './screens/JoinScreen';
import PokerRoom from './screens/PokerRoom';
import Header from './components/Header';
import { User } from './types';
import { generateId } from './utils/helpers';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const handleJoin = useCallback((name: string, sid: string) => {
    const newUser: User = { id: generateId(), name };
    setUser(newUser);
    setSessionId(sid);
  }, []);

  const handleExit = useCallback(() => {
    setUser(null);
    setSessionId(null);
  }, []);

  return (
    <div className="bg-black text-white min-h-screen flex flex-col items-center justify-center p-4 antialiased">
      <Header />
      <main className="w-full max-w-2xl flex flex-col items-center justify-center flex-grow text-center">
        {!user || !sessionId ? (
          <JoinScreen onJoin={handleJoin} />
        ) : (
          <PokerRoom user={user} sessionId={sessionId} onExit={handleExit} />
        )}
      </main>
      <footer className="text-center py-4 text-gray-600">
        <p>A sprint planning tool by Insert Effect</p>
      </footer>
    </div>
  );
};

export default App;
