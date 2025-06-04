
"use client";

import type { Contract } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ClipboardCopy } from "lucide-react";

interface PriorNoticeDraftProps {
  contract: Contract;
}

export function PriorNoticeDraft({ contract }: PriorNoticeDraftProps) {
  const { toast } = useToast();
  const today = new Date().toLocaleDateString("es-CL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Determine a city placeholder. This is a very rough guess.
  const cityPlaceholder = contract.propertyName?.split(',').pop()?.trim() || "[Ciudad]";

  const noticeText = `
${cityPlaceholder}, ${today}

SEÑOR(A)
${contract.tenantName?.toUpperCase() || contract.tenantEmail.toUpperCase() || "[NOMBRE DEL INQUILINO]"}
${contract.propertyName || "[DIRECCIÓN DE LA PROPIEDAD ARRENDADA]"}
PRESENTE

De nuestra consideración:

Junto con saludar, y en mi calidad de arrendador(a) del inmueble ubicado en ${contract.propertyName || "[DIRECCIÓN DE LA PROPIEDAD ARRENDADA]"}, según contrato de arriendo de fecha ${new Date(contract.startDate).toLocaleDateString("es-CL")}, vengo en notificarle formalmente lo siguiente:

Con fecha de hoy, se constata un incumplimiento de las obligaciones contractuales por su parte, consistente en:

[ESPECIFICAR DETALLADAMENTE EL INCUMPLIMIENTO. Ej: No pago de la renta correspondiente al mes de XXXX, por un monto de $YYYYY CLP.]
[ESPECIFICAR DETALLADAMENTE EL INCUMPLIMIENTO. Ej: Daños ocasionados a la propiedad consistentes en ZZZZZ, valorados en $WWWWW CLP.]
[ESPECIFICAR DETALLADAMENTE EL INCUMPLIMIENTO. Ej: No pago de gastos comunes correspondientes a los meses AAAA, BBBB por un total de $VVVVV CLP.]

(Detallar cada incumplimiento de forma clara y precisa, indicando montos adeudados si corresponde y los periodos)

En virtud de lo anterior, se le requiere para que en un plazo máximo e improrrogable de DIEZ (10) DÍAS HÁBILES, contados desde la recepción de la presente comunicación, proceda a:

[DETALLAR LA ACCIÓN REQUERIDA. Ej: Pagar la totalidad de las rentas adeudadas, ascendentes a $XXXXX CLP.]
[DETALLAR LA ACCIÓN REQUERIDA. Ej: Reparar los daños ocasionados a la propiedad o pagar el costo de su reparación, ascendente a $WWWWW CLP.]
[DETALLAR LA ACCIÓN REQUERIDA. Ej: Pagar la totalidad de los gastos comunes adeudados.]

En caso de no dar cumplimiento a lo requerido dentro del plazo señalado, se procederá a iniciar las acciones legales correspondientes para obtener la restitución del inmueble y el cobro de las sumas adeudadas, incluyendo intereses y costas, conforme a lo establecido en la Ley N° 21.461 ("Devuélveme mi casa") y demás normativa aplicable.

Puede realizar el pago/contacto a través de [ESPECIFICAR MEDIO DE PAGO/CONTACTO: Ej: transferencia a la cuenta N° XXXXX del Banco YYYY, titular ZZZZ, RUT WWWW-W, correo electrónico ejemplo@dominio.cl].

Sin otro particular, le saluda atentamente,

____________________________________
${contract.landlordName?.toUpperCase() || "[NOMBRE DEL ARRENDADOR]"}
Arrendador(a)
RUT: [RUT DEL ARRENDADOR]
Correo Electrónico: [CORREO DEL ARRENDADOR]
Teléfono: [TELÉFONO DEL ARRENDADOR]
`;

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(noticeText.trim())
      .then(() => {
        toast({ title: "Texto Copiado", description: "El borrador de la notificación ha sido copiado al portapapeles." });
      })
      .catch(err => {
        toast({ title: "Error al Copiar", description: "No se pudo copiar el texto.", variant: "destructive" });
        console.error('Error al copiar texto: ', err);
      });
  };

  return (
    <div className="p-4 border rounded-md bg-background shadow print:shadow-none print:border-none">
      <header className="mb-4">
        <h3 className="text-md font-semibold text-primary/90">Borrador: Notificación Previa por Incumplimiento</h3>
        <p className="text-sm text-muted-foreground">
          Este es un borrador base. <strong>Revíselo, complételo con los detalles específicos del incumplimiento y ajústelo según sea necesario antes de enviarlo.</strong> Se recomienda que esta notificación sea enviada por un medio que deje constancia de su recepción (ej. carta certificada o correo electrónico con acuse de recibo).
        </p>
      </header>
      
      <Textarea
        readOnly
        value={noticeText.trim()}
        className="w-full h-96 text-xs font-mono bg-muted/30 whitespace-pre-wrap"
        aria-label="Borrador de notificación previa al inquilino"
      />
      <div className="mt-4 flex justify-end">
        <Button onClick={handleCopyToClipboard} variant="outline" size="sm">
          <ClipboardCopy className="mr-2 h-4 w-4" /> Copiar Texto
        </Button>
      </div>

      <footer className="mt-6 pt-4 border-t text-center print:mt-8 print:pt-4">
        <p className="text-xs text-muted-foreground">
          Este borrador es una herramienta de apoyo proporcionada por S.A.R.A. y no constituye asesoría legal.
          Consulte con un abogado para su caso particular.
        </p>
      </footer>
    </div>
  );
}
