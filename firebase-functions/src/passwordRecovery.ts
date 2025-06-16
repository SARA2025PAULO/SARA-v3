// firebase-functions/src/passwordRecovery.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(functions.config().sendgrid.key);

export const passwordRecovery = functions.https.onRequest(async (req, res) => {
  console.log('passwordRecovery function started');
  const email = req.body.email;
  const sendgridAPIKey = functions.config().sendgrid.key;
  console.log('SendGrid API Key exists:', !!sendgridAPIKey); // Log if key is present
  console.log('Received email:', email);

 if (!email) {
    res.status(400).send({ error: 'El campo "email" es obligatorio.' });
  }

 try {
 const user = await admin.auth().getUserByEmail(email);
 // Generate the password reset link and explicitly set the language to Spanish
 let link = await admin.auth().generatePasswordResetLink(email, {
      url: 'https://sara3o.firebaseapp.com/__/auth/action', // optional: custom URL
      handleCodeInApp: true
 });
    console.log('Generated link (before replace):', link);

 // Modify the link to ensure lang=es
    link = link.replace('lang=en', 'lang=es');
    console.log('Modified link (after replace):', link);

 const msg = {
 to: email,
 from: 'notificaciones@sarachile.com',
 subject: 'Recuperación de contraseña SARA',
      text: `
Hola ${user.displayName || 'Usuario'},

Has solicitado restablecer tu contraseña en SARA.
Por favor, haz clic en el siguiente enlace para elegir una nueva contraseña:

${link}

Si no solicitaste este cambio, puedes ignorar este mensaje.

¡Saludos,
El equipo de SARA!
      `.trim(),
 html: `
 <p>Hola <strong>${user.displayName || 'Usuario'}</strong>,</p>
 <p>Has solicitado restablecer tu contraseña en <strong>SARA</strong>.</p>
 <p><a href="${link}">Restablecer contraseña</a></p>
 <p>Si no solicitaste este cambio de contraseña, puedes ignorar este mensaje.</p>
 <p>¡Saludos,<br/>El equipo de SARA!</p>
      `
 };

 await sgMail.send(msg);
    res.send({ success: true });
  } catch (err: any) {
    console.error('Error en passwordRecovery:', err);
 if (err.code === 'auth/user-not-found') {
      res.status(404).send({ error: 'No existe un usuario con ese correo.' });
    }
    res.status(500).send({ error: err.message });
  }
});
