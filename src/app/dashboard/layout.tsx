
"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Solo redirigir si no está cargando y no hay usuario.
    if (!loading && !currentUser) {
      router.replace("/login");
    }
  }, [currentUser, loading, router]);

  // Muestra un estado de carga mientras se verifica la autenticación.
  if (loading || !currentUser) {
    return <div className="flex h-screen items-center justify-center"><p>Cargando...</p></div>;
  }
  
  // Si el usuario es un administrador, no usamos el AppLayout.
  // El AdminLayout (en /admin/layout.tsx) tomará el control.
  if (currentUser.isAdmin) {
    return <>{children}</>;
  }

  // Si es un usuario normal (Arrendador o Inquilino), usamos el AppLayout.
  return <AppLayout>{children}</AppLayout>;
}
