"use client";

import type { User as FirebaseUser } from "firebase/auth";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import type { ReactNode} from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { auth, db } from "@/lib/firebase"; // Ensure db is exported from firebase.ts
import type { UserProfile, UserRole } from "@/types";
import { useRouter } from 'next/navigation';

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  isLoggedIn: boolean;
  login: () => Promise<void>; // Placeholder, actual login handled by FirebaseUI or custom forms
  logout: () => Promise<void>;
  updateUserProfileInFirestore: (uid: string, email: string | null, role: UserRole, displayName?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const updateUserProfileInFirestore = useCallback(async (uid: string, email: string | null, role: UserRole, displayName?: string) => {
    if (!db) {
      console.error("Firestore instance (db) is not available.");
      return;
    }
    const userDocRef = doc(db, "users", uid);
    try {
      await setDoc(userDocRef, { 
        uid, 
        email, 
        role,
        displayName: displayName || email?.split('@')[0] || 'Usuario'
      }, { merge: true });
    } catch (error) {
      console.error("Error updating user profile in Firestore:", error);
    }
  }, []);

  useEffect(() => {
    if (!auth || !db) {
      // Firebase might not be initialized yet, especially on server or early client render
      setLoading(false); // Stop loading, currentUser remains null
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setCurrentUser({ 
            uid: user.uid, 
            email: user.email, 
            role: userData.role as UserRole,
            displayName: userData.displayName || user.email?.split('@')[0] || 'Usuario'
          });
        } else {
          // This case might happen if user is created but Firestore doc fails or is pending
          // For now, set a default or null role. A robust app might try to create the doc here or prompt for role.
          setCurrentUser({ 
            uid: user.uid, 
            email: user.email, 
            role: null, // Or a default role if applicable
            displayName: user.email?.split('@')[0] || 'Usuario'
          });
          console.warn("User document not found in Firestore for UID:", user.uid);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [updateUserProfileInFirestore]);

  const login = async () => {
    // Actual login logic will be in LoginForm.tsx using Firebase SDK
    // This function is a placeholder if needed for context-triggered login actions
    console.log("Login action triggered from context (placeholder)");
  };

  const logout = async () => {
    if (!auth) return;
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      router.push('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const isLoggedIn = !loading && !!currentUser;

  return (
    <AuthContext.Provider value={{ currentUser, loading, isLoggedIn, login, logout, updateUserProfileInFirestore }}>
      {!loading ? children : <div className="flex h-screen items-center justify-center"><p>Cargando...</p></div>}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
