import { collection, addDoc, getDocs, query, orderBy, limit, where, DocumentData } from 'firebase/firestore';
import { db } from './firebase';
import { FirebaseLeaderboardEntry } from '@/shared/firebase-types';

export class FirebaseOnlyLeaderboardService {
  static async addScore(uid: string, displayName: string, level: number, strokes: number): Promise<void> {
    try {
      // Add score to Firebase only - no localStorage fallback
      await addDoc(collection(db, 'scores'), {
        uid,
        displayName,
        level,
        strokes,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Error adding score to Firebase:', error);
      throw new Error('Failed to save score. Please check your internet connection.');
    }
  }

  static async getTopScoresForLevel(level: number, limitCount: number = 10): Promise<FirebaseLeaderboardEntry[]> {
    try {
      const scoresRef = collection(db, 'scores');
      const q = query(
        scoresRef,
        where('level', '==', level),
        orderBy('strokes', 'asc'),
        orderBy('timestamp', 'asc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const entries: FirebaseLeaderboardEntry[] = [];

      querySnapshot.forEach((doc: DocumentData) => {
        const data = doc.data();
        entries.push({
          uid: data.uid,
          displayName: data.displayName,
          level: data.level,
          strokes: data.strokes,
          timestamp: data.timestamp.toDate(),
        });
      });

      return entries;
    } catch (error) {
      console.error('Error fetching scores from Firebase:', error);
      throw new Error('Failed to load leaderboard. Please check your internet connection.');
    }
  }

  static async getOverallLeaderboard(limitCount: number = 20): Promise<{ displayName: string; totalStrokes: number; levelsCompleted: number; uid: string }[]> {
    try {
      const scoresRef = collection(db, 'scores');
      const q = query(scoresRef, orderBy('strokes', 'asc'));
      const querySnapshot = await getDocs(q);

      const playerStats = new Map<string, { totalStrokes: number; levels: Set<number>; displayName: string }>();

      querySnapshot.forEach((doc: DocumentData) => {
        const data = doc.data();
        const existing = playerStats.get(data.uid);

        if (!existing || data.strokes < existing.totalStrokes) {
          const playerData = playerStats.get(data.uid) || {
            totalStrokes: 0,
            levels: new Set<number>(),
            displayName: data.displayName
          };

          // Remove previous score for this level if exists
          if (existing) {
            playerData.totalStrokes -= existing.totalStrokes;
          }

          playerData.totalStrokes += data.strokes;
          playerData.levels.add(data.level);
          playerStats.set(data.uid, playerData);
        }
      });

      // Convert to array and sort
      const leaderboard = Array.from(playerStats.entries())
        .map(([uid, stats]) => ({
          uid,
          displayName: stats.displayName,
          totalStrokes: stats.totalStrokes,
          levelsCompleted: stats.levels.size,
        }))
        .sort((a, b) => {
          // Sort by levels completed (descending), then by total strokes (ascending)
          if (a.levelsCompleted !== b.levelsCompleted) {
            return b.levelsCompleted - a.levelsCompleted;
          }
          return a.totalStrokes - b.totalStrokes;
        });

      return leaderboard.slice(0, limitCount);
    } catch (error) {
      console.error('Error fetching overall leaderboard from Firebase:', error);
      throw new Error('Failed to load leaderboard. Please check your internet connection.');
    }
  }

  static async getPlayerBestScore(uid: string, level: number): Promise<number | null> {
    try {
      const scoresRef = collection(db, 'scores');
      const q = query(
        scoresRef,
        where('uid', '==', uid),
        where('level', '==', level),
        orderBy('strokes', 'asc'),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data();
        return data.strokes;
      }
      return null;
    } catch (error) {
      console.error('Error fetching player best score:', error);
      return null;
    }
  }

  static async getPlayerStats(uid: string): Promise<{ totalStrokes: number; levelsCompleted: number; gamesPlayed: number } | null> {
    try {
      const scoresRef = collection(db, 'scores');
      const q = query(scoresRef, where('uid', '==', uid));
      const querySnapshot = await getDocs(q);

      let totalStrokes = 0;
      const levelsCompleted = new Set<number>();

      querySnapshot.forEach((doc: DocumentData) => {
        const data = doc.data();
        totalStrokes += data.strokes;
        levelsCompleted.add(data.level);
      });

      return {
        totalStrokes,
        levelsCompleted: levelsCompleted.size,
        gamesPlayed: querySnapshot.size,
      };
    } catch (error) {
      console.error('Error fetching player stats:', error);
      return null;
    }
  }
}
