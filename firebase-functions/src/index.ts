
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
// Correctly import the SendGrid mail service object
import sgMail from '@sendgrid/mail';

admin.initializeApp();

// It's crucial to set the SendGrid API Key in your Firebase environment.
// Use this command to set it:
// firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY"
const SENDGRID_API_KEY = functions.config().sendgrid?.key;

if (SENDGRID_API_KEY) {
  // Now this call will work because sgMail is the correct object
  sgMail.setApiKey(SENDGRID_API_KEY);
} else {
  console.error('FATAL ERROR: SendGrid API key is not configured. Emails will fail to send.');
}

/**
 * Triggered by the creation of a document in the 'mail' collection.
 * This function sends an email using the data from the new document.
 */
export const sendEmailOnCreate = functions.firestore
  .document('mail/{mailId}')
  .onCreate(async (snap, context) => {
    if (!SENDGRID_API_KEY) {
      console.error('Could not send email because SendGrid API Key is not set.');
      return;
    }

    const mailData = snap.data();

    const msg = {
      to: mailData.to,
      from: 'notificaciones@sarachile.com', // This must be a verified sender in SendGrid
      subject: mailData.message.subject,
      html: mailData.message.html,
    };

    try {
      console.log(`Attempting to send email to ${msg.to}`);
      await sgMail.send(msg);
      console.log('Email sent successfully via SendGrid.');
    } catch (error) {
      console.error('Error sending email with SendGrid:');
      if ((error as any).response) {
        console.error((error as any).response.body);
      } else {
        console.error(error);
      }
    }
  });
