"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { startComparison } from "../actions";

export default function Result() {

  const [sqaScore, setSqaScore] = useState(0);
  const [reasoningScore, setReasoningScore] = useState(0);
  // const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching scores from an API
    const fetchScores = async () => {
      const { data: sqa_score, error: sqa3dError } = await supabase
        .rpc(
          'calculate_average_score',
          {
            "source_param": 'sqa3d',
          }
        ) as { data: number, error: Error | null };
      
      const { data: reasoning_score, error: reasoningError } = await supabase
        .rpc(
          'calculate_average_score',
          {
            "source_param": 'gemini',
          }
        ) as { data: number, error: Error | null };
      
      if (sqa3dError || reasoningError) {
        console.error("Error fetching scores:", sqa3dError || reasoningError);
        return;
      }

      setSqaScore(sqa_score || 0);
      setReasoningScore(reasoning_score || 0);
    };

    fetchScores();
  }, []);


  return (    
  <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <header className="w-full row-start-1 flex justify-start">
        <Link href="/" className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline hover:opacity-80 transition-all transform text-sm font-medium">
          <span>⬅️</span>
          Go Back to Menu
        </Link>
      </header>
      
      <main className="flex flex-col gap-[48px] row-start-2 items-center justify-center text-center max-w-3xl w-full">
        <div className="flex flex-col items-center space-y-6 w-full">
          <div className="text-3xl mb-2">📊 📈 📉</div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 mb-8">
            Human Validated Counts
          </h1>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-2xl">
            <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                SQA3D Score
              </h2>
              <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                <span className="inline-flex items-center">
                  <span className="mr-2">🏆</span>{sqaScore.toFixed(2)}
                </span>
              </div>
            </div>
            
            <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Reasoning LLM Score
              </h2>
              <div className="text-5xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                <span className="inline-flex items-center">
                  <span className="mr-2">🧠</span>{reasoningScore.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>        <form action={startComparison}>
          <button type="submit" className="rounded-full border-none py-3 px-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:opacity-90 transition-all transform hover:scale-105 font-medium text-lg flex items-center justify-center gap-2 shadow-lg">
            <span className="mr-2">🔄</span>
            Compare Again
          </button>
        </form>
      </main>
      
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <span>📝</span>
          Results validated by experts
        </div>
        <div className="flex items-center gap-2">
          <span>🔍</span>
          Based on standardized benchmarks
        </div>
        <div className="flex items-center gap-2">
          <span>📅</span>
          June 2025
        </div>
      </footer>
    </div>
  );
}
