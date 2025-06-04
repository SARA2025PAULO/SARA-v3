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
  DialogTrigger,
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
import type { Property, PropertyStatus } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

const propertyFormSchema = z.object({
  address: z.string().min(5, { message: "La dirección debe tener al menos 5 caracteres." }),
  description: z.string().min(10, { message: "La descripción debe tener al menos 10 caracteres." }),
  status: z.enum(["Disponible", "Arrendada", "Mantenimiento"], { required_error: "Debes seleccionar un estado."}),
  price: z.coerce.number().positive({ message: "El precio debe ser un número positivo." }).optional(),
  bedrooms: z.coerce.number().int().min(0, { message: "Número de habitaciones no puede ser negativo."}).optional(),
  bathrooms: z.coerce.number().int().min(0, { message: "Número de baños no puede ser negativo."}).optional(),
  area: z.coerce.number().positive({ message: "El área debe ser un número positivo."}).optional(),
  imageUrl: z.string().url({ message: "Por favor ingresa una URL válida para la imagen."}).optional().or(z.literal('')),
});

type PropertyFormValues = z.infer<typeof propertyFormSchema>;

interface PropertyFormDialogProps {
  property?: Property | null; // Property to edit, or null/undefined for new property
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (propertyData: Property, isEditing: boolean) => void;
}

export function PropertyFormDialog({ property, open, onOpenChange, onSave }: PropertyFormDialogProps) {
  const { currentUser } = useAuth();
  const isEditing = !!property;

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: property ? {
      address: property.address,
      description: property.description,
      status: property.status,
      price: property.price,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      area: property.area,
      imageUrl: property.imageUrl || "",
    } : {
      address: "",
      description: "",
      status: "Disponible",
      price: undefined,
      bedrooms: undefined,
      bathrooms: undefined,
      area: undefined,
      imageUrl: "",
    },
  });
  
  // Reset form when property data changes (e.g. opening dialog for different property)
  // or when dialog is closed/reopened for a new property
  useState(() => {
    if (open) {
      form.reset(property ? {
        address: property.address,
        description: property.description,
        status: property.status,
        price: property.price,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        area: property.area,
        imageUrl: property.imageUrl || "",
      } : {
        address: "",
        description: "",
        status: "Disponible",
        price: undefined,
        bedrooms: undefined,
        bathrooms: undefined,
        area: undefined,
        imageUrl: "",
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property, open, form.reset]);


  async function onSubmit(values: PropertyFormValues) {
    if (!currentUser || currentUser.role !== "Arrendador") {
      // This should not happen if UI is correctly hiding the button/dialog
      alert("No tienes permiso para realizar esta acción.");
      return;
    }

    const propertyDataToSave: Property = {
      id: isEditing ? property.id : new Date().toISOString(), // Generate ID for new, use existing for edit
      ownerId: currentUser.uid,
      ...values,
      status: values.status as PropertyStatus, // Zod enum ensures this is correct
    };
    onSave(propertyDataToSave, isEditing);
    onOpenChange(false); // Close dialog on save
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Disponible">Disponible</SelectItem>
                      <SelectItem value="Arrendada">Arrendada</SelectItem>
                      <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                    </SelectContent>
                  </Select>
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
                    <FormLabel>Precio (USD/mes)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ej: 1200" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
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
                      <Input type="number" placeholder="Ej: 150" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
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
                      <Input type="number" placeholder="Ej: 3" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} />
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
                      <Input type="number" placeholder="Ej: 2" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL de la Imagen</FormLabel>
                  <FormControl>
                    <Input placeholder="https://ejemplo.com/imagen.png" {...field} />
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
