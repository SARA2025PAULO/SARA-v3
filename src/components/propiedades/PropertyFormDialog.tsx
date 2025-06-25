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

// Import uuid for unique ID generation
import { v4 as uuidv4 } from 'uuid';

// List of Chilean regions
const chileanRegions = [
  "Arica y Parinacota",
  "Tarapacá",
  "Antofagasta",
  "Atacama",
  "Coquimbo",
  "Valparaíso",
  "Metropolitana de Santiago",
  "Libertador General Bernardo O'Higgins",
  "Maule",
  "Ñuble",
  "Biobío",
  "La Araucanía",
  "Los Ríos",
  "Los Lagos",
  "Aysén del General Carlos Ibáñez del Campo",
  "Magallanes y de la Antártica Chilena",
];

// List of communes in Santiago
const santiagoCommunes = [
  "Cerrillos",
  "Cerro Navia",
  "Conchalí",
  "El Bosque",
  "Estación Central",
  "Huechuraba",
  "Independencia",
  "La Cisterna",
  "La Florida",
  "La Granja",
  "La Pintana",
  "La Reina",
  "Las Condes",
  "Lo Barnechea",
  "Lo Espejo",
  "Lo Prado",
  "Macul",
  "Maipú",
  "Ñuñoa",
  "Pedro Aguirre Cerda",
  "Peñalolén",
  "Providencia",
  "Pudahuel",
  "Quilicura",
  "Quinta Normal",
  "Recoleta",
  "Renca",
  "San Joaquín",
  "San Miguel",
  "San Ramón",
  "Santiago",
  "Vitacura",
];

// Schema for property form validation
export const propertyFormSchema = z.object({
  code: z.string().optional(), // Add code to schema, optional as it's auto-generated
  region: z.string().min(1, { message: "Debes seleccionar una región." }),
  comuna: z.string().optional(),
  address: z.string().min(5, { message: "La dirección debe tener al menos 5 caracteres." }),
  status: z.enum(["Disponible", "Arrendada", "Mantenimiento"]).optional(),
  type: z.enum([
    "Casa",
    "Departamento",
    "Local Comercial",
    "Terreno",
    "Bodega",
    "Estacionamiento",
    "Pieza",
    "Galpón"
  ], { required_error: "Debes seleccionar un tipo de propiedad." }),
  price: z.coerce.number().positive({ message: "El precio debe ser un número positivo." }).optional().or(z.literal('')),
  area: z.coerce.number().positive({ message: "El área debe ser un número positivo." }).optional().or(z.literal('')),
  bedrooms: z.coerce.number().int().min(0, { message: "Número de habitaciones no puede ser negativo." }).optional().or(z.literal('')),
  bathrooms: z.coerce.number().int().min(0, { message: "Número de baños no puede ser negativo." }).optional().or(z.literal('')),
  description: z.string().min(10, { message: "La descripción debe tener al menos 10 caracteres." }),
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
      code: "", // Initialize code in defaultValues
      region: "",
      comuna: "",
      address: "",
      status: "Disponible",
      type: "",
      price: undefined,
      area: undefined,
      bedrooms: undefined,
      bathrooms: undefined,
      description: "",
    },
  });

  const selectedRegion = form.watch("region");

  useEffect(() => {
    if (!open) return;
    form.reset(
      property
        ? {
            ...property, // Spread existing property values
            region: property.region || "",
            comuna: property.comuna || "",
            type: property.type || "",
            price: property.price ?? undefined,
            area: property.area ?? undefined,
            bedrooms: property.bedrooms ?? undefined,
            bathrooms: property.bathrooms ?? undefined,
            // code will be loaded if present, otherwise remains undefined/empty string
          }
        : {
            code: uuidv4().slice(0, 8).toUpperCase(), // Generate code for new properties
            region: "",
            comuna: "",
            address: "",
            status: "Disponible",
            type: "",
            price: undefined,
            area: undefined,
            bedrooms: undefined,
            bathrooms: undefined,
            description: "",
          }
    );
  }, [open, property, form]);

  async function onSubmit(values: PropertyFormValues) {
    if (!currentUser || currentUser.role !== "Arrendador") {
      toast({
        title: "Permiso Denalegado", // Corrected typo: "Denalegado" -> "Denegado"
        description: "No puedes realizar esta acción.",
        variant: "destructive",
      });
      return;
    }

    if (selectedRegion === "Metropolitana de Santiago" && !values.comuna) {
      form.setError("comuna", {
        type: "manual",
        message: "Debes seleccionar una comuna para la Región Metropolitana de Santiago.",
      });
      return;
    }
    
    const finalValues = {
      ...values,
      status: isEditing ? values.status : "Disponible",
      code: isEditing ? values.code : (values.code || uuidv4().slice(0, 8).toUpperCase()), // Ensure code is set for new properties if not already
    };

    const cleaned: PropertyFormValues = {
      region: finalValues.region,
      comuna: finalValues.comuna === '' ? undefined : finalValues.comuna,
      address: finalValues.address,
      status: finalValues.status,
      type: finalValues.type,
      price: finalValues.price === '' ? undefined : finalValues.price,
      area: finalValues.area === '' ? undefined : finalValues.area,
      bedrooms: finalValues.bedrooms === '' ? undefined : finalValues.bedrooms,
      bathrooms: finalValues.bathrooms === '' ? undefined : finalValues.bathrooms,
      description: finalValues.description,
      code: finalValues.code, // Include the generated code
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

            {isEditing && property?.code && (
                <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Código de Propiedad</FormLabel>
                            <FormControl>
                                <Input {...field} disabled={true} className="font-mono bg-muted" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )}

            <FormField
              control={form.control}
              name="region"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Región</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger><SelectValue placeholder="Selecciona una región" /></SelectTrigger>
                      <SelectContent>
                        {chileanRegions.map((region) => (
                          <SelectItem key={region} value={region}>{region}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedRegion === "Metropolitana de Santiago" && (
              <FormField
                control={form.control}
                name="comuna"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comuna</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger><SelectValue placeholder="Selecciona una comuna" /></SelectTrigger>
                        <SelectContent>
                          {santiagoCommunes.map((comuna) => (
                            <SelectItem key={comuna} value={comuna}>{comuna}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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

            {/* Status field is only shown when editing */}
            {isEditing && (
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
            )}

             <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Propiedad</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Casa">Casa</SelectItem>
                        <SelectItem value="Departamento">Departamento</SelectItem>
                        <SelectItem value="Local Comercial">Local Comercial</SelectItem>
                        <SelectItem value="Terreno">Terreno</SelectItem>
                        <SelectItem value="Bodega">Bodega</SelectItem>
                        <SelectItem value="Estacionamiento">Estacionamiento</SelectItem>
                        <SelectItem value="Pieza">Pieza</SelectItem>
                        <SelectItem value="Galpón">Galpón</SelectItem>
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
