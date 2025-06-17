import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import fetch from 'node-fetch';

// Inicializa Firebase Admin si aún no lo has hecho en otro sitio
admin.initializeApp();

export const sendContractInvitation = functions
  .region('us-central1')      // Asegúrate de que la región coincida con tus otras funciones
  .firestore
  .document('contracts/{contractId}')
  .onCreate(async (snap, context) => {
    // 1. Obtén los datos del contrato
    const data = snap.data()!;
    const tenantEmail = data.tenantEmail as string;
    const tenantName = data.tenantName as string;
    const propertyName = data.propertyName as string;

    // 2. Verifica datos esenciales y API key de SendGrid
    const sendgridApiKey = functions.config().sendgrid?.key;
    if (!tenantEmail || !tenantName || !propertyName || !sendgridApiKey) {
      console.error(
        'Faltan datos para enviar invitación o API key de SendGrid no configurada.',
        { tenantEmail, tenantName, propertyName, sendgridApiKey }
      );
      return null;
    }

    // 3. Construye el cuerpo HTML con el botón de login
    const htmlBody = `
      <p>Hola ${tenantName},</p>
      <p>Has sido invitado a firmar un nuevo contrato de arriendo para la propiedad <strong>${propertyName}</strong>.</p>
      <p>Puedes revisar y firmar el contrato iniciando sesión en SARA:</p>
      <a
        href="https://sara-2-0.vercel.app/login"
        style="
          display:inline-block;
          padding:10px 20px;
          background-color:#4CAF50;
          color:#ffffff;
          text-decoration:none;
          border-radius:5px;
          font-weight:bold;
        "
        target="_blank"
      >
        Iniciar sesión en SARA
      </a>
      <p>Si no funciona el botón, copia y pega este enlace en tu navegador:</p>
      <p>https://sara-2-0.vercel.app/login</p>
      <br/>
      <p>Gracias,<br/>El equipo de SARA</p>
    `;

    // 4. Construye el mensaje para SendGrid
    const msg = {
      personalizations: [{ to: [{ email: tenantEmail }] }],
      from: { email: 'notificaciones@sarachile.com' }, // Tu remitente verificado en SendGrid
      subject: 'Invitación para firmar contrato de arriendo',
      content: [
        { type: 'text/plain', value: `Hola ${tenantName}, visita https://sara-2-0.vercel.app/login` },
        { type: 'text/html',  value: htmlBody }
      ]
    };

    // 5. Envía el correo mediante la API REST de SendGrid
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sendgridApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(msg)
      });

      const bodyText = await response.text();
      if (!response.ok) {
        console.error('Error enviando correo de invitación:', response.status, bodyText);
      } else {
        console.log(`Invitación enviada a ${tenantEmail}`);
      }
    } catch (error) {
      console.error('Excepción al enviar correo de invitación:', error);
    }

    return null;
  });
