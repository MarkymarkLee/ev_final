"use client";
import React, { useCallback, useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';

interface VideoPlayerProps {
  source: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ source }) => {
    const playerRef = useRef<ReactPlayer>(null);
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
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [loadingVideo, setLoadingVideo] = useState(true);

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
            playerRef.current.seekTo(newValue, 'fraction'); // Seek as fraction
        }
        // Show the frame immediately as user drags
        setCurrentTime(newValue * duration);
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

    // Preload video as blob
    useEffect(() => {
        let url: string | null = null;
        let abort = false;
        setLoadingVideo(true);
        setBlobUrl(null);
        fetch(source)
            .then(async (res) => {
                if (!res.ok) throw new Error('Failed to fetch video');
                const blob = await res.blob();
                if (!abort) {
                    url = URL.createObjectURL(blob);
                    setBlobUrl(url);
                    setLoadingVideo(false);
                }
            })
            .catch(() => {
                setLoadingVideo(false);
            });
        return () => {
            abort = true;
            if (url) URL.revokeObjectURL(url);
        };
    }, [source]);

    return (
        <div 
            ref={containerRef} 
            className={[
                'relative w-full',
                fullscreen ? 'h-screen' : 'aspect-square', // force square aspect ratio
                'overflow-hidden',
                'rounded-lg',
                fullscreen ? 'bg-black' : '', // only bg in fullscreen
            ].join(' ')}
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => playing && setShowControls(false)}
        >
            {loadingVideo ? (
                <div className="flex items-center justify-center w-full h-full min-h-[200px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <span className="ml-4 text-white text-lg">Loading video...</span>
                </div>
            ) : (
                blobUrl && (
                    <ReactPlayer
                        ref={playerRef}
                        url={blobUrl}
                        playing={playing}
                        volume={volume}
                        onProgress={handleProgress}
                        onDuration={handleDuration}
                        width="100%"
                        height="100%"
                        style={{ position: 'absolute', top: 0, left: 0, background: 'transparent' }}
                        className="absolute top-0 left-0"
                        controls={false}
                    />
                )
            )}
            {/* Video Controls - show/hide based on state */}
            <div 
                className={[
                    'absolute bottom-0 left-0 right-0',
                    'bg-gradient-to-t from-black/70 to-transparent',
                    'px-4 py-2', // slightly less padding for compactness
                    'transition-opacity duration-300',
                    showControls ? 'opacity-100' : 'opacity-0',
                ].join(' ')}
            >
                {/* Controls row: Pause/Play | Progress | Fullscreen */}
                <div className="flex items-center gap-2 w-full">
                    {/* Play/Pause button */}
                    <button 
                        onClick={handlePlayPause}
                        className="text-white hover:text-blue-400 transition-colors flex-shrink-0 p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                    {/* Progress bar fits between buttons */}
                    <div className="flex items-center flex-grow min-w-0">
                        <span className="text-white text-xs mr-2 flex-shrink-0 select-none">{formatTime(currentTime)}</span>
                        <div className="relative flex-grow group min-w-0">
                            <input
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
                                className="w-full h-2 bg-gray-600 rounded-full appearance-none cursor-pointer accent-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400
                                          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 
                                          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500
                                          group-hover:[&::-webkit-slider-thumb]:h-4 group-hover:[&::-webkit-slider-thumb]:w-4 
                                          transition-all"
                            />
                            <div 
                                className="absolute top-0 left-0 h-2 bg-blue-500 rounded-full pointer-events-none" 
                                style={{ width: played * 100 + '%' }}
                            ></div>
                        </div>
                        <span className="text-white text-xs ml-2 flex-shrink-0 select-none">{formatTime(duration)}</span>
                    </div>
                    {/* Fullscreen button */}
                    <button 
                        onClick={toggleFullscreen}
                        className="text-white hover:text-blue-400 transition-colors flex-shrink-0 p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
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
    );
};
