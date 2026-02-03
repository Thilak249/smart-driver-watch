import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Eye, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusDisplayProps {
  ear: number;
  leftEar: number;
  rightEar: number;
  blinkCount: number;
  status: 'awake' | 'drowsy' | 'sleeping';
  consecutiveFrames: number;
  isRunning: boolean;
}

export const StatusDisplay = ({
  ear,
  leftEar,
  rightEar,
  blinkCount,
  status,
  consecutiveFrames,
  isRunning,
}: StatusDisplayProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'sleeping':
        return {
          icon: XCircle,
          label: 'SLEEPING - WAKE UP!',
          color: 'text-destructive',
          bgColor: 'bg-destructive/10',
          borderColor: 'border-destructive',
        };
      case 'drowsy':
        return {
          icon: AlertTriangle,
          label: 'DROWSY - Stay Alert!',
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500',
        };
      default:
        return {
          icon: CheckCircle,
          label: 'AWAKE - All Good',
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500',
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  // Normalize EAR for progress bar (typical range: 0.15 - 0.35)
  const earProgress = Math.min(100, Math.max(0, ((ear - 0.15) / 0.20) * 100));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
      {/* Status Card */}
      <Card className={cn(
        'border-2 transition-all duration-300',
        statusConfig.borderColor,
        statusConfig.bgColor,
        status !== 'awake' && 'animate-pulse'
      )}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <StatusIcon className={cn('w-5 h-5', statusConfig.color)} />
            Driver Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={cn('text-2xl font-bold', statusConfig.color)}>
            {statusConfig.label}
          </p>
          {isRunning && consecutiveFrames > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              Eyes closed: {consecutiveFrames} frames
            </p>
          )}
        </CardContent>
      </Card>

      {/* EAR Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            Eye Aspect Ratio (EAR)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Average EAR</span>
                <span className="font-mono font-bold">{ear.toFixed(3)}</span>
              </div>
              <Progress 
                value={isRunning ? earProgress : 0} 
                className="h-3"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Left Eye:</span>
                <span className="font-mono ml-2">{leftEar.toFixed(3)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Right Eye:</span>
                <span className="font-mono ml-2">{rightEar.toFixed(3)}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Threshold: 0.25 (below = eyes closed)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Blink Counter Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Blink Counter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-primary">{blinkCount}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Total blinks detected
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Normal: 15-20 blinks/minute
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
