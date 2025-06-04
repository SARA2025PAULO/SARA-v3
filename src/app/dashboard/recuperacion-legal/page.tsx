
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import type { Contract } from "@/types";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Gavel, AlertTriangle, FileText, Download, Printer } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ContractDisplayForLegal } from "@/components/recuperacion-legal/ContractDisplayForLegal";

// Placeholder for individual document display component
const LegalDocumentPlaceholder = ({ title, description }: { title: string; description: string }) => (
  <Card className="mt-4">
    <CardHeader>
      <CardTitle className="text-lg flex items-center">
        <FileText className="mr-2 h-5 w-5 text-primary" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">{description}</p>
      <Button variant="outline" size="sm" className="mt-3" disabled>
        Generar y Ver (Próximamente)
      </Button>
    </CardContent>
  </Card>
);

export default function RecuperacionLegalPage() {
  const { currentUser } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [isLoadingContracts, setIsLoadingContracts] = useState(true);

  const fetchLandlordContracts = useCallback(async () => {
    if (currentUser && currentUser.role === "Arrendador" && db) {
      setIsLoadingContracts(true);
      try {
        const contractsRef = collection(db, "contracts");
        // Fetch active or finalized contracts as these are most relevant for recovery
        const q = query(contractsRef, where("landlordId", "==", currentUser.uid), 
                        where("status", "in", ["Activo", "Finalizado"]),
                        orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const fetchedContracts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contract));
        setContracts(fetchedContracts);
      } catch (error) {
        console.error("Error fetching landlord contracts:", error);
        // Handle error (e.g., show toast)
      } finally {
        setIsLoadingContracts(false);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    fetchLandlordContracts();
  }, [fetchLandlordContracts]);

  const selectedContract = contracts.find(c => c.id === selectedContractId);

  const handlePrintPackage = () => {
    // This would eventually trigger printing of a well-formatted page containing all documents
    alert("Funcionalidad de 'Imprimir Paquete' pendiente de implementación detallada para generar el HTML combinado.");
    // For now, window.print() would print the current page.
    // A dedicated printable view/component would be needed.
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center">
            <Gavel className="mr-3 h-7 w-7 text-primary" />
            Asistente para Recuperación Legal de Propiedad (Ley "Devuélveme mi casa")
          </CardTitle>
          <CardDescription>
            Herramientas para ayudar a documentar incumplimientos y facilitar procesos legales.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="default" className="mb-6 bg-primary/5 border-primary/20">
            <AlertTriangle className="h-5 w-5 text-primary" />
            <AlertTitle className="font-semibold text-primary">Información Importante</AlertTitle>
            <AlertDescription className="text-primary/80 text-sm">
              S.A.R.A. proporciona estas herramientas para ayudarte a organizar información y generar borradores de documentos
              basados en los datos que has registrado en la plataforma. Sin embargo, <strong>S.A.R.A. no ofrece asesoría legal.</strong>
              <br />
              La Ley N° 21.461 ("Devuélveme mi casa") establece un procedimiento monitorio para el cobro de rentas de arrendamiento y la restitución de inmuebles.
              Generalmente aplica ante el incumplimiento del pago de la renta u otras obligaciones contractuales.
              <br />
              <strong>Te recomendamos encarecidamente consultar con un abogado</strong> para entender completamente tus derechos,
              obligaciones y los pasos legales específicos a seguir en tu situación particular antes de iniciar cualquier acción legal.
              Los documentos generados aquí son un apoyo y deben ser revisados por un profesional.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <label htmlFor="contract-select" className="block text-sm font-medium text-gray-700 mb-1">
                1. Selecciona el Contrato Relevante:
              </label>
              <Select 
                value={selectedContractId || ""} 
                onValueChange={setSelectedContractId}
                disabled={isLoadingContracts || contracts.length === 0}
              >
                <SelectTrigger id="contract-select">
                  <SelectValue placeholder={isLoadingContracts ? "Cargando contratos..." : (contracts.length === 0 ? "No hay contratos elegibles" : "Selecciona un contrato")} />
                </SelectTrigger>
                <SelectContent>
                  {contracts.map(contract => (
                    <SelectItem key={contract.id} value={contract.id}>
                      {contract.propertyName} (Inquilino: {contract.tenantName || contract.tenantEmail}, Fin: {new Date(contract.endDate).toLocaleDateString('es-CL')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {contracts.length === 0 && !isLoadingContracts && (
                 <p className="text-xs text-muted-foreground mt-1">No tienes contratos en estado "Activo" o "Finalizado" para seleccionar.</p>
              )}
            </div>

            {selectedContract && (
              <Card className="mt-6 bg-muted/30 p-4">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-xl">Documentación para Contrato: {selectedContract.propertyName}</CardTitle>
                  <CardDescription>Inquilino: {selectedContract.tenantName || selectedContract.tenantEmail}</CardDescription>
                </CardHeader>
                <CardContent className="p-0 space-y-4">
                   <p className="text-sm text-muted-foreground">
                    A continuación, podrás generar los documentos necesarios. Estos se basarán en la información
                    registrada en S.A.R.A para el contrato seleccionado.
                  </p>
                  
                  <LegalDocumentPlaceholder 
                    title="Certificado de Historial de Pagos"
                    description="Genera un registro de los pagos declarados y aceptados para este contrato. Útil para evidenciar montos adeudados."
                  />
                  <LegalDocumentPlaceholder 
                    title="Historial de Incidentes"
                    description="Recopila los incidentes registrados para este contrato, especialmente aquellos que constituyan incumplimientos."
                  />
                  
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <FileText className="mr-2 h-5 w-5 text-primary" />
                        Copia del Contrato de Arriendo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ContractDisplayForLegal contract={selectedContract} />
                    </CardContent>
                  </Card>

                  <LegalDocumentPlaceholder 
                    title="Borrador de Notificación Previa al Inquilino"
                    description="Genera un borrador de notificación de incumplimiento para enviar al inquilino, otorgando un plazo para regularizar la situación."
                  />
                  
                  <Separator className="my-6" />

                  <div className="text-center">
                    <Button size="lg" onClick={handlePrintPackage} disabled>
                       <Printer className="mr-2 h-5 w-5" /> Generar y Descargar Paquete Completo (PDF) (Próximamente)
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Esta opción agrupará todos los documentos generados en un solo archivo para facilitar su presentación.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

