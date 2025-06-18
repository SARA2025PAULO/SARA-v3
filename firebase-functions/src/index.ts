
// firebase-functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import fetch from 'node-fetch';

import { passwordRecovery } from './passwordRecovery';
import { uploadProperties } from './uploadProperties';
import { sendContractInvitation } from './sendContractInvitation';

admin.initializeApp();

// 0. Función de prueba mínima para aislar problemas de despliegue
export const helloWorld = functions.https.onRequest((req, res): void => {
  res.send('¡Hola Mundo!');
});

// 1. Función de prueba HTTP usando la API REST de SendGrid
export const testEmailRest = functions.https.onRequest(async (req, res): Promise<void> => {
  const sendgridApiKey = functions.config().sendgrid?.key;
  if (!sendgridApiKey) {
    console.error('SendGrid API key not configured.');
    res.status(500).send('SendGrid API key not configured.');
    return;
  }

  const msg = {
    personalizations: [{ to: [{ email: 'destinatario@ejemplo.com' }] }],
    from: { email: 'notificaciones@sarachile.com' },
    subject: 'Prueba vía REST desde Firebase',
    content: [{ type: 'text/plain', value: '¡Hola desde REST API!' }],
  };

  try {
    console.log('SendGrid API Key (partial):', sendgridApiKey.substring(0, 5) + '...');
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(msg),
    });
    const responseBody = await response.text();
    console.log(`Status - ${response.status}, Body - ${responseBody}`);

    if (response.ok) {
      console.log('Correo REST enviado con éxito (testEmailRest)');
      res.status(200).send('Correo REST enviado con éxito (testEmailRest)');
    } else {
      console.error(`Error enviando correo REST: ${response.status} - ${responseBody}`);
      res.status(500).send('Error enviando correo REST');
    }
  } catch (error: any) {
    console.error('Error in testEmailRest function:', error);
    res.status(500).send('Error en testEmailRest');
  }
});

// 2. Función trigger de Firestore para invitaciones de contrato (en su propio archivo)
export { sendContractInvitation };

// 3. Función HTTPS para recuperación de contraseña (en su propio archivo)
export { passwordRecovery };

// 4. Función HTTPS para carga masiva de propiedades (en su propio archivo)
export { uploadProperties };
