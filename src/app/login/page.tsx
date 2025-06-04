"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

export default function LoginPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered');

  useEffect(() => {
    if (!loading && currentUser) {
      router.replace("/dashboard");
    }
  }, [currentUser, loading, router]);

  if (loading || (!loading && currentUser)) {
    return <div className="flex h-screen items-center justify-center"><p>Cargando...</p></div>;
  }
  
  const defaultTab = registered ? "login" : "login";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="hidden md:flex flex-col items-center justify-center p-8 space-y-6 text-center">
            <Image src="https://placehold.co/300x300.png" alt="S.A.R.A Illustration" width={250} height={250} className="rounded-full shadow-lg" data-ai-hint="modern building key" />
            <h1 className="text-4xl font-bold text-primary font-headline">Bienvenido a S.A.R.A</h1>
            <p className="text-muted-foreground text-lg">
              Tu <span className="font-semibold text-primary/90">S</span>istema de <span className="font-semibold text-primary/90">A</span>dministración <span className="font-semibold text-primary/90">R</span>esponsable de <span className="font-semibold text-primary/90">A</span>rriendos.
            </p>
            <p className="text-sm text-muted-foreground">Simplificamos la gestión de propiedades y contratos para arrendadores e inquilinos.</p>
        </div>
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center md:hidden">
             <CardTitle className="text-3xl font-bold text-primary font-headline">S.A.R.A</CardTitle>
             <CardDescription>Inicia sesión o crea una cuenta para continuar.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="register">Registrarse</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="mt-6">
                <LoginForm />
              </TabsContent>
              <TabsContent value="register" className="mt-6">
                <RegisterForm />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
