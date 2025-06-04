
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale"; 
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription as DialogDescriptionComponent, DialogFooter, DialogHeader, DialogTitle, DialogClose
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Mail, ShieldCheck, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Contract, Property } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const contractFormSchema = z.object({
  propertyId: z.string().min(1, { message: "Debes seleccionar una propiedad." }),
  tenantEmail: z.string().email({ message: "Debe ser un correo electrónico válido." }),
  tenantName: z.string().min(2, {message: "Nombre del inquilino es requerido."}), 
  startDate: z.date({ required_error: "La fecha de inicio es requerida." }),
  endDate: z.date({ required_error: "La fecha de fin es requerida." }),
  rentAmount: z.coerce.number().positive({ message: "El monto del arriendo debe ser positivo." }),
  securityDepositAmount: z.coerce.number().nonnegative({ message: "El monto de garantía no puede ser negativo." }).optional().or(z.literal('')),
  paymentDay: z.coerce.number().int().min(1, {message: "El día debe ser entre 1 y 31."}).max(31, {message: "El día debe ser entre 1 y 31."}).optional().or(z.literal('')),
  terms: z.string().optional(),
}).refine(data => data.endDate > data.startDate, {
  message: "La fecha de fin debe ser posterior a la fecha de inicio.",
  path: ["endDate"],
});

export type ContractFormValues = z.infer<typeof contractFormSchema>;

interface ContractFormDialogProps {
  contract?: Contract | null; // For editing
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: ContractFormValues, isEditing: boolean, originalContractId?: string) => void;
  availableProperties: Property[]; 
}

export function ContractFormDialog({ contract, open, onOpenChange, onSave, availableProperties }: ContractFormDialogProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const isEditing = !!contract;

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: contract ? {
      propertyId: contract.propertyId,
      tenantEmail: contract.tenantEmail,
      tenantName: contract.tenantName || "",
      startDate: new Date(contract.startDate),
      endDate: new Date(contract.endDate),
      rentAmount: contract.rentAmount,
      securityDepositAmount: contract.securityDepositAmount ?? undefined,
      paymentDay: contract.paymentDay ?? undefined,
      terms: contract.terms || "",
    } : {
      propertyId: "",
      tenantEmail: "",
      tenantName: "",
      startDate: undefined,
      endDate: undefined,
      rentAmount: undefined,
      securityDepositAmount: undefined,
      paymentDay: undefined,
      terms: "",
    },
  });

  const selectedPropertyId = form.watch("propertyId");
  useEffect(() => {
    if (selectedPropertyId && !isEditing) { 
      const selectedProp = availableProperties.find(p => p.id === selectedPropertyId);
      if (selectedProp?.potentialTenantEmail) {
        form.setValue("tenantEmail", selectedProp.potentialTenantEmail, { shouldValidate: true });
      }
    }
  }, [selectedPropertyId, availableProperties, form, isEditing]);


  useEffect(() => {
    if (open) {
      form.reset(contract ? {
        propertyId: contract.propertyId,
        tenantEmail: contract.tenantEmail,
        tenantName: contract.tenantName || "",
        startDate: new Date(contract.startDate),
        endDate: new Date(contract.endDate),
        rentAmount: contract.rentAmount,
        securityDepositAmount: contract.securityDepositAmount ?? undefined,
        paymentDay: contract.paymentDay ?? undefined,
        terms: contract.terms || "",
      } : { 
        propertyId: "",
        tenantEmail: "", 
        tenantName: "", 
        startDate: undefined,
        endDate: undefined,
        rentAmount: undefined,
        securityDepositAmount: undefined,
        paymentDay: undefined,
        terms: "",
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract, open]); 


  async function onSubmit(values: ContractFormValues) {
    if (!currentUser || currentUser.role !== "Arrendador") {
      toast({ title: "Error de Permiso", description: "No tienes permiso para esta acción.", variant: "destructive" });
      return;
    }
    
    const cleanedValues: ContractFormValues = {
        ...values,
        securityDepositAmount: values.securityDepositAmount === '' ? undefined : values.securityDepositAmount,
        paymentDay: values.paymentDay === '' ? undefined : values.paymentDay,
    };
    onSave(cleanedValues, isEditing, isEditing ? contract.id : undefined);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Contrato" : "Crear Nuevo Contrato"}</DialogTitle>
          <DialogDescriptionComponent>
            {isEditing ? "Actualiza los detalles del contrato." : "Ingresa los detalles para el nuevo contrato de arriendo."}
          </DialogDescriptionComponent>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4">
            <FormField
              control={form.control}
              name="propertyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Propiedad</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      if (!isEditing) {
                         const selectedProp = availableProperties.find(p => p.id === value);
                         if (selectedProp?.potentialTenantEmail) {
                           form.setValue("tenantEmail", selectedProp.potentialTenantEmail, { shouldValidate: true });
                         } else {
                           form.setValue("tenantEmail", "", { shouldValidate: true }); 
                         }
                      }
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una propiedad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableProperties
                        .filter(p => p.status === "Disponible" || (isEditing && p.id === contract?.propertyId))
                        .map(prop => (
                          <SelectItem key={prop.id} value={prop.id}>{prop.address}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tenantEmail" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo Electrónico del Inquilino</FormLabel>
                  <FormControl>
                    <div className="relative">
                       <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                       <Input type="email" placeholder="inquilino@ejemplo.com" className="pl-9" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="tenantName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Inquilino (Referencia)</FormLabel>
                  <FormControl><Input placeholder="Ej: Homero Simpson" {...field} /></FormControl>
                  <FormDescription>Este nombre se usará si no se encuentra un perfil con el correo.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de Inicio</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={es} />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de Fin</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={es} />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="rentAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto del Arriendo (CLP/mes)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ej: 350000" {...field} 
                      onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      value={field.value ?? ''} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="securityDepositAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto Garantía (CLP)</FormLabel>
                    <FormControl>
                       <div className="relative">
                        <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="number" placeholder="Ej: 350000" className="pl-9" {...field} 
                          onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                          value={field.value ?? ''}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Día de Pago Mensual</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="number" placeholder="Ej: 5 (día del mes)" className="pl-9" {...field} 
                          onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                          value={field.value ?? ''}
                          min="1" max="31"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Términos Adicionales (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ej: Se permiten mascotas pequeñas. No fumar dentro de la propiedad." {...field} rows={3}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (isEditing ? "Guardando..." : "Creando...") : (isEditing ? "Guardar Cambios" : "Crear Contrato")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const DialogDescription = DialogDescriptionComponent;

