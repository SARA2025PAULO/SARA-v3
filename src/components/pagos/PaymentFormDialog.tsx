
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription as UiFormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, DollarSign, Info, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Contract } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const paymentFormSchema = z.object({
  contractId: z.string().min(1, { message: "Debes seleccionar un contrato." }),
  type: z.enum(["arriendo", "gastos comunes", "reparaciones", "otros"], { required_error: "Debes seleccionar un tipo de pago."}),
  amount: z.coerce.number().positive({ message: "El monto debe ser positivo." }),
  paymentDate: z.date({ required_error: "La fecha de pago es requerida." }),
  notes: z.string().optional(),
  attachment: z.custom<FileList>((val) => val instanceof FileList, "Se esperaba un archivo").optional(),
});

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface PaymentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: PaymentFormValues) => Promise<void>; 
  tenantContracts: Contract[];
}

export function PaymentFormDialog({ open, onOpenChange, onSave, tenantContracts }: PaymentFormDialogProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      contractId: tenantContracts.find(c => c.status === "Activo")?.id || "",
      type: "arriendo",
      amount: undefined,
      paymentDate: new Date(),
      notes: "",
      attachment: undefined,
    },
  });

  async function onSubmit(values: PaymentFormValues) {
    if (!currentUser || currentUser.role !== "Inquilino") {
      toast({ title: "Error de Permiso", description: "Solo los inquilinos pueden declarar pagos.", variant: "destructive" });
      return;
    }
    await onSave(values);
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) {
        form.reset({ 
            contractId: tenantContracts.find(c => c.status === "Activo")?.id || "",
            type: "arriendo", amount: undefined, paymentDate: new Date(), notes: "", attachment: undefined
        });
      }
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Declarar Nuevo Pago</DialogTitle>
          <DialogDescription>
            Completa los detalles del pago realizado.
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
                      {tenantContracts.filter(c => c.status === "Activo").map(contract => (
                        <SelectItem key={contract.id} value={contract.id}>
                          {contract.propertyName} (Fin: {new Date(contract.endDate).toLocaleDateString('es-CL')})
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
                      <SelectItem value="arriendo">Arriendo</SelectItem>
                      <SelectItem value="gastos comunes">Gastos Comunes</SelectItem>
                      <SelectItem value="reparaciones">Reparaciones</SelectItem>
                      <SelectItem value="otros">Otros</SelectItem>
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
                  <FormLabel>Monto Pagado (CLP)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
              name="paymentDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de Pago</FormLabel>
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas Adicionales (Opcional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Info className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea placeholder="Ej: Transferencia desde cuenta X, Nro. de operación Y..." className="pl-9" {...field} rows={3}/>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="attachment"
              render={({ field: { onChange, value, ...rest } }) => ( // Destructure to handle FileList
                <FormItem>
                  <FormLabel className="flex items-center">
                    <Paperclip className="h-4 w-4 mr-2 text-muted-foreground" />
                    Adjuntar Comprobante (Opcional)
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="file" 
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      onChange={(e) => onChange(e.target.files)} // Pass FileList to RHF
                      {...rest} 
                    />
                  </FormControl>
                  <UiFormDescription>Puedes adjuntar imágenes o PDF.</UiFormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
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

