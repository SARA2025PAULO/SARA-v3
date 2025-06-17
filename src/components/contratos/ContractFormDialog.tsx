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
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage // Corrected import: removed duplicate Form
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Mail, ShieldCheck, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Contract, Property } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { collection, query, where, limit, getDocs, } from "firebase/firestore";
import { db } from "@/lib/firebase"; // Assuming you have firebase initialized and exported db


// Define el esquema de validación para el formulario
const contractFormSchema = z.object({
  propertyId: z.string().min(1, { message: "Selecciona una propiedad." }),
  tenantEmail: z.string().email({ message: "Ingresa un correo electrónico válido." }).optional(),
  tenantName: z.string().min(1, { message: "Ingresa el nombre completo del inquilino." }), // Added validation for tenantName
  tenantRut: z.string().min(1, { message: "Ingresa el RUT del inquilino." }), // Added validation for tenantRut
  startDate: z.date({
    required_error: "La fecha de inicio es requerida.",
  }),
  endDate: z.date({
    required_error: "La fecha de término es requerida.",
  }),
  rentAmount: z.number({
    required_error: "El monto del arriendo es requerido.",
    invalid_type_error: "Ingresa un número válido para el monto del arriendo.",
  }).positive({ message: "El monto del arriendo debe ser positivo." }),
  securityDepositAmount: z.number({
     invalid_type_error: "Ingresa un número válido para el monto de garantía.",
  }).optional().or(z.literal('')), // Allow empty string for optional number
  commonExpensesIncluded: z.enum(["si", "no", "no aplica"], { // Added validation for commonExpensesIncluded
    required_error: "Selecciona una opción para gastos comunes.",
  }),
  paymentDay: z.number({
    invalid_type_error: "Ingresa un número válido para el día de pago.",
  }).int().min(1).max(31).optional().or(z.literal('')), // Allow empty string for optional number, added range validation
  terms: z.string().optional(),
});

export type ContractFormValues = z.infer<typeof contractFormSchema>;

interface ContractFormDialogProps {
  contract?: Contract;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: ContractFormValues, isEditing: boolean, contractId?: string) => void;
  availableProperties: Property[];
}


export function ContractFormDialog({ contract, open, onOpenChange, onSave, availableProperties }: ContractFormDialogProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const isEditing = !!contract;

  // Estados para controlar la apertura/cierre de los Popovers de fecha
  const [isStartDatePickerOpen, setIsStartDatePickerOpen] = useState(false);
  const [isEndDatePickerOpen, setIsEndDatePickerOpen] = useState(false);


  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: contract ? {
      propertyId: contract.propertyId,
      tenantEmail: contract.tenantEmail,
      tenantName: contract.tenantName || "",
      tenantRut: contract.tenantRut || "", // Added RUT field
      startDate: new Date(contract.startDate),
      endDate: new Date(contract.endDate),
      rentAmount: contract.rentAmount,
      securityDepositAmount: contract.securityDepositAmount ?? undefined,
      commonExpensesIncluded: contract.commonExpensesIncluded ?? "no aplica", // Added common expenses field
      paymentDay: contract.paymentDay ?? undefined,
      terms: contract.terms || "",
    } : {
      propertyId: "",
      tenantEmail: "",
      tenantName: "",
      tenantRut: "", // Added RUT field
      startDate: undefined,
      endDate: undefined,
      rentAmount: undefined,
      securityDepositAmount: undefined,
      commonExpensesIncluded: "no aplica", // Added common expenses field
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
        tenantRut: contract.tenantRut || "", // Added RUT field
        startDate: new Date(contract.startDate),
        endDate: new Date(contract.endDate),
        rentAmount: contract.rentAmount,
        securityDepositAmount: contract.securityDepositAmount ?? undefined,
        commonExpensesIncluded: contract.commonExpensesIncluded ?? "no aplica", // Added common expenses field
        paymentDay: contract.paymentDay ?? undefined,
        terms: contract.terms || "",
      } : {
        propertyId: "",
        tenantEmail: "",
        tenantName: "",
        tenantRut: "", // Added RUT field
        startDate: undefined,
        endDate: undefined,
        rentAmount: undefined,
        securityDepositAmount: undefined,
        commonExpensesIncluded: "no aplica", // Added common expenses field
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

    const cleanedValues: ContractFormValues = { // Keep cleaned values for onSave
      ...values,
      securityDepositAmount: values.securityDepositAmount === '' ? undefined : values.securityDepositAmount,
      paymentDay: values.paymentDay === '' ? undefined : values.paymentDay,
    };

    onSave(cleanedValues, isEditing, isEditing ? contract.id : undefined);

    // Close the dialog immediately after saving
    onOpenChange(false);
    // Perform tenant lookup and show toast after the dialog is closed
    try {
      const usersRef = collection(db, "users");
      const tenantQuery = query(usersRef, where("email", "==", values.tenantEmail), where("role", "==", "Inquilino"), limit(1));
      const tenantSnapshot = await getDocs(tenantQuery);

      if (tenantSnapshot.empty) {

        // Simulate sending an email invitation if no user is found, after dialog closes
        setTimeout(() => {
   toast({ title: "Invitación Enviada", description: `Se ha enviado un correo de invitación a ${values.tenantEmail}.` });
        }, 300); // Small delay to ensure dialog close animation starts
      }
    } catch (error) {
      console.error("Error looking up tenant:", error);
      // Optionally show an error toast for lookup failure, but don't block save
      // toast({ title: "Error en Búsqueda", description: "Hubo un problema al verificar el inquilino.", variant: "destructive" });
    }
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
                        .filter((p) => p.status === "Disponible" || (isEditing && p.id === contract?.propertyId))
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
              name="tenantName" // Use tenantName for "Nombre completo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo del Inquilino</FormLabel>
                  <FormControl><Input placeholder="Ej: Homero Simpson" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tenantRut" // Added tenantRut field
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RUT del Inquilino</FormLabel>
                  <FormControl>
                     <Input
                      placeholder="Ej: 12345678-9" // Updated placeholder
                      {...field}
                     />
                  </FormControl>
                  <FormDescription>Formato esperado: 12345678-9</FormDescription> {/* Updated description */}
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
                   <FormDescription>Se usará para asociar el contrato a un perfil existente o enviar una invitación.</FormDescription>
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
                    {/* Control the Popover open state */}
                    <Popover open={isStartDatePickerOpen} onOpenChange={setIsStartDatePickerOpen}> {/* Added controlled state */}
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
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            setIsStartDatePickerOpen(false); // Close popover on date select
                          }}
                          initialFocus locale={es} />
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
                    {/* Control the Popover open state */}
                     <Popover open={isEndDatePickerOpen} onOpenChange={setIsEndDatePickerOpen}> {/* Added controlled state */}
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
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            setIsEndDatePickerOpen(false); // Close popover on date select
                          }}
                          initialFocus locale={es} />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="rentAmount" // Existing field
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
                name="securityDepositAmount" // Existing field
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
                name="commonExpensesIncluded" // Added common expenses field
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gastos Comunes Incluidos?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una opción" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="si">Sí</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="no aplica">No aplica</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="paymentDay" // Existing field
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
            <FormField
              control={form.control}
              name="terms" // Existing field
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Condiciones Adicionales (Opcional)</FormLabel>
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