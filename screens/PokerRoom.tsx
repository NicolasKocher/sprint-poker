import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { User, GameState, TShirtSize } from '../types';
import { useSession } from '../hooks/useSession';
import { VOTE_DURATION, SIZES } from '../constants';
import Timer from '../components/Timer';
import SizeSelector from '../components/SizeSelector';
import Participants from '../components/Participants';
import ResultsView from '../components/ResultsView';

interface PokerRoomProps {
  user: User;
  sessionId: string;
  isCreating: boolean;
  onExit: () => void;
}

const PokerRoom: React.FC<PokerRoomProps> = ({ user, sessionId, isCreating, onExit }) => {
  const { session, loading, error, startVoting, finishVoting, resetVoting, castVote, leaveSession } = useSession(sessionId, user, isCreating);
  const [timeLeft, setTimeLeft] = useState(VOTE_DURATION);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (session?.gameState === GameState.Voting && session.votingStartTime) {
      const updateTimer = () => {
        const elapsed = (Date.now() - (session.votingStartTime ?? 0)) / 1000;
        const remaining = Math.max(0, VOTE_DURATION - elapsed);
        setTimeLeft(Math.round(remaining));

        if (remaining <= 0) {
          finishVoting();
        }
      };

      updateTimer();
      const timerId = setInterval(updateTimer, 500);
      return () => clearInterval(timerId);
    } else if (session?.gameState !== GameState.Voting) {
      setTimeLeft(VOTE_DURATION);
    }
  }, [session, finishVoting]);

  const isHost = useMemo(() => session?.hostId === user.id, [session, user.id]);
  const userVote = useMemo(() => session?.votes[user.id] || null, [session, user.id]);

  const handleExitRoom = useCallback(async () => {
    try {
      await leaveSession();
    } finally {
      onExit();
    }
  }, [leaveSession, onExit]);

  if (loading) {
    return <div className="text-gray-400 text-xl">Loading session...</div>;
  }

  if (error) {
    return (
      <div className="text-red-400 text-xl">
        <p>Error: {error}</p>
        <button onClick={handleExitRoom} className="mt-4 text-gray-400 hover:text-white">
          &larr; Back
        </button>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-gray-400 text-xl">
        <p>Session not found</p>
        <button onClick={handleExitRoom} className="mt-4 text-gray-400 hover:text-white">
          &larr; Back
        </button>
      </div>
    );
  }
  
  const handleVote = (size: TShirtSize) => {
    castVote(size);
  }

  const { gameState, users, votes } = session;

  const getButtonText = () => {
    switch (gameState) {
      case GameState.Idle:
        return 'Start Voting';
      case GameState.Voting:
        return 'Voting...';
      case GameState.Finished:
        return isHost ? 'Reset & Start New Vote' : 'Waiting for host to reset...';
    }
  };

  const handleMainButtonClick = async () => {
    if (isHost && gameState === GameState.Idle) {
      await startVoting();
    }
  };

  const handleResetClick = async () => {
    if (isHost && gameState === GameState.Finished) {
      await resetVoting();
    }
  };

  const handleCopyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(sessionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset nach 2 Sekunden
    } catch (err) {
      console.error('Failed to copy room code:', err);
    }
  };

  return (
    <div className="w-full flex flex-col items-center space-y-8 md:space-y-12 animate-fade-in">
        <div className="w-full flex justify-between items-center">
            <button onClick={handleExitRoom} className="text-gray-400 hover:text-white transition-colors">&larr; Exit</button>
            <div className="text-center cursor-pointer" onClick={handleCopyRoomCode}>
                <p className="text-gray-500 text-sm">ROOM CODE</p>
                <p className={`text-2xl font-bold tracking-widest transition-colors ${copied ? 'text-lime-400' : 'text-white hover:text-lime-300'}`}>
                  {copied ? 'Copied!' : sessionId}
                </p>
            </div>
            <div className="w-16"></div>
        </div>

        <Participants users={users} votes={votes} />

        <div className="w-full min-h-[220px] md:min-h-[260px] flex flex-col justify-center items-center">
        {gameState === GameState.Idle && (
            <div className="text-gray-400 text-2xl md:text-3xl">
                <p>Waiting for the host to start...</p>
            </div>
        )}
        {(gameState === GameState.Voting) && (
            <Timer timeLeft={timeLeft} totalTime={VOTE_DURATION} isFinished={false} />
        )}
        {gameState === GameState.Finished && (
            <ResultsView users={users} votes={votes} />
        )}
        </div>

      <SizeSelector
        sizes={SIZES}
        selectedSize={userVote}
        onSelect={handleVote}
        disabled={gameState !== GameState.Voting}
      />
      
      <div className="h-16">
        {isHost ? (
          <>
            {gameState === GameState.Finished ? (
              <button
                onClick={handleResetClick}
                className="px-10 py-4 text-xl font-bold rounded-md transition-all duration-300 ease-in-out bg-lime-400 text-black hover:bg-lime-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-lime-400"
              >
                {getButtonText()}
              </button>
            ) : (
              <button
                onClick={handleMainButtonClick}
                disabled={gameState === GameState.Voting}
                className={`
                  px-10 py-4 text-xl font-bold rounded-md transition-all duration-300 ease-in-out
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black
                  ${
                    gameState === GameState.Voting
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-lime-400 text-black hover:bg-lime-300 focus:ring-lime-400'
                  }
                `}
              >
                {getButtonText()}
              </button>
            )}
          </>
        ) : (
          <p className="text-gray-500 h-full flex items-center">{getButtonText()}</p>
        )}
      </div>
    </div>
  );
};

export default PokerRoom;
