// src/components/PageLoader.jsx
import React from "react";
const Loading = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 z-50">
      <div className="flex flex-col items-center space-y-5">
        
        {/* Animated Spinner */}
        <div className="relative">
          <div className="w-16 h-16 border-4 border-green-200 rounded-full"></div>
          <div className="w-16 h-16 border-4 border-green-600 rounded-full border-t-transparent animate-spin absolute top-0"></div>
        </div>

        {/* Text */}
        <p className="text-gray-700 font-semibold tracking-wide animate-pulse">
          Loading, please wait...
        </p>

      </div>
    </div>
  );
};

export default Loading;
