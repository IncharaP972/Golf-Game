import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Star, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { FirebaseLeaderboardService } from '../services/firebase-leaderboard-updated';
import { FirebaseLeaderboardEntry } from '@/shared/firebase-types';

interface LeaderboardProps {
  maxEntries?: number;
}

export default function Leaderboard({ maxEntries = 10 }: LeaderboardProps) {
  const { user } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState<number | 'overall'>('overall');
  const [levelScores, setLevelScores] = useState<FirebaseLeaderboardEntry[]>([]);
  const [overallScores, setOverallScores] = useState<{ displayName: string; totalStrokes: number; levelsCompleted: number; uid: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLeaderboardData();
  }, [selectedLevel, maxEntries]);

  const loadLeaderboardData = async () => {
    setLoading(true);
    try {
      if (selectedLevel === 'overall') {
        const scores = await FirebaseLeaderboardService.getOverallLeaderboard(maxEntries);
        setOverallScores(scores);
      } else {
        const scores = await FirebaseLeaderboardService.getTopScoresForLevel(selectedLevel, maxEntries);
        setLevelScores(scores);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      // Fallback to local data if Firebase fails
      if (selectedLevel === 'overall') {
        setOverallScores([]);
      } else {
        setLevelScores([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <Star className="w-4 h-4 text-blue-500" />;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 3:
        return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white';
      default:
        return 'bg-white/15 text-white';
    }
  };

  const isCurrentUser = (uid: string) => {
    return user && user.uid === uid;
  };

  return (
    <div className="bg-white/15 backdrop-blur-sm rounded-xl p-6 shadow-xl">
      <h2 className="text-2xl font-bold text-white mb-4 text-center flex items-center justify-center gap-2">
        <Trophy className="w-6 h-6 text-yellow-400" />
        Global Leaderboard
      </h2>

      {/* User Status */}
      {user && (
        <div className="mb-4 p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
          <div className="flex items-center gap-2 text-white">
            <User className="w-4 h-4" />
            <span className="text-sm font-medium">
              Signed in as: {user.displayName || user.email}
            </span>
          </div>
        </div>
      )}

      {/* Level Selection */}
      <div className="flex flex-wrap gap-2 mb-4 justify-center">
        <button
          onClick={() => setSelectedLevel('overall')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
            selectedLevel === 'overall'
              ? 'bg-white/25 text-white'
              : 'bg-white/8 text-white/70 hover:bg-white/15'
          }`}
        >
          Overall
        </button>
        {[1, 2, 3, 4, 5].map((level) => (
          <button
            key={level}
            onClick={() => setSelectedLevel(level)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              selectedLevel === level
                ? 'bg-white/25 text-white'
                : 'bg-white/8 text-white/70 hover:bg-white/15'
            }`}
          >
            Level {level}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center text-white/70 py-4">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-2"></div>
          Loading leaderboard...
        </div>
      )}

      {/* Leaderboard Content */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {selectedLevel === 'overall' ? (
          overallScores.length > 0 ? (
            overallScores.map((entry, index) => (
              <div
                key={`${entry.uid}-overall`}
                className={`flex items-center gap-3 p-3 rounded-lg relative ${
                  getRankColor(index + 1)
                } ${isCurrentUser(entry.uid) ? 'ring-2 ring-blue-400' : ''}`}
              >
                <div className="flex items-center gap-2">
                  {getRankIcon(index + 1)}
                  <span className="font-bold text-sm">#{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate flex items-center gap-2">
                    {entry.displayName}
                    {isCurrentUser(entry.uid) && (
                      <span className="text-xs bg-blue-500/30 px-2 py-0.5 rounded-full">You</span>
                    )}
                  </div>
                  <div className="text-xs opacity-90">
                    {entry.levelsCompleted} levels • {entry.totalStrokes} total strokes
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-white/70 py-4">
              No scores yet. Be the first to complete a level!
            </div>
          )
        ) : (
          levelScores.length > 0 ? (
            levelScores.map((entry, index) => (
              <div
                key={`${entry.uid}-${entry.level}-${entry.timestamp}`}
                className={`flex items-center gap-3 p-3 rounded-lg relative ${
                  getRankColor(index + 1)
                } ${isCurrentUser(entry.uid) ? 'ring-2 ring-blue-400' : ''}`}
              >
                <div className="flex items-center gap-2">
                  {getRankIcon(index + 1)}
                  <span className="font-bold text-sm">#{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate flex items-center gap-2">
                    {entry.displayName}
                    {isCurrentUser(entry.uid) && (
                      <span className="text-xs bg-blue-500/30 px-2 py-0.5 rounded-full">You</span>
                    )}
                  </div>
                  <div className="text-xs opacity-90">
                    {entry.strokes} strokes
                  </div>
                </div>
                <div className="text-xs opacity-75">
                  {new Date(entry.timestamp).toLocaleDateString()}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-white/70 py-4">
              No scores for Level {selectedLevel} yet.
            </div>
          )
        )}
      </div>

      {selectedLevel === 'overall' && overallScores.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="text-xs text-white/70 text-center">
            Overall ranking based on levels completed and total strokes
          </div>
        </div>
      )}

      {/* Firebase Status */}
      <div className="mt-4 pt-4 border-t border-white/20">
        <div className="text-xs text-white/50 text-center">
          {user ? '✅ Connected to Firebase' : '⚠️ Sign in to save scores globally'}
        </div>
      </div>
    </div>
  );
}
