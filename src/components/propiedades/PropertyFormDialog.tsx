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
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';
import { regions } from "@/lib/geodata";
import { formatRut, validateRut } from "@/lib/rutUtils";

export const propertyFormSchema = z.object({
  code: z.string().optional(),
  ownerRut: z.string().optional().refine(val => !val || validateRut(val), {
    message: "El RUT ingresado no es válido."
  }),
  region: z.string().min(1, { message: "Debes seleccionar una región." }),
  comuna: z.string().min(1, { message: "Debes seleccionar una comuna." }),
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
  price: z.preprocess(
    (val) => (val === "" || val == null ? undefined : Number(val)),
    z.coerce.number({ invalid_type_error: 'Debe ser un número.' }).positive({ message: "El precio debe ser un número positivo." }).optional()
  ),
  area: z.preprocess(
    (val) => (val === "" || val == null ? undefined : Number(val)),
    z.coerce.number({ invalid_type_error: 'Debe ser un número.' }).positive({ message: "El área debe ser un número positivo." }).optional()
  ),
  bedrooms: z.preprocess(
    (val) => (val === "" || val == null ? undefined : Number(val)),
    z.coerce.number({ invalid_type_error: 'Debe ser un número.' }).int({ message: "Debe ser un número entero." }).min(0, { message: "No puede ser negativo." }).optional()
  ),
  bathrooms: z.preprocess(
    (val) => (val === "" || val == null ? undefined : Number(val)),
    z.coerce.number({ invalid_type_error: 'Debe ser un número.' }).int({ message: "Debe ser un número entero." }).min(0, { message: "No puede ser negativo." }).optional()
  ),
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
  
  const [comunas, setComunas] = useState<string[]>([]);

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      code: "",
      ownerRut: "",
      region: "",
      comuna: "",
      address: "",
      status: "Disponible",
      type: "" as any,
      price: undefined,
      area: undefined,
      bedrooms: undefined,
      bathrooms: undefined,
      description: "",
    },
  });

  const selectedRegion = form.watch("region");

  useEffect(() => {
    if (selectedRegion) {
      const regionData = regions.find(r => r.name === selectedRegion);
      setComunas(regionData ? regionData.communes : []);
      if (form.getValues("region") !== property?.region) {
        form.setValue("comuna", "");
      }
    } else {
      setComunas([]);
    }
  }, [selectedRegion, form, property?.region]);
  
  useEffect(() => {
    if (open) {
      const initialValues = property
        ? {
            ...property,
            ownerRut: property.ownerRut ? formatRut(property.ownerRut) : "",
            region: property.region || "",
            comuna: property.comuna || "",
            type: property.type as any || "",
            price: property.price ?? undefined,
            area: property.area ?? undefined,
            bedrooms: property.bedrooms ?? undefined,
            bathrooms: property.bathrooms ?? undefined,
          }
        : {
            code: uuidv4().slice(0, 8).toUpperCase(),
            ownerRut: "",
            region: "",
            comuna: "",
            address: "",
            status: "Disponible",
            type: "" as any,
            price: undefined,
            area: undefined,
            bedrooms: undefined,
            bathrooms: undefined,
            description: "",
          };
          
      form.reset(initialValues);

      if (property && property.region) {
         const regionData = regions.find(r => r.name === property.region);
         if (regionData) {
           setComunas(regionData.communes);
           form.setValue("comuna", property.comuna || "");
         }
      }
    }
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
    
    const finalValues = {
      ...values,
      ownerRut: values.ownerRut ? formatRut(values.ownerRut) : undefined,
      status: isEditing ? values.status : "Disponible",
      code: isEditing && values.code ? values.code : (values.code || uuidv4().slice(0, 8).toUpperCase()),
    };

    onSave(finalValues, isEditing, isEditing && property ? property.id : undefined);
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                name="ownerRut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RUT del Propietario</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej: 12.345.678-9" 
                        {...field}
                        onChange={(e) => {
                          field.onChange(formatRut(e.target.value));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="region"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Región</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger><SelectValue placeholder="Selecciona una región" /></SelectTrigger>
                      <SelectContent>
                        {regions.map((region) => (
                          <SelectItem key={region.name} value={region.name}>
                            {region.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {comunas.length > 0 && (
              <FormField
                control={form.control}
                name="comuna"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comuna</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger><SelectValue placeholder="Selecciona una comuna" /></SelectTrigger>
                        <SelectContent>
                          {comunas.map((comuna, index) => (
                            <SelectItem key={`${comuna}-${index}`} value={comuna}>
                              {comuna}
                            </SelectItem>
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
                    <Input placeholder="Ej: Av. Siempre Viva 742" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEditing && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger><SelectValue placeholder="Selecciona un estado" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem key="Disponible" value="Disponible">Disponible</SelectItem>
                          <SelectItem key="Arrendada" value="Arrendada">Arrendada</SelectItem>
                          <SelectItem key="Mantenimiento" value="Mantenimiento">Mantenimiento</SelectItem>
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem key="Casa" value="Casa">Casa</SelectItem>
                        <SelectItem key="Departamento" value="Departamento">Departamento</SelectItem>
                        <SelectItem key="Local Comercial" value="Local Comercial">Local Comercial</SelectItem>
                        <SelectItem key="Terreno" value="Terreno">Terreno</SelectItem>
                        <SelectItem key="Bodega" value="Bodega">Bodega</SelectItem>
                        <SelectItem key="Estacionamiento" value="Estacionamiento">Estacionamiento</SelectItem>
                        <SelectItem key="Pieza" value="Pieza">Pieza</SelectItem>
                        <SelectItem key="Galpón" value="Galpón">Galpón</SelectItem>
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
                      <Input type="number" placeholder="Ej: 350000" {...field} value={field.value ?? ''} />
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
                      <Input type="number" placeholder="Ej: 150" {...field} value={field.value ?? ''} />
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
                      <Input type="number" placeholder="Ej: 3" {...field} value={field.value ?? ''} />
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
                      <Input type="number" placeholder="Ej: 2" {...field} value={field.value ?? ''} />
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
