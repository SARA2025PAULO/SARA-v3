"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function HomePage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (currentUser) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }
  }, [currentUser, loading, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <p className="text-xl text-foreground">Cargando S.A.R.A...</p>
      {/* You can add a spinner or a more sophisticated loading animation here */}
    </div>
  );
}
