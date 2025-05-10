
import React, { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

interface SuccessMessageProps {
  title: string;
  message: string;
  onClose: () => void;
}

const SuccessMessage: React.FC<SuccessMessageProps> = ({ title, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 8000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md w-full bg-gradient-to-r from-tiktool-teal/20 to-tiktool-pink/20 border border-tiktool-teal/30 rounded-lg shadow-lg p-4 animate-in fade-in slide-in-from-top-5 duration-300">
      <div className="flex items-start gap-3">
        <div className="bg-tiktool-teal/20 p-2 rounded-full">
          <CheckCircle className="h-6 w-6 text-tiktool-teal" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-lg">{title}</h3>
          <p className="text-muted-foreground">{message}</p>
        </div>
        <button 
          onClick={onClose} 
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default SuccessMessage;
