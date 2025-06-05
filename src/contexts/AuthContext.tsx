
"use client";

import type { User as FirebaseUser } from "firebase/auth";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { doc, getDoc, setDoc, collection, query, where, getDocs, collectionGroup,getCountFromServer } from "firebase/firestore";
import type { ReactNode} from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { auth, db } from "@/lib/firebase"; 
import type { UserProfile, UserRole } from "@/types";
import { useRouter } from 'next/navigation';

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
        displayName: displayName || email?.split('@')[0] || 'Usuario',
        createdAt: new Date().toISOString(), // Add createdAt on profile creation
      }, { merge: true });
    } catch (error) {
      console.error("Error updating user profile in Firestore:", error);
    }
  }, []);

  const fetchPendingCounts = useCallback(async () => {
    if (!currentUser || !db) {
      setPendingCounts({ contratos: 0, pagos: 0, incidentes: 0, evaluaciones: 0 });
      return;
    }

    const uid = currentUser.uid;
    let newCounts: PendingCounts = { contratos: 0, pagos: 0, incidentes: 0, evaluaciones: 0 };

    try {
      if (currentUser.role === "Inquilino") {
        // Contratos pendientes para inquilino
        const pendingContractsQuery = query(collection(db, "contracts"), where("tenantId", "==", uid), where("status", "==", "Pendiente"));
        const pendingContractsSnap = await getCountFromServer(pendingContractsQuery);
        newCounts.contratos += pendingContractsSnap.data().count;

        const pendingInitialStateQuery = query(collection(db, "contracts"), where("tenantId", "==", uid), where("initialPropertyStateStatus", "==", "pendiente_inquilino"));
        const pendingInitialStateSnap = await getCountFromServer(pendingInitialStateQuery);
        newCounts.contratos += pendingInitialStateSnap.data().count;
        
        // Evaluaciones pendientes para inquilino
        const pendingEvalsQuery = query(collection(db, "evaluations"), where("tenantId", "==", uid), where("status", "==", "pendiente de confirmacion"));
        const pendingEvalsSnap = await getCountFromServer(pendingEvalsQuery);
        newCounts.evaluaciones = pendingEvalsSnap.data().count;

        // Incidentes para inquilino
        const incidentsToRespondQuery = query(collection(db, "incidents"), where("tenantId", "==", uid), where("status", "==", "pendiente"), where("createdBy", "!=", uid));
        const incidentsToRespondSnap = await getCountFromServer(incidentsToRespondQuery);
        newCounts.incidentes += incidentsToRespondSnap.data().count;
        
        const incidentsToCloseQuery = query(collection(db, "incidents"), where("tenantId", "==", uid), where("status", "==", "respondido"), where("createdBy", "==", uid));
        const incidentsToCloseSnap = await getCountFromServer(incidentsToCloseQuery);
        newCounts.incidentes += incidentsToCloseSnap.data().count;

      } else if (currentUser.role === "Arrendador") {
        // Contratos pendientes para arrendador
        const rejectedInitialStateQuery = query(collection(db, "contracts"), where("landlordId", "==", uid), where("initialPropertyStateStatus", "==", "rechazado_inquilino"));
        const rejectedInitialStateSnap = await getCountFromServer(rejectedInitialStateQuery);
        newCounts.contratos = rejectedInitialStateSnap.data().count;
        // (Considerar añadir lógica para "declarar estado inicial" como pendiente para arrendador si es necesario)

        // Pagos pendientes para arrendador
        const pendingPaymentsQuery = query(collectionGroup(db, "payments"), where("landlordId", "==", uid), where("status", "==", "pendiente"));
        const pendingPaymentsSnap = await getCountFromServer(pendingPaymentsQuery);
        newCounts.pagos = pendingPaymentsSnap.data().count;

        // Incidentes para arrendador
        const incidentsToRespondQuery = query(collection(db, "incidents"), where("landlordId", "==", uid), where("status", "==", "pendiente"), where("createdBy", "!=", uid));
        const incidentsToRespondSnap = await getCountFromServer(incidentsToRespondQuery);
        newCounts.incidentes += incidentsToRespondSnap.data().count;

        const incidentsToCloseQuery = query(collection(db, "incidents"), where("landlordId", "==", uid), where("status", "==", "respondido"), where("createdBy", "==", uid));
        const incidentsToCloseSnap = await getCountFromServer(incidentsToCloseQuery);
        newCounts.incidentes += incidentsToCloseSnap.data().count;
      }
      setPendingCounts(newCounts);
    } catch (error) {
      console.error("Error fetching pending counts:", error);
      setPendingCounts({ contratos: 0, pagos: 0, incidentes: 0, evaluaciones: 0 });
    }
  }, [currentUser, db]);


  useEffect(() => {
    if (!auth || !db) {
      setLoading(false); 
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
            displayName: userData.displayName || user.email?.split('@')[0] || 'Usuario',
            createdAt: userData.createdAt, // Populate createdAt if exists
          });
        } else {
          setCurrentUser({ 
            uid: user.uid, 
            email: user.email, 
            role: null, 
            displayName: user.email?.split('@')[0] || 'Usuario'
          });
          console.warn("User document not found in Firestore for UID:", user.uid);
        }
      } else {
        setCurrentUser(null);
        setPendingCounts({ contratos: 0, pagos: 0, incidentes: 0, evaluaciones: 0 });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [updateUserProfileInFirestore]); // db is stable, auth is stable

  useEffect(() => {
    if (currentUser) {
      fetchPendingCounts();
    }
  }, [currentUser, fetchPendingCounts]);

  const login = async () => {
    console.log("Login action triggered from context (placeholder)");
  };

  const logout = async () => {
    if (!auth) return;
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setPendingCounts({ contratos: 0, pagos: 0, incidentes: 0, evaluaciones: 0 });
      router.push('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const isLoggedIn = !loading && !!currentUser;

  return (
    <AuthContext.Provider value={{ currentUser, loading, isLoggedIn, login, logout, updateUserProfileInFirestore, pendingCounts, fetchPendingCounts }}>
      {!loading ? children : <div className="flex h-screen items-center justify-center"><p>Cargando S.A.R.A...</p></div>}
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

    