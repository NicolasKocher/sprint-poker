
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="absolute top-0 left-0 p-6 md:p-8">
      <h1 className="text-2xl md:text-3xl font-black tracking-tighter">
        insert <span className="text-lime-400">effect</span>
      </h1>
    </header>
  );
};

export default Header;
