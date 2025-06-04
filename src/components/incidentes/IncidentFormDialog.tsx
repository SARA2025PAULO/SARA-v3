
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription as UiFormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Paperclip, AlertTriangle } from "lucide-react";
import type { Contract, IncidentType, UserRole } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const incidentTypes: IncidentType[] = ["pago", "cuidado de la propiedad", "ruidos molestos", "reparaciones necesarias", "incumplimiento de contrato", "otros"];

const incidentFormSchema = z.object({
  contractId: z.string().min(1, { message: "Debes seleccionar un contrato." }),
  type: z.enum(incidentTypes, { required_error: "Debes seleccionar un tipo de incidente."}),
  description: z.string().min(10, { message: "La descripción debe tener al menos 10 caracteres." }),
  initialAttachment: z.custom<FileList>((val) => val instanceof FileList, "Se esperaba un archivo").optional(),
});

export type IncidentFormValues = z.infer<typeof incidentFormSchema>;

interface IncidentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: IncidentFormValues) => Promise<void>; 
  userContracts: Contract[]; 
  currentUserRole: UserRole | null;
}

export function IncidentFormDialog({ open, onOpenChange, onSave, userContracts, currentUserRole }: IncidentFormDialogProps) {
  const { toast } = useToast();

  const form = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentFormSchema),
    defaultValues: {
      contractId: userContracts.find(c => c.status === "Activo")?.id || "",
      type: "otros",
      description: "",
      initialAttachment: undefined,
    },
  });

  async function onSubmit(values: IncidentFormValues) {
    if (!currentUserRole) { // currentUserRole check instead of currentUser
      toast({ title: "Error de Permiso", description: "No se pudo determinar el rol del usuario.", variant: "destructive" });
      return;
    }
    await onSave(values);
    form.reset({ 
        contractId: userContracts.find(c => c.status === "Activo")?.id || "",
        type: "otros", description: "", initialAttachment: undefined 
    });
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) {
        form.reset({ 
            contractId: userContracts.find(c => c.status === "Activo")?.id || "",
            type: "otros", description: "", initialAttachment: undefined 
        });
      }
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-primary" /> Crear Nuevo Incidente
          </DialogTitle>
          <DialogDescription>
            Describe el incidente para notificar a la otra parte.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4">
            <FormField
              control={form.control}
              name="contractId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contrato Asociado</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un contrato" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {userContracts.filter(c => c.status === "Activo").map(contract => (
                        <SelectItem key={contract.id} value={contract.id}>
                          {contract.propertyName} (
                            {currentUserRole === 'Arrendador' ? `Inquilino: ${contract.tenantName || contract.tenantEmail}` : `Arrendador: ${contract.landlordName}`}
                          )
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Incidente</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {incidentTypes.map(type => (
                        <SelectItem key={type} value={type} className="capitalize">{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción del Incidente</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detalla el incidente..." {...field} rows={4}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="initialAttachment"
              render={({ field: { onChange, value, ...rest } }) => ( 
                <FormItem>
                  <FormLabel className="flex items-center">
                    <Paperclip className="h-4 w-4 mr-2 text-muted-foreground" />
                    Adjuntar Archivo (Opcional)
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="file" 
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      onChange={(e) => onChange(e.target.files)} 
                      {...rest} 
                    />
                  </FormControl>
                  <UiFormDescription>Puedes adjuntar imágenes o PDF como evidencia.</UiFormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Creando..." : "Crear Incidente"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
