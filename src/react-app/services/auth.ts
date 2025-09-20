import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  gamesPlayed: number;
  totalScore: number;
}

export class AuthService {
  static async signUp(email: string, password: string, displayName: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update the user's display name
    await updateProfile(user, { displayName });

    // Create user profile in Firestore
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email!,
      displayName,
      createdAt: new Date(),
      gamesPlayed: 0,
      totalScore: 0,
    };

    await setDoc(doc(db, 'users', user.uid), userProfile);

    return user;
  }

  static async signIn(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  }

  static async signOutUser(): Promise<void> {
    await signOut(auth);
  }

  static onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }

  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        ...data,
        createdAt: data.createdAt.toDate(),
      } as UserProfile;
    }
    return null;
  }

  static async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    await updateDoc(doc(db, 'users', uid), updates);
  }

  static async addGameScore(uid: string, level: number, strokes: number): Promise<void> {
    const scoreRef = doc(db, 'scores', `${uid}_${Date.now()}`);
    await setDoc(scoreRef, {
      uid,
      level,
      strokes,
      timestamp: new Date(),
    });

    // Update user profile stats
    const userProfile = await this.getUserProfile(uid);
    if (userProfile) {
      await this.updateUserProfile(uid, {
        gamesPlayed: userProfile.gamesPlayed + 1,
        totalScore: userProfile.totalScore + strokes,
      });
    }
  }
}
