import Link from "next/link";
import { startComparison } from "./actions";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[48px] row-start-2 items-center justify-center text-center max-w-3xl">
        <div className="flex flex-col items-center space-y-6">
          <div className="text-6xl mb-2 animate-pulse">✨🔮✨</div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
            SQA3D VS Reasoning VLM
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-xl">
            Explore the fascinating comparison between 3D spatial question answering dataset and advanced reasoning language models 🚀
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 w-full justify-center">
          <form action={startComparison}>
            <button type="submit" className="rounded-full border-none py-4 px-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:opacity-90 transition-all transform hover:scale-105 font-medium text-lg w-full sm:w-auto flex items-center justify-center gap-2 shadow-lg">
              <span className="mr-2">🏁</span>
              Start Comparison
            </button>
          </form>
          <Link href="/result" className="rounded-full border border-solid border-gray-200 dark:border-gray-700 py-4 px-8 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all transform hover:scale-105 font-medium text-lg w-full sm:w-auto flex items-center justify-center gap-2 shadow-md">
            <span className="mr-2">📊</span>
            View Results
          </Link>
        </div>
      </main>
      
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <span>❤️</span>
          Made with passion
        </div>
        <div className="flex items-center gap-2">
          <span>🔍</span>
          Advancing AI research
        </div>
        <div className="flex items-center gap-2">
          <span>🌐</span>
          June 2025
        </div>
      </footer>
    </div>
  );
}
