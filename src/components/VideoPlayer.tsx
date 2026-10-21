import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, RefreshCw, ShieldAlert } from 'lucide-react';
import {
  trackProductDemoClick,
  trackDemoVideoStart,
} from '../lib/analytics';

interface VideoPlayerProps {
  src: string;
  title: string;
  productName: 'cnms_v2' | 'operations_advisor';
  poster?: string;
  accentColor?: 'cyan' | 'purple';
  callToActionLabel?: string;
  className?: string;
  isExpired?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  title,
  productName,
  poster,
  accentColor = 'cyan',
  callToActionLabel,
  className = '',
  isExpired = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(false);

  const productLabel: 'CNMS' | 'Operations Advisor' =
    productName === 'cnms_v2' ? 'CNMS' : 'Operations Advisor';

  const isCyan = accentColor === 'cyan';
  const accentHex = isCyan ? '#38bdf8' : '#a855f7';

  // When session expires, immediately halt playback and purge video element
  useEffect(() => {
    if (isExpired && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
      setIsPlaying(false);
    }
  }, [isExpired]);

  useEffect(() => {
    setHasError(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [src]);

  const handlePlay = () => {
    if (isExpired) return;
    setIsPlaying(true);
    // Listen strictly to native playback start, fire once per page session
    trackDemoVideoStart(productLabel);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (isExpired) return;
    const video = videoRef.current;
    if (!video) return;

    if (video.paused || video.ended) {
      trackProductDemoClick(productLabel);
      video.play().catch(() => setHasError(true));
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    if (!document.fullscreenElement) {
      video.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setCurrentTime(video.currentTime);
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) {
      setDuration(video.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isExpired) return;
    const video = videoRef.current;
    if (!video) return;
    const target = parseFloat(e.target.value);
    video.currentTime = target;
    setCurrentTime(target);
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const playLabel = callToActionLabel || (productName === 'cnms_v2' ? 'Watch CNMS v2.0 Demo' : 'Watch Operations Advisor Demo');

  if (isExpired) {
    return (
      <div className={`relative w-full aspect-video bg-[#05070B] hairline-all select-none overflow-hidden flex flex-col items-center justify-center p-6 text-center ${className}`}>
        <ShieldAlert className="w-8 h-8 text-amber-400 mb-3" />
        <h4 className="text-sm font-medium font-display text-white mb-1">
          Demonstration Stream Restricted
        </h4>
        <p className="text-xs text-neutral-400 max-w-sm mb-4">
          Your 60-minute preview session has expired. Request an engineer-led technical walkthrough below.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full aspect-video bg-[#020305] hairline-all select-none overflow-hidden group ${className}`}
      onMouseEnter={() => setControlsVisible(true)}
      onMouseLeave={() => setControlsVisible(false)}
    >
      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#07090E]">
          <p className="text-sm font-medium text-white mb-2">Video Stream Authorization Failed</p>
          <p className="text-xs text-neutral-400 mb-4 font-mono">
            Access to protected demonstration streams requires an active 60-minute session.
          </p>
          <button
            onClick={() => {
              setHasError(false);
              videoRef.current?.load();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#222834] text-xs text-neutral-300 hover:text-white"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            src={src}
            poster={poster}
            title={title}
            aria-label={title}
            playsInline
            preload="metadata"
            onPlay={handlePlay}
            onPause={handlePause}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
            onError={() => setHasError(true)}
            onClick={togglePlay}
            className="w-full h-full object-contain cursor-pointer"
          />

          {/* Obvious, Prominent Center Play Control & Label (Visible when paused) */}
          {!isPlaying && (
            <div
              onClick={togglePlay}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 hover:bg-black/25 transition-colors cursor-pointer z-20 group/trigger"
            >
              <div className="flex items-center gap-3 px-5 py-3 rounded-full bg-black/80 border border-white/30 text-white backdrop-blur-md shadow-2xl group-hover/trigger:scale-105 group-hover/trigger:border-white transition-all">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: accentHex }}
                >
                  <Play className="w-4 h-4 ml-0.5 text-black fill-current" />
                </div>
                <span className="font-display font-medium text-sm sm:text-base text-white tracking-tight pr-2">
                  {playLabel}
                </span>
              </div>
            </div>
          )}

          {/* Clean Editorial Control Bar */}
          <div
            className={`absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent transition-opacity duration-200 z-30 ${
              isPlaying && !controlsVisible ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          >
            {/* Scrubber */}
            <div className="flex items-center mb-2">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                aria-label="Seek video position"
                className="w-full h-1 bg-white/20 appearance-none cursor-pointer hover:h-1.5 transition-all"
                style={{ accentColor: accentHex }}
              />
            </div>

            {/* Transport details */}
            <div className="flex items-center justify-between text-xs text-neutral-300">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="hover:text-white transition-colors"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                </button>

                <button
                  onClick={toggleMute}
                  className="hover:text-white transition-colors"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                <span className="text-[11px] text-neutral-400 font-mono">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] hidden sm:inline-block font-sans text-neutral-400">
                  {title}
                </span>
                <button
                  onClick={toggleFullscreen}
                  className="hover:text-white transition-colors"
                  aria-label="Fullscreen"
                >
                  <Maximize className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
