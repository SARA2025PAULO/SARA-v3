import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import fetch from 'node-fetch'; // We will add this dependency

admin.initializeApp();


// HTTPS test function using SendGrid REST API
export const testEmailRest = functions.https.onRequest(async (req, res) => {
  const sendgridApiKey = functions.config().sendgrid.key;

  if (!sendgridApiKey) {
    console.error("SendGrid API key not configured.");
    return res.status(500).send("SendGrid API key not configured.");
  }

  const msg = {
    personalizations: [
      {
        to: [
          {
            email: "destinatario@ejemplo.com", // Change to your test recipient email
          },
        ],
      },
    ],
    from: {
      email: "notificaciones@sarachile.com", // Change to your verified SendGrid sender email
    },
    subject: "Prueba vía REST desde Firebase",
    content: [
      {
        type: "text/plain",
        value: "¡Hola desde REST API!",
      },
    ],
  };

  try {
    console.log('SendGrid API Key (partial):', sendgridApiKey ? sendgridApiKey.substring(0, 5) + '...' : 'Not configured');
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${sendgridApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(msg),
    });

    const responseBody = await response.text();
    console.log(`SendGrid API Response (testEmailRest): Status - ${response.status}, Body - ${responseBody}`);

    if (response.ok) {
      console.log("Correo REST enviado con éxito (testEmailRest)");
      res.status(200).send("Correo REST enviado con éxito (testEmailRest)");
    } else {
 console.error(`Error enviando correo REST (testEmailRest): ${response.status} - ${responseBody}`);
    }
  } catch (error: any) {
    console.error('Error in testEmailRest function:', error);
    res.status(500).send('Error in testEmailRest function');

  }
});


// Firestore trigger function using SendGrid REST API
export const sendContractInvitation = functions.firestore
  .document('contracts/{contractId}')
  .onCreate(async (snap, context) => {
    const contratoData = snap.data();
    const tenantEmail = contratoData.tenantEmail;
    const tenantName = contratoData.tenantName;
    const sendgridApiKey = functions.config().sendgrid.key;
    const contractId = context.params.contractId;

    // Define registration URL and HTML button
    const registrationUrl = "https://sara-2-0.vercel.app/login";
    const htmlButton = `
  <p>Hola ${tenantName},</p>
  <p>Has sido invitado a un nuevo contrato en SARA.
     Haz clic en el botón de abajo para registrarte y ver los detalles:</p>

  <table cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
    <tr>
      <td align="center" bgcolor="#4CAF50" style="border-radius:5px;">
        <a
          href="https://sara-2-0.vercel.app/login"
          target="_blank"
          style="
            display: inline-block;
            padding: 12px 24px;
            font-size: 16px;
            color: #ffffff;
            text-decoration: none;
            font-weight: bold;
          "
        >
          Registrarse en SARA
        </a>
      </td>
    </tr>
  </table>

  <p>Saludos,<br/>El equipo de SARA</p>
 `;
 console.log('Tenant Email:', tenantEmail);
 console.log('Tenant Name:', tenantName);
 console.log('SendGrid API Key is configured:', !!sendgridApiKey); // Log if the key exists
 console.log('Registration URL:', registrationUrl);
 console.log('HTML Button:', htmlButton);
    if (!tenantEmail || !tenantName || !sendgridApiKey) {
      if (!tenantEmail || !tenantName) {
      console.warn('Missing tenantEmail or tenantName in new contract document.');
      }
      if (!sendgridApiKey) {
      console.error("SendGrid API key not configured for sendContractInvitation.");
      }
 return null; // Exit if essential data or API key is missing
    }
    const msg = {
      personalizations: [{ to: [{ email: tenantEmail }] }],
      from: { email: 'notificaciones@sarachile.com' }, // Replace with your verified SendGrid sender email
      subject: 'Has sido invitado a un contrato en SARA',
 content: [
        { type: 'text/plain', value: `Hola ${tenantName}, visita: https://sara-2-0.vercel.app/login` },
        { type: 'text/html',  value: htmlButton }
      ]
    };

 console.log('SendGrid API Key (partial):', sendgridApiKey ? sendgridApiKey.substring(0, 5) + '...' : 'Not configured');
    try {
 console.log('Message object:', JSON.stringify(msg, null, 2));
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
 method: 'POST',
 headers: {
 'Authorization': `Bearer ${sendgridApiKey}`,
 'Content-Type': 'application/json',
        },
 body: JSON.stringify(msg),
      });

      const responseBody = await response.text();
      console.log(`SendGrid API Response (sendContractInvitation): Status - ${response.status}, Body - ${responseBody}`);
 if (response.ok) {
 console.log(`Invitation email sent to ${tenantEmail} for contract ${contractId}`);
 } else {
 console.error(`Error sending invitation email to ${tenantEmail} (sendContractInvitation): ${response.status} - ${responseBody}`);
 // Optionally re-throw the error or handle it based on your needs
 // throw new functions.https.HttpsError('internal', 'Failed to send invitation email', responseBody);
 }

 return null; // Indicate that the function completed successfully
    } catch (error: any) {
 console.error(`Error in sendContractInvitation function for contract ${contractId}:`, error);
 // Optionally re-throw the error or handle it based on your needs
 // throw new functions.https.HttpsError('internal', 'Error in sendContractInvitation function', error);
    }
  });