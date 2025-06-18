"use client";

import React, { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, MessageSquare } from "lucide-react";
import type { Incident, UserRole } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const incidentResponseFormSchema = z.object({
  responseText: z.string().min(10),
  responseAttachment: z
    .custom<FileList>((v) => v instanceof FileList)
    .optional(),
});

export type IncidentResponseFormValues = z.infer<
  typeof incidentResponseFormSchema
>;

interface IncidentResponseDialogProps {
  incident: Incident | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (incidentId: string, data: IncidentResponseFormValues) => Promise<void>;
  currentUserRole: UserRole | null;
}

export function IncidentResponseDialog({
  incident,
  open,
  onOpenChange,
  onSave,
  currentUserRole,
}: IncidentResponseDialogProps) {
  const { toast } = useToast();
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const form = useForm<IncidentResponseFormValues>({
    resolver: zodResolver(incidentResponseFormSchema),
    defaultValues: { responseText: "", responseAttachment: undefined },
  });

  async function onSubmit(values: IncidentResponseFormValues) {
    if (!currentUserRole || !incident) {
      toast({ title: "Error", description: "No permitido.", variant: "destructive" });
      return;
    }

    let attachmentUrl: string | undefined;
    if (values.responseAttachment?.length) {
      const file = values.responseAttachment[0];
      const storage = getStorage();
      const storageRef = ref(storage, `incident_attachments/${incident.id}/${file.name}`);
      try {
        const snap = await uploadBytes(storageRef, file);
        attachmentUrl = await getDownloadURL(snap.ref);
      } catch (error) {
        console.error("Error uploading response attachment:", error);
        toast({ title: "Error al adjuntar respuesta", description: "No se pudo subir el archivo adjunto.", variant: "destructive" });
        return; // Stop submission if file upload fails
      }
    }

    await onSave(incident.id, { ...values, responseAttachment: attachmentUrl as any });
    form.reset();
    setSelectedFileName(null);
    onOpenChange(false);
  }

  if (!incident) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <MessageSquare /> Responder Incidente
          </DialogTitle>
          <DialogDescription>
            Incidente sobre {incident.propertyName}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="responseText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Respuesta</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="responseAttachment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <Paperclip className="h-4 w-4 mr-2 text-muted-foreground" />
                    {selectedFileName
                      ? `Adjunto: ${selectedFileName}`
                      : "Adjuntar archivo (opcional)"}
                  </FormLabel>
                  <FormControl>
                    <input
                      type="file"
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      onChange={(e) => {
                        const files = e.target.files;
                        setSelectedFileName(files?.[0]?.name ?? null);
                        field.onChange(files || undefined);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Enviando..." : "Enviar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}