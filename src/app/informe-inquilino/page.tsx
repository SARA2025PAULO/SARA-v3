"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/firebase"; // Assuming you have a Firebase config
import { collection, query, where, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast"; // Assuming you have a toast hook

export default function InformeInquilino() {
  const [rut, setRut] = useState('');
  const { toast } = useToast();

  const handleGenerateReport = async () => {
    if (!rut) {
      toast({ title: "RUT Vacio", description: "Por favor, ingrese el RUT del inquilino.", variant: "destructive" });
      return;
    }

    const inquilinosCollectionRef = collection(db, "inquilinos");
    const q = query(inquilinosCollectionRef, where("rut", "==", rut));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      toast({ title: "RUT no encontrado", description: "Regístrate en S.A.R.A. para generar tu informe." });
      return; // Stop execution if RUT is not found
    }
    // TODO: Implement report generation logic here
    console.log('Generating report for RUT:', rut);
    // This is where you would typically:
    // 1. Call an API or server-side function with the RUT.
    // 2. Receive the tenant data and report content.
    // 3. Trigger a file download for the report (e.g., PDF).
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Button variant="outline" asChild>
 <Link href="/">Volver</Link>
 </Button>
      </div>
      <h1 className="text-2xl font-bold mb-6">Informe detallado de comportamiento como Arrendatario</h1>
      <div className="flex flex-col gap-4 max-w-sm">
        <div>
          <Label htmlFor="rut">RUT del Inquilino:</Label>
          <Input
            id="rut"
            type="text"
            value={rut}
            onChange={(e) => setRut(e.target.value)}
            placeholder="Ej: 12.345.678-9"
          />
        </div>
        <Button onClick={handleGenerateReport}>Generar Informe</Button>
      </div>
    </div>
  );
}