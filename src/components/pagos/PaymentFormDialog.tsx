"use client";

import React, { useState } from "react";
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
  FormDescription as UiFormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, CreditCard } from "lucide-react"; 
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import type { Contract } from "@/types"; 

const paymentTypes = ["arriendo", "gastos comunes", "otro"] as const;

const paymentFormSchema = z.object({
  contractId: z.string().min(1, { message: "Debes seleccionar un contrato." }),
  type: z.enum(paymentTypes, { 
    required_error: "Debes seleccionar un tipo de pago.",
  }),
  amount: z.coerce.number().min(1, { message: "El monto debe ser al menos $1." }),
  paymentDate: z.string().min(1, { message: "Debes seleccionar la fecha del pago." }), 
  notes: z.string().max(500, { message: "Máximo 500 caracteres." }).optional().nullable(),
  attachment: z
    .custom<FileList>((val) => val instanceof FileList, "Se esperaba un archivo")
    .optional(),
});

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface PaymentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: PaymentFormValues & { attachmentUrl: string | null }) => Promise<void>;
  tenantContracts: Contract[];
}

export function PaymentFormDialog({
  open,
  onOpenChange,
  onSave,
  tenantContracts,
}: PaymentFormDialogProps) {
  const { toast } = useToast();
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null); 

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      contractId: tenantContracts.find((c) => c.status === "Activo" || c.status === "activo")?.id || "", // Modificado
      type: "arriendo", 
      amount: 0,
      paymentDate: new Date().toISOString().split('T')[0], 
      notes: "",
      attachment: undefined, 
    },
  });

  async function onSubmit(values: PaymentFormValues) {
    let attachmentUrl: string | null = null;

    if (values.attachment && values.attachment.length > 0) {
      const file = values.attachment[0];
      const fileName = file.name;
      const storage = getStorage();
      const storageRef = ref(
        storage,
        `payment_receipts/${values.contractId}/${Date.now()}_${fileName}`
      );
      try {
        const metadata = {
          contentDisposition: `attachment; filename="${fileName}"`,
        };
        const snapshot = await uploadBytes(storageRef, file, metadata);
        attachmentUrl = await getDownloadURL(snapshot.ref);
        toast({ title: "Archivo Adjunto", description: "Comprobante subido exitosamente." });
      } catch (error) {
        console.error("Error al subir el archivo de comprobante:", error);
        toast({
          title: "Error al adjuntar comprobante",
          description: "No se pudo subir el archivo. Inténtalo de nuevo.",
          variant: "destructive",
        });
        return; 
      }
    }

    await onSave({ 
      ...values, 
      attachmentUrl: attachmentUrl 
    });

    form.reset({
      contractId: tenantContracts.find((c) => c.status === "Activo" || c.status === "activo")?.id || "", // Modificado
      type: "arriendo",
      amount: 0,
      paymentDate: new Date().toISOString().split('T')[0],
      notes: "",
      attachment: undefined,
    });
    setSelectedFileName(null); 
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
          form.reset({
            contractId: tenantContracts.find((c) => c.status === "Activo" || c.status === "activo")?.id || "", // Modificado
            type: "arriendo",
            amount: 0,
            paymentDate: new Date().toISOString().split('T')[0],
            notes: "",
            attachment: undefined,
          });
          setSelectedFileName(null);
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-primary" /> Declarar Nuevo Pago
          </DialogTitle>
          <DialogDescription>
            Registra un nuevo pago asociado a tu contrato.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4"
          >
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
                      {tenantContracts
                        .filter((c) => c.status === "Activo" || c.status === "activo") // Modificado
                        .map((contract) => (
                          <SelectItem key={contract.id} value={contract.id}>
                            {contract.propertyName} ({contract.landlordName})
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
                  <FormLabel>Tipo de Pago</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo de pago" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {paymentTypes.map((type) => (
                        <SelectItem key={type} value={type} className="capitalize">
                          {type.charAt(0).toUpperCase() + type.slice(1)}
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
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Ej: 500000"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha del Pago</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detalles adicionales del pago..." {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="attachment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <Paperclip className="h-4 w-4 mr-2 text-muted-foreground" />
                    {selectedFileName
                      ? `Adjunto: ${selectedFileName}`
                      : "Adjuntar Comprobante (Opcional)"}
                  </FormLabel>
                  <FormControl>
                    <input
                      type="file"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      onChange={(e) => {
                        const files = e.target.files;
                        const fileName = files?.[0]?.name || null;
                        setSelectedFileName(fileName); 
                        field.onChange(files || undefined); 
                      }}
                      ref={field.ref} 
                    />
                  </FormControl>
                  <UiFormDescription>
                    Puedes adjuntar el comprobante de pago (imagen o PDF).
                  </UiFormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Declarando..." : "Declarar Pago"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}