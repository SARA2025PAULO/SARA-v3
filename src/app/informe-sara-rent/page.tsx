"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { db } from "@/lib/firebase"; // Ensure this import is correct for your Firebase setup
import { collection, query, where, getDocs } from "firebase/firestore";


export default function InformeSaraRentPage() {
  const [rut, setRut] = useState("");
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Basic formatting logic for RUT 12.345.678-9 (Allows numbers, k, K, and hyphen)
    const value = e.target.value.replace(/[^0-9kK-]/g, ""); 
    let formattedRut = "";
    if (value.length > 1) {
      const rutDigits = value.replace(/-/g, "");
      const verifierDigit = rutDigits.slice(-1);
      const rutBody = rutDigits.slice(0, -1);

      formattedRut = rutBody
        .replace(/\B(?=(\d{3})+(?!\d))/g, ".") // Add dots for thousands
        .concat(rutBody.length > 0 ? "-" : "") // Add hyphen if there are digits
        .concat(verifierDigit);
    } else {
      formattedRut = value;
    }

    setRut(formattedRut);
  };


  const handleGenerateReport = async () => {
    try {
      const inquilinosRef = collection(db, "inquilinos");
      const q = query(inquilinosRef, where("rut", "==", rut));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // No matching RUT found, display commercial message
        alert("No se encontró un informe para este RUT. ¡Invita a tu arrendador a usar SARA Rent!");
      } else {
        // Matching RUT found, proceed with report generation (placeholder)
        alert(`Informe encontrado para RUT: ${rut}. (Generar informe aquí)`);
      }
    } catch (error) {
      console.error("Error fetching RUT:", error);
      alert("Ocurrió un error al buscar el informe. Intenta de nuevo.");
    }
  };

  return (
    <div className="container mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold text-center">
        Generar Informe S.A.R.A. Rent
      </h1>

      <div className="max-w-md mx-auto space-y-4">
        <div>
          <Label htmlFor="rut-input">RUT del Inquilino:</Label>
          <Input
            id="rut-input"
            type="text"
            placeholder="Ej: 12.345.678-9"
            value={rut}
            onChange={handleInputChange}
            className="mt-1"
          />
        </div>

        <Button onClick={handleGenerateReport} className="w-full">
          Obtener informe
        </Button>

        <Button variant="outline" className="w-full" asChild>
          <Link href="/">Volver a la bienvenida</Link>
        </Button>
      </div>
    </div>
  );
}