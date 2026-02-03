import { useRef, useState, useCallback, useEffect } from 'react';

// Eye landmark indices for MediaPipe FaceMesh
const LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380];

interface EyeTrackingState {
  ear: number;
  leftEar: number;
  rightEar: number;
  blinkCount: number;
  isDrowsy: boolean;
  status: 'awake' | 'drowsy' | 'sleeping';
  consecutiveFrames: number;
}

interface Landmark {
  x: number;
  y: number;
  z: number;
}

// Calculate distance between two points
const distance = (p1: Landmark, p2: Landmark): number => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

// Calculate Eye Aspect Ratio (EAR)
// EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
const calculateEAR = (landmarks: Landmark[], indices: number[]): number => {
  const p1 = landmarks[indices[0]]; // outer corner
  const p2 = landmarks[indices[1]]; // upper lid outer
  const p3 = landmarks[indices[2]]; // upper lid inner
  const p4 = landmarks[indices[3]]; // inner corner
  const p5 = landmarks[indices[4]]; // lower lid inner
  const p6 = landmarks[indices[5]]; // lower lid outer

  const vertical1 = distance(p2, p6);
  const vertical2 = distance(p3, p5);
  const horizontal = distance(p1, p4);

  if (horizontal === 0) return 0;
  
  return (vertical1 + vertical2) / (2 * horizontal);
};

export const useEyeTracking = (
  earThreshold: number = 0.25,
  drowsyFrameThreshold: number = 20
) => {
  const [state, setState] = useState<EyeTrackingState>({
    ear: 0,
    leftEar: 0,
    rightEar: 0,
    blinkCount: 0,
    isDrowsy: false,
    status: 'awake',
    consecutiveFrames: 0,
  });

  const consecutiveFramesRef = useRef(0);
  const blinkCountRef = useRef(0);
  const wasBlinkingRef = useRef(false);
  const alertAudioRef = useRef<AudioContext | null>(null);

  // Play alert sound
  const playAlert = useCallback(() => {
    try {
      if (!alertAudioRef.current) {
        alertAudioRef.current = new AudioContext();
      }
      const ctx = alertAudioRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.log('Audio alert failed:', e);
    }
  }, []);

  // Process face landmarks
  const processLandmarks = useCallback((landmarks: Landmark[]) => {
    if (!landmarks || landmarks.length < 468) return;

    const leftEar = calculateEAR(landmarks, LEFT_EYE_INDICES);
    const rightEar = calculateEAR(landmarks, RIGHT_EYE_INDICES);
    const avgEar = (leftEar + rightEar) / 2;

    // Detect blink
    const isBlinking = avgEar < earThreshold;
    
    if (isBlinking && !wasBlinkingRef.current) {
      blinkCountRef.current += 1;
    }
    wasBlinkingRef.current = isBlinking;

    // Track consecutive frames with eyes closed
    if (avgEar < earThreshold) {
      consecutiveFramesRef.current += 1;
    } else {
      consecutiveFramesRef.current = 0;
    }

    // Determine status
    let status: 'awake' | 'drowsy' | 'sleeping' = 'awake';
    let isDrowsy = false;

    if (consecutiveFramesRef.current >= drowsyFrameThreshold * 2) {
      status = 'sleeping';
      isDrowsy = true;
    } else if (consecutiveFramesRef.current >= drowsyFrameThreshold) {
      status = 'drowsy';
      isDrowsy = true;
    }

    setState({
      ear: avgEar,
      leftEar,
      rightEar,
      blinkCount: blinkCountRef.current,
      isDrowsy,
      status,
      consecutiveFrames: consecutiveFramesRef.current,
    });

    return { avgEar, isDrowsy, status };
  }, [earThreshold, drowsyFrameThreshold]);

  const resetBlinkCount = useCallback(() => {
    blinkCountRef.current = 0;
    setState(prev => ({ ...prev, blinkCount: 0 }));
  }, []);

  // Cleanup audio context
  useEffect(() => {
    return () => {
      if (alertAudioRef.current) {
        alertAudioRef.current.close();
      }
    };
  }, []);

  return {
    ...state,
    processLandmarks,
    playAlert,
    resetBlinkCount,
  };
};
