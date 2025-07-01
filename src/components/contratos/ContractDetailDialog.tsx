
"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Contract, Property, UserRole } from "@/types";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Home, Users, Landmark, FileText, MessageSquare, Send, CalendarDays, Loader2, Paperclip, AlertTriangle } from "lucide-react";

// --- Helper Functions ---
const formatDate = (dateString?: string | Date) => {
    if (!dateString) return 'N/A';
    try {
        const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
        return format(date, "d 'de' LLLL 'de' yyyy", { locale: es });
    } catch (e) {
        return "Fecha inválida";
    }
};

const formatCurrency = (value?: number | null) => 
    value !== undefined && value !== null ? `$${value.toLocaleString('es-CL')}` : 'N/A';

const formatString = (value?: string | null) => value || 'No especificado';

// --- Form Schema for Responses ---
const responseFormSchema = z.object({
  responseText: z.string().min(10, "La respuesta debe tener al menos 10 caracteres.").max(500, "Máximo 500 caracteres."),
});
type ResponseFormValues = z.infer<typeof responseFormSchema>;

// --- Sub-components for better structure ---
const DetailSection = ({ title, icon: Icon, children }: { title: string, icon: React.ElementType, children: React.ReactNode }) => (
    <div>
        <h4 className="font-semibold text-lg flex items-center mb-3 text-primary border-b pb-2">
            <Icon className="w-5 h-5 mr-3" />
            {title}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm pl-2">
            {children}
        </div>
    </div>
);

const DetailItem = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div className="flex flex-col">
        <span className="font-semibold text-gray-700">{label}</span>
        <span className="text-gray-600">{value}</span>
    </div>
);


// --- Main Dialog Component ---
interface ContractDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading: boolean; 
  contract: Contract | null; // Contract can be null during loading or on error
  property: Property | null; // Property can be null during loading or on error
  currentUserRole: UserRole | null;
  onRespondToObservation: (contractId: string, response: string) => Promise<void>;
  isSubmittingResponse: boolean;
  onGeneratePdf: (contract: Contract) => void;
  isGeneratingPdf: boolean;
}

