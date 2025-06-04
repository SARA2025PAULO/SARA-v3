
"use client";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RecuperacionLegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && currentUser && currentUser.role !== "Arrendador") {
      router.replace("/dashboard?error=unauthorized_legal_recovery"); 
    }
  }, [currentUser, loading, router]);

  if (loading || (currentUser && currentUser.role !== "Arrendador")) {
    return <AppLayout><div className="p-4">Verificando acceso a herramientas legales...</div></AppLayout>;
  }
  
  return <AppLayout>{children}</AppLayout>;
}
