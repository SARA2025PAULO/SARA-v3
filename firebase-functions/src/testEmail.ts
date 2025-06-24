
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

export const testEmail = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'La función debe ser llamada por un usuario autenticado.');
  }
  const userEmail = context.auth.token.email;
  if (!userEmail) {
      throw new functions.https.HttpsError('invalid-argument', 'No se pudo obtener el correo del usuario autenticado.');
  }

  const sendgridApiKey = functions.config().sendgrid?.key;
  if (!sendgridApiKey) {
    console.error("FATAL: La API Key de SendGrid no está configurada.");
    throw new functions.https.HttpsError('internal', 'El servicio de correo no está configurado.');
  }

  const msg = {
    personalizations: [{
      to: [{ email: userEmail }]
    }],
    from: {
      name: "Prueba S.A.R.A.",
      email: "notificaciones@sarachile.com"
    },
    subject: `Prueba de correo desde S.A.R.A. - ${new Date().toISOString()}`,
    content: [
      {
        type: 'text/plain',
        value: 'Si recibes este correo, la configuración de SendGrid y la función de prueba están funcionando.'
      },
      {
          type: 'text/html',
          value: '<h1>¡Hola!</h1><p>Si recibes este correo, la configuración de SendGrid y la función de prueba están funcionando.</p>'
      }
    ]
  };

  try {
    await axios.post('https://api.sendgrid.com/v3/mail/send', msg, {
      headers: {
        'Authorization': `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`Correo de prueba enviado exitosamente a ${userEmail}.`);
    return { success: true, message: `Correo de prueba enviado a ${userEmail}` };

  } catch (error: any) {
    if (error.response) {
      console.error(`Error al enviar correo de prueba a ${userEmail}: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      throw new functions.https.HttpsError('internal', `Error de SendGrid: ${error.response.status} ${JSON.stringify(error.response.data)}`);
    } else {
      console.error('Excepción al enviar correo de prueba:', error);
      throw new functions.https.HttpsError('internal', 'Ocurrió una excepción inesperada al enviar el correo.');
    }
  }
});
