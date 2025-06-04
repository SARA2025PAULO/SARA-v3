"use client";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PropiedadesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && currentUser && currentUser.role !== "Arrendador") {
      router.replace("/dashboard?error=unauthorized"); // Or a specific unauthorized page
    }
  }, [currentUser, loading, router]);

  if (loading || (currentUser && currentUser.role !== "Arrendador")) {
    // Show loading or a minimal message while redirecting or if access is denied
    return <AppLayout><div className="p-4">Verificando acceso...</div></AppLayout>;
  }
  
  return <AppLayout>{children}</AppLayout>;
}
