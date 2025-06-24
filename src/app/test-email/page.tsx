
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function TestEmailPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleTestEmail = async () => {
    if (!currentUser) {
      toast({ title: 'Error', description: 'Debes iniciar sesión para realizar esta prueba.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const functions = getFunctions();
      const testEmailFunction = httpsCallable(functions, 'testEmail');
      const response: any = await testEmailFunction();
      
      setResult(`Éxito: ${response.data.message}`);
      toast({ title: 'Prueba Exitosa', description: 'La función se ejecutó correctamente. Revisa tu correo.' });

    } catch (error: any) {
      console.error('Error al llamar la función de prueba:', error);
      setResult(`Error: ${error.message}`);
      toast({ title: 'Error en la Prueba', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 text-center">
      <h1 className="text-2xl font-bold mb-4">Página de Prueba de Envío de Correo</h1>
      <p className="mb-6 text-muted-foreground">
        Esta página se usa para diagnosticar problemas con el servicio de correo (SendGrid).
        Al hacer clic en el botón, se intentará enviar un correo de prueba a tu propia dirección de correo electrónico
        (<strong>{currentUser?.email}</strong>).
      </p>

      <Button onClick={handleTestEmail} disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isLoading ? 'Enviando...' : 'Enviar Correo de Prueba'}
      </Button>

      {result && (
        <div className="mt-6 p-4 border rounded-md bg-muted">
          <h2 className="font-semibold">Resultado de la Operación:</h2>
          <pre className="text-sm whitespace-pre-wrap">{result}</pre>
        </div>
      )}
    </div>
  );
}
