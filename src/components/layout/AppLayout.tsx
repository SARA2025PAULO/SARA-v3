
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, FileText, LayoutDashboard, LogOut, Building2, Users, CreditCard, ShieldAlert } from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "./Header"; 

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { currentUser, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!loading && !currentUser) {
      router.replace("/login");
    }
  }, [currentUser, loading, router]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><p>Cargando S.A.R.A...</p></div>;
  }

  if (!currentUser) {
    return null; 
  }
  
  const isArrendador = currentUser.role === "Arrendador";

  const navItems = [
    { href: "/dashboard", label: "Panel de Control", icon: LayoutDashboard },
    ...(isArrendador ? [{ href: "/propiedades", label: "Propiedades", icon: Building2 }] : []),
    { href: "/contratos", label: "Contratos", icon: FileText },
    { href: "/pagos", label: "Pagos", icon: CreditCard },
    { href: "/incidentes", label: "Incidentes", icon: ShieldAlert },
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
              <SidebarMenuItem key={item.label}>
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
      <SidebarInset className="flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
