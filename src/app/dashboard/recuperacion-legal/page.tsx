
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import type { Contract, Property } from "@/types";
import { collection, query, where, getDocs, doc, getDoc, orderBy } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Gavel, AlertTriangle, FileText, Printer, ListChecks, ListX, MailWarning, Send, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ContractDisplayForLegal } from "@/components/recuperacion-legal/ContractDisplayForLegal";
import { PaymentHistoryCertificate } from "@/components/recuperacion-legal/PaymentHistoryCertificate";
import { IncidentHistoryDocument } from "@/components/recuperacion-legal/IncidentHistoryDocument";
import { PriorNoticeDraft } from "@/components/recuperacion-legal/PriorNoticeDraft";
import { useToast } from "@/hooks/use-toast";

export default function RecuperacionLegalPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isLoadingContracts, setIsLoadingContracts] = useState(true);
  const [isLoadingProperty, setIsLoadingProperty] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const fetchLandlordContracts = useCallback(async () => {
    if (currentUser && currentUser.role === "Arrendador" && db) {
      setIsLoadingContracts(true);
      try {
        const contractsRef = collection(db, "contracts");
        const q = query(
          contractsRef,
          where("landlordId", "==", currentUser.uid),
          where("status", "in", ["activo", "finalizado"]),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const fetchedContracts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contract));
        setContracts(fetchedContracts);
      } catch (error) {
        console.error("Error fetching landlord contracts:", error);
        toast({ title: "Error", description: "No se pudieron cargar los contratos.", variant: "destructive" });
      } finally {
        setIsLoadingContracts(false);
      }
    }
  }, [currentUser, toast]);

  useEffect(() => {
    fetchLandlordContracts();
  }, [fetchLandlordContracts]);

  const selectedContract = contracts.find(c => c.id === selectedContractId);

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      if (selectedContract && selectedContract.propertyId && db) {
        setIsLoadingProperty(true);
        try {
          const propertyRef = doc(db, "propiedades", selectedContract.propertyId);
          const docSnap = await getDoc(propertyRef);
          if (docSnap.exists()) {
            setSelectedProperty({ id: docSnap.id, ...docSnap.data() } as Property);
          } else {
            console.warn("Property not found for contract:", selectedContract.id);
            setSelectedProperty(null);
          }
        } catch (error) {
          console.error("Error fetching property details:", error);
          setSelectedProperty(null);
          toast({ title: "Error", description: "No se pudieron cargar los detalles de la propiedad.", variant: "destructive" });
        } finally {
          setIsLoadingProperty(false);
        }
      } else {
        setSelectedProperty(null);
      }
    };

    fetchPropertyDetails();
  }, [selectedContract, toast]);

  const handleGeneratePdf = useCallback(async () => {
    if (!selectedContract || !selectedProperty) {
      toast({
        title: "Error de Generación",
        description: "Por favor, selecciona un contrato y asegúrate de que los detalles de la propiedad estén cargados.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingPdf(true);
    toast({ title: "Generando PDF", description: "Preparando el paquete de documentos..." });

    console.log("Generando PDF para el contrato:", selectedContract.id);
    console.log("Contrato:", selectedContract);
    console.log("Propiedad:", selectedProperty);

    await new Promise(resolve => setTimeout(resolve, 2000)); 

    toast({
      title: "Funcionalidad en Desarrollo",
      description: "La generación y descarga del PDF combinado está en proceso de implementación. Actualmente, solo se muestra una simulación.",
      variant: "default",
    });
    setIsGeneratingPdf(false);

  }, [selectedContract, selectedProperty, toast]);

  const handlePrintPackage = () => {
    handleGeneratePdf();
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
              <strong>Te recomendamos encarecidamente consultar con un abogado</strong> para entender completamente tus derechos,
              obligaciones y los pasos legales específicos a seguir en tu situación particular antes de iniciar cualquier acción legal.
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
                 <p className="text-xs text-muted-foreground mt-1">No tienes contratos en estado "activo" o "finalizado" para seleccionar.</p>
              )}
            </div>

            {selectedContract && (
              <Card className="mt-6 bg-muted/30 p-4">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-xl">Documentación para Contrato: {selectedContract.propertyName}</CardTitle>
                  <CardDescription>Inquilino: {selectedContract.tenantName || selectedContract.tenantEmail}</CardDescription>
                </CardHeader>
                <CardContent className="p-0 space-y-4">
                  {isLoadingProperty ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="ml-4 text-muted-foreground">Cargando detalles de la propiedad...</p>
                    </div>
                  ) : selectedProperty ? (
                    <>
                      <Card className="mt-4">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center">
                            <ListChecks className="mr-2 h-5 w-5 text-primary" />
                            Certificado de Historial de Pagos
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <PaymentHistoryCertificate contract={selectedContract} />
                        </CardContent>
                      </Card>
                      
                      <Card className="mt-4">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center">
                            <ListX className="mr-2 h-5 w-5 text-primary" />
                            Historial de Incidentes
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <IncidentHistoryDocument contract={selectedContract} />
                        </CardContent>
                      </Card>
                      
                      <Card className="mt-4">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center">
                            <FileText className="mr-2 h-5 w-5 text-primary" />
                            Copia del Contrato de Arriendo
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ContractDisplayForLegal contract={selectedContract} property={selectedProperty} />
                        </CardContent>
                      </Card>

                      <Card className="mt-4">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                                <MailWarning className="mr-2 h-5 w-5 text-primary" />
                                Borrador de Notificación Previa al Inquilino
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <PriorNoticeDraft contract={selectedContract} />
                        </CardContent>
                      </Card>
                      
                      <Separator className="my-6" />

                      <div className="text-center">
                        <Button 
                          size="lg" 
                          onClick={handlePrintPackage} 
                          disabled={isGeneratingPdf || !selectedContract || !selectedProperty}
                        >
                           {isGeneratingPdf ? (
                             <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generando...</>
                           ) : (
                             <><Printer className="mr-2 h-5 w-5" /> Generar Paquete Completo (PDF)</>
                           )}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          Esta opción agrupará todos los documentos generados en un solo archivo para facilitar su presentación.
                        </p>
                      </div>

                      <Separator className="my-6" />
                      
                      <Card className="mt-4">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center">
                            <Send className="mr-2 h-5 w-5 text-primary" />
                            Enviar a Asesor Legal
                          </CardTitle>
                          <CardDescription>
                            Próximamente podrás enviar este paquete de documentación directamente a abogados o estudios jurídicos asociados a S.A.R.A.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button size="lg" disabled>
                            <Send className="mr-2 h-5 w-5" /> Enviar Documentación a Abogado (Próximamente)
                          </Button>
                        </CardContent>
                      </Card>

                    </>
                  ) : (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    No se pudieron cargar los detalles de la propiedad asociada a este contrato. El documento no se puede generar.
                  </AlertDescription>
                </Alert>
              )}
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
