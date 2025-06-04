
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardCheck, Star } from "lucide-react";
import type { Contract, EvaluationCriteria } from "@/types";
import { useToast } from "@/hooks/use-toast";
import React from "react";

const evaluationCriteriaSchema = z.object({
  paymentPunctuality: z.coerce.number().int().min(1).max(5),
  propertyCare: z.coerce.number().int().min(1).max(5),
  communication: z.coerce.number().int().min(1).max(5),
  generalBehavior: z.coerce.number().int().min(1).max(5),
});

const evaluationFormSchema = z.object({
  contractId: z.string().min(1, { message: "Debes seleccionar un contrato." }),
  criteria: evaluationCriteriaSchema,
});

export type EvaluationFormValues = z.infer<typeof evaluationFormSchema>;

interface EvaluationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: EvaluationFormValues) => Promise<void>;
  landlordContracts: Contract[]; // Contracts where current user is landlord
  targetTenantName?: string; // Optional, to display in title
  targetPropertyName?: string; // Optional, to display in title
}

const criteriaLabels: Record<keyof EvaluationCriteria, string> = {
  paymentPunctuality: "Puntualidad en los Pagos",
  propertyCare: "Cuidado de la Propiedad",
  communication: "Comunicación",
  generalBehavior: "Convivencia General",
};

export function EvaluationFormDialog({ open, onOpenChange, onSave, landlordContracts, targetTenantName, targetPropertyName }: EvaluationFormDialogProps) {
  const { toast } = useToast();

  const form = useForm<EvaluationFormValues>({
    resolver: zodResolver(evaluationFormSchema),
    defaultValues: {
      contractId: "",
      criteria: {
        paymentPunctuality: 3,
        propertyCare: 3,
        communication: 3,
        generalBehavior: 3,
      },
    },
  });

  const handleSave = async (values: EvaluationFormValues) => {
    try {
      await onSave(values);
      toast({ title: "Evaluación Guardada", description: "La evaluación ha sido guardada y está pendiente de confirmación por el inquilino." });
      onOpenChange(false); // Close dialog on successful save
    } catch (error) {
      toast({ title: "Error al Guardar", description: "No se pudo guardar la evaluación.", variant: "destructive" });
      console.error("Error saving evaluation:", error);
    }
  };
  
  React.useEffect(() => {
    if (open) {
      form.reset({
        contractId: landlordContracts.length > 0 ? landlordContracts[0].id : "", // Default to first or specific if passed
        criteria: {
          paymentPunctuality: 3,
          propertyCare: 3,
          communication: 3,
          generalBehavior: 3,
        },
      });
    }
  }, [open, form, landlordContracts]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) form.reset();
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <ClipboardCheck className="h-5 w-5 mr-2 text-primary" /> Evaluar Inquilino
            {targetTenantName && targetPropertyName && (
              <span className="text-sm font-normal ml-1 text-muted-foreground"> ({targetTenantName} - {targetPropertyName})</span>
            )}
          </DialogTitle>
          <DialogDescription>
            Califica al inquilino según los siguientes criterios (1-5 estrellas).
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4">
            <FormField
              control={form.control}
              name="contractId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contrato Asociado</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un contrato" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {landlordContracts.filter(c => c.status === "Activo" || c.status === "Finalizado").map(contract => (
                        <SelectItem key={contract.id} value={contract.id}>
                          {contract.propertyName} (Inq: {contract.tenantName || contract.tenantEmail})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {(Object.keys(criteriaLabels) as Array<keyof EvaluationCriteria>).map((criterionKey) => (
              <FormField
                key={criterionKey}
                control={form.control}
                name={`criteria.${criterionKey}`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{criteriaLabels[criterionKey]}</FormLabel>
                    {/* TODO: Replace with a proper star rating component */}
                    <div className="flex items-center space-x-2">
                       {[1, 2, 3, 4, 5].map((starValue) => (
                        <Button
                          key={starValue}
                          type="button"
                          variant={field.value >= starValue ? "default" : "outline"}
                          size="icon"
                          className={`h-8 w-8 p-0 ${field.value >= starValue ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                          onClick={() => field.onChange(starValue)}
                        >
                          <Star className={`h-4 w-4 ${field.value >= starValue ? 'fill-current' : ''}`} />
                        </Button>
                      ))}
                    </div>
                     <Input
                        type="number"
                        min="1"
                        max="5"
                        className="hidden" // Hidden but drives the form value for now
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                      />
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            <DialogFooter className="pt-4">
              <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Guardando..." : "Guardar Evaluación"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
