
import React from 'react';

interface TimerProps {
  timeLeft: number;
  totalTime: number;
  isFinished: boolean;
}

const Timer: React.FC<TimerProps> = ({ timeLeft, totalTime, isFinished }) => {
  const progressPercentage = (timeLeft / totalTime) * 100;

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center space-y-6">
      <div className={`
        text-7xl md:text-9xl font-black transition-colors duration-300
        ${isFinished ? 'text-lime-400' : 'text-white'}
      `}>
        {timeLeft > 0 ? timeLeft : 'Done!'}
      </div>
      <div className="w-full bg-gray-800 rounded-full h-4">
        <div
          className="bg-lime-400 h-4 rounded-full transition-all duration-1000 linear"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default Timer;
