
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { useToast } from "@/hooks/use-toast";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UploadCloud } from "lucide-react";

const formSchema = z.object({
  pdfFile: z.custom<FileList>().refine((files) => files?.length > 0, "Debes seleccionar un archivo PDF."),
});

interface UploadContractDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: string;
}

export function UploadContractDialog({ isOpen, onClose, contractId }: UploadContractDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    const file = values.pdfFile[0];
    if (!file) return;

    try {
      const storage = getStorage();
      const storageRef = ref(storage, `contracts/${contractId}/${file.name}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      const contractDocRef = doc(db, "contracts", contractId);
      await updateDoc(contractDocRef, {
        contractUrl: downloadURL,
        updatedAt: serverTimestamp(),
      });

      toast({ title: "Éxito", description: "El contrato se ha subido correctamente." });
      onClose();
    } catch (error) {
      console.error("Error uploading contract:", error);
      toast({ title: "Error", description: "No se pudo subir el contrato.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Subir Contrato Existente</DialogTitle>
          <DialogDescription>
            Selecciona el archivo PDF de tu contrato para almacenarlo de forma segura.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="pdfFile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Archivo PDF del Contrato</FormLabel>
                  <FormControl>
                    <Input type="file" accept="application/pdf" onChange={(e) => field.onChange(e.target.files)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <UploadCloud className="mr-2 h-4 w-4" />
                {isSubmitting ? "Subiendo..." : "Subir Contrato"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
