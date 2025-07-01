
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Building2, FileText, CreditCard, ShieldAlert, ClipboardCheck, LayoutDashboard } from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "./Header";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { currentUser, loading, logout, pendingCounts, fetchPendingCounts } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!loading && !currentUser) {
      router.replace("/login");
    }
  }, [currentUser, loading, router]);

  React.useEffect(() => {
    if (currentUser && !currentUser.isAdmin) {
      fetchPendingCounts();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, pathname]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><p>Cargando S.A.R.A...</p></div>;
  }

  if (!currentUser) {
    return null;
  }

  // --- Lógica de Administrador ---
  // Si el usuario es un administrador, no mostramos el layout de la app principal.
  // El AdminLayout tomará el control total en las rutas /admin/*.
  if (currentUser.isAdmin) {
    return <>{children}</>;
  }

  // --- Lógica para Arrendador e Inquilino ---
  const isArrendador = currentUser.role === "Arrendador";

  const navItems = [
    { href: "/dashboard", label: "Panel de Control", icon: LayoutDashboard, count: 0 },
    ...(isArrendador 
      ? [{ href: "/propiedades", label: "Propiedades", icon: Building2, count: 0 }] 
      : []),
    { href: "/contratos", label: "Contratos", icon: FileText, count: pendingCounts.contratos },
    { href: "/pagos", label: "Pagos", icon: CreditCard, count: isArrendador ? pendingCounts.pagos : 0 },
    { href: "/incidentes", label: "Incidentes", icon: ShieldAlert, count: pendingCounts.incidentes },
    { href: "/evaluaciones", label: "Evaluaciones", icon: ClipboardCheck, count: !isArrendador ? pendingCounts.evaluaciones : 0 },
  ];

  return (
    <SidebarProvider defaultOpen>
      <Sidebar>
        <SidebarHeader className="p-4">
          <Link href="/dashboard" className="text-xl font-semibold text-sidebar-primary font-headline">
            S.A.R.A
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.label} badgeCount={item.count}>
                <Link href={item.href} legacyBehavior passHref>
                  <SidebarMenuButton
                    isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
                    tooltip={item.label}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={logout} tooltip="Cerrar Sesión">
                <LogOut className="h-5 w-5" />
                <span>Cerrar Sesión</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <div className="flex flex-col flex-1">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
