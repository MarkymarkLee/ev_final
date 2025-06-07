"use client";
import { useEffect, useRef } from 'react';

interface ProgressBarProps {
  currentTask: number;
  totalTasks: number;
  onTaskSelect: (index: number) => void;
}

export default function ProgressBar({ 
  currentTask, 
  totalTasks,
  onTaskSelect 
}: ProgressBarProps) {
  const progressBarRef = useRef<HTMLDivElement>(null);
  
  // Scroll task into view when current task changes
  useEffect(() => {
    const targetElement = document.getElementById(`progress-step-${currentTask}`);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      });
    }
  }, [currentTask]);

  return (
    <div 
      className="w-full bg-gray-100 dark:bg-gray-700 p-3 rounded-lg overflow-x-auto"
      ref={progressBarRef}
    >
      <div className="flex items-center justify-between min-w-max">
        {Array.from({ length: totalTasks }).map((_, idx) => (
          <div key={idx} className="flex items-center">
            {/* Connector line */}
            {idx > 0 && (
              <div 
                className={`h-0.5 w-16 ${
                  idx <= currentTask ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            )}
            
            {/* Step indicator */}
            <div 
              id={`progress-step-${idx}`}
              onClick={() => onTaskSelect(idx)}
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm 
                cursor-pointer transition-all transform hover:scale-110
                ${idx === currentTask 
                  ? 'bg-blue-500 text-white ring-2 ring-blue-300' 
                  : idx < currentTask
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                }
              `}
            >
              {idx + 1}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
