import { useRef, useEffect, useState, useCallback } from 'react';
import { FaceMesh, Results } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import { useEyeTracking } from '@/hooks/useEyeTracking';
import { StatusDisplay } from './StatusDisplay';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera as CameraIcon, CameraOff, RotateCcw } from 'lucide-react';

export const EyeTracker = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<Camera | null>(null);
  const faceMeshRef = useRef<FaceMesh | null>(null);
  
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    ear,
    leftEar,
    rightEar,
    blinkCount,
    isDrowsy,
    status,
    consecutiveFrames,
    processLandmarks,
    playAlert,
    resetBlinkCount,
  } = useEyeTracking(0.25, 15);

  const alertPlayedRef = useRef(false);

  // Play alert when drowsy
  useEffect(() => {
    if (isDrowsy && !alertPlayedRef.current) {
      playAlert();
      alertPlayedRef.current = true;
    } else if (!isDrowsy) {
      alertPlayedRef.current = false;
    }
  }, [isDrowsy, playAlert]);

  const onResults = useCallback((results: Results) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];
      
      // Process landmarks for EAR calculation
      processLandmarks(landmarks);

      // Draw eye landmarks
      const leftEyeIndices = [33, 160, 158, 133, 153, 144];
      const rightEyeIndices = [362, 385, 387, 263, 373, 380];

      const drawEyePoints = (indices: number[], color: string) => {
        ctx.fillStyle = color;
        indices.forEach(index => {
          const point = landmarks[index];
          ctx.beginPath();
          ctx.arc(point.x * canvas.width, point.y * canvas.height, 3, 0, 2 * Math.PI);
          ctx.fill();
        });

        // Draw eye outline
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        indices.forEach((index, i) => {
          const point = landmarks[index];
          if (i === 0) {
            ctx.moveTo(point.x * canvas.width, point.y * canvas.height);
          } else {
            ctx.lineTo(point.x * canvas.width, point.y * canvas.height);
          }
        });
        ctx.closePath();
        ctx.stroke();
      };

      const eyeColor = isDrowsy ? '#ef4444' : '#22c55e';
      drawEyePoints(leftEyeIndices, eyeColor);
      drawEyePoints(rightEyeIndices, eyeColor);
    }

    ctx.restore();
  }, [processLandmarks, isDrowsy]);

  const startCamera = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Initialize FaceMesh
      const faceMesh = new FaceMesh({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        },
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      faceMesh.onResults(onResults);
      faceMeshRef.current = faceMesh;

      // Initialize Camera
      if (videoRef.current) {
        const camera = new Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current && faceMeshRef.current) {
              await faceMeshRef.current.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480,
        });

        await camera.start();
        cameraRef.current = camera;
        setIsRunning(true);
      }
    } catch (err) {
      console.error('Failed to start camera:', err);
      setError('Failed to access camera. Please ensure camera permissions are granted.');
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    if (faceMeshRef.current) {
      faceMeshRef.current.close();
      faceMeshRef.current = null;
    }
    setIsRunning(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-4xl mx-auto p-4">
      <Card className="relative overflow-hidden bg-card border-2 border-border">
        <div className="relative aspect-video w-full min-w-[320px] md:min-w-[640px] bg-muted">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover opacity-0"
            playsInline
            muted
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          {!isRunning && !isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/90 gap-4">
              <CameraIcon className="w-16 h-16 text-muted-foreground" />
              <p className="text-muted-foreground text-center px-4">
                Click "Start Camera" to begin eye tracking
              </p>
            </div>
          )}

          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/90 gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
              <p className="text-muted-foreground">Loading MediaPipe...</p>
            </div>
          )}

          {isDrowsy && isRunning && (
            <div className="absolute inset-0 border-4 border-destructive animate-pulse pointer-events-none" />
          )}
        </div>
      </Card>

      <div className="flex gap-4">
        {!isRunning ? (
          <Button 
            onClick={startCamera} 
            disabled={isLoading}
            size="lg"
            className="gap-2"
          >
            <CameraIcon className="w-5 h-5" />
            Start Camera
          </Button>
        ) : (
          <Button 
            onClick={stopCamera} 
            variant="destructive"
            size="lg"
            className="gap-2"
          >
            <CameraOff className="w-5 h-5" />
            Stop Camera
          </Button>
        )}
        
        <Button 
          onClick={resetBlinkCount} 
          variant="outline"
          size="lg"
          className="gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          Reset Blinks
        </Button>
      </div>

      {error && (
        <div className="text-destructive text-center p-4 bg-destructive/10 rounded-lg">
          {error}
        </div>
      )}

      <StatusDisplay
        ear={ear}
        leftEar={leftEar}
        rightEar={rightEar}
        blinkCount={blinkCount}
        status={status}
        consecutiveFrames={consecutiveFrames}
        isRunning={isRunning}
      />
    </div>
  );
};
