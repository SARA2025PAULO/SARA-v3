"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase"; // db is needed here
import { doc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { UserPlus } from "lucide-react";

const formSchema = z.object({
  displayName: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres."}),
  email: z.string().email({ message: "Por favor ingresa un correo válido." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
  confirmPassword: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
  role: z.enum(["Arrendador", "Inquilino"], { required_error: "Debes seleccionar un rol." }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});

export function RegisterForm() {
  const { toast } = useToast();
  const router = useRouter();
  const { updateUserProfileInFirestore } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: undefined, // Arrendador or Inquilino
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!db) {
      toast({ title: "Error de Configuración", description: "La base de datos no está disponible. Contacte al administrador.", variant: "destructive" });
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // Store user role and display name in Firestore
      await updateUserProfileInFirestore(user.uid, user.email, values.role as UserRole, values.displayName);
      
      toast({
        title: "Registro Exitoso",
        description: "Tu cuenta ha sido creada. Ahora puedes iniciar sesión.",
      });
      router.push("/login?registered=true"); // Or directly to /dashboard if auto-login is desired
    } catch (error: any) {
      console.error("Error during registration:", error);
      let errorMessage = "Ocurrió un error durante el registro.";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Este correo electrónico ya está en uso.";
      }
      toast({
        title: "Error de Registro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre Completo</FormLabel>
              <FormControl>
                <Input placeholder="Juan Pérez" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar Contraseña</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Soy un...</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tu rol" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Arrendador">Arrendador (Propietario)</SelectItem>
                  <SelectItem value="Inquilino">Inquilino (Busco arriendo)</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Esto determinará cómo usas S.A.R.A.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Registrando..." : <> <UserPlus className="mr-2 h-4 w-4" /> Crear Cuenta </>}
        </Button>
      </form>
    </Form>
  );
}
