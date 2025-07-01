
"use client";

import { zodResolver } from "@hookform/resolvers/zod"; 
import { useForm } from "react-hook-form";
import * as z from "zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast"; 
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";

const formSchema = z.object({
  email: z.string().email({ message: "Por favor ingresa un correo válido." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
});

export function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // Consultar el rol del usuario desde Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      let isAdmin = false;
      if (userDocSnap.exists()) {
        isAdmin = userDocSnap.data().role === 'admin';
      }

      toast({
        title: "Inicio de Sesión Exitoso",
        description: `Bienvenido de nuevo, ${userDocSnap.data()?.displayName || values.email}.`,
      });

      if (isAdmin) {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }

    } catch (error: any) {
      console.error("Error during login:", error);
      let errorMessage = "Ocurrió un error al iniciar sesión.";
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        errorMessage = "Correo electrónico o contraseña incorrectos.";
      }
      toast({
        title: "Error de Inicio de Sesión",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }

 async function handlePasswordReset() {
    const email = form.getValues("email");
    if (!email) {
      toast({
        title: "Error",
        description: "Por favor, ingresa tu correo electrónico para restablecer la contraseña.",
        variant: "destructive",
      });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Correo de Recuperación Enviado",
        description: "Hemos enviado un correo a tu dirección con instrucciones para restablecer tu contraseña.",
      });
    } catch (error: any) {
      console.error("Error sending password reset email:", error);
      toast({
        title: "Error al Enviar Correo de Recuperación",
        description: error.message || "Ocurrió un error al intentar enviar el correo de recuperación.",
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo Electrónico</FormLabel>
              <FormControl>
                <Input placeholder="tu@correo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="button" variant="link" className="px-0" onClick={handlePasswordReset}>
          ¿Olvidaste tu contraseña?
        </Button>
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Iniciando..." : <> <LogIn className="mr-2 h-4 w-4" /> Iniciar Sesión</>}
        </Button>
      </form>
    </Form>
  );
}
