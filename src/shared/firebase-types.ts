// Firebase Auth types
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  gamesPlayed: number;
  totalScore: number;
}

// Game score for Firebase
export interface GameScore {
  uid: string;
  level: number;
  strokes: number;
  timestamp: Date;
}

// Leaderboard entry with user data
export interface FirebaseLeaderboardEntry {
  uid: string;
  displayName: string;
  level: number;
  strokes: number;
  timestamp: Date;
  userProfile?: UserProfile;
}
