
import * as functions from 'firebase-functions';
import fetch from 'node-fetch';

export const sendContractInvitation = functions.firestore
  .document('contracts/{contractId}')
  .onCreate(async (snap, context): Promise<void> => {
    const data = snap.data();
    if (!data) {
      console.error('No data associated with the event');
      return;
    }
    const tenantEmail = data.tenantEmail;
    const tenantName = data.tenantName;
    const sendgridApiKey = functions.config().sendgrid?.key;
    const registrationUrl = 'https://www.sarachile.com/login';

    if (!tenantEmail || !tenantName || !sendgridApiKey) {
      console.warn('Missing tenantEmail, tenantName, or SendGrid API key');
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
      console.error(`Error in sendContractInvitation ${context.params.contractId}:`, error);
    }
  });
