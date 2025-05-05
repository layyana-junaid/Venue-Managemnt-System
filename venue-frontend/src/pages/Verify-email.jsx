import React from 'react';

const VerifyEmail = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8 animate-fade-in">
      <div className="w-24 h-24 mb-8">
        <svg 
          className="w-full h-full animate-draw-checkmark"
          viewBox="0 0 52 52"
        >
          <circle 
            className="stroke-green-500 fill-none stroke-2"
            cx="26" 
            cy="26" 
            r="25"
            style={{
              strokeDasharray: 166,
              strokeDashoffset: 166,
              animation: 'draw-circle 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards'
            }}
          />
          <path 
            className="stroke-green-500 fill-none stroke-2"
            d="M14.1 27.2l7.1 7.2 16.7-16.8"
            style={{
              strokeDasharray: 48,
              strokeDashoffset: 48,
              animation: 'draw-check 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards'
            }}
          />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">
        Email Verified!
      </h1>
      <p className="text-lg text-gray-600 text-center max-w-md leading-relaxed">
        Your email has been successfully verified. You can now access all features of our platform.
      </p>

      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes draw-circle {
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes draw-check {
          to {
            stroke-dashoffset: 0;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default VerifyEmail;
