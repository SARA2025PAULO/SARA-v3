"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Property } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

// Schema without imageUrl
export const propertyFormSchema = z.object({
  address: z.string().min(5, { message: "La dirección debe tener al menos 5 caracteres." }),
  description: z.string().min(10, { message: "La descripción debe tener al menos 10 caracteres." }),
  status: z.enum(["Disponible", "Arrendada", "Mantenimiento"], { required_error: "Debes seleccionar un estado." }),
  price: z.coerce.number().positive({ message: "El precio debe ser un número positivo." }).optional().or(z.literal('')),
  area: z.coerce.number().positive({ message: "El área debe ser un número positivo." }).optional().or(z.literal('')),
  bedrooms: z.coerce.number().int().min(0, { message: "Número de habitaciones no puede ser negativo." }).optional().or(z.literal('')),
  bathrooms: z.coerce.number().int().min(0, { message: "Número de baños no puede ser negativo." }).optional().or(z.literal('')),
  potentialTenantEmail: z.string().email({ message: "Por favor ingresa un correo válido." }).optional().or(z.literal('')),
});

export type PropertyFormValues = z.infer<typeof propertyFormSchema>;

interface PropertyFormDialogProps {
  property?: Property | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: PropertyFormValues, isEditing: boolean, originalPropertyId?: string) => void;
}

export function PropertyFormDialog({ property, open, onOpenChange, onSave }: PropertyFormDialogProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const isEditing = Boolean(property);

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      address: "",
      description: "",
      status: "Disponible",
      price: undefined,
      area: undefined,
      bedrooms: undefined,
      bathrooms: undefined,
      potentialTenantEmail: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      property
        ? {
            address: property.address,
            description: property.description,
            status: property.status,
            price: property.price ?? undefined,
            area: property.area ?? undefined,
            bedrooms: property.bedrooms ?? undefined,
            bathrooms: property.bathrooms ?? undefined,
            potentialTenantEmail: property.potentialTenantEmail ?? "",
          }
        : {
            address: "",
            description: "",
            status: "Disponible",
            price: undefined,
            area: undefined,
            bedrooms: undefined,
            bathrooms: undefined,
            potentialTenantEmail: "",
          }
    );
  }, [open, property, form]);

  async function onSubmit(values: PropertyFormValues) {
    if (!currentUser || currentUser.role !== "Arrendador") {
      toast({
        title: "Permiso Denegado",
        description: "No puedes realizar esta acción.",
        variant: "destructive",
      });
      return;
    }
    const cleaned: PropertyFormValues = {
      address: values.address,
      description: values.description,
      status: values.status,
      price: values.price === '' ? undefined : values.price,
      area: values.area === '' ? undefined : values.area,
      bedrooms: values.bedrooms === '' ? undefined : values.bedrooms,
      bathrooms: values.bathrooms === '' ? undefined : values.bathrooms,
      potentialTenantEmail: values.potentialTenantEmail === '' ? undefined : values.potentialTenantEmail,
    };
    onSave(cleaned, isEditing, isEditing && property ? property.id : undefined);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Propiedad" : "Añadir Nueva Propiedad"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Actualiza los detalles de tu propiedad." : "Ingresa los detalles de la nueva propiedad."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Av. Siempre Viva 742, Springfield" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ej: Casa espaciosa con 3 habitaciones, jardín y garage." {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger><SelectValue placeholder="Selecciona un estado" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Disponible">Disponible</SelectItem>
                        <SelectItem value="Arrendada">Arrendada</SelectItem>
                        <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio (CLP/mes)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ej: 350000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área (m²)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ej: 150" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bedrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Habitaciones</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ej: 3" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bathrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Baños</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ej: 2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="potentialTenantEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo Electrónico del Potencial Inquilino (Opcional)</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="inquilino@ejemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (isEditing ? "Guardando..." : "Añadiendo...") : (isEditing ? "Guardar Cambios" : "Añadir Propiedad")}    
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
