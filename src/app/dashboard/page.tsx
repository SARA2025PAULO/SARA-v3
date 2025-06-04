"use client";

import { useAuth } from "@/contexts/AuthContext";
import { LandlordDashboard } from "@/components/dashboard/LandlordDashboard";
import { TenantDashboard } from "@/components/dashboard/TenantDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-full"><p>Cargando panel...</p></div>;
  }

  if (!currentUser) {
    // This case should ideally be handled by AppLayout redirecting to /login
    return <div className="flex justify-center items-center h-full"><p>Por favor, inicia sesión.</p></div>;
  }

  if (!currentUser.role) {
     return (
        <Card className="max-w-lg mx-auto mt-10">
            <CardHeader>
                <CardTitle>Rol de Usuario No Definido</CardTitle>
            </CardHeader>
            <CardContent>
                <p>No se ha podido determinar tu rol en la plataforma. Por favor, contacta con el soporte técnico o intenta iniciar sesión de nuevo.</p>
            </CardContent>
        </Card>
     );
  }

  return (
    <div>
      {currentUser.role === "Arrendador" ? <LandlordDashboard /> : <TenantDashboard />}
    </div>
  );
}
