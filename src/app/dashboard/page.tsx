
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { LandlordDashboard } from "@/components/dashboard/LandlordDashboard";
import { TenantDashboard } from "@/components/dashboard/TenantDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-full"><p>Cargando panel...</p></div>;
  }

  if (!currentUser) {
    return <div className="flex justify-center items-center h-full"><p>Por favor, inicia sesión.</p></div>;
  }
  
  // 1. Si es Admin, mostrar un panel especial de Admin en lugar del de usuario.
  if (currentUser.isAdmin) {
    return (
      <Card className="max-w-lg mx-auto mt-10 text-center">
        <CardHeader>
          <CardTitle>Acceso de Administrador</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Has iniciado sesión como Administrador. Tu panel de control se encuentra en una sección separada.</p>
          <Link href="/admin">
            <Button>Ir al Panel de Administración</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // 2. Si no tiene rol, mostrar mensaje de error.
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

  // 3. Lógica existente para Arrendador e Inquilino.
  return (
    <div>
      {currentUser.role === "Arrendador" ? <LandlordDashboard /> : <TenantDashboard />}
    </div>
  );
}
