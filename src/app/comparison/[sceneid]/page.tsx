"use client";
import { Suspense, useEffect, useState } from 'react';
import { redirect, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ProgressBar from './ProgressBar';
import { supabase } from '../../../../lib/supabaseClient';
import ReactPlayer from 'react-player';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { VideoPlayer } from './VideoPlayer';

type TaskData = {
    id: number;
    sceneid: string;
    situation: string;
    question: string;
    answer: string;
    source: string;
    split: string;
    score: number;
    tested: boolean;
}

const GOALS = [
  'You can know where you are based on the situation',
  'You can understand the question perfectly',
  'The answer is correct based on the situation and question',
  'To answer this question, the video or birdeye image of the scene is necessary',
  'To answer this question, you need to understand the 3d relations of the items in the scene and yourself',
];

export default function ComparisonPage() {  const params = useParams();
  const sceneid = params.sceneid as string;
  const [loading, setLoading] = useState(true);
  const [isProcessingVotes, setIsProcessingVotes] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });
  const [sceneData, setSceneData] = useState<TaskData[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [goalChecks, setGoalChecks] = useState<boolean[][]>([]);
  const [currentTaskIdx, setCurrentTaskIdx] = useState(0);

    useEffect(() => {
    // Fetch scene data from Supabase
    const fetchSceneData = async () => {
      // Fetch SQA3D data
      const { data: sceneData, error: sceneDataError } = await supabase
          .rpc(
            'get_random_sqa_tasks', 
            {
              "scene_id_param": sceneid,
              "limit_param": 6,
            }
          ) as { data: TaskData[], error: Error | null };
      
      if (sceneDataError) {
        console.error('Error fetching SQA3D data:', sceneDataError);
        setLoading(false);
        return;
      };

      console.log('Fetched SQA3D data:', sceneData);
      setSceneData(sceneData);

      // Initialize goal checks for each task
      const initialGoalChecks = sceneData.map(() => Array(GOALS.length).fill(false));
      setGoalChecks(initialGoalChecks);

      // Get public URLs for the scene image and video from Supabase storage
      const { data: imageData } = await supabase.storage
        .from('birdeye-images')
        .getPublicUrl(`${sceneid}_bird.png`);
      
      const { data: videoData } = await supabase.storage
        .from('scannet-videos')
        .getPublicUrl(`${sceneid}.mp4`);
      
      if (imageData) {
        setImageUrl(imageData.publicUrl);
      }
      
      if (videoData) {
        setVideoUrl(videoData.publicUrl);
      }
      
      setLoading(false);
    };

    fetchSceneData();
  }, [sceneid]);
  
  // Finish comparison handler
  const handleFinish = async () => {
    try {
      setIsProcessingVotes(true);
      setNotification({ show: true, message: 'Processing your votes...', type: 'info' });
      
      // Process votes for each task
      for (let i = 0; i < goalChecks.length; i++) {
        if (goalChecks[i]) {
          const taskData = sceneData[i];
          taskData.score = goalChecks[i].filter(Boolean).length / 5;
          taskData.tested = true; // Mark as tested
          await updateTaskData(taskData);
        }
      }
      
      // Show success message before redirecting
      setNotification({ show: true, message: 'Thank you! Your votes have been recorded.', type: 'success' });
      
      // Short delay to show success message before redirecting
      setTimeout(() => {
        redirect('/result');
      }, 1500);
    } catch (error) {
      console.error('Error processing votes:', error);
      setNotification({ show: true, message: 'There was an error processing your votes.', type: 'error' });
      setIsProcessingVotes(false);
    }
  };
  
  const updateTaskData = async (t: TaskData) => {
    const { id, ...updateData } = t;
    supabase.from('sqa_tasks').update(updateData).eq('id', id)
      .then(({ error }) => {
        if (error) {
          console.error('Error updating task data:', error);
        } else {
          console.log('Task data updated successfully');
        }
      })
  }
  
  // Handler for checking/unchecking a goal for a task
  const handleGoalCheck = (taskIdx: number, goalIdx: number) => {
    setGoalChecks(prev => {
      const updated = prev.map(arr => [...arr]);
      updated[taskIdx][goalIdx] = !updated[taskIdx][goalIdx];
      return updated;
    });
  };

  // Navigation handlers for single task view
  const handlePrevTask = () => {
    setCurrentTaskIdx(idx => Math.max(0, idx - 1));
  };
  const handleNextTask = () => {
    setCurrentTaskIdx(idx => Math.min(sceneData.length - 1, idx + 1));
  };

  const totalTasks = sceneData.length;
  
  // Function to hide notification
  const hideNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };
  
  // Auto-hide notification after 5 seconds
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (notification.show) {
      timer = setTimeout(() => {
        hideNotification();
      }, 5000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [notification.show]);
  
  // Update goalChecks length to match sceneData length
  useEffect(() => {
    if (sceneData.length > 0) {
      setGoalChecks(prev => {
        // If already correct length, do nothing
        if (prev.length === sceneData.length) return prev;
        // If new data, initialize or resize
        const newChecks = Array(sceneData.length)
          .fill(0)
          .map((_, i) => prev[i] ? prev[i] : Array(GOALS.length).fill(false));
        return newChecks;
      });
    }
  }, [sceneData.length]);
  
  return (
    <div className="grid grid-rows-[auto_1fr_auto] min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <header className="w-full flex justify-between items-center mb-6">
        <Link href="/" className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline hover:opacity-80 transition-all transform text-sm font-medium">
          <span>⬅️</span>
          Back to Home
        </Link>
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
          Scene {sceneid}
        </h1>
        <Link href="/result" className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline hover:opacity-80 transition-all transform text-sm font-medium">
          View Results
          <span>➡️</span>
        </Link>
      </header>
      <main className="flex flex-col items-center gap-8">
        {loading ? (
          <div className="w-full max-w-4xl flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="ml-3 text-gray-600 dark:text-gray-300">Loading scene data...</p>
          </div>
        ) : (
          <div className="w-full max-w-6xl">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-black/90 dark:bg-gray-900 p-4 flex flex-col">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Left column - Video and Image */}
                <div className="w-full md:w-3/10 flex flex-col">
                  
                  {/* Video Player */}
                  <div className="w-full">
                    <h3 className="text-gray-300 font-medium mb-1 text-center text-sm">Environment Images</h3>
                    <div className="bg-gray-800 rounded-md overflow-hidden">
                      <Suspense fallback={<div className="w-full h-full animate-pulse flex items-center justify-center text-gray-400">Loading video...</div>}>
                        {videoUrl ? (
                          <VideoPlayer source={videoUrl}/>
                        ) : (
                          <div className="w-full h-[200px] md:h-[300px] flex items-center justify-center bg-black/40">
                            <p className="text-white font-medium">Loading Video...</p>
                          </div>
                        )}
                      </Suspense>
                    </div>
                  </div>

                  <div className="mb-4" />
                  
                  {/* Scene Image */}
                  <div className="w-full">
                    <h3 className="text-gray-300 font-medium mb-1 text-center text-sm">{`Bird's Eye View`}</h3>
                    <div className="bg-gray-800 rounded-md overflow-hidden h-[150px] relative">
                      {imageUrl ? (
                        <Image 
                          src={imageUrl}
                          alt={`Scene ${sceneid} bird's eye view`}
                          fill
                          className="object-cover"
                          priority
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <p className="text-white font-medium">Loading Scene Image...</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Right column - Single Task and checklist */}
                <div className="w-full md:w-7/10 flex flex-col h-full">
                  <div className="flex flex-col flex-grow h-full">
                    <div className="mb-4">
                      <h2 className="text-xl font-bold text-white mb-1">Task Goal Checklist</h2>
                      <p className="text-gray-300 text-sm mb-3">
                        Review the situation, question, and answer, then check the goals that are achieved.
                      </p>
                    </div>
                    {sceneData.length > 0 && (
                      <div className="rounded-lg bg-gray-800/80 p-4 shadow-md border border-gray-700">
                        <div className="mb-2">
                          <span className="text-lg font-semibold text-blue-300">Task {currentTaskIdx + 1} of {sceneData.length}</span>
                        </div>
                        <div className="mb-2">
                          <span className="font-medium text-gray-400">Situation:</span>
                          <span className="ml-2 text-gray-200">{sceneData[currentTaskIdx]?.situation}</span>
                        </div>
                        <div className="mb-2">
                          <span className="font-medium text-gray-400">Question:</span>
                          <span className="ml-2 text-gray-200">{sceneData[currentTaskIdx]?.question}</span>
                        </div>
                        <div className="mb-4">
                          <span className="font-medium text-gray-400">Answer:</span>
                          <span className="ml-2 text-gray-200">{sceneData[currentTaskIdx]?.answer}</span>
                        </div>
                        <div>
                          <ul className="space-y-2">
                            {GOALS.map((goal, goalIdx) => (
                              <li key={goalIdx} className="flex items-center gap-3">
                                <button
                                  type="button"
                                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors focus:outline-none ${goalChecks[currentTaskIdx][goalIdx] ? 'bg-green-500 border-green-500' : 'bg-gray-700 border-gray-500'}`}
                                  onClick={() => handleGoalCheck(currentTaskIdx, goalIdx)}
                                  aria-pressed={goalChecks[currentTaskIdx][goalIdx]}
                                >
                                  {goalChecks[currentTaskIdx][goalIdx] ? (
                                    <CheckCircleIcon className="w-5 h-5 text-white" />
                                  ) : (
                                    <span className="block w-3 h-3 rounded-full bg-gray-400"></span>
                                  )}
                                </button>
                                <span className="text-gray-200 text-base">{goal}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                    {/* Navigation buttons */}
                    <div className="mt-8 flex justify-between">
                      <button
                        className="px-6 py-3 bg-gray-700 text-gray-200 rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handlePrevTask}
                        disabled={currentTaskIdx === 0}
                      >
                        Previous Task
                      </button>
                      {currentTaskIdx < sceneData.length - 1 ? (
                        <button
                          className="px-6 py-3 bg-gray-700 text-gray-200 rounded hover:bg-gray-600 transition-colors"
                          onClick={handleNextTask}
                        >
                          Next Task
                        </button>
                      ) : (
                        <button
                          className={`px-6 py-3 ${isProcessingVotes 
                            ? 'bg-gray-500 cursor-wait' 
                            : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90'} 
                            text-white rounded transition-all`}
                          onClick={handleFinish}
                          disabled={isProcessingVotes}
                        >
                          {isProcessingVotes ? (
                            <span className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Processing...
                            </span>
                          ) : (
                            'Finish'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      <footer className="mt-auto py-4 flex gap-[24px] flex-wrap items-center justify-center text-sm text-gray-500 dark:text-gray-400 w-full">
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
      </footer>      {/* Notification toast */}
      {notification.show && (
        <div 
          className={`fixed bottom-4 right-4 max-w-md p-4 rounded-lg shadow-lg transition-opacity duration-300 ease-in-out opacity-100
            ${notification.type === 'success' 
              ? 'bg-green-600 text-white' 
              : notification.type === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-blue-600 text-white'}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {notification.type === 'success' && (
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              )}
              {notification.type === 'error' && (
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              )}
              {notification.type === 'info' && (
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              )}
              <p className="font-medium">{notification.message}</p>
            </div>
            <button 
              onClick={hideNotification}
              className="ml-4 text-white focus:outline-none"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
