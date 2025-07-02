"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { UserPlus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

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

const formSchema = z.object({
  displayName: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  email: z.string().email({ message: "Por favor ingresa un correo válido." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
  confirmPassword: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
  role: z.enum(["Arrendador", "Inquilino"], { required_error: "Debes seleccionar un rol." }),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "Debes aceptar los términos y condiciones para continuar.",
  }),
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
      role: undefined,
      acceptTerms: false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);

      await updateUserProfileInFirestore(
        userCredential.user.uid,
        values.email,
        values.role,
        values.displayName
      );

      // Espera que el documento se refleje antes de redirigir
      const userRef = doc(db, "users", userCredential.user.uid);
      await getDoc(userRef);

      toast({
        title: "Registro Exitoso",
        description: "Tu cuenta ha sido creada. Ahora puedes iniciar sesión.",
      });

      router.push("/login?registered=true");
    } catch (error: any) {
      console.error("Error during registration:", error);
      toast({
        title: "Error de Registro",
        description: error.message || "Ocurrió un error durante el registro.",
        variant: "destructive",
      });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <FormField control={form.control} name="displayName" render={({ field }) => (
        <FormItem>
          <FormLabel>Nombre Completo</FormLabel>
          <FormControl>
            <Input placeholder="Juan Pérez" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name="email" render={({ field }) => (
        <FormItem>
          <FormLabel>Correo Electrónico</FormLabel>
          <FormControl>
            <Input placeholder="tu@correo.com" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name="password" render={({ field }) => (
        <FormItem>
          <FormLabel>Contraseña</FormLabel>
          <FormControl>
            <Input type="password" placeholder="••••••••" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name="confirmPassword" render={({ field }) => (
        <FormItem>
          <FormLabel>Confirmar Contraseña</FormLabel>
          <FormControl>
            <Input type="password" placeholder="••••••••" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name="role" render={({ field }) => (
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
      )} />
      <FormField control={form.control} name="acceptTerms" render={({ field }) => (
        <FormItem className="flex items-start space-x-3 rounded-md border p-4 shadow-sm">
          <FormControl>
            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel>
              Acepto los <Link href="/terminos-y-condiciones" className="text-blue-600 hover:underline" target="_blank">términos y condiciones</Link>.
            </FormLabel>
          </div>
          <FormMessage />
        </FormItem>
      )} />
      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Registrando..." : <><UserPlus className="mr-2 h-4 w-4" />Crear Cuenta</>}
      </Button>
    </form>
  );
}
