
import React from 'react';

const LoadingSpinner: React.FC<{ size?: number }> = ({ size = 8 }) => {
  return (
    <div className="flex justify-center items-center">
      <div
        className={`animate-spin rounded-full h-${size} w-${size} border-2 border-primary-200 border-t-primary`}
      ></div>
    </div>
  );
};

export default LoadingSpinner;
