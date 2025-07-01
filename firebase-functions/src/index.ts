
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as sgMail from '@sendgrid/mail';

// 1. Inicializar Admin
admin.initializeApp();

// 2. Configurar SendGrid
const sendgridKey = functions.config().sendgrid?.key;
if (sendgridKey) {
  sgMail.setApiKey(sendgridKey);
}

// =================================================================
// TRIGGER 1: Se activa cuando se crea una invitación
// =================================================================
export const handleInvitationCreation = functions.firestore
  .document('invitations/{invitationId}')
  .onCreate(async (snap, context) => {
    const { invitationId } = context.params;
    const invitationData = snap.data();
    
    console.log(`[${invitationId}] Iniciando proceso para:`, invitationData.email);

    const code = `SARA-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    
    const mailDocument = {
      to: [invitationData.email],
      message: {
        subject: 'Invitación para unirte a SARA',
        html: `<p>Hola, has sido invitado a unirte a SARA. Usa el siguiente código para registrarte: <strong>${code}</strong></p>`,
      },
    };

    try {
      await admin.firestore().collection('mail').add(mailDocument);
      console.log(`[${invitationId}] Documento de correo creado.`);

      await snap.ref.update({
        code: code,
        status: 'pending',
      });
      console.log(`[${invitationId}] Documento de invitación actualizado con el código.`);
      
    } catch (error) {
      console.error(`[${invitationId}] Error procesando la invitación:`, error);
    }
  });

// =================================================================
// TRIGGER 2: Se activa cuando se crea un documento de correo
// =================================================================
export const sendEmailOnCreate = functions.firestore
  .document('mail/{mailId}')
  .onCreate(async (snap) => {
    if (!sendgridKey) {
      console.error('API Key de SendGrid no está configurada. No se puede enviar correo.');
      return;
    }
    
    const mailData = snap.data();
    
    const msg = {
      to: mailData.to,
      from: 'notificaciones@sarachile.com',
      subject: mailData.message.subject,
      html: mailData.message.html,
    };

    try {
      await sgMail.send(msg);
      console.log(`Correo enviado exitosamente a: ${msg.to.join(', ')}`);
    } catch (error: any) {
      console.error('Error enviando correo vía SendGrid:', error);
      if (error.response) {
        console.error('Respuesta de error de SendGrid:', error.response.body);
      }
    }
  });
