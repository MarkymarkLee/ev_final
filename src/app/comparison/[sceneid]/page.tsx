"use client";
import { Suspense, useEffect, useState } from 'react';
import { redirect, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ProgressBar from './ProgressBar';
import ComparisonTask from './ComparisonTask';
import { supabase } from '../../../../lib/supabaseClient';
import ReactPlayer from 'react-player';

type TaskData = {
    id: number;
    sceneid: string;
    situation: string;
    question: string;
    answer: string;
    source: string;
    split: string;
    score: number;
    votes: number;
    tested: boolean;
}

interface TaskState {
  sqa3dValid: boolean;
  llmValid: boolean;
  statusMessage: string;
}

export default function ComparisonPage() {  const params = useParams();
  const sceneid = params.sceneid as string;
  const [loading, setLoading] = useState(true);
  const [isProcessingVotes, setIsProcessingVotes] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });
  const [sqa3dSceneData, setSqa3dSceneData] = useState<TaskData[]>([]);
  const [llmSceneData, setLlmSceneData] = useState<TaskData[]>([]);
  // Decide randomly which model appears on the left for each task
  const [modelPositions, setModelPositions] = useState<boolean[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
    useEffect(() => {
    // Fetch scene data from Supabase
    const fetchSceneData = async () => {
      // Fetch SQA3D data
      const { data: sqa3dData, error: sqa3dError } = await supabase
          .rpc(
            'get_random_sqa_tasks', 
            {
              "scene_id_param": sceneid,
              "source_param": 'sqa3d',
            }
          ) as { data: TaskData[], error: any };
      
      if (sqa3dError) {
        console.error('Error fetching SQA3D data:', sqa3dError);
        setLoading(false);
        return;
      };
      
      // Fetch LLM data
      const { data: llmData, error: llmError } = await supabase
          .rpc(
            'get_random_sqa_tasks', 
            {
              scene_id_param: sceneid,
              source_param: 'gemini',
            }
          ) as { data: TaskData[], error: any };
      
      if (llmError) throw llmError;
      
      setSqa3dSceneData(sqa3dData || []);
      setLlmSceneData(llmData || []);
      
      // Randomly decide position of models for each task
      const taskCount = Math.min(sqa3dData?.length || 0, llmData?.length || 0);
      const positions = Array(taskCount)
        .fill(0)
        .map(() => Math.random() < 0.5); // true = SQA3D on left, false = LLM on left
      setModelPositions(positions);

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
  
  // Get the taskId from the URL - default to 0 if not present
  const [taskId, setTaskId] = useState(() => {
    // If we're on the client, check the URL for task parameter
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const taskParam = urlParams.get('task');
      return taskParam ? parseInt(taskParam, 10) : 0;
    }
    return 0;
  });
  
  // Initialize state for each task
  const [taskStates, setTaskStates] = useState<TaskState[]>(() => {
    // Start with states for 3 tasks (we'll fetch 3 from each source)
    return Array(3).fill(0).map(() => ({
      sqa3dValid: false,
      llmValid: false,
      statusMessage: "Both are bad!"
    }));
  });
  
  // Helper function to get the total number of tasks
  const getTotalTasks = () => {
    return Math.min(sqa3dSceneData.length, llmSceneData.length);
  };
  
  // Handle status change for SQA3D model
  const handleSQA3DChange = (index: number, isValid: boolean) => {
    setTaskStates(prev => {
      const newStates = [...prev];
      newStates[index].sqa3dValid = isValid;
      updateStatusMessage(newStates, index);
      return newStates;
    });
  };
  
  // Handle status change for LLM model
  const handleLLMChange = (index: number, isValid: boolean) => {
    setTaskStates(prev => {
      const newStates = [...prev];
      newStates[index].llmValid = isValid;
      updateStatusMessage(newStates, index);
      return newStates;
    });
  };
  
  // Helper function to update status messages
  const updateStatusMessage = (states: TaskState[], index: number) => {
    const sqa3dOnLeft = modelPositions[index]; // Get position for current task
    
    if (states[index].sqa3dValid && states[index].llmValid) {
      states[index].statusMessage = "Both are good!";
    } else if (states[index].sqa3dValid) {
      states[index].statusMessage = sqa3dOnLeft ? "Left is better!" : "Right is better!";
    } else if (states[index].llmValid) {
      states[index].statusMessage = sqa3dOnLeft ? "Right is better!" : "Left is better!";
    } else {
      states[index].statusMessage = "Both are bad!";
    }
  };
  
  // Navigation handlers
  const handlePrevTask = () => {
    const newTaskId = Math.max(0, taskId - 1);
    navigateToTask(newTaskId);
  };
  
  const handleNextTask = () => {
    const totalTasks = getTotalTasks();
    const newTaskId = Math.min(totalTasks - 1, taskId + 1);
    navigateToTask(newTaskId);
  };
  
  // Navigate to a specific task
  const navigateToTask = (newTaskId: number) => {
    // Update URL with new task id
    const url = new URL(window.location.href);
    url.searchParams.set('task', newTaskId.toString());
    window.history.pushState({}, '', url);
    
    // Update state
    setTaskId(newTaskId);
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
  // Finish comparison handler
  const handleFinish = async () => {
    try {
      setIsProcessingVotes(true);
      setNotification({ show: true, message: 'Processing your votes...', type: 'info' });
      
      // Process votes for each task
      for (let i = 0; i < taskStates.length; i++) {
        if (taskStates[i].sqa3dValid) {
          const taskData = sqa3dSceneData[i];
          taskData.score = (taskData.score * taskData.votes + 1) /  (taskData.votes + 1); // Update score
          taskData.votes += 1;
          taskData.tested = true; // Mark as tested
          await updateTaskData(taskData);
        }
        if (taskStates[i].llmValid) {
          const taskData = llmSceneData[i];
          taskData.score = (taskData.score * taskData.votes + 1) /  (taskData.votes + 1); // Update score
          taskData.votes += 1;
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
  
  const totalTasks = getTotalTasks();
  
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
                           <ReactPlayer url={videoUrl} controls={true} width="100%" height="100%" />
                      </Suspense>
                    </div>
                  </div>

                  <div className="mb-4" />
                  
                  {/* Scene Image */}
                  <div className="w-full">
                    <h3 className="text-gray-300 font-medium mb-1 text-center text-sm">Bird's Eye View</h3>
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
                
                {/* Right column - Task data and controls */}
                <div className="w-full md:w-7/10 flex flex-col h-full">
                  {/* Make this a flex container with full height */}
                  <div className="flex flex-col flex-grow h-full">
                    {/* Add title and instruction */}
                    <div className="mb-4">
                      <h2 className="text-xl font-bold text-white mb-1">Task {taskId + 1}: Answer Comparison</h2>
                      <p className="text-gray-300 text-sm mb-3">
                        Compare the two answers and select which one is more accurate based on the scene context. 
                        Select by clicking on the card that contains the better answer.
                      </p>
                    </div>
                    
                    {/* Task content area */}
                    <div className="overflow-auto">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {modelPositions[taskId] ? (
                          // SQA3D on the left, LLM on the right
                          <>
                            <ComparisonTask 
                              modelName="SQA3D"
                              isValid={taskStates[taskId]?.sqa3dValid}
                              situation={sqa3dSceneData[taskId]?.situation}
                              question={sqa3dSceneData[taskId]?.question}
                              answer={sqa3dSceneData[taskId]?.answer}
                              onStatusChange={(isValid) => handleSQA3DChange(taskId, isValid)}
                            />
                            <ComparisonTask 
                              modelName="LLM"
                              isValid={taskStates[taskId]?.llmValid || false}
                              situation={llmSceneData[taskId]?.situation}
                              question={llmSceneData[taskId]?.question}
                              answer={llmSceneData[taskId]?.answer}
                              onStatusChange={(isValid) => handleLLMChange(taskId, isValid)}
                            />
                          </>
                        ) : (
                          // LLM on the left, SQA3D on the right
                          <>
                            <ComparisonTask 
                              modelName="LLM"
                              isValid={taskStates[taskId]?.llmValid || false}
                              situation={llmSceneData[taskId]?.situation}
                              question={llmSceneData[taskId]?.question}
                              answer={llmSceneData[taskId]?.answer}
                              onStatusChange={(isValid) => handleLLMChange(taskId, isValid)}
                            />
                            <ComparisonTask 
                              modelName="SQA3D"
                              isValid={taskStates[taskId]?.sqa3dValid || false}
                              situation={sqa3dSceneData[taskId]?.situation}
                              question={sqa3dSceneData[taskId]?.question}
                              answer={sqa3dSceneData[taskId]?.answer}
                              onStatusChange={(isValid) => handleSQA3DChange(taskId, isValid)}
                            />
                          </>
                        )}
                      </div>
                      
                      {/* Status message */}
                      <div className={`text-center py-3 font-medium text-xl ${
                        taskStates[taskId]?.statusMessage.includes("good") ? "text-green-500" : 
                        taskStates[taskId]?.statusMessage.includes("bad") ? "text-red-500" : 
                        "text-blue-500"
                      }`}>
                        {taskStates[taskId]?.statusMessage || "Both are bad!"}
                      </div>
                    </div>
                    
                    {/* Flexible spacer that will actually grow */}
                    <div className="flex-grow"></div>
                    
                    {/* Footer area with navigation - now will stick to bottom */}
                    <div className="mt-auto">
                      <div className="flex justify-between">
                        <button 
                          className="px-6 py-3 bg-gray-700 text-gray-200 rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={handlePrevTask}
                          disabled={taskId === 0}
                        >
                          Previous Task
                        </button>
                        
                        {taskId < totalTasks - 1 ? (
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
                      
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <ProgressBar 
                          currentTask={taskId}
                          totalTasks={totalTasks}
                          onTaskSelect={navigateToTask}
                        />
                      </div>
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
