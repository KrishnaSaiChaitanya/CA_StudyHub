import React from 'react';

/**
 * A true layout skeleton loader simulating a standard card/article view.
 * Use this in place of your content component while data is fetching.
 */
const CardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-24 h-full">
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 rounded-full border-t-2 border-accent animate-spin"></div>
        <div className="absolute inset-2 rounded-full border-r-2 border-indigo-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
      </div>
    </div>
  );
};

export default CardSkeleton;