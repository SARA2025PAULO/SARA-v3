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
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Mail, ShieldCheck, Receipt, Home, Landmark, User2, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Contract, Property } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { collection, query, where, limit, getDocs, } from "firebase/firestore";
import { db } from "@/lib/firebase"; 
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Regex para validar el formato de RUT chileno (ej: 12.345.678-9 o 1.234.567-K)
const rutRegex = /^\d{1,2}\.\d{3}\.\d{3}-[0-9Kk]$/;

// Define el esquema de validación para el formulario
const contractFormSchema = z.object({
  propertyId: z.string().min(1, { message: "Selecciona una propiedad." }),
  tenantEmail: z.string().email({ message: "Ingresa un correo electrónico válido." }).optional(),
  tenantName: z.string().min(1, { message: "Ingresa el nombre completo del inquilino." }),
  tenantRut: z.string()
    .min(1, { message: "Ingresa el RUT del inquilino." })
    .regex(rutRegex, { message: "Formato de RUT inválido. Ej: 12.345.678-9" }),
  tenantNationality: z.string().min(1, { message: "Ingresa la nacionalidad del inquilino." }).optional(),
  tenantCivilStatus: z.string().min(1, { message: "Ingresa el estado civil del inquilino." }).optional(),
  tenantProfession: z.string().min(1, { message: "Ingresa la profesión u oficio del inquilino." }).optional(),
  tenantAddressForNotifications: z.string().optional().nullable(),
  
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
  }).optional().or(z.literal('')),
  commonExpensesIncluded: z.enum(["si", "no", "no aplica"], { 
    required_error: "Selecciona una opción para gastos comunes.",
  }),
  paymentDay: z.number({
    invalid_type_error: "Ingresa un número válido para el día de pago.",
  }).int().min(1).max(31).optional().or(z.literal('')),
  terms: z.string().optional(),

  propertyRolAvaluo: z.string().min(1, { message: "Ingresa el Rol de Avalúo Fiscal." }).optional().nullable(),
  propertyCBRFojas: z.string().min(1, { message: "Ingresa la Foja de inscripción." }).optional().nullable(),
  propertyCBRNumero: z.string().min(1, { message: "Ingresa el Número de inscripción." }).optional().nullable(),
  propertyCBRAno: z.number({
    invalid_type_error: "Ingresa un año válido para la inscripción.",
  }).int().min(1900).max(new Date().getFullYear()).optional().nullable().or(z.literal('')),

  // NEW: Field for existing contract file upload
  existingContract: z
    .custom<FileList>((val) => val instanceof FileList, "Se esperaba un archivo")
    .optional(),
});

export type ContractFormValues = z.infer<typeof contractFormSchema>;

interface ContractFormDialogProps {
  contract?: Contract;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: ContractFormValues & { existingContractUrl: string | null; existingContractFileName: string | null; }, isEditing: boolean, contractId?: string) => void;
  availableProperties: Property[];
}


