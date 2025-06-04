
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
import { Paperclip, MessageSquare } from "lucide-react";
import type { Incident, UserRole } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const incidentResponseFormSchema = z.object({
  responseText: z.string().min(10, { message: "Tu respuesta debe tener al menos 10 caracteres." }),
  responseAttachment: z.custom<FileList>((val) => val instanceof FileList, "Se esperaba un archivo").optional(),
});

export type IncidentResponseFormValues = z.infer<typeof incidentResponseFormSchema>;

interface IncidentResponseDialogProps {
  incident: Incident | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (incidentId: string, data: IncidentResponseFormValues) => Promise<void>; 
  currentUserRole: UserRole | null; // Added to understand context for display
}

export function IncidentResponseDialog({ incident, open, onOpenChange, onSave, currentUserRole }: IncidentResponseDialogProps) {
  const { toast } = useToast();

  const form = useForm<IncidentResponseFormValues>({
    resolver: zodResolver(incidentResponseFormSchema),
    defaultValues: {
      responseText: "",
      responseAttachment: undefined,
    },
  });

  async function onSubmit(values: IncidentResponseFormValues) {
    if (!currentUserRole || !incident) {
      toast({ title: "Error de Permiso", description: "Acción no permitida.", variant: "destructive" });
      return;
    }
    await onSave(incident.id, values);
    form.reset({ responseText: "", responseAttachment: undefined });
  }

  if (!incident) return null;

  const creatorIsLandlord = incident.createdBy === incident.landlordId;
  const creatorName = creatorIsLandlord ? (incident.landlordName || "Arrendador") : (incident.tenantName || "Inquilino");


  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) {
        form.reset({ responseText: "", responseAttachment: undefined });
      }
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-primary" /> Responder al Incidente
          </DialogTitle>
          <DialogDescription>
            Incidente sobre: {incident.propertyName} (Tipo: {incident.type})
          </DialogDescription>
        </DialogHeader>
        <div className="py-2 px-1 space-y-2 max-h-[30vh] overflow-y-auto border rounded-md bg-muted/50">
            <p className="text-sm font-semibold">Descripción Inicial (de {creatorName}):</p>
            <p className="text-sm whitespace-pre-wrap">{incident.description}</p>
            {incident.initialAttachmentUrl && (
                <p className="text-sm flex items-center"><Paperclip className="h-4 w-4 mr-1"/> Adjunto del Creador: {incident.initialAttachmentUrl} (solo nombre)</p>
            )}
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4">
            <FormField
              control={form.control}
              name="responseText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tu Respuesta/Comentario</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Escribe tu respuesta o comentario aquí..." {...field} rows={4}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="responseAttachment"
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
                  <UiFormDescription>Puedes adjuntar imágenes o PDF como respaldo.</UiFormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Enviando..." : "Enviar Respuesta"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
