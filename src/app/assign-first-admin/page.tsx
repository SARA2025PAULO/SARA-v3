
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

// Esquema de validación para el formulario
const formSchema = z.object({
  email: z.string().email('Por favor, introduce un correo electrónico válido.'),
});

// URL de la NUEVA Cloud Function
const grantAdminRoleUrl = 'https://us-central1-sara3o.cloudfunctions.net/grantAdminRole';

export default function AssignFirstAdminPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  // Función para llamar a la Cloud Function con fetch
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    toast({
      title: 'Procesando...',
      description: `Asignando rol de administrador a ${values.email}`,
    });
    
    try {
      const response = await fetch(grantAdminRoleUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: values.email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Ocurrió un error en el servidor.');
      }

      toast({
        title: '¡Rol Asignado con Éxito!',
        description: result.message + " Por favor, cierra sesión y vuelve a iniciar para acceder al panel de admin.",
        variant: 'default',
        duration: 9000,
      });
      form.reset();

    } catch (error: any) {
      console.error('Error al asignar el rol:', error);
      toast({
        title: 'Error de Comunicación',
        description: error.message || 'No se pudo asignar el rol. Revisa los logs de la función.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShieldCheck className="mr-2 h-6 w-6 text-primary" />
            Asignar Primer Administrador
          </CardTitle>
          <CardDescription>
            Usa esta herramienta única para dar permisos de administrador al primer usuario.
            Una vez usado, se recomienda eliminar esta página.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tu Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input placeholder="tu@correo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSubmitting ? 'Asignando...' : 'Convertirme en Administrador'}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              &larr; Volver a la página principal
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
