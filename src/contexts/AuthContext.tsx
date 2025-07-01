
"use client";

import type { User as FirebaseUser } from "firebase/auth";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { doc, getDoc, setDoc, collection, query, where, getDocs, collectionGroup, getCountFromServer } from "firebase/firestore";
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { auth, db } from "@/lib/firebase"; 
import type { UserProfile, UserRole } from "@/types";
import { useRouter } from 'next/navigation';
import { Loader2 } from "lucide-react";

interface PendingCounts {
  contratos: number;
  pagos: number;
  incidentes: number;
  evaluaciones: number;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  isLoggedIn: boolean;
  login: () => Promise<void>; 
  logout: () => Promise<void>;
  updateUserProfileInFirestore: (uid: string, email: string | null, role: UserRole, displayName?: string) => Promise<void>;
  pendingCounts: PendingCounts;
  fetchPendingCounts: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingCounts, setPendingCounts] = useState<PendingCounts>({
    contratos: 0,
    pagos: 0,
    incidentes: 0,
    evaluaciones: 0,
  });
  const router = useRouter();

  const updateUserProfileInFirestore = useCallback(async (uid: string, email: string | null, role: UserRole, displayName?: string) => {
    const userDocRef = doc(db, "users", uid);
    try {
      await setDoc(userDocRef, { 
        uid, 
        email, 
        role,
        displayName: displayName || email?.split('@')[0] || 'Usuario',
        createdAt: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      console.error("Error updating user profile in Firestore:", error);
    }
  }, []);

  const fetchPendingCounts = useCallback(async () => {
    if (!currentUser) return;
    // Lógica para buscar pendientes...
  }, [currentUser]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        let userProfile: UserProfile | null = null;

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          userProfile = { 
            uid: user.uid, 
            email: user.email, 
            role: userData.role as UserRole,
            displayName: userData.displayName,
            createdAt: userData.createdAt,
            isAdmin: userData.role === 'admin', // Lectura directa del rol desde la DB
          };
        }
        setCurrentUser(userProfile);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchPendingCounts();
    }
  }, [currentUser, fetchPendingCounts]);

  const login = async () => {};

  const logout = async () => {
    await firebaseSignOut(auth);
    setCurrentUser(null);
    router.push('/login');
  };

  const isLoggedIn = !loading && !!currentUser;

  return (
    <AuthContext.Provider value={{ currentUser, loading, isLoggedIn, login, logout, updateUserProfileInFirestore, pendingCounts, fetchPendingCounts }}>
      {loading ? (
        <div className="flex h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3 text-lg">Cargando S.A.R.A...</p>
        </div>
      ) : (
        children
      )}
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
