
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
import { Textarea } from "@/components/ui/textarea";
import { CheckSquare, MessageSquare, Star } from "lucide-react";
import type { Evaluation, EvaluationCriteria } from "@/types";
import { useToast } from "@/hooks/use-toast";

const confirmationFormSchema = z.object({
  tenantComment: z.string().optional(),
});

export type ConfirmationFormValues = z.infer<typeof confirmationFormSchema>;

interface TenantEvaluationConfirmationDialogProps {
  evaluation: Evaluation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (evaluationId: string, data: ConfirmationFormValues) => Promise<void>;
}

const criteriaLabels: Record<keyof EvaluationCriteria, string> = {
  paymentPunctuality: "Puntualidad en los Pagos",
  propertyCare: "Cuidado de la Propiedad",
  communication: "Comunicación",
  generalBehavior: "Convivencia General",
};

export function TenantEvaluationConfirmationDialog({ evaluation, open, onOpenChange, onConfirm }: TenantEvaluationConfirmationDialogProps) {
  const { toast } = useToast();

  const form = useForm<ConfirmationFormValues>({
    resolver: zodResolver(confirmationFormSchema),
    defaultValues: {
      tenantComment: "",
    },
  });

  const handleConfirm = async (values: ConfirmationFormValues) => {
    if (!evaluation) return;
    try {
      await onConfirm(evaluation.id, values);
      toast({ title: "Evaluación Confirmada", description: "Has confirmado la recepción de la evaluación." });
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Error al Confirmar", description: "No se pudo confirmar la evaluación.", variant: "destructive" });
      console.error("Error confirming evaluation:", error);
    }
  };
  
  if (!evaluation) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) form.reset();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <CheckSquare className="h-5 w-5 mr-2 text-primary" /> Confirmar Evaluación Recibida
          </DialogTitle>
          <DialogDescription>
            Has recibido una evaluación de {evaluation.landlordName || "tu arrendador"} para la propiedad {evaluation.propertyName}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-3 text-sm max-h-[50vh] overflow-y-auto pr-2 border rounded-md p-3 bg-muted/50">
          <h4 className="font-semibold mb-2">Calificaciones Recibidas:</h4>
          {(Object.keys(criteriaLabels) as Array<keyof EvaluationCriteria>).map((criterionKey) => (
            <div key={criterionKey} className="flex justify-between items-center">
              <span>{criteriaLabels[criterionKey]}:</span>
              <div className="flex items-center">
                {[1,2,3,4,5].map(star => (
                  <Star 
                    key={star} 
                    className={`h-4 w-4 ${evaluation.criteria[criterionKey] >= star ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} 
                  />
                ))}
                 <span className="ml-1 text-xs">({evaluation.criteria[criterionKey]}/5)</span>
              </div>
            </div>
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleConfirm)} className="space-y-4 mt-2">
            <FormField
              control={form.control}
              name="tenantComment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                     <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" /> Comentario Adicional (Opcional)
                  </FormLabel>
                  <FormControl>
                    <Textarea placeholder="Añade un comentario si lo deseas..." {...field} rows={3}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-3">
              <DialogClose asChild><Button type="button" variant="outline">Cerrar</Button></DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Confirmando..." : "Confirmar Recepción"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