export function ContractDetailDialog({
  open, onOpenChange, isLoading, contract, property, currentUserRole,
  onRespondToObservation, isSubmittingResponse, onGeneratePdf, isGeneratingPdf
}: ContractDetailDialogProps) {
  
  const form = useForm<ResponseFormValues>({
    resolver: zodResolver(responseFormSchema),
    defaultValues: { responseText: "" },
  });

  const handleResponseSubmit = async (values: ResponseFormValues) => {
    if (!contract) return;
    await onRespondToObservation(contract.id, values.responseText);
    form.reset();
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center p-12">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Cargando detalles del contrato...</p>
        </div>
      );
    }

    // If not loading and no contract data at all, this is a critical error.
    if (!contract) {
      return (
         <Alert variant="destructive">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>Error Crítico</AlertTitle>
            <AlertDescription>No se pudo cargar la información del contrato. Por favor, cierra e intenta de nuevo.</AlertDescription>
        </Alert>
      );
    }
    
    // If contract is loaded, but property is missing (after loading is done)
    const propertyMissingAlert = !property ? (
        <Alert variant="warning" className="mb-4">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>Advertencia: Propiedad no encontrada</AlertTitle>
            <AlertDescription>No se pudieron cargar los detalles de la propiedad asociada a este contrato. Algunos campos pueden aparecer como "No especificado".</AlertDescription>
        </Alert>
    ) : null;

    const showResponseForm = currentUserRole === "Arrendador" && contract.status?.toLowerCase() === "pendiente";

    return (
      <div className="space-y-6">
        {propertyMissingAlert} {/* Display alert here */}

        <DetailSection title="Resumen del Contrato" icon={FileText}>
          <DetailItem label="Propiedad" value={property ? `${property.address}, ${property.comuna}` : "No especificado (Propiedad no encontrada)"} />
          <DetailItem label="Estado del Contrato" value={<Badge variant={contract.status === 'activo' ? 'success' : 'default'}>{formatString(contract.status)}</Badge>} />
          <DetailItem label="Período de Arriendo" value={`${formatDate(contract.startDate)} al ${formatDate(contract.endDate)}`} />
          <DetailItem label="Monto del Arriendo" value={<span className="font-bold text-primary">{formatCurrency(contract.rentAmount)}</span>} />
        </DetailSection>

        <Separator />

        <DetailSection title="Partes Involucradas" icon={Users}>
            <DetailItem label="Arrendador" value={formatString(contract.landlordName)} />
            <DetailItem label="RUT Arrendador" value={property ? formatString(property.ownerRut) : "No especificado (Propiedad no encontrada)"} />
            <DetailItem label="Inquilino" value={formatString(contract.tenantName)} />
            <DetailItem label="RUT Inquilino" value={formatString(contract.tenantRut)} />
            <DetailItem label="Email Inquilino" value={formatString(contract.tenantEmail)} />
        </DetailSection>

        <Separator />
        
        <DetailSection title="Condiciones del Arriendo" icon={Landmark}>
            <DetailItem label="Uso de la Propiedad" value={<Badge variant="outline">{formatString(contract.propertyUsage)}</Badge>} />
            <DetailItem label="Monto de Garantía" value={formatCurrency(contract.securityDepositAmount)} />
            <DetailItem label="Día de Pago (Renta)" value={formatString(contract.rentPaymentDay?.toString())} />
            <DetailItem label="Gastos Comunes" value={formatString(contract.commonExpensesIncluded)} />
            <DetailItem label="Prohibición de Subarrendar" value={contract.prohibitionToSublet ? 'Sí' : 'No'} />
            <div className="md:col-span-2">
                <DetailItem label="Cláusulas Especiales" value={<p className="whitespace-pre-wrap text-xs bg-muted p-2 rounded-md">{formatString(contract.terms)}</p>} />
            </div>
        </DetailSection>

        <Separator />

        <DetailSection title="Datos Legales de la Propiedad" icon={Home}>
            <DetailItem label="Rol de Avalúo" value={property ? formatString(property.code) : "No especificado (Propiedad no encontrada)"} />
            <DetailItem label="Fojas (CBR)" value={formatString(contract.propertyCBRFojas)} />
            <DetailItem label="Número (CBR)" value={formatString(contract.propertyCBRNumero)} />
            <DetailItem label="Año (CBR)" value={formatString(contract.propertyCBRAno?.toString())} />
        </DetailSection>

        {contract.existingContractUrl && (
            <>
            <Separator/>
            <DetailSection title="Documento Adjunto" icon={Paperclip}>
                <div className="md:col-span-2">
                    <Button variant="link" asChild className="p-0 h-auto">
                        <a href={contract.existingContractUrl} target="_blank" rel="noopener noreferrer">
                            <Paperclip className="h-4 w-4 mr-2"/>
                            {contract.existingContractFileName || 'Ver Contrato Firmado'}
                        </a>
                    </Button>
                </div>
            </DetailSection>
            </>
        )}

        {contract.observations && contract.observations.length > 0 && (
            <>
            <Separator />
            <DetailSection title="Observaciones y Respuestas" icon={MessageSquare}>
                <div className="space-y-3 md:col-span-2">
                {contract.observations.map((obs) => (
                  <div key={obs.id} className={`border-l-4 p-2 rounded-r-md ${obs.type === 'observation' ? 'border-yellow-400 bg-yellow-50' : 'border-blue-400 bg-blue-50'}`}>
                    <p className="text-xs text-muted-foreground font-medium">De: {obs.fromUserName} ({obs.fromUserRole}) - {formatDate(obs.createdAt)}</p>
                    <p className="mt-1">{obs.text}</p>
                  </div>
                ))}
                </div>
            </DetailSection>
            </>
        )}

        {showResponseForm && (
            <>
            <Separator />
            <DetailSection title="Responder a Inquilino" icon={Send}>
                <div className="md:col-span-2">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleResponseSubmit)} className="space-y-3">
                    <FormField
                        control={form.control}
                        name="responseText"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="sr-only">Respuesta</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Escribe tu respuesta a las observaciones del inquilino..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <Button type="submit" disabled={isSubmittingResponse}>
                        {isSubmittingResponse && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Enviar Respuesta
                    </Button>
                    </form>
                </Form>
                </div>
            </DetailSection>
            </>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Detalles Completos del Contrato</DialogTitle>
          <DialogDescription>
            Revisa toda la información registrada para este acuerdo.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-6 pl-2 -mr-2">
            {renderContent()}
        </div>
        <DialogFooter className="pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
