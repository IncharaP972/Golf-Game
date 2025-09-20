import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Star, LogOut, User } from 'lucide-react';
import { FirebaseOnlyLeaderboardService } from '../services/firebase-only-leaderboard';
import { FirebaseLeaderboardEntry } from '@/shared/firebase-types';
import { useAuth } from '../contexts/AuthContext';

interface LeaderboardProps {
  maxEntries?: number;
}

export default function FirebaseOnlyLeaderboard({ maxEntries = 10 }: LeaderboardProps) {
  const [selectedLevel, setSelectedLevel] = useState<number | 'overall'>('overall');
  const [levelScores, setLevelScores] = useState<FirebaseLeaderboardEntry[]>([]);
  const [overallScores, setOverallScores] = useState<{ displayName: string; totalStrokes: number; levelsCompleted: number; uid: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, userProfile, signOut } = useAuth();

  useEffect(() => {
    loadLeaderboardData();
  }, [selectedLevel, maxEntries]);

  const loadLeaderboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (selectedLevel === 'overall') {
        const scores = await FirebaseOnlyLeaderboardService.getOverallLeaderboard(maxEntries);
        setOverallScores(scores);
      } else {
        const scores = await FirebaseOnlyLeaderboardService.getTopScoresForLevel(selectedLevel, maxEntries);
        setLevelScores(scores);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      setError(error instanceof Error ? error.message : 'Failed to load leaderboard');
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
    return user?.uid === uid;
  };

  return (
    <div className="bg-white/15 backdrop-blur-sm rounded-xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-400" />
          Leaderboard
        </h2>

        {user && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-white/80">
              <User className="w-4 h-4" />
              <span className="text-sm">{userProfile?.displayName || user.displayName}</span>
            </div>
            <button
              onClick={signOut}
              className="p-2 text-white/60 hover:text-white transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

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

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Leaderboard Content */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {loading ? (
          <div className="text-center text-white/70 py-4">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-2"></div>
            Loading leaderboard...
          </div>
        ) : selectedLevel === 'overall' ? (
          overallScores.length > 0 ? (
            overallScores.map((entry, index) => (
              <div
                key={`${entry.uid}-overall`}
                className={`flex items-center gap-3 p-3 rounded-lg ${
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
                      <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
                        You
                      </span>
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
                key={`${entry.uid}-${entry.level}-${entry.timestamp.getTime()}`}
                className={`flex items-center gap-3 p-3 rounded-lg ${
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
                      <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-xs opacity-90">
                    {entry.strokes} strokes
                  </div>
                </div>
                <div className="text-xs opacity-75">
                  {entry.timestamp.toLocaleDateString()}
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
    </div>
  );
}
