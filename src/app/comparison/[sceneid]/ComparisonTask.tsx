"use client";
import { useEffect, useState } from 'react';

interface ComparisonTaskProps {
  modelName: string;
  isValid: boolean;
  situation: string;
  question: string;
  answer: string;
  onStatusChange?: (isValid: boolean) => void;
}

export default function ComparisonTask({ 
  isValid: initialIsValid,
  situation,
  question,
  answer,
  onStatusChange
}: ComparisonTaskProps) {
  const [isValid, setIsValid] = useState(initialIsValid);
  
  // Update local state when prop changes
  useEffect(() => {
    setIsValid(initialIsValid);
  }, [initialIsValid]);
  
  const toggleValidity = () => {
    const newStatus = !isValid;
    setIsValid(newStatus);
    if (onStatusChange) {
      onStatusChange(newStatus);
    }
  };
  
  // Border color should change based on validity
  const borderColor = isValid 
    ? 'border-green-500' 
    : 'border-red-500';
  
  return (
    <button 
      onClick={toggleValidity}
      className={`flex flex-col p-4 border-2 rounded-md ${borderColor} bg-gray-900 text-left transition-colors cursor-pointer hover:bg-gray-800 text-sm h-full relative`}
      aria-pressed={isValid}
    >
      <div className="space-y-3 overflow-auto flex-grow">
        <div className="text-white">
          <p className="font-bold text-white mb-1">Situation:</p>
          <p className="pl-2">{situation}</p>
        </div>
        
        <div className="text-white">
          <p className="font-bold text-white mb-1">Question:</p>
          <p className="pl-2">{question}</p>
        </div>
        
        <div className="text-white">
          <p className="font-bold text-white mb-1">Answer:</p>
          <p className="pl-2">{answer}</p>
        </div>
      </div>
      
      {/* Validity indicator positioned at bottom right */}
      <div className="absolute bottom-2 right-2">
        {isValid ? (
          <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">Valid</div>
        ) : (
          <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">Invalid</div>
        )}
      </div>
    </button>
  );
}
