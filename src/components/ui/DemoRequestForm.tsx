
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const formSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  email: z.string().email("Por favor, introduce un correo electrónico válido."),
  message: z.string().optional(),
});

export function DemoRequestForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      // Escribir en la colección 'mail' para que la extensión "Trigger Email" se active
      await addDoc(collection(db, "mail"), {
        to: ['pauloandrescordova@gmail.com'],
        message: {
          subject: `Nueva Solicitud de Demo de ${values.name}`,
          html: `
            <p><strong>Nombre:</strong> ${values.name}</p>
            <p><strong>Email:</strong> ${values.email}</p>
            <p><strong>Mensaje:</strong></p>
            <p>${values.message || 'No dejó mensaje adicional.'}</p>
          `,
        },
      });

      toast({
        title: "¡Solicitud Enviada!",
        description: "Gracias por tu interés. Nos pondremos en contacto contigo pronto.",
      });
      
      form.reset();

    } catch (error) {
      console.error("Error writing to mail collection:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar tu solicitud. Por favor, inténtalo de nuevo más tarde.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre Completo</FormLabel>
              <FormControl>
                <Input placeholder="Tu nombre y apellido" {...field} />
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
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mensaje Adicional (Opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Cuéntanos un poco sobre ti o tu negocio..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Enviando Solicitud..." : "Solicitar Credenciales de Prueba"}
        </Button>
      </form>
    </Form>
  );
}
