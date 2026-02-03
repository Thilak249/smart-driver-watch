import { EyeTracker } from '@/components/EyeTracker';
import { Eye, Shield, AlertTriangle } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Eye className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Smart Eye Tracking System
              </h1>
              <p className="text-muted-foreground">
                Real-time drowsiness detection to prevent road accidents
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Info Banner */}
        <div className="mb-8 p-4 bg-muted rounded-lg border flex items-start gap-3">
          <Shield className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <h2 className="font-semibold text-foreground">How it works</h2>
            <p className="text-sm text-muted-foreground mt-1">
              This system uses MediaPipe FaceMesh to detect 468 facial landmarks in real-time. 
              It calculates the Eye Aspect Ratio (EAR) from 6 key eye landmarks per eye. 
              When EAR drops below threshold for consecutive frames, it triggers a drowsiness alert.
            </p>
          </div>
        </div>

        {/* Eye Tracker Component */}
        <EyeTracker />

        {/* Algorithm Explanation */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-card rounded-lg border">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              EAR Algorithm
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              <strong>Eye Aspect Ratio (EAR)</strong> measures eye openness using the formula:
            </p>
            <code className="block bg-muted p-2 rounded mt-2 text-sm font-mono">
              EAR = (|p2-p6| + |p3-p5|) / (2 × |p1-p4|)
            </code>
            <ul className="text-sm text-muted-foreground mt-2 list-disc list-inside space-y-1">
              <li>p1, p4: Horizontal eye corners</li>
              <li>p2, p6: Upper eyelid landmarks</li>
              <li>p3, p5: Lower eyelid landmarks</li>
            </ul>
          </div>

          <div className="p-4 bg-card rounded-lg border">
            <h3 className="font-semibold text-foreground">Detection Thresholds</h3>
            <ul className="text-sm text-muted-foreground mt-2 space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <strong>Awake:</strong> EAR &gt; 0.25
              </li>
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-500" />
                <strong>Drowsy:</strong> Eyes closed for 15+ frames
              </li>
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <strong>Sleeping:</strong> Eyes closed for 30+ frames
              </li>
            </ul>
            <p className="text-xs text-muted-foreground mt-3">
              Audio alert triggers when drowsiness is detected.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-12">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          College Mini Project: Smart Eye Tracking System | Built with React + MediaPipe
        </div>
      </footer>
    </div>
  );
};

export default Index;
