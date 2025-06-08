"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { startComparison } from "../actions";

export default function Result() {

  const [sqaScore, setSqaScore] = useState(0);
  const [reasoningScore, setReasoningScore] = useState(0);
  const [sqaGeminiScore, setSqaGeminiScore] = useState(0);
  const [reasoningGeminiScore, setReasoningGeminiScore] = useState(0);
  const [loading, setLoading] = useState(true);

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

      const { data: sqa_gemini_score, error: sqa3d_g_Error } = await supabase
        .rpc(
          'calculate_average_gemini_score',
          {
            "source_param": 'sqa3d',
          }
        ) as { data: number, error: Error | null };
      
      const { data: reasoning_gemini_score, error: reasoning_g_Error } = await supabase
        .rpc(
          'calculate_average_gemini_score',
          {
            "source_param": 'gemini',
          }
        ) as { data: number, error: Error | null };
      
      if (sqa3d_g_Error || reasoning_g_Error) {
        console.error("Error fetching scores:", sqa3d_g_Error || reasoning_g_Error);
        return;
      }

      setSqaScore(sqa_score || 0);
      setReasoningScore(reasoning_score || 0);
      setSqaGeminiScore(sqa_gemini_score || 0);
      setReasoningGeminiScore(reasoning_gemini_score || 0);
      setLoading(false);
    };

    fetchScores();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-6"></div>
          <div className="text-xl font-semibold text-blue-700 dark:text-blue-300">Loading scores...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4 gap-4 font-[family-name:var(--font-geist-sans)]">
      <header className="w-full flex justify-start mb-2">
        <Link href="/" className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline hover:opacity-80 transition-all transform text-sm font-medium">
          <span>⬅️</span>
          Go Back to Menu
        </Link>
      </header>
      <main className="flex flex-col gap-8 items-center justify-center text-center max-w-3xl w-full mx-auto flex-1">
        <div className="flex flex-col items-center space-y-6 w-full">
          <div className="text-4xl mb-2">📊 📈 📉</div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 mb-4">
            Average Rated Scores
          </h1>
          <div className="grid grid-cols-2 gap-8 w-full max-w-2xl">
            <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                SQA3D <span className="text-lg font-normal text-gray-400">(Human)</span>
              </h2>
              <div className="text-6xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                <span className="inline-flex items-center">
                  <span className="mr-2">🏆</span>{sqaScore.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Reasoning <span className="text-lg font-normal text-gray-400">(Human)</span>
              </h2>
              <div className="text-6xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                <span className="inline-flex items-center">
                  <span className="mr-2">🧠</span>{reasoningScore.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                SQA3D <span className="text-lg font-normal text-gray-400">(Gemini)</span>
              </h2>
              <div className="text-6xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                <span className="inline-flex items-center">
                  <span className="mr-2">🤖</span>{sqaGeminiScore.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Reasoning <span className="text-lg font-normal text-gray-400">(Gemini)</span>
              </h2>
              <div className="text-6xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                <span className="inline-flex items-center">
                  <span className="mr-2">🤖</span>{reasoningGeminiScore.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
        <form action={startComparison} className="mt-8">
          <button type="submit" className="rounded-full border-none py-4 px-10 bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:opacity-90 transition-all transform hover:scale-105 font-medium text-2xl flex items-center justify-center gap-2 shadow-lg">
            <span className="mr-2">🔄</span>
            Compare Again
          </button>
        </form>
      </main>
      <footer className="flex gap-4 flex-wrap items-center justify-center text-xs text-gray-500 dark:text-gray-400 mt-4">
        <div className="flex items-center gap-1">
          <span>📝</span>
          Results validated by experts
        </div>
        <div className="flex items-center gap-1">
          <span>🔍</span>
          Based on standardized benchmarks
        </div>
        <div className="flex items-center gap-1">
          <span>📅</span>
          June 2025
        </div>
      </footer>
    </div>
  );
}
