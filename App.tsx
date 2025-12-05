import React, { useState, Suspense, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import { TreeState, MotionData } from './types';
import { Experience } from './components/Experience';
import { WebcamController } from './components/WebcamController';

export default function App() {
  const [treeState, setTreeState] = useState<TreeState>(TreeState.FORMED);
  const [motionData, setMotionData] = useState<MotionData>({ x: 0, y: 0, intensity: 0, gesture: 'NONE' });
  const [useCamera, setUseCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // User Interaction State
  const [userName, setUserName] = useState<string>("");
  const [hasEnteredName, setHasEnteredName] = useState(false);
  const [showToast, setShowToast] = useState(false);
  
  // Audio State
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Gesture-based State Control
  useEffect(() => {
    if (!useCamera) return;

    if (motionData.gesture === 'OPEN_HAND') {
      setTreeState(TreeState.CHAOS);
    } else if (motionData.gesture === 'CLOSED_FIST') {
      setTreeState(TreeState.FORMED);
    }
  }, [useCamera, motionData.gesture]);

  const toggleState = () => {
    setTreeState(prev => prev === TreeState.FORMED ? TreeState.CHAOS : TreeState.FORMED);
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim().length > 0) {
      setHasEnteredName(true);
      // Try to play audio on interaction - using a promise to handle potential errors gracefully
      if (audioRef.current) {
        audioRef.current.volume = 0.4; // Slightly lower volume for background
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log("Audio playback prevented by browser:", error);
          });
        }
      }
    }
  };

  const handleGiftClick = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1a2e26_0%,_#000000_100%)] z-0 pointer-events-none" />

      {/* BGM: We Wish You a Merry Christmas (Kevin MacLeod) */}
      <audio 
        ref={audioRef} 
        loop 
        preload="auto"
        src="https://upload.wikimedia.org/wikipedia/commons/e/eb/We_Wish_You_a_Merry_Christmas_%28Kevin_MacLeod%29_%28ISRC_USUAN1100339%29.oga" 
      />

      {/* 3D Scene */}
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 4, 22], fov: 40 }}
        gl={{ 
          antialias: false, 
          stencil: false, 
          alpha: false,
          powerPreference: "high-performance" 
        }}
        className={`z-10 transition-opacity duration-1000 ${hasEnteredName ? 'opacity-100' : 'opacity-30 blur-sm'}`}
      >
        <Suspense fallback={null}>
          <Experience 
            treeState={treeState} 
            motionData={motionData} 
            onGiftClick={handleGiftClick}
          />
        </Suspense>
      </Canvas>

      <Loader />

      {/* Intro Screen (Name Input) */}
      {!hasEnteredName && (
        <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/60 backdrop-blur-md transition-opacity duration-700">
           <div className="text-center p-8 border border-emerald-500/30 rounded-2xl bg-black/40 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
              <h1 className="text-5xl font-handwriting text-white mb-6 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
                Welcome
              </h1>
              <p className="text-emerald-100/70 mb-8 font-serif uppercase tracking-widest text-xs">
                Please enter your name to begin
              </p>
              <form onSubmit={handleNameSubmit} className="flex flex-col gap-4">
                <input 
                  type="text" 
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Your Name"
                  className="bg-white/5 border border-emerald-500/50 rounded px-4 py-2 text-white text-center focus:outline-none focus:border-emerald-400 focus:bg-emerald-900/20 transition-all font-serif"
                />
                <button 
                  type="submit"
                  className="px-6 py-2 bg-emerald-600/20 border border-emerald-500 hover:bg-emerald-500 hover:text-black text-emerald-100 rounded uppercase tracking-widest text-xs transition-all duration-300"
                >
                  Enter Experience
                </button>
              </form>
           </div>
        </div>
      )}

      {/* Toast Message - Click Result */}
      {/* Updated: White text with white glow for 5s */}
      <div className={`absolute top-[60%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[70] transition-opacity duration-700 ${showToast ? 'opacity-100' : 'opacity-0'}`}>
        <h1 className="text-2xl md:text-4xl font-handwriting text-white text-center whitespace-nowrap drop-shadow-[0_0_15px_rgba(255,255,255,0.9)] [text-shadow:0_0_20px_rgba(255,255,255,0.8),0_0_40px_rgba(255,255,255,0.4)] animate-pulse">
          {userName}, Merry Christmas
        </h1>
      </div>

      {/* Main UI Overlay (Only visible after name entry) */}
      <div className={`absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-between p-6 z-50 transition-opacity duration-1000 ${hasEnteredName ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* Header: Lowered and smaller */}
        <div className="text-center mt-24 relative z-50 select-none">
          <h1 className="text-xl md:text-3xl font-handwriting text-transparent bg-clip-text bg-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] opacity-90 pb-1">
            Grand Luxury
          </h1>
          <h2 className="text-[8px] md:text-[10px] font-light text-emerald-200 tracking-[0.6em] uppercase drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]">
            Christmas Tree
          </h2>
        </div>

        {/* Bottom Status Text */}
        <div className="text-center mb-6 pointer-events-auto">
           <p className="text-yellow-100/60 text-[9px] font-mono uppercase tracking-widest">
            {useCamera 
              ? `Status: ${motionData.gesture === 'NONE' ? 'Detecting Hand...' : motionData.gesture.replace('_', ' ')}`
              : "Drag to Rotate • Click Blue Gift"}
          </p>
           {useCamera && (
             <div className="flex justify-center gap-4 mt-2">
                <span className={`text-[8px] uppercase transition-colors duration-300 ${motionData.gesture === 'OPEN_HAND' ? 'text-red-400 glow' : 'text-gray-500'}`}>
                  Open Hand: Explode
                </span>
                <span className={`text-[8px] uppercase transition-colors duration-300 ${motionData.gesture === 'CLOSED_FIST' ? 'text-emerald-400 glow' : 'text-gray-500'}`}>
                  Fist: Assemble
                </span>
             </div>
           )}
        </div>

        {/* Top Right Controls */}
        <div className="absolute top-6 right-6 flex flex-col items-end gap-3 pointer-events-auto">
          {/* Music Toggle */}
           <button
            onClick={toggleMute}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-white/20 bg-white/5 backdrop-blur-md text-white/70 hover:bg-white/10 transition-all"
            title={isMuted ? "Unmute Music" : "Mute Music"}
          >
            {isMuted ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
            )}
          </button>

          <button
            onClick={() => setUseCamera(!useCamera)}
            className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded border transition-all duration-500 backdrop-blur-md
              ${useCamera 
                ? 'bg-emerald-900/40 border-emerald-400 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'}
            `}
          >
            {useCamera ? 'Cam ON' : 'Use Cam'}
          </button>

          <button
            onClick={toggleState}
            className={`
              relative overflow-hidden px-4 py-1.5 rounded backdrop-blur-md border transition-all duration-500
              ${treeState === TreeState.FORMED 
                ? 'bg-white/5 border-white/20 text-white hover:bg-white/10' 
                : 'bg-yellow-600/20 border-yellow-500 text-yellow-200 shadow-[0_0_20px_rgba(234,179,8,0.4)]'}
            `}
          >
            <span className="font-sans text-[9px] uppercase tracking-widest font-bold">
              {treeState === TreeState.FORMED ? 'Explode' : 'Form'}
            </span>
          </button>
        </div>

        {/* Camera Preview */}
        {useCamera && (
          <div className="absolute bottom-6 right-6 pointer-events-auto transition-opacity duration-1000 animate-in fade-in">
             <div className="w-24 h-16 rounded-lg overflow-hidden border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)] bg-black/50 backdrop-blur-sm relative">
                <WebcamController 
                  onMotionUpdate={setMotionData} 
                  onStreamReady={setCameraStream} 
                  className="w-full h-full object-cover transform -scale-x-100 opacity-80"
                />
                <div className="absolute bottom-0 left-0 w-full text-center text-[6px] text-emerald-300 uppercase tracking-widest bg-black/60 py-0.5">
                  Live Feed
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}