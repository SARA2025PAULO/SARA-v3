
import * as functions from 'firebase-functions';
import fetch from 'node-fetch';

export const sendContractInvitation = functions
  .region('us-central1') // Especifica la región para compatibilidad con Firestore
  .firestore
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

    // Remove htmlButton as it will now be part of the SendGrid Dynamic Template
    // const htmlButton = `...`; 

    const msg = {
      personalizations: [{
        to: [{ email: tenantEmail }],
        dynamic_template_data: {
          tenantName: tenantName,
          registrationUrl: registrationUrl,
          // Add other data if your template requires them
        },
      }],
      from: { email: 'notificaciones@sarachile.com' },
      template_id: 'd-0e5c724eda68490fb40916d7d6bf0274', // <--- Actualizado con el ID de tu plantilla
    };

    try {
      console.log('SendGrid API Key (partial):', sendgridApiKey.substring(0, 5) + '...');
      console.log('Mensaje a SendGrid:', JSON.stringify(msg, null, 2));

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
      } else {
        console.log(`Invitación enviada exitosamente a ${tenantEmail}.`);
      }
    } catch (error: any) {
      console.error(`Error in sendContractInvitation ${context.params.contractId}:`, error);
    }
  });
