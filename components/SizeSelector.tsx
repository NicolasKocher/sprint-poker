
import React from 'react';
import { TShirtSize } from '../types';

interface SizeSelectorProps {
  sizes: TShirtSize[];
  selectedSize: TShirtSize | null;
  onSelect: (size: TShirtSize) => void;
  disabled: boolean;
}

const SizeSelector: React.FC<SizeSelectorProps> = ({
  sizes,
  selectedSize,
  onSelect,
  disabled,
}) => {
  return (
    <div className="flex flex-wrap justify-center gap-3 md:gap-5">
      {sizes.map(size => {
        const isSelected = size === selectedSize;
        return (
          <button
            key={size}
            onClick={() => onSelect(size)}
            disabled={disabled}
            className={`
              w-20 h-20 md:w-24 md:h-24 
              text-2xl md:text-3xl font-bold border-2 rounded-md
              flex items-center justify-center
              transition-all duration-200 ease-in-out
              ${disabled
                ? 'border-gray-700 text-gray-600 cursor-not-allowed'
                : 'border-gray-600 text-gray-300 hover:border-lime-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-lime-400'
              }
              ${isSelected ? 'bg-lime-400 border-lime-400 text-black' : 'bg-gray-900'}
            `}
          >
            {size}
          </button>
        );
      })}
    </div>
  );
};

export default SizeSelector;
