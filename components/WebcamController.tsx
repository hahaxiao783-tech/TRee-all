import React, { useEffect, useRef } from 'react';
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { MotionData, GestureType } from '../types';

interface Props {
  onMotionUpdate: (data: MotionData) => void;
  onStreamReady?: (stream: MediaStream) => void;
  className?: string;
}

export const WebcamController: React.FC<Props> = ({ onMotionUpdate, onStreamReady, className }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastGestureRef = useRef<GestureType>('NONE');

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let handLandmarker: HandLandmarker | null = null;
    let animationFrameId: number;

    const setupMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
        startWebcam();
      } catch (error) {
        console.error("Error initializing MediaPipe:", error);
      }
    };

    const startWebcam = () => {
      navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, facingMode: "user" } })
        .then((stream) => {
          if (video) {
            video.srcObject = stream;
            video.play();
            if (onStreamReady) onStreamReady(stream);
            video.addEventListener("loadeddata", predictWebcam);
          }
        })
        .catch((err) => {
            console.error("Webcam error:", err);
            alert("Unable to access camera. Please check permissions.");
        });
    };

    const predictWebcam = () => {
      if (!video || !handLandmarker) return;

      const nowInMs = Date.now();
      
      if (video.currentTime > 0) {
        const results = handLandmarker.detectForVideo(video, nowInMs);
        
        let gesture: GestureType = 'NONE';
        let x = 0;
        let y = 0;
        let intensity = 0;

        if (results.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];
          
          // Wrist (0), Middle Finger MCP (9)
          const wrist = landmarks[0];
          const middleMcp = landmarks[9];
          
          // Map position
          x = (1 - middleMcp.x) * 2 - 1; 
          y = -(middleMcp.y * 2 - 1);

          // Gesture Logic
          const tips = [8, 12, 16, 20];
          let totalDist = 0;
          tips.forEach(idx => {
            const dx = landmarks[idx].x - wrist.x;
            const dy = landmarks[idx].y - wrist.y;
            totalDist += Math.sqrt(dx*dx + dy*dy);
          });
          const avgDist = totalDist / 4;

          // Tuned Thresholds
          if (avgDist < 0.25) {
            gesture = 'CLOSED_FIST';
            intensity = 0;
          } else if (avgDist > 0.35) {
            gesture = 'OPEN_HAND';
            intensity = 1;
          }
        }

        if (gesture !== lastGestureRef.current) {
          lastGestureRef.current = gesture;
        }

        onMotionUpdate({ x, y, intensity, gesture });
      }

      animationFrameId = window.requestAnimationFrame(predictWebcam);
    };

    setupMediaPipe();

    return () => {
      if (video && video.srcObject) {
        (video.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (handLandmarker) handLandmarker.close();
    };
  }, []);

  return (
    <video 
      ref={videoRef} 
      className={className || "hidden"} 
      autoPlay 
      playsInline 
      muted 
    />
  );
};