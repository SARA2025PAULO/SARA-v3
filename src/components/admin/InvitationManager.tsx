
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Send } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email('Por favor, introduce un correo electrónico válido.'),
  role: z.enum(['arrendador', 'inquilino'], {
    required_error: 'Debes seleccionar un rol.',
  }),
});

interface Invitation {
  id: string;
  email: string;
  role: string;
  code?: string;
  status: 'pending' | 'used' | 'error' | 'generating';
  createdAt?: { toDate: () => Date };
}

export const InvitationManager = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      role: 'arrendador',
    },
  });

  useEffect(() => {
    const q = query(collection(db, 'invitations'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const invitationsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Invitation[];
      setInvitations(invitationsData);
      setLoading(false);
    }, (error) => {
      console.error("Error al obtener invitaciones:", error);
      toast({ title: "Error", description: "No se pudieron cargar las invitaciones.", variant: "destructive" });
      setLoading(false);
    });
    return () => unsubscribe();
  }, [toast]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      // CORRECCIÓN: Se añade el campo 'status' y 'createdAt' inicial
      // para que el documento se cree correctamente y sea visible al instante.
      await addDoc(collection(db, 'invitations'), {
        email: values.email,
        role: values.role,
        status: 'generating', // Estado inicial
        createdAt: serverTimestamp(), // Fecha de creación inicial
      });

      toast({
        title: '¡Invitación Registrada!',
        description: `La invitación para ${values.email} se está procesando. Aparecerá en el historial en breve.`,
      });
      form.reset();
    } catch (error: any) {
      console.error('Error al crear el documento de invitación:', error);
      toast({
        title: 'Error de Frontend',
        description: 'No se pudo registrar la invitación en la base de datos. Revisa la consola para más detalles.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Columna para crear invitaciones */}
      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PlusCircle className="mr-2 h-5 w-5" />
              Crear Nueva Invitación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo Electrónico</FormLabel>
                      <FormControl>
                        <Input placeholder="usuario@ejemplo.com" {...field} />
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
                      <FormLabel>Rol Asignado</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un rol" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="arrendador">Arrendador</SelectItem>
                          <SelectItem value="inquilino">Inquilino</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  {isSubmitting ? 'Enviando...' : 'Enviar Invitación'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Columna para listar invitaciones */}
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Historial de Invitaciones</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((invite) => (
                    <TableRow key={invite.id}>
                      <TableCell className="font-medium">{invite.email}</TableCell>
                      <TableCell>{invite.code || 'Generando...'}</TableCell>
                      <TableCell className="capitalize">{invite.role}</TableCell>
                      <TableCell>
                        <Badge variant={invite.status === 'pending' ? 'secondary' : invite.status === 'used' ? 'default' : 'destructive'}>
                          {invite.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {invite.createdAt ? new Date(invite.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
