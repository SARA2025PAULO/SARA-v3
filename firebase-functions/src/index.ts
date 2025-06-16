// firebase-functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import fetch from 'node-fetch';

import { passwordRecovery } from './passwordRecovery';

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

// 2. Función trigger de Firestore para invitaciones de contrato
export const sendContractInvitation = functions.firestore
  .document('contracts/{contractId}')
  .onCreate(async (snap, context): Promise<void> => {
    const data = snap.data()!;
    const tenantEmail = data.tenantEmail;
    const tenantName = data.tenantName;
    const sendgridApiKey = functions.config().sendgrid?.key;
    const registrationUrl = 'https://sara-2-0.vercel.app/login';

    if (!tenantEmail || !tenantName || !sendgridApiKey) {
      console.warn('Faltan tenantEmail, tenantName o SendGrid API key');
      return;
    }

    const htmlButton = `
      <p>Hola ${tenantName},</p>
      <p>Has sido invitado a un nuevo contrato en SARA. Haz clic en el botón de abajo para registrarte y ver los detalles:</p>
      <table cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
        <tr>
          <td align="center" bgcolor="#4CAF50" style="border-radius:5px;">
            <a href="${registrationUrl}" target="_blank" style="
              display: inline-block;
              padding: 12px 24px;
              font-size: 16px;
              color: #ffffff;
              text-decoration: none;
              font-weight: bold;
            ">Registrarse en SARA</a>
          </td>
        </tr>
      </table>
      <p>Saludos,<br/>El equipo de SARA</p>
    `;

    const msg = {
      personalizations: [{ to: [{ email: tenantEmail }] }],
      from: { email: 'notificaciones@sarachile.com' },
      subject: 'Has sido invitado a un contrato en SARA',
      content: [
        { type: 'text/plain', value: `Hola ${tenantName}, visita: ${registrationUrl}` },
        { type: 'text/html', value: htmlButton },
      ],
    };

    try {
      console.log('SendGrid API Key (partial):', sendgridApiKey.substring(0, 5) + '...');
      console.log('Mensaje:', JSON.stringify(msg, null, 2));

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

      if (!response.ok) {
        console.error(`Error invitación a ${tenantEmail}: ${response.status} - ${responseBody}`);
      }
    } catch (error: any) {
      console.error(`Error en sendContractInvitation ${context.params.contractId}:`, error);
    }
  });

// 3. Función HTTPS para recuperación de contraseña (en su propio archivo)
export { passwordRecovery };