export function ContractFormDialog({ contract, open, onOpenChange, onSave, availableProperties }: ContractFormDialogProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const isEditing = !!contract;

  const [isStartDatePickerOpen, setIsStartDatePickerOpen] = useState(false);
  const [isEndDatePickerOpen, setIsEndDatePickerOpen] = useState(false);
  const [selectedExistingContractFileName, setSelectedExistingContractFileName] = useState<string | null>(null); // NEW state for existing contract file name


  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: contract ? {
      propertyId: contract.propertyId,
      tenantEmail: contract.tenantEmail,
      tenantName: contract.tenantName || "",
      tenantRut: contract.tenantRut || "", 
      tenantNationality: contract.tenantNationality || "",
      tenantCivilStatus: contract.tenantCivilStatus || "",
      tenantProfession: contract.tenantProfession || "",
      tenantAddressForNotifications: contract.tenantAddressForNotifications || "",
      startDate: new Date(contract.startDate),
      endDate: new Date(contract.endDate),
      rentAmount: contract.rentAmount,
      securityDepositAmount: contract.securityDepositAmount ?? undefined,
      commonExpensesIncluded: contract.commonExpensesIncluded ?? "no aplica", 
      paymentDay: contract.paymentDay ?? undefined,
      terms: contract.terms || "",
      propertyRolAvaluo: contract.propertyRolAvaluo || "",
      propertyCBRFojas: contract.propertyCBRFojas || "",
      propertyCBRNumero: contract.propertyCBRNumero || "",
      propertyCBRAno: contract.propertyCBRAno ?? undefined,
      // NEW: Set default for existing contract file
      existingContract: undefined, // Files can't be set as default via react-hook-form directly
    } : {
      propertyId: "",
      tenantEmail: "",
      tenantName: "",
      tenantRut: "",
      tenantNationality: "",
      tenantCivilStatus: "",
      tenantProfession: "",
      tenantAddressForNotifications: "",
      startDate: undefined,
      endDate: undefined,
      rentAmount: undefined,
      securityDepositAmount: undefined,
      commonExpensesIncluded: "no aplica",
      paymentDay: undefined,
      terms: "",
      propertyRolAvaluo: "",
      propertyCBRFojas: "",
      propertyCBRNumero: "",
      propertyCBRAno: undefined,
      // NEW: Set default for existing contract file
      existingContract: undefined,
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
        tenantRut: contract.tenantRut || "",
        tenantNationality: contract.tenantNationality || "",
        tenantCivilStatus: contract.tenantCivilStatus || "",
        tenantProfession: contract.tenantProfession || "",
        tenantAddressForNotifications: contract.tenantAddressForNotifications || "",
        startDate: new Date(contract.startDate),
        endDate: new Date(contract.endDate),
        rentAmount: contract.rentAmount,
        securityDepositAmount: contract.securityDepositAmount ?? undefined,
        commonExpensesIncluded: contract.commonExpensesIncluded ?? "no aplica",
        paymentDay: contract.paymentDay ?? undefined,
        terms: contract.terms || "",
        propertyRolAvaluo: contract.propertyRolAvaluo || "",
        propertyCBRFojas: contract.propertyCBRFojas || "",
        propertyCBRNumero: contract.propertyCBRNumero || "",
        propertyCBRAno: contract.propertyCBRAno ?? undefined,
        // NEW: Reset existing contract file state and form field
        existingContract: undefined,
      } : {
        propertyId: "",
        tenantEmail: "",
        tenantName: "",
        tenantRut: "",
        tenantNationality: "",
        tenantCivilStatus: "",
        tenantProfession: "",
        tenantAddressForNotifications: "",
        startDate: undefined,
        endDate: undefined,
        rentAmount: undefined,
        securityDepositAmount: undefined,
        commonExpensesIncluded: "no aplica",
        paymentDay: undefined,
        terms: "",
        propertyRolAvaluo: "",
        propertyCBRFojas: "",
        propertyCBRNumero: "",
        propertyCBRAno: undefined,
        // NEW: Reset existing contract file state and form field
        existingContract: undefined,
      });
      // Reset the selected file name when dialog opens or contract changes
      setSelectedExistingContractFileName(contract?.existingContractFileName || null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract, open]);


  async function onSubmit(values: ContractFormValues) {
    if (!currentUser || currentUser.role !== "Arrendador") {
      toast({ title: "Error de Permiso", description: "No tienes permiso para esta acción.", variant: "destructive" });
      return;
    }

    let existingContractUrl: string | null = null;
    let existingContractFileName: string | null = null;

    // NEW: Handle existing contract file upload
    if (values.existingContract && values.existingContract.length > 0) {
      const file = values.existingContract[0];
      existingContractFileName = file.name; // Use the actual file name
      const storage = getStorage();
      // Using a generic ID for the path for now, will refine once contract ID is known on creation
      const uploadPath = `existing_contracts/${values.propertyId}/${Date.now()}_${existingContractFileName}`;
      const storageRef = ref(storage, uploadPath);
      try {
        const metadata = { contentDisposition: `attachment; filename="${existingContractFileName}"` };
        const snapshot = await uploadBytes(storageRef, file, metadata);
        existingContractUrl = await getDownloadURL(snapshot.ref);
        toast({ title: "Archivo Adjunto", description: "Contrato existente subido exitosamente." });
      } catch (error) {
        console.error("Error al subir el contrato existente:", error);
        toast({
          title: "Error al adjuntar contrato",
          description: "No se pudo subir el archivo del contrato existente. Inténtalo de nuevo.",
          variant: "destructive",
        });
        return; // Stop form submission if upload fails
      }
    }

    const cleanedValues: ContractFormValues = {
      ...values,
      securityDepositAmount: values.securityDepositAmount === '' ? undefined : values.securityDepositAmount,
      paymentDay: values.paymentDay === '' ? undefined : values.paymentDay,
      propertyCBRAno: values.propertyCBRAno === '' ? undefined : values.propertyCBRAno,
      tenantAddressForNotifications: values.tenantAddressForNotifications === '' ? null : values.tenantAddressForNotifications,
    };

    await onSave({
      ...cleanedValues,
      existingContractUrl: existingContractUrl,
      existingContractFileName: existingContractFileName,
    }, isEditing, isEditing ? contract.id : undefined);

    onOpenChange(false);
    try {
      const usersRef = collection(db, "users");
      const tenantQuery = query(usersRef, where("email", "==", values.tenantEmail), where("role", "==", "Inquilino"), limit(1));
      const tenantSnapshot = await getDocs(tenantQuery);

      if (tenantSnapshot.empty) {
        setTimeout(() => {
   toast({ title: "Invitación Enviada", description: `Se ha enviado un correo de invitación a ${values.tenantEmail}.` });
        }, 300);
      }
    } catch (error) {
      console.error("Error looking up tenant:", error);
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
            {/* Propiedad */}
            <h3 className="text-lg font-semibold flex items-center"><Home className="h-5 w-5 mr-2 text-primary"/>Datos de la Propiedad</h3>
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
              name="propertyRolAvaluo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol de Avalúo Fiscal</FormLabel>
                  <FormControl><Input placeholder="Ej: 123-45" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="propertyCBRFojas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Foja CBR</FormLabel>
                    <FormControl><Input placeholder="Ej: 12345" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="propertyCBRNumero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número CBR</FormLabel>
                    <FormControl><Input placeholder="Ej: 678" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="propertyCBRAno"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Año CBR</FormLabel>
                    <FormControl><Input type="number" placeholder="Ej: 2020" {...field}
                      onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                      value={field.value ?? ''} min="1900" max={new Date().getFullYear().toString()} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Inquilino */}
            <h3 className="text-lg font-semibold flex items-center mt-6"><User2 className="h-5 w-5 mr-2 text-primary"/>Datos del Inquilino</h3>
            <FormField
              control={form.control}
              name="tenantName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo del Inquilino</FormLabel>
                  <FormControl><Input placeholder="Ej: Homero Jay Simpson" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tenantRut"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RUT del Inquilino</FormLabel>
                  <FormControl>
                     <Input
                      placeholder="Ej: 12.345.678-9"
                      {...field}
                     />
                  </FormControl>
                  <FormDescription>Formato esperado: 12.345.678-9</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tenantNationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nacionalidad</FormLabel>
                    <FormControl><Input placeholder="Ej: Chilena" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tenantCivilStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado Civil</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value ?? ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona estado civil" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="soltero">Soltero/a</SelectItem>
                        <SelectItem value="casado">Casado/a</SelectItem>
                        <SelectItem value="divorciado">Divorciado/a</SelectItem>
                        <SelectItem value="viudo">Viudo/a</SelectItem>
                        <SelectItem value="union civil">Unión Civil</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="tenantProfession"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profesión u Oficio</FormLabel>
                  <FormControl><Input placeholder="Ej: Ingeniero, Estudiante" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tenantAddressForNotifications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domicilio para Notificaciones (Opcional)</FormLabel>
                  <FormControl><Input placeholder="Ej: Calle Falsa 123, Springfield" {...field} value={field.value ?? ''} /></FormControl>
                  <FormDescription>Si es diferente al de la propiedad arrendada.</FormDescription>
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

            {/* Cláusulas del Contrato */}
            <h3 className="text-lg font-semibold flex items-center mt-6"><Landmark className="h-5 w-5 mr-2 text-primary"/>Términos del Contrato</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de Inicio</FormLabel>
                    <Popover open={isStartDatePickerOpen} onOpenChange={setIsStartDatePickerOpen}>
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
                            setIsStartDatePickerOpen(false);
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
                     <Popover open={isEndDatePickerOpen} onOpenChange={setIsEndDatePickerOpen}>
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
                            setIsEndDatePickerOpen(false);
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
              name="rentAmount"
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
                name="securityDepositAmount"
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
                name="commonExpensesIncluded"
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
              name="paymentDay"
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
              name="terms"
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

            {/* NEW: Adjuntar Contrato Existente */}
            <h3 className="text-lg font-semibold flex items-center mt-6"><Paperclip className="h-5 w-5 mr-2 text-primary"/>Adjuntar Contrato Existente (Opcional)</h3>
            <FormField
              control={form.control}
              name="existingContract"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    {selectedExistingContractFileName
                      ? `Archivo seleccionado: ${selectedExistingContractFileName}`
                      : "Selecciona un archivo PDF del contrato existente"}
                  </FormLabel>
                  <FormControl>
                    <input
                      type="file"
                      accept=".pdf"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      onChange={(e) => {
                        const files = e.target.files;
                        const fileName = files?.[0]?.name || null;
                        setSelectedExistingContractFileName(fileName);
                        field.onChange(files || undefined);
                      }}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormDescription>Adjunta el contrato de arrendamiento firmado (solo PDF).</FormDescription>
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