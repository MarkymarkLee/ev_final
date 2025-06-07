"use client";
import React, { useCallback, useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';

interface VideoPlayerProps {
  source: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ source }) => {    const playerRef = useRef<ReactPlayer>(null);
    const progressRef = useRef<HTMLInputElement>(null);
    const [playing, setPlaying] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const [played, setPlayed] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [fullscreen, setFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [showControls, setShowControls] = useState(true);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Format time in minutes:seconds format
    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return minutes + ":" + remainingSeconds.toString().padStart(2, '0');
    };

    const handlePlayPause = useCallback(() => {
        setPlaying(prev => !prev);
    }, []);

    const seekForward = () => {
        if (playerRef.current) {
            const newTime = Math.min(playerRef.current.getCurrentTime() + 10, duration);
            playerRef.current.seekTo(newTime);
        }
    };

    const seekBackward = () => {
        if (playerRef.current) {
            const newTime = Math.max(playerRef.current.getCurrentTime() - 10, 0);
            playerRef.current.seekTo(newTime);
        }
    };    const handleProgress = (state: { played: number; playedSeconds: number }) => {
        if (!isDragging) {
            setPlayed(state.played);
            setCurrentTime(state.playedSeconds);
        }
    };const toggleMute = () => {
        setVolume(prev => prev === 0 ? 0.5 : 0);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
    };    const handleProgressMouseDown = () => {
        setIsDragging(true);
    };

    const handleProgressMouseUp = () => {
        setIsDragging(false);
    };

    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseFloat(e.target.value);
        setPlayed(newValue);
        if (playerRef.current) {
            playerRef.current.seekTo(newValue);
        }
    };

    const handleDuration = (duration: number) => {
        setDuration(duration);
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement && containerRef.current) {
            containerRef.current.requestFullscreen().catch(err => {
                console.error("Error attempting to enable fullscreen: " + err.message);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };    useEffect(() => {
        const handleFullscreenChange = () => {
            setFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    useEffect(() => {
        const handleGlobalMouseUp = () => {
            if (isDragging) {
                setIsDragging(false);
            }
        };

        document.addEventListener('mouseup', handleGlobalMouseUp);
        document.addEventListener('touchend', handleGlobalMouseUp);
        
        return () => {
            document.removeEventListener('mouseup', handleGlobalMouseUp);
            document.removeEventListener('touchend', handleGlobalMouseUp);
        };
    }, [isDragging]);

    useEffect(() => {
        const showControlsTemporarily = () => {
            setShowControls(true);
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }
            controlsTimeoutRef.current = setTimeout(() => {
                if (playing) setShowControls(false);
            }, 3000);
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener('mousemove', showControlsTemporarily);
            container.addEventListener('touchstart', showControlsTemporarily);
        }

        return () => {
            if (container) {
                container.removeEventListener('mousemove', showControlsTemporarily);
                container.removeEventListener('touchstart', showControlsTemporarily);
            }
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }
        };
    }, [playing]);

    return (
        <div 
            ref={containerRef} 
            className={"relative w-full overflow-hidden rounded-lg bg-black " + (fullscreen ? 'h-screen' : 'aspect-video')}
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => playing && setShowControls(false)}
        >
            <ReactPlayer
                ref={playerRef}
                url={source}
                playing={playing}
                volume={volume}
                onProgress={handleProgress}
                onDuration={handleDuration}
                width="100%"
                height="100%"
                style={{ position: 'absolute', top: 0, left: 0 }}
                className="absolute top-0 left-0"
                controls={false}
            />
            
            {/* Video Controls - show/hide based on state */}
            <div 
                className={"absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3 transition-opacity duration-300 " +
                    (showControls ? 'opacity-100' : 'opacity-0')
                }
            >
                {/* Progress bar */}
                <div className="flex items-center mb-2">
                    <span className="text-white text-xs mr-2">{formatTime(currentTime)}</span>
                    <div className="relative flex-grow mx-2 group">                        <input
                            ref={progressRef}
                            type="range"
                            min="0"
                            max="1"
                            step="0.001"
                            value={played}
                            onChange={handleProgressChange}
                            onMouseDown={handleProgressMouseDown}
                            onMouseUp={handleProgressMouseUp}
                            onTouchStart={handleProgressMouseDown}
                            onTouchEnd={handleProgressMouseUp}
                            className="w-full h-1.5 bg-gray-600 rounded-full appearance-none cursor-pointer accent-blue-500 
                                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 
                                      [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500
                                      group-hover:[&::-webkit-slider-thumb]:h-4 group-hover:[&::-webkit-slider-thumb]:w-4 
                                      transition-all"
                        />
                        <div 
                            className="absolute top-0 left-0 h-1.5 bg-blue-500 rounded-full pointer-events-none" 
                            style={{ width: played * 100 + '%' }}
                        ></div>
                    </div>
                    <span className="text-white text-xs ml-2">{formatTime(duration)}</span>
                </div>
                
                {/* Controls */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        {/* Play/Pause button */}
                        <button 
                            onClick={handlePlayPause}
                            className="text-white hover:text-blue-400 transition-colors"
                            aria-label={playing ? 'Pause' : 'Play'}
                        >
                            {playing ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                        </button>
                        
                        {/* Rewind button */}
                        <button 
                            onClick={seekBackward}
                            className="text-white hover:text-blue-400 transition-colors"
                            aria-label="Rewind 10 seconds"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                            </svg>
                        </button>
                        
                        {/* Forward button */}
                        <button 
                            onClick={seekForward}
                            className="text-white hover:text-blue-400 transition-colors"
                            aria-label="Forward 10 seconds"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
                            </svg>
                        </button>
                        
                        {/* Volume control */}
                        <div className="flex items-center space-x-2">                            <button 
                                onClick={toggleMute}
                                className="text-white hover:text-blue-400 transition-colors"
                                aria-label={volume === 0 ? "Unmute" : "Mute"}
                            >
                                {volume === 0 ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                    </svg>
                                ) : volume < 0.5 ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657a8 8 0 010-11.314" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 14.536a5 5 0 010-7.072" />
                                    </svg>
                                )}
                            </button>
                            <div className="w-20 hidden sm:block">
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={volume}
                                    onChange={handleVolumeChange}
                                    className="w-full h-1 bg-gray-600 rounded-full appearance-none cursor-pointer accent-blue-500
                                              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 
                                              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* Right side controls */}
                    <div>
                        <button 
                            onClick={toggleFullscreen}
                            className="text-white hover:text-blue-400 transition-colors"
                            aria-label={fullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                        >
                            {fullscreen ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M15 9H19.5M15 9V4.5M15 15v4.5M15 15h4.5M9 15H4.5M9 15v4.5" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Large play button overlay when paused */}
            {!playing && (
                <button 
                    onClick={handlePlayPause}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10
                               bg-blue-500/70 hover:bg-blue-600/70 text-white rounded-full p-4
                               transition-colors duration-300 flex items-center justify-center"
                    aria-label="Play"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>
            )}
        </div>
    );
};
