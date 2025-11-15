import React from 'react';
import { User, TShirtSize } from '../types';

interface ParticipantsProps {
  users: User[];
  votes: Record<string, TShirtSize>;
}

const Participants: React.FC<ParticipantsProps> = ({ users, votes }) => {
  return (
    <div className="w-full max-w-lg">
      <h3 className="text-lg font-bold text-gray-400 mb-3">Participants ({users.length})</h3>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
        {users.map(user => {
          const hasVoted = !!votes[user.id];
          return (
            <div
              key={user.id}
              className={`
                px-4 py-2 rounded-full flex items-center gap-2
                transition-all duration-300
                ${hasVoted ? 'bg-lime-900/50 text-lime-300' : 'bg-gray-800 text-gray-400'}
              `}
            >
              <span>{user.name}</span>
              {hasVoted && (
                <span className="text-lime-400">&#x2713;</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Participants;
