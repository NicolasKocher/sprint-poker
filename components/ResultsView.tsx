import React, { useMemo } from 'react';
import { User, TShirtSize } from '../types';
import { SIZES, SIZES_MAP } from '../constants';

interface ResultsViewProps {
  users: User[];
  votes: Record<string, TShirtSize>;
}

const ResultsView: React.FC<ResultsViewProps> = ({ users, votes }) => {
  const averageSize = useMemo(() => {
    // FIX: Using Object.entries for better type inference as Object.values was inferring 'size' as 'unknown'.
    const validVotes = Object.entries(votes).map(([, size]) => SIZES_MAP[size]);
    if (validVotes.length === 0) {
      return 'N/A';
    }
    const avgValue = validVotes.reduce((sum, val) => sum + val, 0) / validVotes.length;
    
    // Find the closest T-shirt size to the average value
    const closestSize = SIZES.reduce((prev, curr) => {
      const prevDiff = Math.abs(SIZES_MAP[prev] - avgValue);
      const currDiff = Math.abs(SIZES_MAP[curr] - avgValue);
      return currDiff < prevDiff ? curr : prev;
    });

    return closestSize;
  }, [votes]);

  return (
    <div className="w-full max-w-md animate-fade-in text-center">
      <h2 className="text-2xl text-gray-400 mb-2">Results</h2>
      <div className="mb-6">
        <p className="text-lg text-gray-400">Average Estimate</p>
        <p className="text-6xl font-black text-lime-400">{averageSize}</p>
      </div>

      <div className="w-full bg-gray-900/50 rounded-lg p-4 max-h-48 overflow-y-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="p-2 text-gray-400 font-semibold">Participant</th>
              <th className="p-2 text-gray-400 font-semibold text-right">Vote</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b border-gray-800 last:border-b-0">
                <td className="p-2">{user.name}</td>
                <td className="p-2 font-bold text-right">{votes[user.id] || 'Did not vote'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultsView;
