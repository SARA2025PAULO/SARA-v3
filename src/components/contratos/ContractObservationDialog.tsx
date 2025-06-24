"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Textarea } from "@/components/ui/textarea";
import type { Contract } from "@/types";
import { MessageSquarePlus } from "lucide-react";

const observationFormSchema = z.object({
  observationText: z
    .string()
    .min(10, { message: "La observación debe tener al menos 10 caracteres." })
    .max(500, { message: "La observación no puede exceder los 500 caracteres." }),
});

export type ObservationFormValues = z.infer<typeof observationFormSchema>;

interface ContractObservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: Contract;
  onSaveObservation: (contractId: string, observation: string) => Promise<void>;
  isSubmitting: boolean;
}

export function ContractObservationDialog({
  open,
  onOpenChange,
  contract,
  onSaveObservation,
  isSubmitting,
}: ContractObservationDialogProps) {
  const form = useForm<ObservationFormValues>({
    resolver: zodResolver(observationFormSchema),
    defaultValues: {
      observationText: "",
    },
  });

  async function onSubmit(values: ObservationFormValues) {
    await onSaveObservation(contract.id, values.observationText);
    form.reset(); // Reset form after saving
    onOpenChange(false); // Close dialog after saving
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
          form.reset();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <MessageSquarePlus className="h-5 w-5 mr-2 text-primary" /> Hacer Observación sobre Contrato
          </DialogTitle>
          <DialogDescription>
            Escribe tus comentarios o preguntas sobre el contrato de arrendamiento.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="observationText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tu Observación</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ej: Faltan detalles sobre el mantenimiento del jardín..."
                      {...field}
                      rows={5}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Enviar Observación"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}