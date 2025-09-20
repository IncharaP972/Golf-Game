import { useEffect, useRef, useState } from 'react';
import { Pause, Volume2, Trophy, ArrowRight, RotateCcw as Replay } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';
import { FirebaseOnlyLeaderboardService } from '../services/firebase-leaderboard';
import { useAuth } from '../contexts/AuthContext';

export default function Game() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialLevel = parseInt(queryParams.get('level') || '1', 10);
  const { user, userProfile } = useAuth();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameInstanceRef = useRef<any>(null);
  const [currentLevel, setCurrentLevel] = useState(initialLevel);
  const [showCongrats, setShowCongrats] = useState(false);
  const [completedStrokes, setCompletedStrokes] = useState(0);
  const [showPause, setShowPause] = useState(false);
  const [instructionIntro, setInstructionIntro] = useState(false);
  const [showBoundaryWarning, setShowBoundaryWarning] = useState(false);

  const initializeGame = (level: number) => {
    if (gameInstanceRef.current) {
      gameInstanceRef.current.dispose();
    }

    if (canvasRef.current) {
      const canvas = canvasRef.current;

      import('../game/GameEngine').then(({ GameEngine }) => {
        gameInstanceRef.current = new GameEngine(canvas, level, async (_, strokes) => {
          setCompletedStrokes(strokes);
          setShowCongrats(true);

          // Save score to Firebase if user is authenticated
          if (user && userProfile) {
            try {
              await FirebaseOnlyLeaderboardService.addScore(
                user.uid,
                userProfile.displayName || user.displayName || 'Anonymous',
                level,
                strokes
              );
              console.log('Score saved to Firebase successfully!');
            } catch (error) {
              console.error('Failed to save score to Firebase:', error);
              // Could show a toast notification here
            }
          } else {
            console.warn('User not authenticated - score not saved to leaderboard');
          }

          // Persist progress immediately when a level is completed
          const saved = localStorage.getItem('levelsData');
          let levelsData = saved ? JSON.parse(saved) : [];
          const idx = levelsData.findIndex((l: any) => l.id === level);
          if (idx !== -1) {
            const best = levelsData[idx].bestScore;
            if (best === null || strokes < best) {
              levelsData[idx].bestScore = strokes;
            }
            if (idx + 1 < levelsData.length) {
              levelsData[idx + 1].isUnlocked = true;
            }
            localStorage.setItem('levelsData', JSON.stringify(levelsData));
          }
        });
        gameInstanceRef.current.start();
      });
    }
  };

  useEffect(() => {
    initializeGame(currentLevel);

    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.dispose();
      }
    };
  }, [currentLevel]);

  // Level instruction intro animation
  useEffect(() => {
    if (currentLevel === 1) {
      setInstructionIntro(true);
      const timer = setTimeout(() => setInstructionIntro(false), 1000);
      return () => clearTimeout(timer);
    }
    if (currentLevel === 5) {
      // Show boundary warning for level 5 (circular course) for 3 seconds
      setShowBoundaryWarning(true);
      const timer2 = setTimeout(() => setShowBoundaryWarning(false), 3000);
      return () => clearTimeout(timer2);
    }
    setInstructionIntro(false);
    setShowBoundaryWarning(false);
  }, [currentLevel]);

  const resetLevel = () => {
    if (gameInstanceRef.current) {
      gameInstanceRef.current.resetBall();
    }
  };

  const toggleMute = () => {
    if (gameInstanceRef.current) {
      gameInstanceRef.current.toggleMute();
    }
  };
